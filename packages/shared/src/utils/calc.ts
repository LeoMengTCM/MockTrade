import { COMMISSION_RATE, PRICE_LIMIT_PERCENT } from '../constants/game';

export function calcReturnRate(currentAssets: number, initialCapital: number): number {
  return (currentAssets - initialCapital) / initialCapital;
}

export function calcPnl(quantity: number, avgCost: number, currentPrice: number): number {
  return quantity * (currentPrice - avgCost);
}

export function calcPnlPercent(avgCost: number, currentPrice: number): number {
  if (avgCost === 0) return 0;
  return (currentPrice - avgCost) / avgCost;
}

export function calcCommission(price: number, quantity: number): number {
  return price * quantity * COMMISSION_RATE;
}

export function calcUpperLimit(openPrice: number): number {
  return +(openPrice * (1 + PRICE_LIMIT_PERCENT)).toFixed(2);
}

export function calcLowerLimit(openPrice: number): number {
  return +(openPrice * (1 - PRICE_LIMIT_PERCENT)).toFixed(2);
}

export function isWithinPriceLimit(price: number, openPrice: number): boolean {
  return price >= calcLowerLimit(openPrice) && price <= calcUpperLimit(openPrice);
}

export function calcNewAvgCost(
  existingQty: number,
  existingAvgCost: number,
  newQty: number,
  newPrice: number,
): number {
  const totalCost = existingQty * existingAvgCost + newQty * newPrice;
  const totalQty = existingQty + newQty;
  return totalQty > 0 ? +(totalCost / totalQty).toFixed(4) : 0;
}
