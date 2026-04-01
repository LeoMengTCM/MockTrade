'use client';

import type { PriceDirection } from '@/lib/price-change';

interface SparklineProps {
    prices: number[];
    width?: number;
    height?: number;
    className?: string;
    direction?: PriceDirection;
}

export function Sparkline({ prices, width = 80, height = 24, className, direction }: SparklineProps) {
    if (!prices || prices.length < 2) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = 1;

    const points = prices.map((price, i) => {
        const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
        const y = padding + (1 - (price - min) / range) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const stroke = direction === 'flat'
        ? 'var(--text-muted)'
        : direction === 'down'
            ? 'var(--price-down)'
            : 'var(--price-up)';

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className={className}
            style={{ display: 'block' }}
        >
            <polyline
                points={points}
                fill="none"
                stroke={stroke}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
