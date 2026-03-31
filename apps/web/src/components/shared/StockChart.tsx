/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import type { KLineData } from '@mocktrade/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { getPricePalette, PRICE_COLOR_MODE_EVENT } from '@/lib/market-display';

type ChartMode = 'line' | 'candlestick';
type ChartResolution = 'tick' | '1m' | '5m' | '15m';

const RESOLUTION_OPTIONS: Array<{
  value: ChartResolution;
  label: string;
  description: string;
}> = [
  { value: 'tick', label: '逐笔', description: '每次价格变动一组' },
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

export interface StockTradeMarker {
  id: string;
  side: 'buy' | 'sell';
  quantity: number;
  filledAt: string;
}

// ——— 工具函数 ———

function buildMovingAverage(bars: KLineData[], period: number) {
  const points: Array<{ time: number; value: number }> = [];
  for (let i = period - 1; i < bars.length; i += 1) {
    const slice = bars.slice(i - period + 1, i + 1);
    const bar = bars[i];
    if (!bar) continue;
    const avg = slice.reduce((s, b) => s + b.close, 0) / slice.length;
    points.push({ time: bar.time, value: +avg.toFixed(2) });
  }
  return points;
}

/** 均价线 (VWAP): 累计成交额 / 累计成交量 */
function buildVWAP(bars: KLineData[]) {
  const points: Array<{ time: number; value: number }> = [];
  let cumVolume = 0;
  let cumAmount = 0;
  for (const bar of bars) {
    cumVolume += bar.volume;
    cumAmount += bar.close * bar.volume;
    if (cumVolume > 0) {
      points.push({ time: bar.time, value: +(cumAmount / cumVolume).toFixed(2) });
    }
  }
  return points;
}

function findNearestBarTime(bars: KLineData[], targetTime: number) {
  const first = bars[0];
  if (!first) return null;
  let nearest = first.time;
  let best = Math.abs(first.time - targetTime);
  for (const bar of bars) {
    const d = Math.abs(bar.time - targetTime);
    if (d < best) { best = d; nearest = bar.time; }
  }
  return nearest;
}

function buildTradeMarkers(
  bars: KLineData[],
  trades: StockTradeMarker[],
  palette: ReturnType<typeof getPricePalette>,
) {
  return trades
    .map((t) => {
      const ts = new Date(t.filledAt).getTime();
      if (!Number.isFinite(ts)) return null;
      const time = findNearestBarTime(bars, Math.floor(ts / 1000));
      if (time === null) return null;
      return {
        id: t.id,
        time: time as any,
        position: t.side === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
        shape: t.side === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
        color: t.side === 'buy' ? palette.up : palette.down,
        text: `${t.side === 'buy' ? '买' : '卖'}${t.quantity}`,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => Number(a.time) - Number(b.time));
}

// ——— 组件 ———

export function StockChart({
  stockId,
  prevClosePrice = 0,
  openPrice = 0,
  tradeMarkers = [],
}: {
  stockId: string;
  prevClosePrice?: number;
  openPrice?: number;
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
    const h = () => setPaletteVersion((v) => v + 1);
    window.addEventListener(PRICE_COLOR_MODE_EVENT, h);
    return () => window.removeEventListener(PRICE_COLOR_MODE_EVENT, h);
  }, []);

  // 拉取 K 线数据
  useEffect(() => {
    let active = true;
    const fetch = async () => {
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
    fetch();
    const timer = setInterval(fetch, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [stockId, resolution]);

  // 绘制图表
  useEffect(() => {
    if (!containerRef.current || bars.length === 0) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      if (!containerRef.current || cancelled) return;

      const container = containerRef.current;
      const palette = getPricePalette();
      const firstBar = bars[0]!;
      const latestBar = bars[bars.length - 1]!;

      // 昨收价作为基线 —— 如果没传则用第一根 K 线的 open 兜底
      const baselineValue = prevClosePrice > 0 ? prevClosePrice : firstBar.open;
      const markers = buildTradeMarkers(bars, tradeMarkers, palette);

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

      // ——— 昨收参考线 ———
      const refLineSeries = chart.addLineSeries({
        color: 'rgba(148, 163, 184, 0.55)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      refLineSeries.setData(bars.map((b) => ({ time: b.time as any, value: baselineValue })));

      // ——— 成交量 ———
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volSeries.setData(bars.map((b) => ({
        time: b.time as any,
        value: b.volume,
        color: b.close >= b.open ? palette.upSoft : palette.downSoft,
      })));

      if (mode === 'line') {
        // ====== 分时图 ======
        // 使用 BaselineSeries: 昨收线以上涨色，以下跌色
        const series = chart.addBaselineSeries({
          baseValue: { type: 'price', price: baselineValue },
          topLineColor: palette.up,
          topFillColor1: `${palette.up}30`,
          topFillColor2: `${palette.up}05`,
          bottomLineColor: palette.down,
          bottomFillColor1: `${palette.down}05`,
          bottomFillColor2: `${palette.down}30`,
          lineWidth: 2,
          priceLineColor: latestBar.close >= baselineValue ? palette.up : palette.down,
          lastValueVisible: true,
          crosshairMarkerRadius: 4,
        });
        series.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.24 } });
        series.setData(bars.map((b) => ({ time: b.time as any, value: b.close })));
        series.setMarkers(markers);

        // ——— 均价线 (VWAP) ———
        const vwapData = buildVWAP(bars);
        if (vwapData.length > 0) {
          const vwapSeries = chart.addLineSeries({
            color: '#f59e0b',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
          });
          vwapSeries.setData(vwapData.map((p) => ({ time: p.time as any, value: p.value })));
        }
      } else {
        // ====== K 线 ======
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
        series.setData(bars.map((b) => ({
          time: b.time as any, open: b.open, high: b.high, low: b.low, close: b.close,
        })));
        series.setMarkers(markers);

        // ——— MA5 / MA20 ———
        const ma5 = buildMovingAverage(bars, 5);
        const ma20 = buildMovingAverage(bars, 20);

        const ma5Series = chart.addLineSeries({
          color: '#f59e0b', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        ma5Series.setData(ma5.map((p) => ({ time: p.time as any, value: p.value })));

        const ma20Series = chart.addLineSeries({
          color: '#22d3ee', lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        });
        ma20Series.setData(ma20.map((p) => ({ time: p.time as any, value: p.value })));
      }

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (!containerRef.current) return;
        chart.applyOptions({ width: containerRef.current.clientWidth });
      };
      window.addEventListener('resize', handleResize);
      cleanup = () => { window.removeEventListener('resize', handleResize); chart.remove(); };
    })();

    return () => { cancelled = true; cleanup?.(); };
  }, [bars, mode, paletteVersion, resolution, tradeMarkers, prevClosePrice, openPrice]);

  // ——— 统计数据 ———
  const latestBar = bars[bars.length - 1];
  const firstBar = bars[0];
  const baselineValue = prevClosePrice > 0 ? prevClosePrice : (firstBar?.open ?? 0);

  // VWAP
  const vwapValue = (() => {
    let cumVol = 0, cumAmt = 0;
    for (const b of bars) { cumVol += b.volume; cumAmt += b.close * b.volume; }
    return cumVol > 0 ? cumAmt / cumVol : 0;
  })();

  // session-level high/low from all bars
  const sessionHigh = bars.length > 0 ? Math.max(...bars.map(b => b.high)) : 0;
  const sessionLow = bars.length > 0 ? Math.min(...bars.map(b => b.low)) : 0;

  const latestPrice = latestBar?.close ?? 0;
  const priceChange = latestPrice - baselineValue;
  const pctChange = baselineValue > 0 ? priceChange / baselineValue : 0;
  const amplitude = baselineValue > 0 ? ((sessionHigh - sessionLow) / baselineValue) * 100 : 0;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      {/* 顶部控制栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">价格走势</h3>
        <div className="flex flex-wrap gap-2">
          {/* 周期选择 */}
          <div className="flex gap-1 bg-[var(--bg-primary)] p-0.5 rounded-full border border-[var(--border-color)]">
            {RESOLUTION_OPTIONS.map(({ value, label, description }) => (
              <button key={value} onClick={() => setResolution(value)} title={description}
                className={cn('rounded-full px-3 py-1.5 text-xs transition-colors',
                  resolution === value ? 'bg-accent-primary text-white shadow font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}>
                {label}
              </button>
            ))}
          </div>
          {/* 图表类型 */}
          <div className="flex gap-1 bg-[var(--bg-primary)] p-0.5 rounded-full border border-[var(--border-color)]">
            {([['line', '分时'], ['candlestick', 'K线']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)}
                className={cn('rounded-full px-3 py-1.5 text-xs transition-colors',
                  mode === v ? 'bg-accent-primary text-white shadow font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 统计面板 */}
      {!loading && !error && latestBar && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)] md:grid-cols-5">
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>最新价</div>
            <div className={cn('mt-1 text-sm font-mono', priceChange >= 0 ? 'text-up' : 'text-down')}>
              {formatCurrency(latestPrice)}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>涨跌</div>
            <div className={cn('mt-1 text-sm font-mono', priceChange >= 0 ? 'text-up' : 'text-down')}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>涨跌幅</div>
            <div className={cn('mt-1 text-sm font-mono', priceChange >= 0 ? 'text-up' : 'text-down')}>
              {pctChange >= 0 ? '+' : ''}{formatPercent(pctChange)}
            </div>
          </div>
          {mode === 'line' ? (
            <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
              <div>均价</div>
              <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{formatCurrency(vwapValue)}</div>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
              <div>昨收</div>
              <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{formatCurrency(baselineValue)}</div>
            </div>
          )}
          <div className="rounded-xl bg-[var(--bg-primary)] px-3 py-2">
            <div>振幅</div>
            <div className="mt-1 text-sm font-mono text-[var(--text-primary)]">{amplitude.toFixed(2)}%</div>
          </div>
        </div>
      )}

      {/* 图例 */}
      {!loading && !error && bars.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          {mode === 'line' ? (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />均价线
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-3 bg-slate-400 opacity-50" style={{ borderTop: '1px dashed' }} />昨收
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />MA5
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />MA20
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-3 bg-slate-400 opacity-50" style={{ borderTop: '1px dashed' }} />昨收
              </span>
            </>
          )}
          {tradeMarkers.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1"><span className="text-up">↑</span>买入</span>
              <span className="inline-flex items-center gap-1"><span className="text-down">↓</span>卖出</span>
            </>
          )}
        </div>
      )}

      {/* 图表容器 */}
      <div className="mt-4">
        {loading && <div className="py-16 text-center text-sm text-[var(--text-muted)]">正在加载图表数据...</div>}
        {!loading && error && <div className="py-16 text-center text-sm text-red-400">{error}</div>}
        {!loading && !error && bars.length === 0 && <div className="py-16 text-center text-sm text-[var(--text-muted)]">暂无图表数据</div>}
        {!loading && !error && bars.length > 0 && <div ref={containerRef} className="h-[360px] w-full" />}
      </div>
    </div>
  );
}
