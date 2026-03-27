import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTickEntity } from '../../entities/stock-tick.entity';
import { RedisService } from '../redis/redis.service';

export interface KLineBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

@Injectable()
export class KLineService {
  constructor(
    @InjectRepository(StockTickEntity) private readonly tickRepo: Repository<StockTickEntity>,
    private readonly redis: RedisService,
  ) {}

  async getKLines(stockId: string, limit = 100): Promise<KLineBar[]> {
    const cached = await this.redis.get(`kline:${stockId}:${limit}`);
    if (cached) return JSON.parse(cached);

    const ticks = await this.tickRepo.find({ where: { stockId }, order: { timestamp: 'DESC' }, take: limit * 30 });
    if (ticks.length === 0) return [];
    ticks.reverse();

    const bars: KLineBar[] = [];
    const barSize = 30;
    for (let i = 0; i < ticks.length; i += barSize) {
      const chunk = ticks.slice(i, i + barSize);
      if (chunk.length === 0) continue;
      const prices = chunk.map(t => Number(t.price));
      const volumes = chunk.map(t => Number(t.volume));
      bars.push({
        time: new Date(chunk[0].timestamp).getTime() / 1000,
        open: prices[0], high: Math.max(...prices), low: Math.min(...prices), close: prices[prices.length - 1],
        volume: volumes.reduce((a, b) => a + b, 0),
      });
    }

    const result = bars.slice(-limit);
    await this.redis.set(`kline:${stockId}:${limit}`, JSON.stringify(result), 5);
    return result;
  }
}
