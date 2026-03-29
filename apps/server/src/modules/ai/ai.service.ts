import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AISettingsInput, AISettingsService, RuntimeAISettings } from './ai-settings.service';
import { AIHealthService } from './ai-health.service';

type AIRequestErrorKind = 'timeout' | 'network' | 'http' | 'unknown';

class AIRequestError extends Error {
  attemptCount?: number;

  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly statusCode?: number,
    public readonly kind: AIRequestErrorKind = 'unknown',
  ) {
    super(message);
    this.name = 'AIRequestError';
  }
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly retryableStatusCodes = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

  constructor(
    private readonly settingsService: AISettingsService,
    private readonly healthService: AIHealthService,
  ) { }

  async generateText(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const temp = opts?.temperature ?? 0.8;
    const maxTok = opts?.maxTokens ?? 1000;
    const settings = await this.settingsService.getRuntimeSettings();

    if (!settings.apiKey) {
      throw new BadRequestException('AI API Key 未配置');
    }

    try {
      return await this.generateTextWithSettings(settings, system, user, { temperature: temp, maxTokens: maxTok });
    } catch (error) {
      const upstreamError = this.toAIRequestError(error, settings.requestTimeoutMs);
      const attemptText = upstreamError.attemptCount ? `${upstreamError.attemptCount} attempts` : 'request failure';
      this.logger.error(
        `AI call failed (${settings.provider}/${settings.model}, ${attemptText}): ${upstreamError.message}`,
      );
      throw new Error(this.toPublicUpstreamErrorMessage(upstreamError));
    }
  }

  async generateJSON<T>(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<T> {
    const text = await this.generateText(system + '\n\nRespond with valid JSON only.', user, opts);
    return JSON.parse(this.extractJSON(text));
  }

  async testConnection(input: AISettingsInput = {}) {
    const settings = await this.settingsService.getRuntimeSettings(input, {
      preserveExistingApiKey: true,
    });

    if (!settings.apiKey) {
      throw new BadRequestException('AI API Key 未配置');
    }

    try {
      const reply = await this.generateTextWithSettings(
        settings,
        '你是连接测试助手。请用一句简短中文确认 AI 接口可用。',
        '请回复“AI 连接测试成功”，并附上一句不超过 20 个字的说明。',
        { temperature: 0.2, maxTokens: 80 },
      );

      return {
        provider: settings.provider,
        apiBase: settings.apiBase,
        model: settings.model,
        reply: reply.trim(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const upstreamError = this.toAIRequestError(error, settings.requestTimeoutMs);
      throw new BadGatewayException(this.toPublicUpstreamErrorMessage(upstreamError));
    }
  }

  async isConfigured(): Promise<boolean> {
    const settings = await this.settingsService.getRuntimeSettings();
    return !!settings.apiKey;
  }

  private async generateTextWithSettings(
    settings: RuntimeAISettings,
    system: string,
    user: string,
    opts?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const temp = opts?.temperature ?? 0.8;
    const maxTok = opts?.maxTokens ?? 1000;

    return settings.provider === 'claude'
      ? this.callClaude(settings, system, user, temp, maxTok)
      : this.callOpenAI(settings, system, user, temp, maxTok);
  }

  private async callOpenAI(
    settings: RuntimeAISettings,
    system: string,
    user: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    return this.executeWithRetry(settings, async () => {
      const res = await this.fetchWithTimeout(`${settings.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature,
          max_tokens: maxTokens,
        }),
      }, settings.requestTimeoutMs);

      if (!res.ok) {
        throw await this.buildHttpError('OpenAI', res);
      }

      const data = await res.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content || '';
    });
  }

  private async callClaude(
    settings: RuntimeAISettings,
    system: string,
    user: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    return this.executeWithRetry(settings, async () => {
      const res = await this.fetchWithTimeout(`${settings.apiBase}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      }, settings.requestTimeoutMs);

      if (!res.ok) {
        throw await this.buildHttpError('Claude', res);
      }

      const data = await res.json() as {
        content?: Array<{ text?: string }>;
      };
      return data.content?.[0]?.text || '';
    });
  }

  private async executeWithRetry(
    settings: RuntimeAISettings,
    request: () => Promise<string>,
  ): Promise<string> {
    // Circuit breaker: skip AI call if upstream is persistently down
    if (await this.healthService.isCircuitOpen()) {
      const err = new AIRequestError(
        'AI 上游熔断中（连续失败过多），已跳过本次调用。可在管理后台手动恢复。',
        false,
        undefined,
        'unknown',
      );
      err.attemptCount = 0;
      throw err;
    }

    const maxAttempts = Math.max(1, settings.maxRetries + 1);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = Date.now();

      try {
        const result = await request();
        const latencyMs = Date.now() - startedAt;

        await this.healthService.recordSuccess({
          attemptCount: attempt,
          latencyMs,
        });

        if (attempt > 1) {
          this.logger.warn(
            `AI upstream recovered on attempt ${attempt}/${maxAttempts} for ${settings.provider}/${settings.model}`,
          );
        }

        return result;
      } catch (error) {
        const upstreamError = this.toAIRequestError(error, settings.requestTimeoutMs);
        upstreamError.attemptCount = attempt;
        const latencyMs = Date.now() - startedAt;

        if (upstreamError.retryable && attempt < maxAttempts) {
          const delayMs = this.calculateBackoffDelay(settings.retryBaseDelayMs, attempt);
          this.logger.warn(
            `AI upstream attempt ${attempt}/${maxAttempts} failed for ${settings.provider}/${settings.model}: ${upstreamError.message}. Retrying in ${delayMs}ms`,
          );
          await this.sleep(delayMs);
          continue;
        }

        await this.healthService.recordFailure({
          attemptCount: attempt,
          latencyMs,
          errorMessage: upstreamError.message,
          retryable: upstreamError.retryable,
          statusCode: upstreamError.statusCode,
        });

        throw upstreamError;
      }
    }

    const unreachable = new AIRequestError('AI upstream request failed unexpectedly', true);
    unreachable.attemptCount = maxAttempts;
    throw unreachable;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIRequestError(`AI upstream request timed out after ${timeoutMs}ms`, true, undefined, 'timeout');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async buildHttpError(providerName: 'OpenAI' | 'Claude', response: Response): Promise<AIRequestError> {
    const raw = (await response.text()).replace(/\s+/g, ' ').trim();
    const body = raw.length > 600 ? `${raw.slice(0, 597)}...` : raw;
    return new AIRequestError(
      `${providerName} ${response.status}: ${body || response.statusText || 'Empty response body'}`,
      this.retryableStatusCodes.has(response.status),
      response.status,
      'http',
    );
  }

  private extractJSON(text: string): string {
    const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlock) return codeBlock[1].trim();
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) return jsonMatch[0];
    return text.trim();
  }

  private toAIRequestError(error: unknown, timeoutMs: number): AIRequestError {
    if (error instanceof AIRequestError) {
      return error;
    }

    if (error instanceof Error) {
      const compact = error.message.replace(/\s+/g, ' ').trim();

      if (error.name === 'AbortError') {
        return new AIRequestError(`AI upstream request timed out after ${timeoutMs}ms`, true, undefined, 'timeout');
      }

      if (this.isRetryableNetworkMessage(compact)) {
        return new AIRequestError(compact || 'AI upstream network request failed', true, undefined, 'network');
      }

      return new AIRequestError(compact || 'AI upstream request failed', false, undefined, 'unknown');
    }

    return new AIRequestError('AI upstream request failed', true, undefined, 'unknown');
  }

  private toPublicUpstreamErrorMessage(error: AIRequestError): string {
    if (error.kind === 'timeout') {
      return 'AI 上游请求超时，请稍后重试或检查网络连通性';
    }

    if (error.kind === 'network') {
      return 'AI 上游网络连接失败，请检查 Base URL、代理配置或稍后重试';
    }

    if (error.kind === 'http') {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return 'AI 上游鉴权失败，请检查 API Key 是否正确';
      }

      if (error.statusCode === 404) {
        return 'AI 上游接口不存在，请检查 Base URL 或模型配置';
      }

      if (error.statusCode === 429) {
        return 'AI 上游触发限流，请稍后重试';
      }

      if (error.statusCode && error.statusCode >= 500) {
        return 'AI 上游服务暂时不可用，请稍后重试';
      }
    }

    return this.formatTechnicalMessage(error.message);
  }

  private formatTechnicalMessage(message: string): string {
    const compact = message.replace(/\s+/g, ' ').trim();
    const extracted = compact.match(/"message":\s*"([^"]+)"/);

    if (extracted?.[1]) {
      return `AI 上游接口错误：${extracted[1]}`;
    }

    if (compact.length > 220) {
      return `AI 上游接口错误：${compact.slice(0, 217)}...`;
    }

    return `AI 上游接口错误：${compact}`;
  }

  private isRetryableNetworkMessage(message: string): boolean {
    return /(fetch failed|socket|network|timed out|timeout|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|TLS|SSL|certificate|terminated|UND_ERR)/i.test(message);
  }

  private calculateBackoffDelay(baseDelayMs: number, attempt: number): number {
    const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
    const jitter = Math.round(baseDelayMs * 0.25 * Math.random());
    return Math.min(exponential + jitter, 15000);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
