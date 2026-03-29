'use client';

import { useEffect, useState, useRef } from 'react';
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
  const isFlat = change === undefined || change === 0;

  const colorClass = isFlat ? 'text-[var(--text-muted)]' : isUp ? 'text-up' : 'text-down';
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-[1.35rem]', xl: 'text-3xl' }[size];

  const [flashClass, setFlashClass] = useState<string>('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const wentUp = value > prevValueRef.current;
      setFlashClass(wentUp ? 'flash-up' : 'flash-down');
      prevValueRef.current = value;

      const timer = setTimeout(() => setFlashClass(''), 500);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="flex items-baseline gap-2.5">
      <span className={cn('font-mono font-bold tabular-nums tracking-tight rounded-md px-1 -mx-1', sizeClass, flashClass)}>
        ${value.toFixed(2)}
      </span>
      {change !== undefined && (
        <span className={cn('font-mono text-sm tabular-nums font-medium', colorClass)}>
          {showSign && (isUp && !isFlat ? '+' : '')}{change.toFixed(2)}
          {changePercent !== undefined && ` (${isUp && !isFlat ? '+' : ''}${(changePercent * 100).toFixed(2)}%)`}
        </span>
      )}
    </div>
  );
}
