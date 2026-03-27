import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { RedisService } from '../redis/redis.service';
import { MarketStatus, MARKET_OPEN_DURATION_MS, MARKET_CLOSE_DURATION_MS } from '@mocktrade/shared';

@Injectable()
export class MarketStateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketStateService.name);
  private status: MarketStatus = MarketStatus.CLOSED;
  private cycleTimer: NodeJS.Timeout | null = null;
  private cycleCount = 0;
  private statusChangeCallbacks: Array<(status: MarketStatus, countdown: number) => void> = [];
  private openDuration = MARKET_OPEN_DURATION_MS;
  private closeDuration = MARKET_CLOSE_DURATION_MS;

  constructor(
    @InjectRepository(StockEntity)
    private readonly stockRepo: Repository<StockEntity>,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    const openMs = await this.redis.get('config:market:openDuration');
    const closeMs = await this.redis.get('config:market:closeDuration');
    if (openMs) this.openDuration = parseInt(openMs);
    if (closeMs) this.closeDuration = parseInt(closeMs);
    this.startCycle();
  }

  onModuleDestroy() {
    if (this.cycleTimer) clearTimeout(this.cycleTimer);
  }

  getStatus() { return this.status; }
  getCycleCount() { return this.cycleCount; }
  getOpenDuration() { return this.openDuration; }
  getCloseDuration() { return this.closeDuration; }

  onStatusChange(cb: (status: MarketStatus, countdown: number) => void) {
    this.statusChangeCallbacks.push(cb);
  }

  async setDurations(openMs: number, closeMs: number) {
    this.openDuration = openMs;
    this.closeDuration = closeMs;
    await this.redis.set('config:market:openDuration', openMs.toString());
    await this.redis.set('config:market:closeDuration', closeMs.toString());
  }

  private startCycle() { this.openMarket(); }

  private openMarket() {
    this.status = MarketStatus.OPENING;
    this.cycleCount++;
    this.logger.log(`Market OPEN - Cycle #${this.cycleCount}`);
    this.notify(MarketStatus.OPENING, Math.floor(this.openDuration / 1000));
    this.cycleTimer = setTimeout(() => this.settleMarket(), this.openDuration);
  }

  private async settleMarket() {
    this.status = MarketStatus.SETTLING;
    const stocks = await this.stockRepo.find({ where: { isActive: true } });
    for (const s of stocks) {
      s.prevClosePrice = s.currentPrice;
      s.volume = 0 as any;
    }
    await this.stockRepo.save(stocks);
    this.closeMarket();
  }

  private closeMarket() {
    this.status = MarketStatus.CLOSED;
    this.logger.log(`Market CLOSED (${this.closeDuration / 1000}s)`);
    this.notify(MarketStatus.CLOSED, Math.floor(this.closeDuration / 1000));
    this.cycleTimer = setTimeout(async () => {
      const stocks = await this.stockRepo.find({ where: { isActive: true } });
      for (const s of stocks) {
        s.openPrice = s.currentPrice;
        s.dailyHigh = s.currentPrice;
        s.dailyLow = s.currentPrice;
        s.volume = 0 as any;
      }
      await this.stockRepo.save(stocks);
      this.openMarket();
    }, this.closeDuration);
  }

  private notify(status: MarketStatus, countdown: number) {
    for (const cb of this.statusChangeCallbacks) {
      try { cb(status, countdown); } catch (e) { this.logger.error('Callback error', e); }
    }
  }

  pause() {
    if (this.cycleTimer) { clearTimeout(this.cycleTimer); this.cycleTimer = null; }
    this.status = MarketStatus.CLOSED;
    this.logger.warn('Market PAUSED');
  }

  resume() {
    this.logger.warn('Market RESUMED');
    this.openMarket();
  }
}
