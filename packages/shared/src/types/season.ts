export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SeasonRecord {
  id: string;
  userId: string;
  seasonId: string;
  finalAssets: number;
  returnRate: number;
  tier: Tier;
  ranking: number;
}
