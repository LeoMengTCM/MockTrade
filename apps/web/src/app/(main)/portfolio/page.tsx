'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { TierBadge } from '@/components/shared/TierBadge';
import { cn } from '@/lib/cn';
import Link from 'next/link';

interface AccountInfo {
  availableCash: number; frozenCash: number; marketValue: number;
  totalAssets: number; totalPnl: number; returnRate: number;
}

interface PositionItem {
  id: string; stockId: string; stockSymbol: string; stockName: string;
  quantity: number; avgCost: number; currentPrice: number;
  marketValue: number; pnl: number; pnlPercent: number;
}

interface OrderItem {
  id: string; stockId: string; type: string; side: string;
  price: number; quantity: number; status: string; createdAt: string;
  filledPrice: number | null;
}

export default function PortfolioPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderItem[]>([]);
  const [tab, setTab] = useState<'holdings' | 'pending' | 'history'>('holdings');

  const fetchData = () => {
    api.get('/trade/account').then(r => setAccount(r.data)).catch(() => {});
    api.get('/trade/positions').then(r => setPositions(r.data)).catch(() => {});
    api.get('/trade/orders/active').then(r => setActiveOrders(r.data)).catch(() => {});
    api.get('/trade/orders', { params: { limit: 50 } }).then(r => setOrders(r.data.items || [])).catch(() => {});
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, []);

  const getTier = (rate: number) => {
    if (rate >= 1.0) return 'legendary';
    if (rate >= 0.5) return 'diamond';
    if (rate >= 0.2) return 'gold';
    if (rate >= 0.05) return 'silver';
    return 'bronze';
  };

  const cancelOrder = async (orderId: string) => {
    try { await api.delete(`/trade/orders/${orderId}`); fetchData(); } catch {}
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-4">
      {/* Account Summary Hero Card */}
      {account && (
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-8 shadow-sm sm:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="text-sm font-medium text-[var(--text-muted)]">我的持仓资产</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)] sm:text-5xl">
                {formatCurrency(account.totalAssets)}
              </div>
              <div className={cn('mt-3 flex items-center gap-2 text-sm font-medium tabular-nums', account.totalPnl >= 0 ? 'text-up' : 'text-down')}>
                <span>{account.totalPnl >= 0 ? '+' : ''}{formatCurrency(account.totalPnl)}</span>
                <span className="rounded-full bg-current/10 px-2 py-0.5">{account.totalPnl >= 0 ? '+' : ''}{formatPercent(account.returnRate)}</span>
              </div>
            </div>
            <div className="flex shrink-0">
              <div className="scale-110 transform">
                <TierBadge tier={getTier(account.returnRate) as any} size="lg" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-[var(--border-color)] pt-6">
            <div>
              <div className="text-xs text-[var(--text-muted)]">可用现金</div>
              <div className="mt-1.5 text-lg font-medium tabular-nums text-[var(--text-primary)]">{formatCurrency(account.availableCash)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">股票市值</div>
              <div className="mt-1.5 text-lg font-medium tabular-nums text-[var(--text-primary)]">{formatCurrency(account.marketValue)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)]">冻结资金</div>
              <div className="mt-1.5 text-lg font-medium tabular-nums text-[var(--text-primary)]">{formatCurrency(account.frozenCash)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Tabs */}
      <div className="flex w-fit items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1">
        {([
          ['holdings', '当前持仓'],
          ['pending', `未成交 (${activeOrders.length})`],
          ['history', '成交记录']
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-medium transition-all duration-200',
              tab === key
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'holdings' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {positions.length === 0 && <div className="col-span-full py-12 text-center text-sm text-[var(--text-muted)]">目前空仓，赶紧去市场里挑一只心仪的股票吧。</div>}
          {positions.map(p => (
            <Link key={p.id} href={`/stock/${p.stockId}`} className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 transition-all hover:bg-[var(--bg-hover)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-medium text-[var(--text-primary)]">{p.stockSymbol}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{p.stockName}</div>
                </div>
                <div className={cn('text-right text-sm font-medium tabular-nums', p.pnl >= 0 ? 'text-up' : 'text-down')}>
                  <div>{p.pnl >= 0 ? '+' : ''}{formatCurrency(p.pnl)}</div>
                  <div className="mt-0.5 text-xs">{p.pnl >= 0 ? '+' : ''}{formatPercent(p.pnlPercent)}</div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div>
                  <div className="text-[var(--text-muted)]">持仓数量</div>
                  <div className="mt-1 font-medium tabular-nums text-[var(--text-primary)]">{p.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-[var(--text-muted)]">持仓均价</div>
                  <div className="mt-1 font-medium tabular-nums text-[var(--text-primary)]">{formatCurrency(p.avgCost)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {activeOrders.length === 0 && <p className="py-12 text-center text-sm text-[var(--text-muted)]">当前没有任何未成交委托。</p>}
          {activeOrders.map(o => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', o.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down')}>
                  {o.side === 'buy' ? '买' : '卖'}
                </span>
                <div>
                  <div className="font-medium text-[var(--text-primary)]">限价委托 (代码 {o.stockId.slice(0,4)})</div>
                  <div className="mt-0.5 text-xs text-[var(--text-secondary)] tabular-nums">{formatCurrency(o.price)} × {o.quantity} 股</div>
                </div>
              </div>
              <button
                onClick={() => cancelOrder(o.id)}
                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500"
              >
                撤单
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {orders.filter(o => o.status !== 'pending').length === 0 && <p className="py-12 text-center text-sm text-[var(--text-muted)]">近期暂无记录。</p>}
          {orders.filter(o => o.status !== 'pending').map(o => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold', o.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down')}>
                  {o.side === 'buy' ? '买' : '卖'}
                </span>
                <div>
                  <div className="font-medium tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(o.filledPrice || o.price)} × {o.quantity} 股
                  </div>
                  <div className="mt-0.5 text-xs tabular-nums text-[var(--text-secondary)]">
                    {new Date(o.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <span className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                o.status === 'filled' ? 'bg-[#1f8f5f]/10 text-[#1f8f5f]' : 'bg-[var(--text-muted)]/10 text-[var(--text-secondary)]'
              )}>
                {getOrderStatusLabel(o.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getOrderStatusLabel(status: string) {
  if (status === 'filled') return '已成交';
  if (status === 'cancelled') return '已撤销';
  return '处理中';
}
