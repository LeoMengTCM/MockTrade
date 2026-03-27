'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { TierBadge } from '@/components/shared/TierBadge';
import { cn } from '@/lib/cn';
import { Trophy } from 'lucide-react';

interface SeasonResult {
  id: string; userId: string; finalAssets: number;
  returnRate: number; tier: string; ranking: number;
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<SeasonResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/seasons/current').then(async (res) => {
      if (res.data?.id) {
        const r = await api.get(`/seasons/${res.data.id}/results`);
        setResults(r.data || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-[var(--text-muted)]">Loading...</div>;

  const top3 = results.slice(0, 3);
  const rest = results.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="text-amber-400" size={24} />
        <h1 className="text-2xl font-bold">Leaderboard</h1>
      </div>

      {results.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-muted)]">
          <p>No season results yet.</p>
          <p className="text-sm mt-1">Create a season from the admin panel to get started.</p>
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
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right">Assets</th>
                  <th className="px-4 py-3 text-right">Return</th>
                  <th className="px-4 py-3 text-right">Tier</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="px-4 py-3 font-medium">{r.ranking <= 3 ? ['🥇', '🥈', '🥉'][r.ranking - 1] : `#${r.ranking}`}</td>
                    <td className="px-4 py-3">{r.userId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(r.finalAssets))}</td>
                    <td className={cn('px-4 py-3 text-right font-mono', Number(r.returnRate) >= 0 ? 'text-up' : 'text-down')}>
                      {formatPercent(Number(r.returnRate))}
                    </td>
                    <td className="px-4 py-3 text-right"><TierBadge tier={r.tier as any} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PodiumSlot({ rank, data }: { rank: number; data: SeasonResult }) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl mb-1">{medals[rank as 1 | 2 | 3]}</div>
      <div className="text-sm font-medium">{data.userId.slice(0, 8)}</div>
      <div className={cn('text-xs font-mono', Number(data.returnRate) >= 0 ? 'text-up' : 'text-down')}>{formatPercent(Number(data.returnRate))}</div>
      <TierBadge tier={data.tier as any} size="sm" />
      <div className={cn('w-20 rounded-t-lg bg-accent-primary/20 mt-2', heights[rank as 1 | 2 | 3])} />
    </div>
  );
}
