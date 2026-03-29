'use client';

import { useMarketStore } from '@/stores/market-store';
import { cn } from '@/lib/cn';
import { formatCountdown } from '@/lib/formatters';

export function MarketStatusBadge() {
  const { marketStatus, countdown, marketRegime } = useMarketStore();
  const isOpen = marketStatus === 'opening';
  const isSettling = marketStatus === 'settling';

  const statusLabel = isOpen ? '开盘中' : isSettling ? '结算中' : '休市中';
  const countdownLabel = isOpen
    ? `距休市 ${formatCountdown(countdown)}`
    : marketStatus === 'closed' && countdown > 0
      ? `距开盘 ${formatCountdown(countdown)}`
      : null;

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'h-2 w-2 rounded-full',
        isOpen
          ? 'bg-green-500 animate-pulse'
          : isSettling
            ? 'bg-amber-500 animate-pulse'
            : 'bg-gray-500',
      )}>
      </span>
      <span className={cn(
        'text-sm font-medium',
        isOpen ? 'text-green-400' : isSettling ? 'text-amber-400' : 'text-[var(--text-muted)]',
      )}>
        {statusLabel}
      </span>
      {countdownLabel && (
        <span className="text-xs text-[var(--text-muted)]">
          {countdownLabel}
        </span>
      )}
      {marketRegime && (
        <span
          className={cn(
            'hidden xl:inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
            marketRegime.regime === 'bull'
              ? 'bg-up/10 text-up'
              : marketRegime.regime === 'bear'
                ? 'bg-down/10 text-down'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          )}
        >
          {marketRegime.label}
        </span>
      )}
    </div>
  );
}
