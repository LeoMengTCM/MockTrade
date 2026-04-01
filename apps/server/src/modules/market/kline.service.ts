import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTickEntity } from '../../entities/stock-tick.entity';
import { RedisService } from '../redis/redis.service';
import { MarketStateService } from './market-state.service';

export interface KLineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type KLineResolution = 'tick' | '1m' | '1d' | '5d' | '15d';

interface TickPoint {
  price: number;
  volume: number;
  timestampMs: number;
  marketDayId: string | null;
  marketDayStartedAtMs: number | null;
}

interface TradingDaySlice {
  id: string;
  startAtMs: number;
  openPrice: number;
  ticks: TickPoint[];
}

@Injectable()
export class KLineService {
  constructor(
    @InjectRepository(StockTickEntity) private readonly tickRepo: Repository<StockTickEntity>,
    private readonly redis: RedisService,
    private readonly marketState: MarketStateService,
  ) {}

  async getKLines(stockId: string, limit = 100, resolution = '1m'): Promise<KLineBar[]> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
    const normalizedResolution = this.normalizeResolution(resolution);
    const cacheKey = `kline:${stockId}:${normalizedResolution}:${safeLimit}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Ignore corrupted cache and rebuild.
      }
    }

    const ticks = await this.loadRecentTicks(stockId, this.getTickFetchSize(normalizedResolution, safeLimit));
    if (ticks.length === 0) return [];

    const tradingDays = this.buildTradingDaySlices(ticks);
    if (tradingDays.length === 0) return [];

    const latestTradingDay = tradingDays[tradingDays.length - 1]!;
    let result: KLineBar[];

    if (normalizedResolution === 'tick') {
      result = this.buildTickBars(latestTradingDay, safeLimit);
    } else if (normalizedResolution === '1m') {
      result = this.buildRelativeTimeBars(latestTradingDay, safeLimit, 60);
    } else if (normalizedResolution === '1d') {
      result = this.buildTradingDayBars(tradingDays, safeLimit, 1);
    } else if (normalizedResolution === '5d') {
      result = this.buildTradingDayBars(tradingDays, safeLimit, 5);
    } else {
      result = this.buildTradingDayBars(tradingDays, safeLimit, 15);
    }

    await this.redis.set(cacheKey, JSON.stringify(result), 5);
    return result;
  }

  private normalizeResolution(resolution: string): KLineResolution {
    if (resolution === 'tick') return 'tick';
    if (resolution === '1d' || resolution === 'day' || resolution === '5m') return '1d';
    if (resolution === '5d' || resolution === '15m' || resolution === '1w') return '5d';
    if (resolution === '15d' || resolution === '1h' || resolution === '1M') return '15d';
    return '1m';
  }

  private getTickFetchSize(resolution: KLineResolution, limit: number) {
    if (resolution === 'tick' || resolution === '1m') {
      return Math.max(400, limit * 4);
    }

    const tradingDayMultiplier = resolution === '1d' ? 80 : resolution === '5d' ? 320 : 720;
    return Math.min(6000, Math.max(800, limit * tradingDayMultiplier));
  }

  private async loadRecentTicks(stockId: string, take: number): Promise<TickPoint[]> {
    const ticks = await this.tickRepo.find({
      where: { stockId },
      order: { timestamp: 'DESC' },
      take,
    });

    return ticks.reverse().map((tick) => ({
      price: Number(tick.price),
      volume: Number(tick.volume),
      timestampMs: new Date(tick.timestamp).getTime(),
      marketDayId: tick.marketDayId ?? null,
      marketDayStartedAtMs: tick.marketDayStartedAt ? new Date(tick.marketDayStartedAt).getTime() : null,
    }));
  }

  private buildTradingDaySlices(ticks: TickPoint[]): TradingDaySlice[] {
    const sessions: TradingDaySlice[] = [];
    const legacyGapMs = this.getLegacySessionGapMs();
    let currentSession: TradingDaySlice | null = null;
    let previousTimestampMs: number | null = null;
    let legacySessionIndex = 0;

    for (const tick of ticks) {
      const shouldStartNewSession = !currentSession
        || (tick.marketDayId !== null && tick.marketDayId !== currentSession.id)
        || (
          tick.marketDayId === null
          && previousTimestampMs !== null
          && tick.timestampMs - previousTimestampMs > legacyGapMs
        );

      if (shouldStartNewSession) {
        currentSession = {
          id: tick.marketDayId ?? `legacy:${++legacySessionIndex}`,
          startAtMs: tick.marketDayStartedAtMs ?? tick.timestampMs,
          openPrice: tick.price,
          ticks: [],
        };
        sessions.push(currentSession);
      } else if (currentSession && tick.marketDayStartedAtMs !== null && tick.marketDayStartedAtMs < currentSession.startAtMs) {
        currentSession.startAtMs = tick.marketDayStartedAtMs;
      }

      currentSession!.ticks.push(tick);
      previousTimestampMs = tick.timestampMs;
    }

    return sessions
      .map((session, index) => ({
        ...session,
        openPrice: this.getTradingDayOpenPrice(session, sessions[index - 1]),
      }))
      .filter((session) => session.ticks.length > 0);
  }

  private getTradingDayOpenPrice(session: TradingDaySlice, previousSession?: TradingDaySlice): number {
    const firstTick = session.ticks[0];
    if (!firstTick) return 0;
    if (firstTick.volume === 0) return firstTick.price;

    const previousClose = previousSession?.ticks[previousSession.ticks.length - 1]?.price;
    return previousClose ?? firstTick.price;
  }

  private getLegacySessionGapMs() {
    return Math.max(6000, Math.floor(this.marketState.getCloseDuration() / 3));
  }

  private buildTickBars(session: TradingDaySlice, limit: number): KLineBar[] {
    const bars: KLineBar[] = [];
    let previousPrice = session.openPrice;

    for (let index = 0; index < session.ticks.length; index += 1) {
      const tick = session.ticks[index];
      if (!tick) continue;

      const open = index === 0 ? session.openPrice : previousPrice;
      const close = tick.price;
      previousPrice = close;

      bars.push({
        time: Math.floor(tick.timestampMs / 1000),
        open,
        high: Math.max(open, close),
        low: Math.min(open, close),
        close,
        volume: tick.volume,
      });
    }

    return bars.slice(-limit);
  }

  private buildRelativeTimeBars(session: TradingDaySlice, limit: number, bucketSeconds: number): KLineBar[] {
    const bucketMs = bucketSeconds * 1000;
    const bars: KLineBar[] = [];
    let currentBucketIndex: number | null = null;
    let currentBar: KLineBar | null = null;
    let previousClose = session.openPrice;

    for (const tick of session.ticks) {
      const elapsedMs = Math.max(0, tick.timestampMs - session.startAtMs);
      const bucketIndex = Math.floor(elapsedMs / bucketMs);
      const bucketStartMs = session.startAtMs + bucketIndex * bucketMs;

      if (currentBucketIndex !== bucketIndex || !currentBar) {
        if (currentBar) bars.push(currentBar);

        const bucketOpen = bucketIndex === 0 ? session.openPrice : previousClose;
        currentBucketIndex = bucketIndex;
        currentBar = {
          time: Math.floor(bucketStartMs / 1000),
          open: bucketOpen,
          high: Math.max(bucketOpen, tick.price),
          low: Math.min(bucketOpen, tick.price),
          close: tick.price,
          volume: tick.volume,
        };
      } else {
        currentBar.high = Math.max(currentBar.high, tick.price);
        currentBar.low = Math.min(currentBar.low, tick.price);
        currentBar.close = tick.price;
        currentBar.volume += tick.volume;
      }

      previousClose = tick.price;
    }

    if (currentBar) bars.push(currentBar);

    return bars.slice(-limit);
  }

  private buildTradingDayBars(tradingDays: TradingDaySlice[], limit: number, spanDays: number): KLineBar[] {
    const dailyBars = tradingDays
      .map((session) => this.buildTradingDayBar(session))
      .filter((bar): bar is KLineBar => bar !== null);

    if (spanDays <= 1) {
      return dailyBars.slice(-limit);
    }

    const groupedBars: KLineBar[] = [];
    for (let index = 0; index < dailyBars.length; index += spanDays) {
      const group = dailyBars.slice(index, index + spanDays);
      if (group.length === 0) continue;

      groupedBars.push({
        time: group[0]!.time,
        open: group[0]!.open,
        high: Math.max(...group.map((bar) => bar.high)),
        low: Math.min(...group.map((bar) => bar.low)),
        close: group[group.length - 1]!.close,
        volume: group.reduce((sum, bar) => sum + bar.volume, 0),
      });
    }

    return groupedBars.slice(-limit);
  }

  private buildTradingDayBar(session: TradingDaySlice): KLineBar | null {
    const firstTick = session.ticks[0];
    const lastTick = session.ticks[session.ticks.length - 1];
    if (!firstTick || !lastTick) return null;

    const prices = session.ticks.map((tick) => tick.price);

    return {
      time: Math.floor(session.startAtMs / 1000),
      open: session.openPrice,
      high: Math.max(session.openPrice, ...prices),
      low: Math.min(session.openPrice, ...prices),
      close: lastTick.price,
      volume: session.ticks.reduce((sum, tick) => sum + tick.volume, 0),
    };
  }
}
