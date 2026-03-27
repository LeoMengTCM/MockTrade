import { Tier } from '../types/season';

export const TIER_THRESHOLDS: Record<Tier, number> = {
  legendary: 1.0,  // >= 100%
  diamond: 0.5,    // >= 50%
  gold: 0.2,       // >= 20%
  silver: 0.05,    // >= 5%
  bronze: -Infinity,
};

export const TIER_COLORS: Record<Tier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#00BFFF',
  legendary: '#A855F7',
};

export const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'diamond', 'legendary'];

export function getTierFromReturnRate(returnRate: number): Tier {
  if (returnRate >= TIER_THRESHOLDS.legendary) return 'legendary';
  if (returnRate >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (returnRate >= TIER_THRESHOLDS.gold) return 'gold';
  if (returnRate >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}
