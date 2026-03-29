import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockEntity } from '../../../entities/stock.entity';
import { StockTickEntity } from '../../../entities/stock-tick.entity';
import { MarketStateService } from '../market-state.service';
import { PriceSynthesizer } from './price-synthesizer';
import { MarketGateway } from '../market.gateway';
import { RedisService } from '../../redis/redis.service';
import { MarketStatus, TICK_INTERVAL_MIN_MS, TICK_INTERVAL_MAX_MS } from '@mocktrade/shared';

@Injectable()
export class TickScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TickScheduler.name);
  private tickTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectRepository(StockTickEntity) private readonly tickRepo: Repository<StockTickEntity>,
    private readonly marketState: MarketStateService,
    private readonly synthesizer: PriceSynthesizer,
    private readonly gateway: MarketGateway,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.marketState.onStatusChange((status) => {
      if (status === MarketStatus.OPENING) this.start();
      else this.stop();
    });
  }

  onModuleDestroy() { this.stop(); }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Tick scheduler started');
    this.scheduleTick();
  }

  private stop() {
    this.isRunning = false;
    if (this.tickTimer) { clearTimeout(this.tickTimer); this.tickTimer = null; }
  }

  private scheduleTick() {
    if (!this.isRunning) return;
    const interval = Math.floor(Math.random() * (TICK_INTERVAL_MAX_MS - TICK_INTERVAL_MIN_MS + 1)) + TICK_INTERVAL_MIN_MS;
    this.tickTimer = setTimeout(() => this.executeTick(), interval);
  }

  private async executeTick() {
    if (!this.isRunning || this.marketState.getStatus() !== MarketStatus.OPENING) {
      this.stop();
      return;
    }

    try {
      const stocks = await this.stockRepo.find({ where: { isActive: true } });
      const tickBatch: StockTickEntity[] = [];
      const updates: Array<{ stockId: string; price: number; change: number; changePercent: number; volume: number }> = [];

      for (const stock of stocks) {
        const result = this.synthesizer.synthesize({
          stockId: stock.id,
          symbol: stock.symbol,
          currentPrice: Number(stock.currentPrice),
          basePrice: Number(stock.basePrice),
          openPrice: Number(stock.openPrice),
          sector: stock.sector,
        });

        const tickVolume = Math.floor(Math.random() * 500) + 10;
        stock.currentPrice = result.newPrice as any;
        stock.dailyHigh = Math.max(Number(stock.dailyHigh), result.newPrice) as any;
        stock.dailyLow = Math.min(Number(stock.dailyLow), result.newPrice) as any;
        stock.volume = (Number(stock.volume) + tickVolume) as any;

        tickBatch.push(this.tickRepo.create({ stockId: stock.id, price: result.newPrice as any, volume: tickVolume }));
        updates.push({ stockId: stock.id, price: result.newPrice, change: result.change, changePercent: result.changePercent, volume: tickVolume });

        await this.redis.set(`price:${stock.id}`, JSON.stringify({ price: result.newPrice, change: result.change, changePercent: result.changePercent }), 300);
      }

      await this.stockRepo.save(stocks);
      await this.tickRepo.save(tickBatch);
      this.gateway.broadcastTicks(updates);
    } catch (error) {
      this.logger.error('Tick error', error);
    }

    this.scheduleTick();
  }
}
