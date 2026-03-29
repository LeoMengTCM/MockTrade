import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export type AIHealthStatus = 'idle' | 'healthy' | 'degraded' | 'down' | 'unconfigured';

export interface AIHealthSummary {
  status: AIHealthStatus;
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  lastAttemptCount: number | null;
  lastAlertAt: string | null;
}

interface AIHealthMutation {
  attemptCount: number;
  latencyMs: number;
}

interface AIHealthFailureMutation extends AIHealthMutation {
  errorMessage: string;
  retryable: boolean;
  statusCode?: number;
}

interface StoredAIHealthState {
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  lastAttemptCount: number | null;
  lastAlertAt: string | null;
}

@Injectable()
export class AIHealthService {
  private readonly logger = new Logger(AIHealthService.name);
  private readonly healthKey = 'status:ai:upstream';
  private readonly alertThreshold = 3;
  private readonly alertCooldownMs = 15 * 60 * 1000;
  private readonly circuitBreakerThreshold = 5;

  constructor(private readonly redis: RedisService) {}

  async getSummary(configured: boolean): Promise<AIHealthSummary> {
    const state = await this.getStoredState();
    return {
      status: this.resolveStatus(configured, state),
      consecutiveFailures: state.consecutiveFailures,
      totalSuccesses: state.totalSuccesses,
      totalFailures: state.totalFailures,
      lastSuccessAt: state.lastSuccessAt,
      lastFailureAt: state.lastFailureAt,
      lastError: state.lastError,
      lastLatencyMs: state.lastLatencyMs,
      lastAttemptCount: state.lastAttemptCount,
      lastAlertAt: state.lastAlertAt,
    };
  }

  async recordSuccess(input: AIHealthMutation): Promise<void> {
    const state = await this.getStoredState();
    const recovered = state.consecutiveFailures > 0;
    const now = new Date().toISOString();

    await this.setFields({
      consecutiveFailures: '0',
      totalSuccesses: String(state.totalSuccesses + 1),
      lastSuccessAt: now,
      lastLatencyMs: String(Math.max(0, Math.round(input.latencyMs))),
      lastAttemptCount: String(Math.max(1, Math.round(input.attemptCount))),
      lastError: '',
    });

    if (recovered) {
      this.logger.log(`AI upstream recovered after ${state.consecutiveFailures} consecutive failures`);
    }
  }

  async recordFailure(input: AIHealthFailureMutation): Promise<void> {
    const state = await this.getStoredState();
    const nextFailures = state.consecutiveFailures + 1;
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const lastAlertMs = state.lastAlertAt ? Date.parse(state.lastAlertAt) : 0;
    const shouldAlert =
      nextFailures >= this.alertThreshold
      && (!lastAlertMs || Number.isNaN(lastAlertMs) || nowMs - lastAlertMs >= this.alertCooldownMs);

    await this.setFields({
      consecutiveFailures: String(nextFailures),
      totalFailures: String(state.totalFailures + 1),
      lastFailureAt: now,
      lastError: this.sanitizeMessage(input.errorMessage),
      lastLatencyMs: String(Math.max(0, Math.round(input.latencyMs))),
      lastAttemptCount: String(Math.max(1, Math.round(input.attemptCount))),
      ...(shouldAlert ? { lastAlertAt: now } : {}),
    });

    if (shouldAlert) {
      const statusText = input.statusCode ? `HTTP ${input.statusCode}` : input.retryable ? 'network/retryable' : 'non-retryable';
      this.logger.error(`AI upstream entered degraded state after ${nextFailures} consecutive failures (${statusText})`);
    }
  }

  async isCircuitOpen(): Promise<boolean> {
    const state = await this.getStoredState();
    return state.consecutiveFailures >= this.circuitBreakerThreshold;
  }

  async resetHealth(): Promise<void> {
    await this.setFields({
      consecutiveFailures: '0',
      lastError: '',
    });
    this.logger.log('AI health has been manually reset by admin');
  }

  private async getStoredState(): Promise<StoredAIHealthState> {
    const raw = await this.redis.hGetAll(this.healthKey);

    return {
      consecutiveFailures: this.parseInteger(raw.consecutiveFailures),
      totalSuccesses: this.parseInteger(raw.totalSuccesses),
      totalFailures: this.parseInteger(raw.totalFailures),
      lastSuccessAt: raw.lastSuccessAt || null,
      lastFailureAt: raw.lastFailureAt || null,
      lastError: raw.lastError || null,
      lastLatencyMs: this.parseNullableInteger(raw.lastLatencyMs),
      lastAttemptCount: this.parseNullableInteger(raw.lastAttemptCount),
      lastAlertAt: raw.lastAlertAt || null,
    };
  }

  private resolveStatus(configured: boolean, state: StoredAIHealthState): AIHealthStatus {
    if (!configured) {
      return 'unconfigured';
    }

    if (!state.lastSuccessAt && !state.lastFailureAt) {
      return 'idle';
    }

    if (state.consecutiveFailures >= this.alertThreshold) {
      return 'down';
    }

    if (state.consecutiveFailures > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  private async setFields(fields: Record<string, string>): Promise<void> {
    await Promise.all(
      Object.entries(fields).map(([field, value]) => this.redis.hSet(this.healthKey, field, value)),
    );
  }

  private parseInteger(value?: string): number {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseNullableInteger(value?: string): number | null {
    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private sanitizeMessage(message: string): string {
    const compact = message.replace(/\s+/g, ' ').trim();
    if (compact.length <= 320) {
      return compact;
    }

    return `${compact.slice(0, 317)}...`;
  }
}
