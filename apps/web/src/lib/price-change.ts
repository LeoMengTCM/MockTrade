export type PriceDirection = 'up' | 'down' | 'flat';

export interface PriceMovement {
  change: number;
  changePercent: number;
  direction: PriceDirection;
}

export function getPriceDirection(change: number, epsilon = 0.000001): PriceDirection {
  if (Math.abs(change) <= epsilon) return 'flat';
  return change > 0 ? 'up' : 'down';
}

export function getPriceMovement(currentPrice: number, referencePrice: number): PriceMovement {
  const change = currentPrice - referencePrice;
  const changePercent = referencePrice > 0 ? change / referencePrice : 0;

  return {
    change,
    changePercent,
    direction: getPriceDirection(change),
  };
}

export function getDirectionalTextClass(
  direction: PriceDirection,
  neutralClass = 'text-[var(--text-muted)]',
) {
  if (direction === 'up') return 'text-up';
  if (direction === 'down') return 'text-down';
  return neutralClass;
}
