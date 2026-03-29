'use client';

import { useEffect, useState } from 'react';
import type { Season } from '@mocktrade/shared';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { formatCurrency, formatDateRange, formatPercent } from '@/lib/formatters';
import { TierBadge } from '@/components/shared/TierBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface SeasonHistory {
  id: string; seasonId: string; finalAssets: number;
  returnRate: number; tier: string; ranking: number;
}

export default function ProfilePage() {
  const { user, isHydrated } = useAuthStore();
  const [account, setAccount] = useState<any>(null);
  const [history, setHistory] = useState<SeasonHistory[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    if (!isHydrated || !user) return;
    Promise.all([
      api.get('/trade/account'),
      api.get('/seasons/my-history'),
      api.get('/seasons/current'),
      api.get('/seasons'),
    ]).then(([accountRes, historyRes, currentSeasonRes, seasonsRes]) => {
      setAccount(accountRes.data);
      setHistory(historyRes.data || []);
      setCurrentSeason(currentSeasonRes.data || null);
      setSeasons(seasonsRes.data || []);
    }).catch(() => {});
  }, [isHydrated, user]);

  if (!isHydrated) return <div className="py-12 text-center text-[var(--text-muted)]">正在加载个人资料...</div>;
  if (!user) return <div className="py-12 text-center text-[var(--text-muted)]">请先登录</div>;

  const getTier = (rate: number) => {
    if (rate >= 1.0) return 'legendary';
    if (rate >= 0.5) return 'diamond';
    if (rate >= 0.2) return 'gold';
    if (rate >= 0.05) return 'silver';
    return 'bronze';
  };

  const seasonMap = new Map(seasons.map((season) => [season.id, season]));
  const sortedHistory = [...history].sort((a, b) => {
    const aEnd = seasonMap.get(a.seasonId)?.endDate || '';
    const bEnd = seasonMap.get(b.seasonId)?.endDate || '';
    return new Date(bEnd).getTime() - new Date(aEnd).getTime();
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} className="h-16 w-16 text-2xl font-bold" />
        <div>
          <h1 className="text-xl font-bold">{user.username}</h1>
          <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          <p className="text-xs text-[var(--text-muted)]">加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
        </div>
      </div>

      {/* Current Season Stats */}
      {account && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">当前赛季</h2>
              {currentSeason && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {currentSeason.name} · {formatDateRange(currentSeason.startDate, currentSeason.endDate)}
                </p>
              )}
            </div>
            <TierBadge tier={getTier(account.returnRate) as any} size="md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="总资产" value={formatCurrency(account.totalAssets)} />
            <Stat label="收益率" value={formatPercent(account.returnRate)} up={account.returnRate >= 0} />
            <Stat label="可用现金" value={formatCurrency(account.availableCash)} />
            <Stat label="股票市值" value={formatCurrency(account.marketValue || 0)} />
          </div>
        </div>
      )}

      {/* Season History */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
        <h2 className="text-lg font-semibold mb-4">赛季历史</h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">还没有已结算的赛季</p>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map(h => {
              const season = seasonMap.get(h.seasonId);
              return (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-[var(--bg-primary)] p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">#{h.ranking}</span>
                  <div>
                    <div className="text-sm font-medium">{season?.name || '已结算赛季'}</div>
                    {season && <div className="text-xs text-[var(--text-muted)]">{formatDateRange(season.startDate, season.endDate)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TierBadge tier={h.tier as any} size="sm" />
                  <div className="text-right">
                    <div className="text-sm font-mono">{formatCurrency(Number(h.finalAssets))}</div>
                    <div className={`text-xs font-mono ${Number(h.returnRate) >= 0 ? 'text-up' : 'text-down'}`}>
                      {formatPercent(Number(h.returnRate))}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
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
