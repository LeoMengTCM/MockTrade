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
    <div className="space-y-6">
      {/* Account Summary */}
      {account && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--text-muted)]">总资产</div>
              <div className="text-3xl font-bold font-mono tabular-nums mt-1">{formatCurrency(account.totalAssets)}</div>
              <div className={cn('text-sm font-mono mt-1', account.totalPnl >= 0 ? 'text-up' : 'text-down')}>
                {account.totalPnl >= 0 ? '+' : ''}{formatCurrency(account.totalPnl)} ({formatPercent(account.returnRate)})
              </div>
            </div>
            <TierBadge tier={getTier(account.returnRate) as any} size="lg" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
            <div><div className="text-xs text-[var(--text-muted)]">可用现金</div><div className="text-sm font-mono mt-0.5">{formatCurrency(account.availableCash)}</div></div>
            <div><div className="text-xs text-[var(--text-muted)]">冻结资金</div><div className="text-sm font-mono mt-0.5">{formatCurrency(account.frozenCash)}</div></div>
            <div><div className="text-xs text-[var(--text-muted)]">股票市值</div><div className="text-sm font-mono mt-0.5">{formatCurrency(account.marketValue)}</div></div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border-color)]">
        {([['holdings', '持仓'], ['pending', `未成交 (${activeOrders.length})`], ['history', '成交记录']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={cn('pb-2 text-sm font-medium border-b-2 -mb-px', tab === key ? 'border-accent-primary text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)]')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'holdings' && (
        <div className="space-y-3">
          {positions.length === 0 && <p className="text-sm text-[var(--text-muted)] py-8 text-center">你还没有持仓，先去买一只股票。</p>}
          {positions.map(p => (
            <Link key={p.id} href={`/stock/${p.stockId}`}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-hover)]">
              <div>
                <div className="font-medium">{p.stockSymbol}</div>
                <div className="text-xs text-[var(--text-muted)]">{p.quantity} 股 · 均价 {formatCurrency(p.avgCost)}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{formatCurrency(p.marketValue)}</div>
                <div className={cn('text-xs font-mono', p.pnl >= 0 ? 'text-up' : 'text-down')}>
                  {p.pnl >= 0 ? '+' : ''}{formatCurrency(p.pnl)} ({formatPercent(p.pnlPercent)})
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {activeOrders.length === 0 && <p className="text-sm text-[var(--text-muted)] py-8 text-center">当前没有未成交委托</p>}
          {activeOrders.map(o => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <div>
                <span className={cn('text-xs font-medium rounded px-1.5 py-0.5 mr-2', o.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down')}>
                  {o.side === 'buy' ? '买入' : '卖出'}
                </span>
                <span className="text-sm">限价 {formatCurrency(o.price)} × {o.quantity} 股</span>
              </div>
              <button onClick={() => cancelOrder(o.id)} className="text-xs text-red-400 hover:text-red-300">撤单</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {orders.filter(o => o.status !== 'pending').length === 0 && <p className="text-sm text-[var(--text-muted)] py-8 text-center">暂无成交记录</p>}
          {orders.filter(o => o.status !== 'pending').map(o => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium rounded px-1.5 py-0.5', o.side === 'buy' ? 'bg-up/10 text-up' : 'bg-down/10 text-down')}>
                  {o.side === 'buy' ? '买入' : '卖出'}
                </span>
                <span className="font-mono">{o.quantity} 股 @ {formatCurrency(o.filledPrice || o.price)}</span>
              </div>
              <span className={cn('text-xs', o.status === 'filled' ? 'text-green-400' : 'text-[var(--text-muted)]')}>{getOrderStatusLabel(o.status)}</span>
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
