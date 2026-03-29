export interface StockBehaviorProfile {
  key: string;
  marketSensitivity: number;
  volatilityMultiplier: number;
  meanReversion: number;
  eventSensitivity: number;
  anchorClamp: [number, number];
  anchorBullBias: number;
  anchorBearBias: number;
  anchorDriftRange: [number, number];
  anchorDurationRange: [number, number];
  swingBullBias: number;
  swingBearBias: number;
  swingDriftRange: [number, number];
  swingDurationRange: [number, number];
  jumpChance: number;
  jumpRange: [number, number];
  jumpBearBias: number;
}

const PROFILE_LIBRARY: Record<string, StockBehaviorProfile> = {
  steadyCompounder: {
    key: 'steadyCompounder',
    marketSensitivity: 0.95,
    volatilityMultiplier: 0.8,
    meanReversion: 0.006,
    eventSensitivity: 0.16,
    anchorClamp: [0.85, 2.4],
    anchorBullBias: 0.68,
    anchorBearBias: 0.1,
    anchorDriftRange: [0.00025, 0.00085],
    anchorDurationRange: [18, 42],
    swingBullBias: 0.5,
    swingBearBias: 0.26,
    swingDriftRange: [0.0003, 0.0014],
    swingDurationRange: [5, 12],
    jumpChance: 0.005,
    jumpRange: [0.01, 0.035],
    jumpBearBias: 0.58,
  },
  defensiveGrower: {
    key: 'defensiveGrower',
    marketSensitivity: 0.8,
    volatilityMultiplier: 0.65,
    meanReversion: 0.01,
    eventSensitivity: 0.14,
    anchorClamp: [0.9, 1.9],
    anchorBullBias: 0.6,
    anchorBearBias: 0.12,
    anchorDriftRange: [0.00015, 0.00055],
    anchorDurationRange: [20, 48],
    swingBullBias: 0.46,
    swingBearBias: 0.24,
    swingDriftRange: [0.0002, 0.0009],
    swingDurationRange: [6, 14],
    jumpChance: 0.004,
    jumpRange: [0.008, 0.025],
    jumpBearBias: 0.6,
  },
  cyclicalMover: {
    key: 'cyclicalMover',
    marketSensitivity: 1,
    volatilityMultiplier: 1.15,
    meanReversion: 0.008,
    eventSensitivity: 0.2,
    anchorClamp: [0.75, 1.9],
    anchorBullBias: 0.46,
    anchorBearBias: 0.27,
    anchorDriftRange: [0.00005, 0.00045],
    anchorDurationRange: [10, 24],
    swingBullBias: 0.45,
    swingBearBias: 0.35,
    swingDriftRange: [0.0005, 0.0022],
    swingDurationRange: [3, 8],
    jumpChance: 0.012,
    jumpRange: [0.018, 0.055],
    jumpBearBias: 0.48,
  },
  highBeta: {
    key: 'highBeta',
    marketSensitivity: 1.2,
    volatilityMultiplier: 1.45,
    meanReversion: 0.0045,
    eventSensitivity: 0.26,
    anchorClamp: [0.65, 2.3],
    anchorBullBias: 0.48,
    anchorBearBias: 0.28,
    anchorDriftRange: [0.0001, 0.0004],
    anchorDurationRange: [8, 18],
    swingBullBias: 0.49,
    swingBearBias: 0.36,
    swingDriftRange: [0.0012, 0.0035],
    swingDurationRange: [2, 6],
    jumpChance: 0.02,
    jumpRange: [0.025, 0.075],
    jumpBearBias: 0.5,
  },
  memeRocket: {
    key: 'memeRocket',
    marketSensitivity: 1.35,
    volatilityMultiplier: 1.8,
    meanReversion: 0.0035,
    eventSensitivity: 0.32,
    anchorClamp: [0.55, 2.8],
    anchorBullBias: 0.48,
    anchorBearBias: 0.27,
    anchorDriftRange: [0.00005, 0.00035],
    anchorDurationRange: [6, 14],
    swingBullBias: 0.51,
    swingBearBias: 0.38,
    swingDriftRange: [0.0018, 0.0048],
    swingDurationRange: [2, 5],
    jumpChance: 0.03,
    jumpRange: [0.035, 0.09],
    jumpBearBias: 0.5,
  },
  turnaround: {
    key: 'turnaround',
    marketSensitivity: 1.1,
    volatilityMultiplier: 1.35,
    meanReversion: 0.005,
    eventSensitivity: 0.24,
    anchorClamp: [0.55, 2.2],
    anchorBullBias: 0.53,
    anchorBearBias: 0.2,
    anchorDriftRange: [0.0002, 0.0008],
    anchorDurationRange: [12, 28],
    swingBullBias: 0.47,
    swingBearBias: 0.37,
    swingDriftRange: [0.001, 0.0032],
    swingDurationRange: [3, 7],
    jumpChance: 0.018,
    jumpRange: [0.02, 0.065],
    jumpBearBias: 0.49,
  },
};

const SECTOR_DEFAULT_PROFILE: Record<string, keyof typeof PROFILE_LIBRARY> = {
  '科技': 'steadyCompounder',
  '科技/汽车': 'highBeta',
  '科技/娱乐': 'highBeta',
  '科技/社交': 'highBeta',
  '餐饮': 'cyclicalMover',
  '餐饮/科技': 'highBeta',
  '餐饮/娱乐': 'highBeta',
  '金融': 'defensiveGrower',
  '金融/保险': 'defensiveGrower',
  '能源': 'defensiveGrower',
  '消费/宠物': 'memeRocket',
  '消费/电商': 'steadyCompounder',
  '娱乐/游戏': 'highBeta',
  '娱乐/影视': 'cyclicalMover',
  '医疗': 'defensiveGrower',
  '健康/消费': 'cyclicalMover',
  '房地产': 'defensiveGrower',
  '交通': 'cyclicalMover',
  '水产/食品': 'memeRocket',
  '教育': 'steadyCompounder',
  '农业': 'turnaround',
};

const SYMBOL_PROFILE_OVERRIDES: Record<string, keyof typeof PROFILE_LIBRARY> = {
  PEAR: 'steadyCompounder',
  GOGGLE: 'steadyCompounder',
  TESLAA: 'memeRocket',
  NETTFLIX: 'highBeta',
  BYTT: 'highBeta',
  HOTPOT: 'cyclicalMover',
  MALALA: 'cyclicalMover',
  MTEA: 'highBeta',
  JBING: 'highBeta',
  CHUANR: 'highBeta',
  GCOIN: 'defensiveGrower',
  INSUR: 'defensiveGrower',
  SUNPW: 'defensiveGrower',
  WINDY: 'defensiveGrower',
  CATCO: 'memeRocket',
  SHOPP: 'steadyCompounder',
  GPLAY: 'highBeta',
  MOVIEE: 'cyclicalMover',
  HEALZ: 'defensiveGrower',
  FITBIT: 'cyclicalMover',
  TOWER: 'defensiveGrower',
  FLYER: 'cyclicalMover',
  SEAAA: 'memeRocket',
  LEARN: 'steadyCompounder',
  FARMM: 'turnaround',
};

export function getStockBehavior(symbol: string, sector: string): StockBehaviorProfile {
  const profileKey = SYMBOL_PROFILE_OVERRIDES[symbol]
    ?? SECTOR_DEFAULT_PROFILE[sector]
    ?? 'cyclicalMover';

  return PROFILE_LIBRARY[profileKey];
}
