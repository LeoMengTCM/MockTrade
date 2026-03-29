import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { AIHealthService, AIHealthSummary } from './ai-health.service';

export type AIProvider = 'openai' | 'claude';

export interface RuntimeAISettings {
  provider: AIProvider;
  apiBase: string;
  apiKey: string;
  model: string;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

export interface PublicAISettings {
  provider: AIProvider;
  apiBase: string;
  model: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  health: AIHealthSummary;
}

export interface AISettingsInput {
  provider?: string;
  apiBase?: string;
  apiKey?: string;
  model?: string;
  clearApiKey?: boolean;
}

@Injectable()
export class AISettingsService {
  private readonly SETTINGS_KEY = 'config:ai:settings';

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly aiHealth: AIHealthService,
  ) {}

  async getPublicSettings(): Promise<PublicAISettings> {
    const settings = await this.getRuntimeSettings();
    const configured = !!settings.apiKey;

    return {
      provider: settings.provider,
      apiBase: settings.apiBase,
      model: settings.model,
      hasApiKey: configured,
      apiKeyPreview: this.maskApiKey(settings.apiKey),
      requestTimeoutMs: settings.requestTimeoutMs,
      maxRetries: settings.maxRetries,
      retryBaseDelayMs: settings.retryBaseDelayMs,
      health: await this.aiHealth.getSummary(configured),
    };
  }

  async getRuntimeSettings(
    input: AISettingsInput = {},
    options: { preserveExistingApiKey?: boolean } = {},
  ): Promise<RuntimeAISettings> {
    const defaults = this.getDefaultSettings();
    const stored = await this.redis.hGetAll(this.SETTINGS_KEY);
    const preserveExistingApiKey = options.preserveExistingApiKey ?? true;
    const hasStoredApiKey = Object.prototype.hasOwnProperty.call(stored, 'apiKey');
    const hasInputApiKey = Object.prototype.hasOwnProperty.call(input, 'apiKey');

    const provider = this.normalizeProvider(
      input.provider ?? stored.provider ?? defaults.provider,
    );

    const apiBase =
      this.normalizeApiBase(input.apiBase ?? stored.apiBase ?? defaults.apiBase)
      || this.getDefaultApiBase(provider);

    const model =
      (input.model ?? stored.model ?? defaults.model)?.trim()
      || this.getDefaultModel(provider);

    const existingApiKey = hasStoredApiKey ? stored.apiKey : defaults.apiKey;
    let apiKey = existingApiKey ?? '';

    if (input.clearApiKey) {
      apiKey = '';
    } else if (hasInputApiKey) {
      const nextApiKey = (input.apiKey ?? '').trim();
      if (nextApiKey) {
        apiKey = nextApiKey;
      } else if (!preserveExistingApiKey) {
        apiKey = '';
      }
    }

    return {
      provider,
      apiBase,
      apiKey,
      model,
      requestTimeoutMs: this.normalizeIntegerSetting(
        this.config.get<string>('AI_REQUEST_TIMEOUT_MS'),
        15000,
        1000,
        120000,
      ),
      maxRetries: this.normalizeIntegerSetting(
        this.config.get<string>('AI_MAX_RETRIES'),
        2,
        0,
        5,
      ),
      retryBaseDelayMs: this.normalizeIntegerSetting(
        this.config.get<string>('AI_RETRY_BASE_DELAY_MS'),
        800,
        100,
        30000,
      ),
    };
  }

  async saveSettings(input: AISettingsInput): Promise<PublicAISettings> {
    const settings = await this.getRuntimeSettings(input, {
      preserveExistingApiKey: true,
    });

    await Promise.all([
      this.redis.hSet(this.SETTINGS_KEY, 'provider', settings.provider),
      this.redis.hSet(this.SETTINGS_KEY, 'apiBase', settings.apiBase),
      this.redis.hSet(this.SETTINGS_KEY, 'model', settings.model),
    ]);

    if (input.clearApiKey) {
      await this.redis.hSet(this.SETTINGS_KEY, 'apiKey', '');
    } else if (Object.prototype.hasOwnProperty.call(input, 'apiKey')) {
      const nextApiKey = (input.apiKey ?? '').trim();
      if (nextApiKey) {
        await this.redis.hSet(this.SETTINGS_KEY, 'apiKey', nextApiKey);
      }
    }

    return this.getPublicSettings();
  }

  private getDefaultSettings(): RuntimeAISettings {
    const provider = this.normalizeProvider(
      this.config.get<string>('AI_PROVIDER') || 'openai',
    );
    const envApiBase = this.normalizeApiBase(this.config.get<string>('AI_API_BASE'));

    return {
      provider,
      apiBase: envApiBase || this.getDefaultApiBase(provider),
      apiKey: this.config.get<string>('AI_API_KEY') || '',
      model: (this.config.get<string>('AI_MODEL') || '').trim() || this.getDefaultModel(provider),
      requestTimeoutMs: this.normalizeIntegerSetting(
        this.config.get<string>('AI_REQUEST_TIMEOUT_MS'),
        15000,
        1000,
        120000,
      ),
      maxRetries: this.normalizeIntegerSetting(
        this.config.get<string>('AI_MAX_RETRIES'),
        2,
        0,
        5,
      ),
      retryBaseDelayMs: this.normalizeIntegerSetting(
        this.config.get<string>('AI_RETRY_BASE_DELAY_MS'),
        800,
        100,
        30000,
      ),
    };
  }

  private normalizeProvider(provider?: string): AIProvider {
    return provider === 'claude' ? 'claude' : 'openai';
  }

  private normalizeApiBase(apiBase?: string): string {
    return (apiBase || '').trim().replace(/\/+$/, '');
  }

  private getDefaultApiBase(provider: AIProvider): string {
    return provider === 'claude'
      ? 'https://api.anthropic.com/v1'
      : 'https://api.openai.com/v1';
  }

  private getDefaultModel(provider: AIProvider): string {
    return provider === 'claude'
      ? 'claude-3-5-sonnet-latest'
      : 'gpt-4o';
  }

  private maskApiKey(apiKey: string): string | null {
    if (!apiKey) return null;
    if (apiKey.length <= 8) return `${apiKey.slice(0, 2)}***`;
    return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
  }

  private normalizeIntegerSetting(
    input: string | number | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const parsed = typeof input === 'number' ? input : Number.parseInt((input || '').trim(), 10);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(Math.round(parsed), min), max);
  }
}
