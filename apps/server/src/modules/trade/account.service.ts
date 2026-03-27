import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { INITIAL_CAPITAL } from '@mocktrade/shared';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly redis: RedisService) {}

  private key(userId: string, seasonId: string) {
    return `account:${userId}:${seasonId}`;
  }

  async initAccount(userId: string, seasonId: string): Promise<void> {
    const k = this.key(userId, seasonId);
    const exists = await this.redis.get(k);
    if (!exists) {
      await this.redis.set(k, JSON.stringify({
        availableCash: INITIAL_CAPITAL,
        frozenCash: 0,
      }));
      this.logger.log(`Account initialized: ${userId} season=${seasonId}`);
    }
  }

  async getAccount(userId: string, seasonId: string) {
    const k = this.key(userId, seasonId);
    const raw = await this.redis.get(k);
    if (!raw) {
      // Auto-init if not exists
      await this.initAccount(userId, seasonId);
      return { availableCash: INITIAL_CAPITAL, frozenCash: 0 };
    }
    return JSON.parse(raw) as { availableCash: number; frozenCash: number };
  }

  async deductCash(userId: string, seasonId: string, amount: number): Promise<boolean> {
    const account = await this.getAccount(userId, seasonId);
    if (account.availableCash < amount) return false;
    account.availableCash = +(account.availableCash - amount).toFixed(2);
    await this.redis.set(this.key(userId, seasonId), JSON.stringify(account));
    return true;
  }

  async addCash(userId: string, seasonId: string, amount: number): Promise<void> {
    const account = await this.getAccount(userId, seasonId);
    account.availableCash = +(account.availableCash + amount).toFixed(2);
    await this.redis.set(this.key(userId, seasonId), JSON.stringify(account));
  }

  async freezeCash(userId: string, seasonId: string, amount: number): Promise<boolean> {
    const account = await this.getAccount(userId, seasonId);
    if (account.availableCash < amount) return false;
    account.availableCash = +(account.availableCash - amount).toFixed(2);
    account.frozenCash = +(account.frozenCash + amount).toFixed(2);
    await this.redis.set(this.key(userId, seasonId), JSON.stringify(account));
    return true;
  }

  async unfreezeCash(userId: string, seasonId: string, amount: number): Promise<void> {
    const account = await this.getAccount(userId, seasonId);
    account.frozenCash = +(account.frozenCash - amount).toFixed(2);
    account.availableCash = +(account.availableCash + amount).toFixed(2);
    await this.redis.set(this.key(userId, seasonId), JSON.stringify(account));
  }

  async deductFrozen(userId: string, seasonId: string, amount: number): Promise<void> {
    const account = await this.getAccount(userId, seasonId);
    account.frozenCash = +(account.frozenCash - amount).toFixed(2);
    await this.redis.set(this.key(userId, seasonId), JSON.stringify(account));
  }
}
