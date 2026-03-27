import { Injectable } from '@nestjs/common';

export interface RandomWalkParams {
  currentPrice: number;
  mu: number;
  sigma: number;
  dt: number;
}

@Injectable()
export class RandomWalk {
  generate(params: RandomWalkParams): number {
    const { currentPrice, mu, sigma, dt } = params;
    const z = this.boxMullerRandom();
    const changePercent = mu * dt + sigma * Math.sqrt(dt) * z;
    return +(currentPrice * changePercent).toFixed(4);
  }

  private boxMullerRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

export const SECTOR_VOLATILITY: Record<string, number> = {
  '科技': 0.03, '科技/汽车': 0.035, '科技/娱乐': 0.025, '科技/社交': 0.028,
  '餐饮': 0.015, '餐饮/科技': 0.02, '餐饮/娱乐': 0.018,
  '金融': 0.008, '金融/保险': 0.01,
  '能源': 0.018, '消费/宠物': 0.025, '消费/电商': 0.02,
  '娱乐/游戏': 0.03, '娱乐/影视': 0.022,
  '医疗': 0.02, '健康/消费': 0.015,
  '房地产': 0.008, '交通': 0.015, '水产/食品': 0.028,
  '教育': 0.015, '农业': 0.02,
};

export function getSectorVolatility(sector: string): number {
  return SECTOR_VOLATILITY[sector] ?? 0.02;
}
