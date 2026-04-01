'use client';

import { useEffect, useState } from 'react';
import type { Season, Tier } from '@mocktrade/shared';
import { getTierFromReturnRate } from '@mocktrade/shared';
import { api } from '@/lib/api';
import { formatCurrency, formatDateRange, formatPercent } from '@/lib/formatters';
import { getDirectionalTextClass, getPriceDirection } from '@/lib/price-change';
import { TierBadge } from '@/components/shared/TierBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { cn } from '@/lib/cn';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  score: number;
}

interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  totalAssets: number;
  returnRate: number;
  tier: Tier;
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<LeaderboardRow[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'return' | 'assets' | 'worst'>('return');

  useEffect(() => {
    setLoading(true);
    let targetType = 'return';
    let targetOrder = 'desc';
    if (activeTab === 'assets') targetType = 'assets';
    if (activeTab === 'worst') {
      targetType = 'return';
      targetOrder = 'asc';
    }

    Promise.all([
      api.get('/seasons/current'),
      api.get(`/leaderboard/${targetType}?limit=100&order=${targetOrder}`),
      api.get('/leaderboard/assets?limit=100'),
      api.get('/leaderboard/return?limit=100'),
    ]).then(([seasonRes, targetRes, assetsRes, returnRes]) => {
      const activeSeason = seasonRes.data || null;
      const targetEntries = (targetRes.data || []) as LeaderboardEntry[];
      
      const assetMap = new Map<string, number>(
        ((assetsRes.data || []) as LeaderboardEntry[]).map((entry) => [entry.userId, entry.score]),
      );
      const returnMap = new Map<string, number>(
        ((returnRes.data || []) as LeaderboardEntry[]).map((entry) => [entry.userId, entry.score]),
      );

      setCurrentSeason(activeSeason);
      setResults(targetEntries.map((entry) => ({
        rank: entry.rank,
        userId: entry.userId,
        username: entry.username,
        avatarUrl: entry.avatarUrl,
        totalAssets: assetMap.get(entry.userId) ?? 1000000,
        returnRate: returnMap.get(entry.userId) ?? 0,
        tier: getTierFromReturnRate(returnMap.get(entry.userId) ?? 0),
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [activeTab]);

  if (loading && results.length === 0) return <div className="py-12 text-center text-[var(--text-muted)]">加载中...</div>;

  const top3 = results.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="text-amber-400" size={24} />
        <div>
          <h1 className="text-2xl font-bold">赛季排名</h1>
          {currentSeason && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {currentSeason.name} · {formatDateRange(currentSeason.startDate, currentSeason.endDate)}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-x-auto hide-scrollbar">
        {([
          ['return', '收益战神榜', '🏆'],
          ['assets', '资本大鳄榜', '💰'],
          ['worst', '破产惨剧榜', '📉'],
        ] as const).map(([value, label, icon]) => (
          <button
            key={value}
            onClick={() => setActiveTab(value as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === value
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {loading && results.length > 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)]">正在切换榜单...</div>
      ) : results.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)]">
          <p>当前赛季还没有可显示的排名。</p>
          <p className="text-sm mt-1">创建赛季后，这里会直接显示当前赛季的实时收益榜。</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-4 py-8">
              <PodiumSlot rank={2} data={top3[1]!} />
              <PodiumSlot rank={1} data={top3[0]!} />
              <PodiumSlot rank={3} data={top3[2]!} />
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                  <th className="px-4 py-3 text-left">名次</th>
                  <th className="px-4 py-3 text-left">用户</th>
                  <th className="px-4 py-3 text-right">资产</th>
                  <th className="px-4 py-3 text-right">收益率</th>
                  <th className="px-4 py-3 text-right">段位</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const direction = getPriceDirection(Number(r.returnRate));
                  return (
                    <tr key={r.userId} className="border-b border-[var(--border-color)] last:border-0">
                      <td className="px-4 py-3 font-medium">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar username={r.username} avatarUrl={r.avatarUrl} className="h-9 w-9 text-sm" />
                          <div className="font-medium">{r.username}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--text-secondary)]">{formatCurrency(Number(r.totalAssets))}</td>
                      <td className={cn('px-4 py-3 text-right font-mono font-medium', getDirectionalTextClass(direction))}>
                        {formatPercent(Number(r.returnRate))}
                      </td>
                      <td className="px-4 py-3 text-right"><TierBadge tier={r.tier} size="sm" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumSlot({ rank, data }: { rank: number; data: LeaderboardRow }) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const direction = getPriceDirection(Number(data.returnRate));
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl mb-1">{medals[rank as 1 | 2 | 3]}</div>
      <UserAvatar username={data.username} avatarUrl={data.avatarUrl} className="mb-2 h-12 w-12 text-base" />
      <div className="text-sm font-medium">{data.username}</div>
      <div className={cn('text-xs font-mono', getDirectionalTextClass(direction))}>{formatPercent(Number(data.returnRate))}</div>
      <TierBadge tier={data.tier} size="sm" />
      <div className={cn('w-20 rounded-t-lg bg-accent-primary/20 mt-2', heights[rank as 1 | 2 | 3])} />
    </div>
  );
}
