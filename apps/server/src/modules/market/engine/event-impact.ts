import { Injectable, Logger } from '@nestjs/common';

export interface StockImpact {
  stockId: string;
  impactPercent: number;
  decayRate: number;
  startTime: number;
  duration: number;
}

@Injectable()
export class EventImpact {
  private readonly logger = new Logger(EventImpact.name);
  private activeImpacts: StockImpact[] = [];

  inject(stockId: string, impactPercent: number, durationMs = 60000): void {
    this.activeImpacts.push({
      stockId,
      impactPercent,
      decayRate: 3 / durationMs,
      startTime: Date.now(),
      duration: durationMs,
    });
    this.logger.log(`Impact: stock=${stockId}, ${(impactPercent * 100).toFixed(1)}%, ${durationMs}ms`);
  }

  getCurrentImpact(stockId: string): number {
    const now = Date.now();
    this.activeImpacts = this.activeImpacts.filter(i => now - i.startTime <= i.duration);
    let total = 0;
    for (const i of this.activeImpacts) {
      if (i.stockId !== stockId) continue;
      total += i.impactPercent * Math.exp(-i.decayRate * (now - i.startTime));
    }
    return total;
  }

  injectRelated(primaryId: string, related: Array<{ stockId: string; ratio: number }>, impact: number, dur = 60000) {
    this.inject(primaryId, impact, dur);
    for (const r of related) this.inject(r.stockId, impact * r.ratio, dur);
  }

  clearAll() { this.activeImpacts = []; }
  getActiveCount() { return this.activeImpacts.length; }
}
