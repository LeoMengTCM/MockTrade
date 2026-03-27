'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMarketStore } from '@/stores/market-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatPercent, formatVolume, timeAgo } from '@/lib/formatters';
import { SentimentTag } from '@/components/shared/SentimentTag';
import { cn } from '@/lib/cn';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface StockDetail {
  id: string; symbol: string; name: string; persona: string; sector: string;
  basePrice: number; currentPrice: number; openPrice: number; prevClosePrice: number;
  dailyHigh: number; dailyLow: number; volume: number;
}

interface NewsItem {
  id: string; title: string; content: string; sentiment: string; impact: string;
  impactLevel: string; publishedAt: string; impactPercents: Record<string, number>;
}

export default function StockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { stocks, marketStatus } = useMarketStore();
  const { isAuthenticated } = useAuthStore();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tab, setTab] = useState<'news' | 'about'>('news');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell' | null>(null);
  const [orderQty, setOrderQty] = useState('100');
  const [ordering, setOrdering] = useState(false);
  const [orderMsg, setOrderMsg] = useState('');

  // Real-time price from store
  const liveStock = stocks.find(s => s.id === id);
  const currentPrice = liveStock?.currentPrice ?? stock?.currentPrice ?? 0;
  const openPrice = liveStock?.openPrice ?? stock?.openPrice ?? 0;
  const change = currentPrice - openPrice;
  const changePct = openPrice > 0 ? change / openPrice : 0;
  const isUp = change >= 0;

  useEffect(() => {
    api.get(`/market/stocks/${id}`).then(r => setStock(r.data)).catch(() => {});
    api.get('/news', { params: { stockId: id, limit: 10 } }).then(r => setNews(r.data.items || [])).catch(() => {});
  }, [id]);

  const submitOrder = async () => {
    if (!orderSide) return;
    setOrdering(true);
    setOrderMsg('');
    try {
      await api.post('/trade/orders', { stockId: id, type: 'market', side: orderSide, quantity: parseInt(orderQty) });
      setOrderMsg(`${orderSide === 'buy' ? 'Bought' : 'Sold'} ${orderQty} shares @ $${currentPrice.toFixed(2)}`);
      setOrderSide(null);
    } catch (e: any) {
      setOrderMsg(e.response?.data?.message || 'Order failed');
    }
    setOrdering(false);
  };

  if (!stock && !liveStock) return <div className="py-12 text-center text-[var(--text-muted)]">Loading...</div>;

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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open', value: formatCurrency(openPrice) },
          { label: 'High', value: formatCurrency(liveStock?.dailyHigh ?? stock?.dailyHigh ?? 0) },
          { label: 'Low', value: formatCurrency(liveStock?.dailyLow ?? stock?.dailyLow ?? 0) },
          { label: 'Volume', value: formatVolume(liveStock?.volume ?? stock?.volume ?? 0) },
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
          <button onClick={() => setOrderSide('buy')} className="flex-1 rounded-lg bg-up py-3 text-center font-semibold text-white hover:bg-up/80">BUY</button>
          <button onClick={() => setOrderSide('sell')} className="flex-1 rounded-lg border-2 border-down py-3 text-center font-semibold text-down hover:bg-down/10">SELL</button>
        </div>
      )}

      {/* Order Panel */}
      {orderSide && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{orderSide === 'buy' ? 'Buy' : 'Sell'} {stock?.symbol}</h3>
            <button onClick={() => setOrderSide(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)]">Quantity</label>
            <input type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)} min="1"
              className="w-full mt-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-mono outline-none focus:border-accent-primary" />
          </div>
          <div className="flex gap-2">
            {[100, 500, 1000].map(q => (
              <button key={q} onClick={() => setOrderQty(String(q))} className="flex-1 rounded-lg border border-[var(--border-color)] py-1 text-xs hover:bg-[var(--bg-hover)]">{q}</button>
            ))}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Est. {orderSide === 'buy' ? 'Cost' : 'Revenue'}: <span className="font-mono">{formatCurrency(currentPrice * parseInt(orderQty || '0'))}</span>
          </div>
          <button onClick={submitOrder} disabled={ordering}
            className={cn('w-full rounded-lg py-2.5 font-medium text-white', orderSide === 'buy' ? 'bg-up hover:bg-up/80' : 'bg-down hover:bg-down/80', 'disabled:opacity-50')}>
            {ordering ? 'Processing...' : `Confirm ${orderSide === 'buy' ? 'Buy' : 'Sell'}`}
          </button>
          {orderMsg && <div className="text-sm text-center text-[var(--text-secondary)]">{orderMsg}</div>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border-color)]">
        {(['news', 'about'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('pb-2 text-sm font-medium border-b-2 -mb-px', tab === t ? 'border-accent-primary text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]')}>
            {t === 'news' ? 'News' : 'About'}
          </button>
        ))}
      </div>

      {tab === 'news' ? (
        <div className="space-y-3">
          {news.length === 0 && <p className="text-sm text-[var(--text-muted)]">No news yet</p>}
          {news.map(n => (
            <Link key={n.id} href={`/news/${n.id}`} className="block rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-hover)]">
              <div className="flex items-center gap-2 mb-2">
                <SentimentTag sentiment={n.sentiment as any} />
                <span className="text-xs text-[var(--text-muted)]">{timeAgo(n.publishedAt)}</span>
              </div>
              <h4 className="font-medium">{n.title}</h4>
              {n.impactPercents && n.impactPercents[id] && (
                <div className={cn('text-xs mt-1 font-mono', n.impactPercents[id] >= 0 ? 'text-up' : 'text-down')}>
                  Impact: {n.impactPercents[id] >= 0 ? '+' : ''}{(n.impactPercents[id] * 100).toFixed(1)}%
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="font-semibold mb-2">About {stock?.name}</h3>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{stock?.persona}</p>
          <div className="mt-3 text-xs text-[var(--text-muted)]">Sector: {stock?.sector}</div>
        </div>
      )}
    </div>
  );
}
