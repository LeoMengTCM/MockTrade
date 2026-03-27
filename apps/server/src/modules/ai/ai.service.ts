import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly provider: string;
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.provider = config.get<string>('AI_PROVIDER') || 'openai';
    this.apiBase = config.get<string>('AI_API_BASE') || 'https://api.openai.com/v1';
    this.apiKey = config.get<string>('AI_API_KEY') || '';
    this.model = config.get<string>('AI_MODEL') || 'gpt-4o';
  }

  async generateText(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
    const temp = opts?.temperature ?? 0.8;
    const maxTok = opts?.maxTokens ?? 1000;
    try {
      return this.provider === 'claude'
        ? await this.callClaude(system, user, temp, maxTok)
        : await this.callOpenAI(system, user, temp, maxTok);
    } catch (e) {
      this.logger.error(`AI call failed: ${e}`);
      throw e;
    }
  }

  async generateJSON<T>(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<T> {
    const text = await this.generateText(system + '\n\nRespond with valid JSON only.', user, opts);
    return JSON.parse(this.extractJSON(text));
  }

  private async callOpenAI(system: string, user: string, temperature: number, maxTokens: number): Promise<string> {
    const res = await fetch(`${this.apiBase}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return data.choices[0]?.message?.content || '';
  }

  private async callClaude(system: string, user: string, temperature: number, maxTokens: number): Promise<string> {
    const res = await fetch(`${this.apiBase}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: this.model, max_tokens: maxTokens, temperature, system, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) throw new Error(`Claude ${res.status}: ${await res.text()}`);
    const data = await res.json() as any;
    return data.content[0]?.text || '';
  }

  private extractJSON(text: string): string {
    const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlock) return codeBlock[1].trim();
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) return jsonMatch[0];
    return text.trim();
  }

  isConfigured(): boolean { return !!this.apiKey; }
}
