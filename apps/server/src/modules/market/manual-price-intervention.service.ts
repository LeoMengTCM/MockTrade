import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketStatus } from '@mocktrade/shared';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { StockTickEntity } from '../../entities/stock-tick.entity';
import { RedisService } from '../redis/redis.service';
import { EventImpact } from './engine/event-impact';
import { MarketGateway } from './market.gateway';
import { MarketStateService } from './market-state.service';

@Injectable()
export class ManualPriceInterventionService {
  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    @InjectRepository(StockTickEntity) private readonly tickRepo: Repository<StockTickEntity>,
    private readonly marketState: MarketStateService,
    private readonly eventImpact: EventImpact,
    private readonly gateway: MarketGateway,
    private readonly redis: RedisService,
  ) {}

  async applyShock(stockId: string, rawImpactPercent: number, durationMs = 60000) {
    if (!Number.isFinite(rawImpactPercent) || rawImpactPercent === 0) {
      throw new BadRequestException('请输入非 0 的干预幅度');
    }

    if (this.marketState.getStatus() !== MarketStatus.OPENING) {
      throw new BadRequestException('当前为休市或结算阶段，手动价格干预仅在开盘中可立即生效');
    }

    const stock = await this.stockRepo.findOne({ where: { id: stockId, isActive: true } });
    if (!stock) {
      throw new BadRequestException('股票不存在或已停用');
    }

    const impactPercent = this.normalizeImpactPercent(rawImpactPercent);
    const currentPrice = Number(stock.currentPrice);
    const openPrice = Number(stock.openPrice) || currentPrice;
    const immediatePercent = this.clamp(impactPercent * 0.35, -0.08, 0.08);
    const upperLimit = +(openPrice * 1.10).toFixed(2);
    const lowerLimit = +(openPrice * 0.90).toFixed(2);

    let newPrice = currentPrice * (1 + immediatePercent);
    newPrice = this.clamp(newPrice, lowerLimit, upperLimit);
    newPrice = +newPrice.toFixed(2);

    if (newPrice === currentPrice) {
      const minStep = impactPercent > 0 ? 0.01 : -0.01;
      newPrice = +this.clamp(currentPrice + minStep, lowerLimit, upperLimit).toFixed(2);
    }

    const tickVolume = Math.max(100, Math.round(Math.abs(impactPercent) * 5000));
    const change = +(newPrice - currentPrice).toFixed(2);
    const changePercent = openPrice > 0 ? +((newPrice - openPrice) / openPrice).toFixed(6) : 0;
    const marketDayId = this.marketState.getCurrentMarketDayId();
    const marketDayStartedAt = this.marketState.getCurrentMarketDayStartedAt();

    stock.currentPrice = newPrice as any;
    stock.dailyHigh = Math.max(Number(stock.dailyHigh), newPrice) as any;
    stock.dailyLow = Math.min(Number(stock.dailyLow), newPrice) as any;
    stock.volume = (Number(stock.volume) + tickVolume) as any;

    await this.stockRepo.save(stock);
    await this.tickRepo.save(this.tickRepo.create({
      stockId: stock.id,
      price: newPrice as any,
      volume: tickVolume,
      marketDayId,
      marketDayStartedAt,
    }));
    await this.redis.set(
      `price:${stock.id}`,
      JSON.stringify({ price: newPrice, change, changePercent }),
      300,
    );

    this.gateway.broadcastTicks([
      {
        stockId: stock.id,
        price: newPrice,
        change,
        changePercent,
        volume: tickVolume,
      },
    ]);

    this.eventImpact.inject(stock.id, impactPercent, durationMs);

    return {
      stockId: stock.id,
      stockName: stock.name,
      stockSymbol: stock.symbol,
      impactPercent,
      durationMs,
      immediatePrice: newPrice,
      immediateChange: change,
    };
  }

  private normalizeImpactPercent(rawImpactPercent: number) {
    if (Math.abs(rawImpactPercent) > 1) {
      return rawImpactPercent / 100;
    }
    return rawImpactPercent;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}
