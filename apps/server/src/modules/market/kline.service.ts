import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { StockTickEntity } from '../../entities/stock-tick.entity';
import { RedisService } from '../redis/redis.service';

export interface KLineBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

type KLineResolution = 'tick' | '1m' | '5m' | '15m' | '1h';

@Injectable()
export class KLineService {
  constructor(
    @InjectRepository(StockTickEntity) private readonly tickRepo: Repository<StockTickEntity>,
    private readonly redis: RedisService,
  ) {}

  async getKLines(stockId: string, limit = 100, resolution = '1m'): Promise<KLineBar[]> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
    const normalizedResolution = this.normalizeResolution(resolution);
    const cached = await this.redis.get(`kline:${stockId}:${normalizedResolution}:${safeLimit}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Corrupted cache — fall through to rebuild
      }
    }

    const result = normalizedResolution === 'tick'
      ? await this.buildTickBars(stockId, safeLimit)
      : await this.buildTimeBars(stockId, safeLimit, normalizedResolution);

    await this.redis.set(`kline:${stockId}:${normalizedResolution}:${safeLimit}`, JSON.stringify(result), 5);
    return result;
  }

  private normalizeResolution(resolution: string): KLineResolution {
    if (resolution === 'tick') return 'tick';
    if (resolution === '5m' || resolution === '1d') return '5m';
    if (resolution === '15m' || resolution === '1w') return '15m';
    if (resolution === '1h' || resolution === '1M') return '1h';
    return '1m';
  }

  private async buildTickBars(stockId: string, limit: number): Promise<KLineBar[]> {
    const ticks = await this.tickRepo.find({
      where: { stockId },
      order: { timestamp: 'DESC' },
      take: limit + 1,
    });

    if (ticks.length === 0) return [];
    ticks.reverse();

    const bars: KLineBar[] = [];

    for (let index = 0; index < ticks.length; index += 1) {
      const currentTick = ticks[index];
      if (!currentTick) continue;

      const previousTick = index > 0 ? ticks[index - 1] : undefined;
      const close = Number(currentTick.price);
      const open = previousTick ? Number(previousTick.price) : close;

      bars.push({
        time: Math.floor(new Date(currentTick.timestamp).getTime() / 1000),
        open,
        high: Math.max(open, close),
        low: Math.min(open, close),
        close,
        volume: Number(currentTick.volume),
      });
    }

    return bars.slice(-limit);
  }

  private async buildTimeBars(stockId: string, limit: number, resolution: Exclude<KLineResolution, 'tick'>): Promise<KLineBar[]> {
    const bucketSeconds = this.getBucketSeconds(resolution);
    const lookbackMs = bucketSeconds * limit * 1000 * 2;
    const ticks = await this.tickRepo.find({
      where: {
        stockId,
        timestamp: MoreThanOrEqual(new Date(Date.now() - lookbackMs)),
      },
      order: { timestamp: 'ASC' },
    });

    if (ticks.length === 0) return [];

    const bars: KLineBar[] = [];
    const bucketMs = bucketSeconds * 1000;
    let currentBucketStart: number | null = null;
    let currentBar: KLineBar | null = null;

    for (const tick of ticks) {
      const timestampMs = new Date(tick.timestamp).getTime();
      const bucketStartMs = Math.floor(timestampMs / bucketMs) * bucketMs;
      const price = Number(tick.price);
      const volume = Number(tick.volume);

      if (currentBucketStart !== bucketStartMs || !currentBar) {
        if (currentBar) bars.push(currentBar);
        currentBucketStart = bucketStartMs;
        currentBar = {
          time: Math.floor(bucketStartMs / 1000),
          open: price,
          high: price,
          low: price,
          close: price,
          volume,
        };
        continue;
      }

      currentBar.high = Math.max(currentBar.high, price);
      currentBar.low = Math.min(currentBar.low, price);
      currentBar.close = price;
      currentBar.volume += volume;
    }

    if (currentBar) bars.push(currentBar);

    return bars.slice(-limit);
  }

  private getBucketSeconds(resolution: Exclude<KLineResolution, 'tick'>): number {
    if (resolution === '5m') return 5 * 60;
    if (resolution === '15m') return 15 * 60;
    if (resolution === '1h') return 60 * 60;
    return 60;
  }
}
