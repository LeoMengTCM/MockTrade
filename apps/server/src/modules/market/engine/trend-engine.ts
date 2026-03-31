import { Injectable } from '@nestjs/common';
import { StockBehaviorProfile } from './stock-behavior';
import { MarketRegimeInfluence } from '../market-regime.service';

interface TrendState {
  anchorPrice: number;
  anchorDrift: number;
  anchorTicksRemaining: number;
  swingDrift: number;
  swingTicksRemaining: number;
}

export interface TrendContributionParams {
  stockId: string;
  currentPrice: number;
  basePrice: number;
  profile: StockBehaviorProfile;
  market: MarketRegimeInfluence;
}

export interface TrendContribution {
  anchorPrice: number;
  trendChange: number;
  jumpChange: number;
}

@Injectable()
export class TrendEngine {
  private readonly states = new Map<string, TrendState>();

  cleanup(activeStockIds: Set<string>): void {
    for (const stockId of this.states.keys()) {
      if (!activeStockIds.has(stockId)) {
        this.states.delete(stockId);
      }
    }
  }

  resetAll(): void {
    this.states.clear();
  }

  getContribution(params: TrendContributionParams): TrendContribution {
    const {
      stockId, currentPrice, basePrice, profile, market,
    } = params;
    const state = this.getOrCreateState(stockId, basePrice);

    this.resetIfSeasonRestarted(state, currentPrice, basePrice);

    if (state.anchorTicksRemaining <= 0) {
      this.assignAnchorRegime(state, profile, market);
    }

    if (state.swingTicksRemaining <= 0) {
      this.assignSwingRegime(state, profile, market);
    }

    state.anchorPrice = this.clamp(
      state.anchorPrice * (1 + state.anchorDrift + market.anchorDrift),
      basePrice * profile.anchorClamp[0],
      basePrice * profile.anchorClamp[1],
    );

    const trendChange = +(currentPrice * state.swingDrift).toFixed(4);
    const jumpChange = this.rollJump(currentPrice, profile, market);

    state.anchorTicksRemaining -= 1;
    state.swingTicksRemaining -= 1;

    return {
      anchorPrice: +state.anchorPrice.toFixed(4),
      trendChange,
      jumpChange,
    };
  }

  private getOrCreateState(stockId: string, basePrice: number): TrendState {
    let state = this.states.get(stockId);
    if (!state) {
      state = {
        anchorPrice: basePrice,
        anchorDrift: 0,
        anchorTicksRemaining: 0,
        swingDrift: 0,
        swingTicksRemaining: 0,
      };
      this.states.set(stockId, state);
    }
    return state;
  }

  private resetIfSeasonRestarted(state: TrendState, currentPrice: number, basePrice: number) {
    const priceNearBase = Math.abs(currentPrice - basePrice) / Math.max(basePrice, 0.01) < 0.01;
    const anchorFarAway = Math.abs(state.anchorPrice - basePrice) / Math.max(basePrice, 0.01) > 0.2;

    if (priceNearBase && anchorFarAway) {
      state.anchorPrice = basePrice;
      state.anchorDrift = 0;
      state.anchorTicksRemaining = 0;
      state.swingDrift = 0;
      state.swingTicksRemaining = 0;
    }
  }

  private assignAnchorRegime(state: TrendState, profile: StockBehaviorProfile, market: MarketRegimeInfluence) {
    const direction = this.rollDirection(profile.anchorBullBias, profile.anchorBearBias, market.bias);
    const driftMultiplier = 1 + Math.abs(market.bias) * 0.65;
    state.anchorDrift = direction === 0 ? 0 : this.randomRange(...profile.anchorDriftRange) * direction * driftMultiplier;
    state.anchorTicksRemaining = this.randomInt(...profile.anchorDurationRange);
  }

  private assignSwingRegime(state: TrendState, profile: StockBehaviorProfile, market: MarketRegimeInfluence) {
    const direction = this.rollDirection(profile.swingBullBias, profile.swingBearBias, market.bias);
    const driftMultiplier = 1 + Math.abs(market.bias) * 0.8;
    state.swingDrift = direction === 0 ? 0 : this.randomRange(...profile.swingDriftRange) * direction * driftMultiplier;
    state.swingTicksRemaining = this.randomInt(...profile.swingDurationRange);
  }

  private rollJump(currentPrice: number, profile: StockBehaviorProfile, market: MarketRegimeInfluence): number {
    if (Math.random() >= profile.jumpChance) {
      return 0;
    }

    const jumpBearBias = this.clamp(profile.jumpBearBias - market.bias * 0.8, 0.12, 0.88);
    const direction = Math.random() < jumpBearBias ? -1 : 1;
    return +(currentPrice * this.randomRange(...profile.jumpRange) * direction).toFixed(4);
  }

  private rollDirection(bullBias: number, bearBias: number, marketBias: number): -1 | 0 | 1 {
    const adjustedBullBias = this.clamp(bullBias + marketBias, 0.08, 0.82);
    const adjustedBearBias = this.clamp(bearBias - marketBias, 0.08, 0.82);
    const roll = Math.random();
    if (roll < adjustedBullBias) {
      return 1;
    }
    if (roll < Math.min(adjustedBullBias + adjustedBearBias, 0.95)) {
      return -1;
    }
    return 0;
  }

  private randomRange(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }
}
