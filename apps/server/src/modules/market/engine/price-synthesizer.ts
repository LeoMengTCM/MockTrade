import { Injectable } from '@nestjs/common';
import { RandomWalk, getSectorVolatility } from './random-walk';
import { MeanReversion } from './mean-reversion';
import { EventImpact } from './event-impact';

export interface SynthesizeParams {
  stockId: string;
  currentPrice: number;
  basePrice: number;
  openPrice: number;
  sector: string;
}

export interface SynthesizeResult {
  newPrice: number;
  change: number;
  changePercent: number;
  hitUpperLimit: boolean;
  hitLowerLimit: boolean;
}

@Injectable()
export class PriceSynthesizer {
  constructor(
    private readonly randomWalk: RandomWalk,
    private readonly meanReversion: MeanReversion,
    private readonly eventImpact: EventImpact,
  ) {}

  synthesize(params: SynthesizeParams): SynthesizeResult {
    const { stockId, currentPrice, basePrice, openPrice, sector } = params;
    const sigma = getSectorVolatility(sector);

    const rwChange = this.randomWalk.generate({ currentPrice, mu: 0, sigma, dt: 1 / 30 });
    const mrChange = this.meanReversion.calculate(currentPrice, basePrice, 0.02);
    const eiPercent = this.eventImpact.getCurrentImpact(stockId);
    const eiChange = currentPrice * eiPercent * 0.1;

    let newPrice = currentPrice + rwChange + mrChange + eiChange;
    const upperLimit = +(openPrice * 1.10).toFixed(2);
    const lowerLimit = +(openPrice * 0.90).toFixed(2);
    let hitUpperLimit = false, hitLowerLimit = false;

    if (newPrice >= upperLimit) { newPrice = upperLimit; hitUpperLimit = true; }
    else if (newPrice <= lowerLimit) { newPrice = lowerLimit; hitLowerLimit = true; }

    newPrice = Math.max(0.01, +newPrice.toFixed(2));
    const change = +(newPrice - currentPrice).toFixed(2);
    const changePercent = openPrice > 0 ? +((newPrice - openPrice) / openPrice).toFixed(6) : 0;

    return { newPrice, change, changePercent, hitUpperLimit, hitLowerLimit };
  }
}
