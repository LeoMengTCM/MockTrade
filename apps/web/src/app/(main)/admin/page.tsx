'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';
import { Settings, Play, Pause, Zap, Newspaper, Trophy, Award, RefreshCw } from 'lucide-react';

interface EngineStatus {
  marketStatus: string;
  cycleCount: number;
  activeImpacts: number;
  connectedClients: number;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [queueLen, setQueueLen] = useState(0);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Season form
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');

  // Duration form
  const [openMs, setOpenMs] = useState('120000');
  const [closeMs, setCloseMs] = useState('30000');

  // Shock form
  const [shockStockId, setShockStockId] = useState('');
  const [shockPercent, setShockPercent] = useState('0.05');

  useEffect(() => {
    if (user?.role !== 'admin') { router.push('/'); return; }
    refreshStatus();
  }, [user, router]);

  const refreshStatus = async () => {
    try {
      const [s, q] = await Promise.all([
        api.get('/admin/engine/status'),
        api.get('/admin/news/queue'),
      ]);
      setStatus(s.data);
      setQueueLen(q.data.queueLength);
    } catch {}
  };

  const action = async (name: string, fn: () => Promise<any>) => {
    setLoading(name);
    setMsg('');
    try {
      const r = await fn();
      setMsg(`${name}: ${r.data?.message || 'OK'}`);
      refreshStatus();
    } catch (e: any) {
      setMsg(`${name} failed: ${e.response?.data?.message || e.message}`);
    }
    setLoading(null);
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={24} />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {msg && <div className="rounded-lg bg-accent-primary/10 p-3 text-sm">{msg}</div>}

      {/* Engine Status */}
      <Section title="Engine Status" icon={<Zap size={18} />}>
        {status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Market" value={status.marketStatus} />
            <Stat label="Cycle" value={`#${status.cycleCount}`} />
            <Stat label="Active Impacts" value={String(status.activeImpacts)} />
            <Stat label="WS Clients" value={String(status.connectedClients)} />
          </div>
        ) : <p className="text-sm text-[var(--text-muted)]">Loading...</p>}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={refreshStatus} className="text-xs text-accent-primary hover:underline flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </button>
          <span className="text-xs text-[var(--text-muted)]">News queue: {queueLen} items</span>
        </div>
      </Section>

      {/* Market Controls */}
      <Section title="Market Controls" icon={<Play size={18} />}>
        <div className="flex flex-wrap gap-2">
          <ActionBtn label="Pause Market" icon={<Pause size={14} />} color="red"
            loading={loading === 'Pause'} onClick={() => action('Pause', () => api.post('/admin/market/pause'))} />
          <ActionBtn label="Resume Market" icon={<Play size={14} />} color="green"
            loading={loading === 'Resume'} onClick={() => action('Resume', () => api.post('/admin/market/resume'))} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Open (ms)</label>
            <input value={openMs} onChange={e => setOpenMs(e.target.value)} className="block w-32 mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Close (ms)</label>
            <input value={closeMs} onChange={e => setCloseMs(e.target.value)} className="block w-32 mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <ActionBtn label="Set Durations" loading={loading === 'Durations'}
            onClick={() => action('Durations', () => api.post('/admin/market/durations', { openMs: parseInt(openMs), closeMs: parseInt(closeMs) }))} />
        </div>
      </Section>

      {/* News Controls */}
      <Section title="News Controls" icon={<Newspaper size={18} />}>
        <div className="flex flex-wrap gap-2">
          <ActionBtn label="Generate News" loading={loading === 'Generate'}
            onClick={() => action('Generate', () => api.post('/admin/news/generate'))} />
          <ActionBtn label="Publish News" loading={loading === 'Publish'}
            onClick={() => action('Publish', () => api.post('/admin/news/publish'))} />
        </div>
      </Section>

      {/* Shock Injection */}
      <Section title="Price Shock" icon={<Zap size={18} />}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Stock ID</label>
            <input value={shockStockId} onChange={e => setShockStockId(e.target.value)} placeholder="UUID"
              className="block w-64 mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Impact %</label>
            <input value={shockPercent} onChange={e => setShockPercent(e.target.value)}
              className="block w-24 mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <ActionBtn label="Inject Shock" color="red" loading={loading === 'Shock'}
            onClick={() => action('Shock', () => api.post(`/admin/stocks/${shockStockId}/shock`, { impactPercent: parseFloat(shockPercent) }))} />
        </div>
      </Section>

      {/* Season Controls */}
      <Section title="Season Management" icon={<Trophy size={18} />}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Name</label>
            <input value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="Season 1"
              className="block w-40 mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Start</label>
            <input type="date" value={seasonStart} onChange={e => setSeasonStart(e.target.value)}
              className="block mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">End</label>
            <input type="date" value={seasonEnd} onChange={e => setSeasonEnd(e.target.value)}
              className="block mt-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
          </div>
          <ActionBtn label="Create Season" color="green" loading={loading === 'CreateSeason'}
            onClick={() => action('CreateSeason', () => api.post('/seasons', { name: seasonName, startDate: seasonStart, endDate: seasonEnd }))} />
        </div>
      </Section>

      {/* Achievement Seed */}
      <Section title="Achievements" icon={<Award size={18} />}>
        <ActionBtn label="Seed Achievements" loading={loading === 'Seed'}
          onClick={() => action('Seed', () => api.post('/achievements/seed'))} />
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">{icon}{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--bg-primary)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="text-sm font-mono mt-0.5">{value}</div>
    </div>
  );
}

function ActionBtn({ label, icon, color, loading, onClick }: {
  label: string; icon?: React.ReactNode; color?: 'red' | 'green'; loading: boolean; onClick: () => void;
}) {
  const colorClass = color === 'red' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
    : color === 'green' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
    : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20';
  return (
    <button onClick={onClick} disabled={loading}
      className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50', colorClass)}>
      {icon}{loading ? 'Processing...' : label}
    </button>
  );
}
