import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MarketStatus } from '@mocktrade/shared';
import { Repository } from 'typeorm';
import { StockEntity } from '../../entities/stock.entity';
import { StockBehaviorProfile } from './engine/stock-behavior';
import { MarketStateService } from './market-state.service';

export type MarketRegime = 'bull' | 'neutral' | 'bear';
export type SectorRole = 'leader' | 'laggard' | 'neutral';

interface MarketRegimeState {
  regime: MarketRegime;
  totalCycles: number;
  cyclesRemaining: number;
  startedCycle: number;
  lastProcessedCycle: number;
  strength: number;
  leadingSectors: string[];
  laggingSectors: string[];
}

export interface MarketRegimeInfluence {
  regime: MarketRegime;
  sectorRole: SectorRole;
  bias: number;
  anchorDrift: number;
  volatilityMultiplier: number;
  eventSensitivityMultiplier: number;
}

@Injectable()
export class MarketRegimeService implements OnModuleInit {
  private readonly logger = new Logger(MarketRegimeService.name);
  private state: MarketRegimeState | null = null;
  private sectorUniverse: string[] = [];

  constructor(
    @InjectRepository(StockEntity) private readonly stockRepo: Repository<StockEntity>,
    private readonly marketState: MarketStateService,
  ) {}

  async onModuleInit() {
    await this.refreshSectorUniverse();

    this.marketState.onStatusChange((status) => {
      if (status === MarketStatus.OPENING) {
        void this.handleOpeningCycle().catch((error) => {
          this.logger.error('Failed to advance market regime', error);
        });
      }
    });

    if (this.marketState.getStatus() === MarketStatus.OPENING) {
      await this.handleOpeningCycle();
    }
  }

  async handleOpeningCycle() {
    const cycle = this.marketState.getCycleCount();
    if (cycle <= 0) {
      return;
    }

    if (this.sectorUniverse.length === 0) {
      await this.refreshSectorUniverse();
    }

    if (!this.state) {
      this.state = this.createState(this.pickInitialRegime(), cycle);
      this.logState('Initialized');
      return;
    }

    if (this.state.lastProcessedCycle === cycle) {
      return;
    }

    this.state.lastProcessedCycle = cycle;
    this.state.cyclesRemaining -= 1;
    this.state.strength = this.computeStrength(this.state.totalCycles, this.state.cyclesRemaining);

    if (this.state.cyclesRemaining <= 0) {
      this.state = this.createState(this.pickNextRegime(this.state.regime), cycle);
      this.logState('Switched');
    }
  }

  getInfluence(sector: string, profile: StockBehaviorProfile): MarketRegimeInfluence {
    const state = this.ensureState();
    const sectorRole = this.getSectorRole(sector, state);
    const regimeBias = state.regime === 'bull'
      ? 0.22
      : state.regime === 'bear'
        ? -0.22
        : 0;
    const sectorBias = sectorRole === 'leader'
      ? 0.07
      : sectorRole === 'laggard'
        ? -0.07
        : 0;

    const combinedBias = (regimeBias + sectorBias) * profile.marketSensitivity * state.strength;
    const anchorDriftBase = state.regime === 'bull'
      ? 0.00035
      : state.regime === 'bear'
        ? -0.00035
        : 0;
    const anchorSectorBonus = sectorRole === 'leader'
      ? 0.0001
      : sectorRole === 'laggard'
        ? -0.0001
        : 0;
    const anchorDrift = (anchorDriftBase + anchorSectorBonus) * profile.marketSensitivity * state.strength;

    let volatilityMultiplier = 1;
    if (state.regime === 'bear') {
      volatilityMultiplier += 0.08 * profile.marketSensitivity;
    } else if (state.regime === 'bull') {
      volatilityMultiplier += 0.03 * profile.marketSensitivity;
    }
    if (sectorRole === 'leader') {
      volatilityMultiplier += 0.04;
    } else if (sectorRole === 'laggard') {
      volatilityMultiplier += 0.06;
    }

    let eventSensitivityMultiplier = 1;
    if (sectorRole === 'leader') {
      eventSensitivityMultiplier += 0.08;
    } else if (sectorRole === 'laggard') {
      eventSensitivityMultiplier -= 0.05;
    }

    return {
      regime: state.regime,
      sectorRole,
      bias: combinedBias,
      anchorDrift,
      volatilityMultiplier,
      eventSensitivityMultiplier,
    };
  }

  getSnapshot() {
    const state = this.ensureState();

    return {
      regime: state.regime,
      label: this.getRegimeLabel(state.regime),
      cyclesRemaining: state.cyclesRemaining,
      totalCycles: state.totalCycles,
      strength: +state.strength.toFixed(2),
      leadingSectors: state.leadingSectors,
      laggingSectors: state.laggingSectors,
    };
  }

  private async refreshSectorUniverse() {
    const stocks = await this.stockRepo.find({
      select: ['sector'],
      where: { isActive: true },
    });
    this.sectorUniverse = [...new Set(stocks.map((stock) => stock.sector))];
  }

  private ensureState(): MarketRegimeState {
    if (!this.state) {
      this.state = this.createState(this.pickInitialRegime(), Math.max(this.marketState.getCycleCount(), 1));
    }

    return this.state;
  }

  private createState(regime: MarketRegime, cycle: number): MarketRegimeState {
    const rotation = this.pickSectorRotation(regime);
    const totalCycles = this.randomInt(
      regime === 'neutral' ? 2 : 3,
      regime === 'neutral' ? 4 : 6,
    );

    return {
      regime,
      totalCycles,
      cyclesRemaining: totalCycles,
      startedCycle: cycle,
      lastProcessedCycle: cycle,
      strength: 0.45,
      leadingSectors: rotation.leadingSectors,
      laggingSectors: rotation.laggingSectors,
    };
  }

  private computeStrength(totalCycles: number, cyclesRemaining: number) {
    const elapsed = totalCycles - cyclesRemaining;
    return Math.min(1, 0.45 + elapsed * 0.22);
  }

  private pickInitialRegime(): MarketRegime {
    const roll = Math.random();
    if (roll < 0.45) {
      return 'bull';
    }
    if (roll < 0.7) {
      return 'neutral';
    }
    return 'bear';
  }

  private pickNextRegime(current: MarketRegime): MarketRegime {
    const roll = Math.random();

    if (current === 'bull') {
      return roll < 0.65 ? 'bear' : 'neutral';
    }

    if (current === 'bear') {
      return roll < 0.65 ? 'bull' : 'neutral';
    }

    return roll < 0.5 ? 'bull' : 'bear';
  }

  private pickSectors(count: number) {
    if (this.sectorUniverse.length <= count) {
      return [...this.sectorUniverse];
    }

    const pool = [...this.sectorUniverse];
    const picked: string[] = [];
    while (picked.length < count && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      picked.push(pool[index]);
      pool.splice(index, 1);
    }
    return picked;
  }

  private pickSectorRotation(regime: MarketRegime) {
    const leadingCount = regime === 'bear' ? 1 : 2;
    const laggingCount = regime === 'bull' ? 1 : 2;
    const shuffled = [...this.sectorUniverse].sort(() => Math.random() - 0.5);

    const leadingSectors = shuffled.slice(0, leadingCount);
    const remaining = shuffled.filter((sector) => !leadingSectors.includes(sector));
    const laggingSectors = remaining.slice(0, laggingCount);

    return {
      leadingSectors,
      laggingSectors,
    };
  }

  private getSectorRole(sector: string, state: MarketRegimeState): SectorRole {
    if (state.leadingSectors.includes(sector)) {
      return 'leader';
    }
    if (state.laggingSectors.includes(sector)) {
      return 'laggard';
    }
    return 'neutral';
  }

  private getRegimeLabel(regime: MarketRegime) {
    if (regime === 'bull') {
      return '市场上行';
    }
    if (regime === 'bear') {
      return '市场下行';
    }
    return '市场震荡';
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private logState(prefix: string) {
    if (!this.state) {
      return;
    }
    this.logger.log(
      `${prefix} market regime: ${this.state.regime}, ${this.state.cyclesRemaining} cycles, leaders=${this.state.leadingSectors.join('/') || '-'}, laggards=${this.state.laggingSectors.join('/') || '-'}`,
    );
  }
}
