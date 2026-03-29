export type MarketRegime = 'bull' | 'neutral' | 'bear';
export type MarketSectorRole = 'leader' | 'laggard' | 'neutral';

export interface MarketRegimeSnapshot {
  regime: MarketRegime;
  label: string;
  cyclesRemaining: number;
  totalCycles: number;
  strength: number;
  leadingSectors: string[];
  laggingSectors: string[];
}

export function getMarketRegimeDescription(regime: MarketRegime) {
  if (regime === 'bull') {
    return '整体偏强，市场通常涨多跌少，稳健股更容易慢慢走高。';
  }

  if (regime === 'bear') {
    return '整体偏弱，市场通常跌多涨少，短线更要控制仓位和节奏。';
  }

  return '多空拉扯更明显，重点看板块分化和单只股票自己的节奏。';
}

export function getMarketRegimeStrengthLabel(strength: number) {
  if (strength >= 0.85) {
    return '强';
  }

  if (strength >= 0.6) {
    return '中';
  }

  return '初期';
}

export function getMarketSectorRole(regime: MarketRegimeSnapshot, sector?: string | null): MarketSectorRole {
  if (!sector) {
    return 'neutral';
  }

  if (regime.leadingSectors.includes(sector)) {
    return 'leader';
  }

  if (regime.laggingSectors.includes(sector)) {
    return 'laggard';
  }

  return 'neutral';
}

export function getMarketSectorRoleLabel(role: MarketSectorRole) {
  if (role === 'leader') {
    return '当前属于领涨板块';
  }

  if (role === 'laggard') {
    return '当前属于承压板块';
  }

  return '当前处于中性板块';
}
