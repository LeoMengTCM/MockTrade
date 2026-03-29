'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, TrendingDown, TrendingUp, Activity, BarChart2, Layers, ChevronRight } from 'lucide-react';
import { PriceDisplay } from '@/components/shared/PriceDisplay';
import { NewsTicker } from '@/components/shared/NewsTicker';
import { Sparkline } from '@/components/shared/Sparkline';
import { MarketRegimePanel } from '@/components/shared/MarketRegimePanel';
import { useMarketStore } from '@/stores/market-store';
import { cn } from '@/lib/cn';
import { formatVolume } from '@/lib/formatters';
import { api } from '@/lib/api';

function getChangePercent(currentPrice: number, openPrice: number) {
  return openPrice > 0 ? (currentPrice - openPrice) / openPrice : 0;
}

export default function HomePage() {
  const { stocks, marketRegime } = useMarketStore();
  const [sparklineData, setSparklineData] = useState<Record<string, number[]>>({});
  const sortedByMove = [...stocks].sort((a, b) => getChangePercent(b.currentPrice, b.openPrice) - getChangePercent(a.currentPrice, a.openPrice));
  const sortedByVolatility = [...stocks].sort(
    (a, b) => Math.abs(getChangePercent(b.currentPrice, b.openPrice)) - Math.abs(getChangePercent(a.currentPrice, a.openPrice)),
  );

  const topGainer = sortedByMove[0];
  const topLoser = sortedByMove[sortedByMove.length - 1];
  const risingCount = stocks.filter((stock) => getChangePercent(stock.currentPrice, stock.openPrice) > 0).length;
  const fallingCount = stocks.filter((stock) => getChangePercent(stock.currentPrice, stock.openPrice) < 0).length;
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);

  useEffect(() => {
    if (stocks.length === 0) return;
    // Fetch sparkline data for each stock (last 20 kline points)
    const fetchSparklines = async () => {
      const data: Record<string, number[]> = {};
      await Promise.all(
        stocks.slice(0, 25).map(async (stock) => {
          try {
            const res = await api.get(`/market/stocks/${stock.id}/kline`, {
              params: { periods: 20, resolution: 'tick' },
            });
            const items = Array.isArray(res.data) ? res.data : [];
            data[stock.id] = items.map((k: any) => Number(k.close));
          } catch { /* ignore */ }
        }),
      );
      setSparklineData(data);
    };
    fetchSparklines();
  }, [stocks.length]);

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-5 py-12">
        <Activity className="h-10 w-10 text-[var(--text-muted)] animate-pulse" />
        <h1 className="text-3xl font-bold tracking-tight">正在加载市场数据...</h1>
        <p className="text-[var(--text-secondary)] font-medium">正在获取最新行情</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* News Ticker */}
      <NewsTicker />

      {/* Title Area - High typography */}
      <div className="space-y-3 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">市场总览</h1>
        <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium max-w-2xl">
          查看 25 只股票的最新价格、涨跌和成交情况。
        </p>
      </div>

      {marketRegime && (
        <MarketRegimePanel regime={marketRegime} />
      )}

      {/* Hero Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <OverviewCard icon={<Layers size={18} />} label="股票数量" value={`${stocks.length}`} suffix="只" />
        <OverviewCard icon={<TrendingUp size={18} />} label="上涨家数" value={`${risingCount}`} suffix="只" accent="up" />
        <OverviewCard icon={<TrendingDown size={18} />} label="下跌家数" value={`${fallingCount}`} suffix="只" accent="down" />
        <OverviewCard icon={<BarChart2 size={18} />} label="总成交量" value={formatVolume(totalVolume)} />
      </div>

      {/* Highlight Section */}
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Spotlight - Clean background */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500">
                <Flame size={20} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">涨跌排名</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topGainer && <SpotlightCard href={`/stock/${topGainer.id}`} title="涨幅第一" stock={topGainer} type="up" />}
            {topLoser && <SpotlightCard href={`/stock/${topLoser.id}`} title="跌幅第一" stock={topLoser} type="down" />}
          </div>
        </div>

        {/* Volatility Radar */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">波动最大</h2>
            <Activity size={20} className="text-accent-primary" />
          </div>
          <div className="flex flex-col justify-between flex-1 gap-1">
            {sortedByVolatility.slice(0, 4).map((stock, i) => {
              const changePercent = getChangePercent(stock.currentPrice, stock.openPrice);
              const isUp = changePercent >= 0;
              return (
                <Link
                  key={stock.id}
                  href={`/stock/${stock.id}`}
                  className="group flex flex-row items-center justify-between rounded-2xl p-3 sm:px-4 sm:py-3.5 hover:bg-[var(--bg-hover)] transition-all -mx-2 sm:-mx-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--text-muted)] text-sm font-semibold opacity-60 w-3">{i + 1}</span>
                    <div className="flex flex-col">
                      <div className="font-bold text-base text-[var(--text-primary)]">{stock.symbol}</div>
                      <div className="text-xs font-medium text-[var(--text-muted)] line-clamp-1 max-w-[120px]">{stock.name}</div>
                    </div>
                  </div>
                  <div className={cn('text-[0.95rem] font-bold tabular-nums', isUp ? 'text-up' : 'text-down')}>
                    {isUp ? '+' : ''}{(changePercent * 100).toFixed(2)}%
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid List - iOS Stocks aesthetic */}
      <div className="space-y-6 pt-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight">全部股票</h2>
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {stocks.map((stock) => {
            const change = stock.currentPrice - stock.openPrice;
            const changePercent = getChangePercent(stock.currentPrice, stock.openPrice);
            const isUp = changePercent >= 0;
            const sparkline = sparklineData[stock.id];
            return (
              <Link
                key={stock.id}
                href={`/stock/${stock.id}`}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:shadow-soft-hover rounded-[1.5rem] p-5 sm:p-6 transition-all duration-300 group flex flex-col justify-between h-full"
              >
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-x font-bold tracking-tight text-[var(--text-primary)]">{stock.symbol}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{stock.sector}</span>
                    </div>
                    <div className="text-sm font-medium text-[var(--text-secondary)]">{stock.name}</div>
                  </div>
                  {sparkline && sparkline.length >= 2 && (
                    <Sparkline prices={sparkline} width={80} height={28} />
                  )}
                </div>

                <div>
                  <div className="mb-4">
                    <PriceDisplay value={stock.currentPrice} change={change} changePercent={changePercent} size="lg" />
                  </div>

                  <div className="pt-4 border-t border-[var(--border-color)] flex flex-row items-center justify-between text-xs font-semibold text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><BarChart2 size={14} /> VOL {formatVolume(stock.volume)}</span>
                    <span className="group-hover:text-accent-primary flex items-center transition-colors">查看详情 <ChevronRight size={14} /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ icon, label, value, suffix, accent }: { icon: React.ReactNode, label: string; value: string; suffix?: string; accent?: 'up' | 'down'; }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-5 flex flex-col justify-between hover:shadow-soft transition-all duration-300">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] mb-4">
        {icon}
        {label}
      </div>
      <div className={cn(
        'text-3xl md:text-4xl font-extrabold tracking-tight tabular-nums',
        accent === 'up' ? 'text-up' : accent === 'down' ? 'text-down' : 'text-[var(--text-primary)]'
      )}>
        {value}<span className="text-base font-semibold ml-1 text-[var(--text-muted)] tracking-normal">{suffix}</span>
      </div>
    </div>
  );
}

function SpotlightCard({ href, title, stock, type }: { href: string; title: string; stock: { symbol: string, name: string, currentPrice: number, openPrice: number }; type: 'up' | 'down'; }) {
  const changePercent = getChangePercent(stock.currentPrice, stock.openPrice);
  const change = stock.currentPrice - stock.openPrice;
  return (
    <Link href={href} className={cn(
      "rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between",
      type === 'up'
        ? "bg-up/10 border-up/20 hover:bg-up/[0.15]"
        : "bg-down/10 border-down/20 hover:bg-down/[0.15]"
    )}>
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-5">
        {type === 'up' ? <TrendingUp size={16} className="text-up" /> : <TrendingDown size={16} className="text-down" />}
        {title}
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-1">{stock.symbol}</div>
        <div className="text-sm font-semibold text-[var(--text-secondary)] mb-6 truncate">{stock.name}</div>
        <PriceDisplay value={stock.currentPrice} change={change} changePercent={changePercent} />
      </div>
    </Link>
  );
}
