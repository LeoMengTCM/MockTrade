'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { translateApiErrorMessage } from '@/lib/api-error';
import { useMarketStore } from '@/stores/market-store';
import { useAuthStore } from '@/stores/auth-store';
import { StockChart, type StockTradeMarker } from '@/components/shared/StockChart';
import { MarketRegimePanel } from '@/components/shared/MarketRegimePanel';
import { formatCountdown, formatCurrency, formatPercent, formatVolume, timeAgo } from '@/lib/formatters';
import { SentimentTag } from '@/components/shared/SentimentTag';
import { cn } from '@/lib/cn';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TradeModal } from '@/components/shared/TradeModal';

interface StockDetail {
  id: string; symbol: string; name: string; persona: string; sector: string;
  basePrice: number; currentPrice: number; openPrice: number; prevClosePrice: number;
  dailyHigh: number; dailyLow: number; volume: number;
}

interface NewsItem {
  id: string; title: string; content: string; sentiment: string; impact: string;
  impactLevel: string; publishedAt: string; impactPercents: Record<string, number>;
  newsType: 'event' | 'recap';
}

interface FilledOrderItem {
  id: string;
  stockId: string;
  side: 'buy' | 'sell';
  quantity: number;
  status: 'filled' | 'pending' | 'cancelled' | 'expired';
  filledAt: string | null;
}

export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { stocks, marketStatus, countdown, marketRegime } = useMarketStore();
  const { isAuthenticated } = useAuthStore();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsError, setNewsError] = useState('');
  const [tradeMarkers, setTradeMarkers] = useState<StockTradeMarker[]>([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [modalInitialSide, setModalInitialSide] = useState<'buy' | 'sell'>('buy');
  const [refreshToken, setRefreshToken] = useState(0);

  // Real-time price from store
  const liveStock = stocks.find(s => s.id === id);
  const currentPrice = liveStock?.currentPrice ?? stock?.currentPrice ?? 0;
  const openPrice = liveStock?.openPrice ?? stock?.openPrice ?? 0;
  const change = currentPrice - openPrice;
  const changePct = openPrice > 0 ? change / openPrice : 0;
  const isUp = change >= 0;
  const marketCountdownLabel = marketStatus === 'opening'
    ? `距休市 ${formatCountdown(countdown)}`
    : marketStatus === 'closed' && countdown > 0
      ? `距开盘 ${formatCountdown(countdown)}`
      : marketStatus === 'settling'
        ? '正在结算，稍后开始下一轮'
        : '';

  useEffect(() => {
    let active = true;

    const fetchStock = async () => {
      try {
        const response = await api.get(`/market/stocks/${id}`);
        if (!active) return;
        setStock(response.data);
      } catch { }
    };

    const fetchNews = async () => {
      try {
        const response = await api.get('/news', { params: { stockId: id, limit: 10 } });
        if (!active) return;
        setNews(Array.isArray(response.data?.items) ? response.data.items : []);
        setNewsError('');
      } catch {
        if (!active) return;
        setNews([]);
        setNewsError('相关新闻加载失败，请稍后重试');
      }
    };

    const fetchTradeMarkers = async () => {
      if (!isAuthenticated) {
        if (active) setTradeMarkers([]);
        return;
      }

      try {
        const response = await api.get('/trade/orders', {
          params: { stockId: id, status: 'filled', limit: 100 },
        });
        if (!active) return;

        const orders = Array.isArray(response.data?.items) ? response.data.items as FilledOrderItem[] : [];
        setTradeMarkers(
          orders
            .filter((order) => order.status === 'filled' && order.filledAt)
            .map((order) => ({
              id: order.id,
              side: order.side,
              quantity: order.quantity,
              filledAt: order.filledAt as string,
            })),
        );
      } catch {
        if (!active) return;
        setTradeMarkers([]);
      }
    };

    void fetchStock();
    void fetchNews();
    void fetchTradeMarkers();

    const timer = setInterval(() => {
      void fetchNews();
      void fetchTradeMarkers();
    }, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, isAuthenticated, refreshToken]);

  if (!stock && !liveStock) return <div className="py-12 text-center text-[var(--text-muted)]">正在加载股票信息...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded hover:bg-[var(--bg-hover)]"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">{stock?.symbol || liveStock?.symbol}</h1>
          <p className="text-sm text-[var(--text-muted)]">{stock?.name || liveStock?.name}</p>
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="text-3xl font-bold font-mono tabular-nums">{formatCurrency(currentPrice)}</div>
        <div className={cn('text-lg font-mono tabular-nums', isUp ? 'text-up' : 'text-down')}>
          {isUp ? '+' : ''}{change.toFixed(2)} ({formatPercent(changePct)})
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">市场状态：{marketStatus === 'opening' ? '开盘中' : marketStatus === 'settling' ? '结算中' : '休市中'}</p>
        {marketCountdownLabel && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{marketCountdownLabel}</p>
        )}
      </div>

      {marketRegime && (
        <MarketRegimePanel
          regime={marketRegime}
          focusSector={stock?.sector || liveStock?.sector}
          compact
          title="当前行情环境"
        />
      )}

      {/* Persona / Company Info */}
      <div className="rounded-xl border border-[var(--border-color)] bg-accent-primary/5 p-4 text-sm text-[var(--text-secondary)] shadow-soft">
        <span className="font-semibold text-accent-primary">简介：</span>
        {stock?.persona || liveStock?.persona}
        <span className="ml-2 mt-1 block text-xs text-[var(--text-muted)]">行业：{stock?.sector || liveStock?.sector}</span>
      </div>

      <StockChart stockId={id} tradeMarkers={tradeMarkers} />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '开盘价', value: formatCurrency(openPrice) },
          { label: '最高价', value: formatCurrency(liveStock?.dailyHigh ?? stock?.dailyHigh ?? 0) },
          { label: '最低价', value: formatCurrency(liveStock?.dailyLow ?? stock?.dailyLow ?? 0) },
          { label: '成交量', value: formatVolume(liveStock?.volume ?? stock?.volume ?? 0) },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3">
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
            <div className="text-sm font-mono mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trade Buttons */}
      {isAuthenticated && (
        <div className="flex gap-3">
          <button onClick={() => { setModalInitialSide('buy'); setIsTradeModalOpen(true); }} className="flex-1 rounded-xl bg-up py-4 text-center text-lg tracking-widest font-bold text-white hover:bg-up/90 shadow-[0_0_15px_-5px_var(--price-up)] transition-all border border-up/20">买入</button>
          <button onClick={() => { setModalInitialSide('sell'); setIsTradeModalOpen(true); }} className="flex-1 rounded-xl bg-down py-4 text-center text-lg tracking-widest font-bold text-white hover:bg-down/90 shadow-[0_0_15px_-5px_var(--price-down)] transition-all border border-down/20">卖出</button>
        </div>
      )}

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stockId={id}
        stockSymbol={stock?.symbol || liveStock?.symbol || ''}
        currentPrice={currentPrice}
        initialSide={modalInitialSide}
        onOrderSuccess={() => setRefreshToken(v => v + 1)}
      />

      <div className="pt-4 border-t border-[var(--border-color)]">
        <h3 className="font-semibold mb-4 text-lg">相关新闻</h3>
        <div className="space-y-3">
          {newsError && <p className="text-sm text-red-400">{newsError}</p>}
          {!newsError && news.length === 0 && <p className="text-sm text-[var(--text-muted)]">暂无相关新闻</p>}
          {news.map(n => (
            <Link key={n.id} href={`/news/${n.id}`} className="block rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-hover)] shadow-soft transition-all">
              <div className="flex items-center gap-2 mb-2">
                <SentimentTag sentiment={n.sentiment as any} newsType={n.newsType} />
                <span className="text-xs text-[var(--text-muted)]">{timeAgo(n.publishedAt)}</span>
                <span className="rounded-full bg-[var(--bg-primary)] px-2 py-0.5 text-[11px] text-[var(--text-muted)] border border-[var(--border-color)]">
                  {n.newsType === 'recap' ? '结果回顾' : '事件新闻'}
                </span>
              </div>
              <h4 className="font-medium">{n.title}</h4>
              {n.newsType === 'recap' && n.impactPercents && typeof n.impactPercents[id] === 'number' && (
                <div className={cn('text-xs mt-1 font-mono', n.impactPercents[id] >= 0 ? 'text-up' : 'text-down')}>
                  次日结果：{n.impactPercents[id] >= 0 ? '+' : ''}{(n.impactPercents[id] * 100).toFixed(1)}%
                </div>
              )}
              {n.newsType === 'event' && (
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  这条消息已经发布，实际结果会在下一轮开始后公布。
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
