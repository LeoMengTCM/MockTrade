'use client';

import { useMarketStore } from '@/stores/market-store';
import { cn } from '@/lib/cn';

export function MarketStatusBadge() {
  const { marketStatus, countdown } = useMarketStore();
  const isOpen = marketStatus === 'opening';

  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-500')}>
      </span>
      <span className={cn('text-sm font-medium', isOpen ? 'text-green-400' : 'text-[var(--text-muted)]')}>
        {isOpen ? 'OPEN' : 'CLOSED'}
      </span>
      {countdown > 0 && (
        <span className="text-xs text-[var(--text-muted)]">
          {isOpen ? `Closing in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : `Opens in ${countdown}s`}
        </span>
      )}
    </div>
  );
}
