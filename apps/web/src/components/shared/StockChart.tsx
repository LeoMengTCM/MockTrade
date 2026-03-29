/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { KLineData } from '@mocktrade/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatters';
import { getPricePalette, PRICE_COLOR_MODE_EVENT } from '@/lib/market-display';

type ChartMode = 'line' | 'candlestick';
type ChartResolution = 'tick' | '1m' | '5m' | '15m';

const RESOLUTION_OPTIONS: Array<{
  value: ChartResolution;
  label: string;
  description: string;
}> = [
  { value: 'tick', label: '逐跳', description: '每次价格变动一组' },
  { value: '1m', label: '1分', description: '按 1 分钟聚合' },
  { value: '5m', label: '5分', description: '按 5 分钟聚合' },
  { value: '15m', label: '15分', description: '按 15 分钟聚合' },
];

const RESOLUTION_LIMIT_MAP: Record<ChartResolution, number> = {
  tick: 240,
  '1m': 240,
  '5m': 120,
  '15m': 90,
};

const RESOLUTION_DESCRIPTION_MAP: Record<ChartResolution, string> = {
  tick: '逐跳展示',
  '1m': '1 分钟',
  '5m': '5 分钟',
  '15m': '15 分钟',
};

export interface StockTradeMarker {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  filledAt: string;
}

function buildMovingAverage(bars: KLineData[], period: number) {
  const points: Array<{ time: number; value: number }> = [];
  for (let index = period - 1; index < bars.length; index += 1) {
    const slice = bars.slice(index - period + 1, index + 1);
    const currentBar = bars[index];
    if (!currentBar) continue;
    const average = slice.reduce((total, bar) => total + bar.close, 0) / slice.length;
    points.push({
      time: currentBar.time,
      value: Number(average.toFixed(2)),
    });
  }
  return points;
}

function findNearestBarTime(bars: KLineData[], targetTime: number) {
  const firstBar = bars[0];
  if (!firstBar) return null;

  let nearestTime = firstBar.time;
  let smallestDiff = Math.abs(firstBar.time - targetTime);

  for (const bar of bars) {
    const diff = Math.abs(bar.time - targetTime);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearestTime = bar.time;
    }
  }

  return nearestTime;
}

function buildTradeMarkers(
  bars: KLineData[],
  trades: StockTradeMarker[],
  palette: ReturnType<typeof getPricePalette>,
) {
  return trades
    .map((trade) => {
      const filledAt = new Date(trade.filledAt).getTime();
      if (!Number.isFinite(filledAt)) return null;

      const markerTime = findNearestBarTime(bars, Math.floor(filledAt / 1000));
      if (markerTime === null) return null;

      return {
        id: trade.id,
        time: markerTime as any,
        position: trade.side === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
        shape: trade.side === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
        color: trade.side === 'buy' ? palette.up : palette.down,
        text: `${trade.side === 'buy' ? '买' : '卖'}${trade.quantity}`,
      };
    })
    .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
    .sort((left, right) => Number(left.time) - Number(right.time));
}

export function StockChart({
  stockId,
  tradeMarkers = [],
}: {
  stockId: string;
  tradeMarkers?: StockTradeMarker[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [bars, setBars] = useState<KLineData[]>([]);
  const [mode, setMode] = useState<ChartMode>('line');
  const [resolution, setResolution] = useState<ChartResolution>('tick');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paletteVersion, setPaletteVersion] = useState(0);

  useEffect(() => {
    const handlePaletteChange = () => setPaletteVersion((value) => value + 1);
    window.addEventListener(PRICE_COLOR_MODE_EVENT, handlePaletteChange);
    return () => window.removeEventListener(PRICE_COLOR_MODE_EVENT, handlePaletteChange);
  }, []);

  useEffect(() => {
    let active = true;

    const fetchBars = async () => {
      try {
        const periods = RESOLUTION_LIMIT_MAP[resolution];
        const res = await api.get(`/market/stocks/${stockId}/kline`, { params: { periods, resolution } });
        if (!active) return;
        setBars(Array.isArray(res.data) ? res.data : []);
        setError('');
      } catch {
        if (!active) return;
        setError('K 线数据加载失败');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBars();
    const timer = setInterval(fetchBars, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [stockId, resolution]);

  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      if (!containerRef.current || cancelled) return;

      const container = containerRef.current;
      const palette = getPricePalette();
      const firstBar = bars[0];
      const latestBar = bars[bars.length - 1];
      if (!firstBar || !latestBar) return;
      const trendColor = latestBar.close >= firstBar.open ? palette.up : palette.down;
      const movingAverage5 = buildMovingAverage(bars, 5);
      const movingAverage20 = buildMovingAverage(bars, 20);
      const baselineValue = firstBar.open;
      const executionMarkers = buildTradeMarkers(bars, tradeMarkers, palette);

      const chart = createChart(container, {
        width: container.clientWidth,
        height: 360,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(71, 85, 105, 0.05)' },
          horzLines: { color: 'rgba(71, 85, 105, 0.05)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(71, 85, 105, 0.28)',
          entireTextOnly: true,
        },
        timeScale: {
          borderColor: 'rgba(71, 85, 105, 0.28)',
          timeVisible: true,
          secondsVisible: resolution === 'tick',
          barSpacing: resolution === 'tick' ? (mode === 'line' ? 8 : 6) : mode === 'line' ? 10 : 8,
          rightOffset: 2,
        },
        crosshair: {
          vertLine: { labelBackgroundColor: '#0f172a' },
          horzLine: { labelBackgroundColor: '#0f172a' },
        },
        localization: {
          priceFormatter: (price: number) => price.toFixed(2),
        },
      });

      const baselineSeries = chart.addLineSeries({
        color: 'rgba(148, 163, 184, 0.55)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      baselineSeries.setData(
        bars.map((bar) => ({
          time: bar.time as any,
          value: baselineValue,
        })),
      );

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      volumeSeries.setData(
        bars.map((bar) => ({
          time: bar.time as any,
          value: bar.volume,
          color: bar.close >= bar.open ? palette.upSoft : palette.downSoft,
        })),
      );

      if (mode === 'line') {
        const series = chart.addAreaSeries({
          topColor: `${trendColor}66`,
          bottomColor: `${trendColor}00`,
          lineColor: trendColor,
          lineWidth: 2,
          priceLineColor: trendColor,
          crosshairMarkerRadius: 4,
        });

        series.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } });
        series.setData(
          bars.map((bar) => ({
            time: bar.time as any,
            value: bar.close,
          })),
        );
        series.setMarkers(executionMarkers);
      } else {
        const series = chart.addCandlestickSeries({
          upColor: palette.up,
          downColor: palette.down,
          borderUpColor: palette.up,
          borderDownColor: palette.down,
          wickUpColor: palette.up,
          wickDownColor: palette.down,
          borderVisible: true,
        });

        series.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } });
        series.setData(
          bars.map((bar) => ({
            time: bar.time as any,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          })),
        );
        series.setMarkers(executionMarkers);
      }

      const ma5Series = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      ma5Series.setData(movingAverage5.map((point) => ({ time: point.time as any, value: point.value })));

      const ma20Series = chart.addLineSeries({
        color: '#22d3ee',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      ma20Series.setData(movingAverage20.map((point) => ({ time: point.time as any, value: point.value })));

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (!containerRef.current) return;
        chart.applyOptions({ width: containerRef.current.clientWidth });
      };

      window.addEventListener('resize', handleResize);
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bars, mode, paletteVersion, resolution, tradeMarkers]);

  const latestBar = bars[bars.length - 1];
  const intradayAmplitude = latestBar
    ? latestBar.open > 0
      ? ((latestBar.high - latestBar.low) / latestBar.open) * 100
      : 0
    : 0;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">价格走势</h3>
          <p className="text-sm text-[var(--text-muted)]">分时图和 K 线现在共用同一套真实分辨率，支持逐跳查看每次价格变化。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-[var(--bg-primary)] p-0.5 rounded-full border border-[var(--border-color)]">
            {RESOLUTION_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => setResolution(value)}
                title={description}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-colors',
                  resolution === value
                    ? 'bg-accent-primary text-white shadow font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-[var(--bg-primary)] p-0.5 rounded-full border border-[var(--border-color)]">
            {([
              ['line', '分时图'],
              ['candlestick', 'K 线'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs transition-colors',
                  mode === value
                    ? 'bg-accent-primary text-white shadow font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!loading && !error && latestBar && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] md:grid-cols-5">
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>最新价</div>
            <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{formatCurrency(latestBar.close)}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>开盘价</div>
            <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{formatCurrency(latestBar.open)}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>最高价</div>
            <div className="mt-1 text-sm font-mono text-up">{formatCurrency(latestBar.high)}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>最低价</div>
            <div className="mt-1 text-sm font-mono text-down">{formatCurrency(latestBar.low)}</div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>振幅</div>
            <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{intradayAmplitude.toFixed(2)}%</div>
          </div>
        </div>
      )}

      {!loading && !error && bars.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            MA5
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            MA20
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            开盘价参考线
          </span>
          {tradeMarkers.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="text-up">↑</span>
                买入点
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-down">↓</span>
                卖出点
              </span>
            </>
          )}
        </div>
      )}

      <div className="mt-4">
        {loading && <div className="py-16 text-center text-sm text-[var(--text-muted)]">正在加载图表数据...</div>}
        {!loading && error && <div className="py-16 text-center text-sm text-red-400">{error}</div>}
        {!loading && !error && bars.length === 0 && <div className="py-16 text-center text-sm text-[var(--text-muted)]">暂无图表数据</div>}
        {!loading && !error && bars.length > 0 && <div ref={containerRef} className="h-[360px] w-full" />}
      </div>

      {!loading && !error && bars.length > 0 && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          当前展示最近 {bars.length} 组行情，按 {RESOLUTION_DESCRIPTION_MAP[resolution]} 组织。
          分时图会直接看收盘轨迹，K 线会看每组区间的开高低收；箭头表示你的成交位置。
        </p>
      )}
    </div>
  );
}
