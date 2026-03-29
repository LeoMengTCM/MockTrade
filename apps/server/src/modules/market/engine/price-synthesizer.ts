import { Injectable } from '@nestjs/common';
import { RandomWalk, getSectorVolatility } from './random-walk';
import { MeanReversion } from './mean-reversion';
import { EventImpact } from './event-impact';
import { getStockBehavior } from './stock-behavior';
import { TrendEngine } from './trend-engine';
import { MarketRegimeService } from '../market-regime.service';

export interface SynthesizeParams {
  stockId: string;
  symbol: string;
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
    private readonly trendEngine: TrendEngine,
    private readonly marketRegime: MarketRegimeService,
  ) {}

  synthesize(params: SynthesizeParams): SynthesizeResult {
    const {
      stockId, symbol, currentPrice, basePrice, openPrice, sector,
    } = params;
    const profile = getStockBehavior(symbol, sector);
    const market = this.marketRegime.getInfluence(sector, profile);
    const sigma = getSectorVolatility(sector) * profile.volatilityMultiplier * market.volatilityMultiplier;
    const trend = this.trendEngine.getContribution({
      stockId,
      currentPrice,
      basePrice,
      profile,
      market,
    });

    const rwChange = this.randomWalk.generate({ currentPrice, mu: 0, sigma, dt: 1 / 30 });
    const mrChange = this.meanReversion.calculate(currentPrice, trend.anchorPrice, profile.meanReversion);
    const eiPercent = this.eventImpact.getCurrentImpact(stockId);
    const eiChange = currentPrice * eiPercent * profile.eventSensitivity * market.eventSensitivityMultiplier;

    let newPrice = currentPrice + rwChange + trend.trendChange + trend.jumpChange + mrChange + eiChange;
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
