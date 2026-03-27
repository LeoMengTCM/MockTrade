'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { TierBadge } from '@/components/shared/TierBadge';

interface SeasonHistory {
  id: string; seasonId: string; finalAssets: number;
  returnRate: number; tier: string; ranking: number;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [account, setAccount] = useState<any>(null);
  const [history, setHistory] = useState<SeasonHistory[]>([]);

  useEffect(() => {
    api.get('/trade/account').then(r => setAccount(r.data)).catch(() => {});
    api.get('/seasons/my-history').then(r => setHistory(r.data || [])).catch(() => {});
  }, []);

  if (!user) return <div className="py-12 text-center text-[var(--text-muted)]">Please login</div>;

  const getTier = (rate: number) => {
    if (rate >= 1.0) return 'legendary';
    if (rate >= 0.5) return 'diamond';
    if (rate >= 0.2) return 'gold';
    if (rate >= 0.05) return 'silver';
    return 'bronze';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
        <div className="h-16 w-16 rounded-full bg-accent-primary/20 flex items-center justify-center text-2xl font-bold">
          {user.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.username}</h1>
          <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          <p className="text-xs text-[var(--text-muted)]">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Current Season Stats */}
      {account && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Current Season</h2>
            <TierBadge tier={getTier(account.returnRate) as any} size="md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Assets" value={formatCurrency(account.totalAssets)} />
            <Stat label="Return" value={formatPercent(account.returnRate)} up={account.returnRate >= 0} />
            <Stat label="Cash" value={formatCurrency(account.availableCash)} />
            <Stat label="Stock Value" value={formatCurrency(account.marketValue || 0)} />
          </div>
        </div>
      )}

      {/* Season History */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
        <h2 className="text-lg font-semibold mb-4">Season History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No completed seasons yet</p>
        ) : (
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-primary)] p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">#{h.ranking}</span>
                  <TierBadge tier={h.tier as any} size="sm" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{formatCurrency(Number(h.finalAssets))}</div>
                  <div className={`text-xs font-mono ${Number(h.returnRate) >= 0 ? 'text-up' : 'text-down'}`}>
                    {formatPercent(Number(h.returnRate))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className={`text-sm font-mono mt-0.5 ${up !== undefined ? (up ? 'text-up' : 'text-down') : ''}`}>{value}</div>
    </div>
  );
}
