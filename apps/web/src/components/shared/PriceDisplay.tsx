'use client';

import { cn } from '@/lib/cn';

interface PriceDisplayProps {
  value: number;
  change?: number;
  changePercent?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
}

export function PriceDisplay({ value, change, changePercent, size = 'md', showSign = true }: PriceDisplayProps) {
  const isUp = (change ?? 0) >= 0;
  const colorClass = change === undefined || change === 0 ? 'text-[var(--text-muted)]' : isUp ? 'text-up' : 'text-down';
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-xl', xl: 'text-3xl' }[size];

  return (
    <div className="flex items-baseline gap-2">
      <span className={cn('font-mono font-bold tabular-nums', sizeClass)}>
        ${value.toFixed(2)}
      </span>
      {change !== undefined && (
        <span className={cn('font-mono text-sm tabular-nums', colorClass)}>
          {showSign && (isUp ? '+' : '')}{change.toFixed(2)}
          {changePercent !== undefined && ` (${isUp ? '+' : ''}${(changePercent * 100).toFixed(2)}%)`}
        </span>
      )}
    </div>
  );
}
