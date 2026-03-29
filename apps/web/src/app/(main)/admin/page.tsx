'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PriceColorMode, Season } from '@mocktrade/shared';
import { api } from '@/lib/api';
import { translateApiErrorMessage } from '@/lib/api-error';
import { formatDateRange } from '@/lib/formatters';
import { applyPriceColorMode } from '@/lib/market-display';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketStore } from '@/stores/market-store';
import { cn } from '@/lib/cn';
import {
  Settings, Play, Pause, Zap, Newspaper, Trophy, Award,
  RefreshCw, LayoutDashboard, Cpu, Radio, LayoutTemplate,
  Shield, Fingerprint, Users
} from 'lucide-react';

// === Type Definitions (Same as original) === //
interface EngineStatus {
  marketStatus: string;
  cycleCount: number;
  activeImpacts: number;
  connectedClients: number;
  aiStatus: AIHealthSummary['status'];
  aiConsecutiveFailures: number;
}
interface AIHealthSummary {
  status: 'idle' | 'healthy' | 'degraded' | 'down' | 'unconfigured';
  consecutiveFailures: number;
  totalSuccesses: number;
  totalFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  lastAttemptCount: number | null;
}
interface AdminAISettings {
  provider: 'openai' | 'claude';
  apiBase: string;
  model: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  requestTimeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  health: AIHealthSummary;
}
interface AdminDisplaySettings {
  priceColorMode: PriceColorMode;
}
interface PendingNewsItem {
  title: string;
  stockSymbol: string;
  stockName: string;
  sentiment: string;
  impactLevel: string;
}
interface QueueStatsData {
  waiting: number;
  delayed: number;
  completed: number;
  failed: number;
  active: number;
}

const PRICE_COLOR_MODE_PREVIEWS: Record<PriceColorMode, {
  up: string; down: string; upSoft: string; downSoft: string;
}> = {
  'red-up-green-down': { up: '#FF453A', down: '#30D158', upSoft: 'rgba(255, 69, 58, 0.15)', downSoft: 'rgba(48, 209, 88, 0.15)' },
  'green-up-red-down': { up: '#30D158', down: '#FF453A', upSoft: 'rgba(48, 209, 88, 0.15)', downSoft: 'rgba(255, 69, 58, 0.15)' },
};

type TabId = 'overview' | 'ai' | 'display' | 'market' | 'news' | 'season' | 'users';

export default function AdminPage() {
  const { user, isHydrated } = useAuthStore();
  const { stocks } = useMarketStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Status states
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [queueLen, setQueueLen] = useState(0);
  const [queueItems, setQueueItems] = useState<PendingNewsItem[]>([]);
  const [aiSettings, setAiSettings] = useState<AdminAISettings | null>(null);
  const [displaySettings, setDisplaySettings] = useState<AdminDisplaySettings | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [queueStats, setQueueStats] = useState<{ buffer: QueueStatsData; scheduler: QueueStatsData } | null>(null);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number; totalOrders: number; filledOrders: number; totalVolume: number } | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersTotal, setAdminUsersTotal] = useState(0);

  // UI states
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  // Form states
  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [openMs, setOpenMs] = useState('120000');
  const [closeMs, setCloseMs] = useState('30000');
  const [manualStockId, setManualStockId] = useState('');
  const [manualImpact, setManualImpact] = useState<'positive' | 'negative'>('positive');
  const [manualImpactPercent, setManualImpactPercent] = useState('3');
  const [manualStyle, setManualStyle] = useState<'neutral' | 'breaking' | 'funny'>('neutral');
  const [manualEventHint, setManualEventHint] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'claude'>('openai');
  const [aiBase, setAiBase] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiKey, setAiKey] = useState('');
  const [clearAiKey, setClearAiKey] = useState(false);
  const [priceColorMode, setPriceColorMode] = useState<PriceColorMode>('red-up-green-down');

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'admin') { router.replace('/'); return; }
    refreshStatus();
  }, [isHydrated, user, router]);

  const refreshStatus = async () => {
    try {
      const [s, q, ai, display, currentSeasonRes, seasonsRes, qStats, stats] = await Promise.all([
        api.get('/admin/engine/status'),
        api.get('/admin/news/queue'),
        api.get('/admin/ai/settings'),
        api.get('/admin/display-settings'),
        api.get('/seasons/current'),
        api.get('/seasons'),
        api.get('/admin/news/queue-stats'),
        api.get('/admin/stats'),
      ]);
      setStatus(s.data);
      setQueueLen(q.data.queueLength);
      setQueueItems(q.data.items || []);
      setAiSettings(ai.data);
      setDisplaySettings(display.data);
      setCurrentSeason(currentSeasonRes.data || null);
      setSeasons(seasonsRes.data || []);
      setQueueStats(qStats.data || null);
      setAdminStats(stats.data || null);
      setAiProvider(ai.data.provider);
      setAiBase(ai.data.apiBase);
      setAiModel(ai.data.model);
      setAiKey('');
      setClearAiKey(false);
      setPriceColorMode(display.data.priceColorMode);
    } catch { }
  };

  const notify = (successLabel: string, err?: any) => {
    if (err) {
      const message = Array.isArray(err.response?.data?.message) ? err.response.data.message[0] : err.response?.data?.message || err.message;
      setMsg(translateApiErrorMessage(message, `${successLabel}失败，请稍后重试`));
    } else {
      setMsg(`${successLabel}已完成`);
    }
    // Auto clear message after 3 seconds
    setTimeout(() => setMsg(''), 3000);
  };

  const action = async (key: string, successLabel: string, fn: () => Promise<any>) => {
    setLoading(key);
    try {
      await fn();
      notify(successLabel);
      refreshStatus();
    } catch (e: any) {
      notify(successLabel, e);
    }
    setLoading(null);
  };

  // --- Handlers ---
  const generateNews = async () => action('generate', '新闻入队', () => api.post('/admin/news/generate'));
  const publishNews = async () => action('publish', '发布新闻', () => api.post('/admin/news/publish'));

  const submitManualNews = async (publishNow: boolean) => {
    if (!manualStockId || !Number.isFinite(parseFloat(manualImpactPercent))) {
      setMsg('请检查股票及影响幅度表单');
      return;
    }
    setLoading(publishNow ? 'manualPublish' : 'manualQueue');
    try {
      const response = await api.post('/admin/news/manual', {
        stockId: manualStockId, impact: manualImpact, impactPercent: parseFloat(manualImpactPercent),
        style: manualStyle, eventHint: manualEventHint.trim() || undefined, publishNow,
      });
      notify(publishNow ? '手动事件发布' : '手动事件入队');
      if (!publishNow && response.data?.queuedNews) {
        setQueueLen(len => len + 1);
        setQueueItems(curr => [response.data.queuedNews, ...curr.filter(i => i.title !== response.data.queuedNews.title)].slice(0, 5));
      }
      refreshStatus();
    } catch (e: any) { notify('生成/发布手动事件', e); }
    setLoading(null);
  };

  const buildAiPayload = () => ({
    provider: aiProvider, apiBase: aiBase.trim(), model: aiModel.trim(),
    ...(aiKey.trim() ? { apiKey: aiKey.trim() } : {}),
    ...(clearAiKey && !aiKey.trim() ? { clearApiKey: true } : {}),
  });

  const saveAiSettings = async () => action('saveAi', '保存AI配置', () => api.post('/admin/ai/settings', buildAiPayload()));

  const testAiSettings = async () => {
    setLoading('testAi');
    try {
      const response = await api.post('/admin/ai/test', buildAiPayload());
      notify(`AI 测试成功：${response.data.reply}`);
    } catch (e: any) { notify('AI 测试', e); }
    setLoading(null);
  };

  const saveDisplaySettings = async () => {
    setLoading('saveDisplay');
    try {
      const response = await api.post('/admin/display-settings', { priceColorMode });
      const nextMode = response.data?.settings?.priceColorMode || priceColorMode;
      applyPriceColorMode(nextMode);
      setPriceColorMode(nextMode);
      notify('保存显示设置');
    } catch (e: any) { notify('保存显示设置', e); }
    setLoading(null);
  };

  const createSeason = async () => {
    if (!seasonName.trim() || !seasonStart || !seasonEnd) {
      setMsg('请把赛季名称、开始时间和结束时间填完整');
      return;
    }

    if (new Date(seasonEnd) <= new Date(seasonStart)) {
      setMsg('结束时间必须晚于开始时间');
      return;
    }

    setLoading('createSeason');
    try {
      await api.post('/seasons', {
        name: seasonName.trim(),
        startDate: seasonStart,
        endDate: seasonEnd,
      });
      setSeasonName('');
      setSeasonStart('');
      setSeasonEnd('');
      notify('创建赛季');
      refreshStatus();
    } catch (e: any) {
      notify('创建赛季', e);
    }
    setLoading(null);
  };

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '系统总览', icon: <LayoutDashboard size={18} /> },
    { id: 'market', label: '市场控制', icon: <Radio size={18} /> },
    { id: 'news', label: '新闻管理', icon: <Newspaper size={18} /> },
    { id: 'ai', label: 'AI 设置', icon: <Cpu size={18} /> },
    { id: 'display', label: '显示设置', icon: <LayoutTemplate size={18} /> },
    { id: 'season', label: '赛季管理', icon: <Trophy size={18} /> },
    { id: 'users', label: '用户管理', icon: <Users size={18} /> },
  ];

  if (!isHydrated) return <div className="py-24 text-center tracking-tight text-[var(--text-muted)] animate-pulse">正在加载管理后台...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4">
      <div className="flex items-end justify-between border-b border-[var(--border-color)] pb-5 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理后台</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">管理市场、新闻、AI 和显示设置。这里的操作会立即影响当前服务。</p>
        </div>
        <button onClick={refreshStatus} className="flex items-center gap-1.5 rounded-full bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-[var(--bg-hover)]">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-accent-primary text-white shadow-soft translate-x-1'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <div className={cn(activeTab === tab.id ? 'opacity-100' : 'opacity-70')}>{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 transition-opacity duration-300 ease-in-out">
          {/* Global Flash Message */}
          <div className={cn(
            'mb-6 overflow-hidden rounded-xl bg-accent-primary/10 transition-all duration-300',
            msg ? 'max-h-16 opacity-100 p-3.5 border border-accent-primary/20' : 'max-h-0 opacity-0 border-transparent'
          )}>
            <p className="text-sm font-medium text-accent-primary flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
              </span>
              {msg}
            </p>
          </div>

          {/* === OVERVIEW TAB === */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="系统总览" desc="查看市场状态、连接数、待发布队列和 AI 健康情况" />
              {status ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SystemCard label="市场状态" value={getMarketStatusLabel(status.marketStatus)} highlight={status.marketStatus === 'opening'} />
                  <SystemCard label="当前周期" value={`#${status.cycleCount}`} />
                  <SystemCard label="活跃影响" value={status.activeImpacts.toString()} />
                  <SystemCard label="在线连接" value={status.connectedClients.toString()} />
                </div>
              ) : <div className="h-24 rounded-2xl bg-[var(--bg-secondary)] animate-pulse" />}

              {adminStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SystemCard label="注册用户" value={adminStats.totalUsers.toString()} />
                  <SystemCard label="总订单数" value={adminStats.totalOrders.toString()} />
                  <SystemCard label="成交订单" value={adminStats.filledOrders.toString()} />
                  <SystemCard label="总成交额" value={`¥${(adminStats.totalVolume / 10000).toFixed(1)}万`} />
                </div>
              )}

              {status ? (
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">AI 上游稳定性</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        连续失败 {status.aiConsecutiveFailures} 次，当前链路已接入超时控制、自动重试与退避。
                      </p>
                    </div>
                    <span className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                      getAiHealthTone(status.aiStatus),
                    )}>
                      {getAiHealthLabel(status.aiStatus)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Queue Monitoring */}
              {queueStats && (
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                  <p className="text-sm font-semibold mb-3">队列监控</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">新闻缓冲队列</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div><div className="text-lg font-mono font-bold">{queueStats.buffer.waiting}</div><div className="text-[10px] text-[var(--text-muted)]">等待中</div></div>
                        <div><div className="text-lg font-mono font-bold">{queueStats.buffer.active}</div><div className="text-[10px] text-[var(--text-muted)]">活跃</div></div>
                        <div><div className="text-lg font-mono font-bold">{queueStats.buffer.delayed}</div><div className="text-[10px] text-[var(--text-muted)]">延迟</div></div>
                        <div><div className="text-lg font-mono font-bold text-emerald-500">{queueStats.buffer.completed}</div><div className="text-[10px] text-[var(--text-muted)]">已完成</div></div>
                        <div><div className="text-lg font-mono font-bold text-rose-500">{queueStats.buffer.failed}</div><div className="text-[10px] text-[var(--text-muted)]">失败</div></div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">新闻调度队列</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div><div className="text-lg font-mono font-bold">{queueStats.scheduler.waiting}</div><div className="text-[10px] text-[var(--text-muted)]">等待中</div></div>
                        <div><div className="text-lg font-mono font-bold">{queueStats.scheduler.active}</div><div className="text-[10px] text-[var(--text-muted)]">活跃</div></div>
                        <div><div className="text-lg font-mono font-bold">{queueStats.scheduler.delayed}</div><div className="text-[10px] text-[var(--text-muted)]">延迟</div></div>
                        <div><div className="text-lg font-mono font-bold text-emerald-500">{queueStats.scheduler.completed}</div><div className="text-[10px] text-[var(--text-muted)]">已完成</div></div>
                        <div><div className="text-lg font-mono font-bold text-rose-500">{queueStats.scheduler.failed}</div><div className="text-[10px] text-[var(--text-muted)]">失败</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><Newspaper size={18} /> 待发布新闻队列</h3>
                  <span className="text-xs font-mono bg-[var(--bg-hover)] px-2 py-1 rounded-md">Queue: {queueLen}</span>
                </div>
                {queueItems.length > 0 ? (
                  <div className="space-y-3">
                    {queueItems.map((item, idx) => (
                      <div key={idx} className="group flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4 shadow-sm border border-transparent hover:border-accent-primary/50 transition-colors">
                        <div>
                          <p className="font-semibold text-sm group-hover:text-accent-primary transition-colors">{item.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{item.stockName} ({item.stockSymbol}) · {getSentimentLabel(item.sentiment)} · {getImpactLevelLabel(item.impactLevel)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-[var(--text-muted)] p-4 text-center bg-[var(--bg-primary)] rounded-xl border border-dashed border-[var(--border-color)]">当前没有待发布新闻。</p>}
              </div>
            </div>
          )}

          {/* === MARKET TAB === */}
          {activeTab === 'market' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="市场控制" desc="暂停或恢复市场，并调整开盘和休市时长" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <h3 className="text-sm font-semibold mb-3">市场状态</h3>
                <div className="flex flex-wrap gap-3">
                  <FancyBtn label="暂停市场" icon={<Pause size={14} />} color="red"
                    loading={loading === 'pause'} onClick={() => action('pause', '暂停市场', () => api.post('/admin/market/pause'))} />
                  <FancyBtn label="恢复市场" icon={<Play size={14} />} color="green"
                    loading={loading === 'resume'} onClick={() => action('resume', '恢复市场', () => api.post('/admin/market/resume'))} />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 space-y-4">
                <h3 className="text-sm font-semibold">市场时长设置 (ms)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FancyInput label="开盘时长" value={openMs} onChange={setOpenMs} />
                  <FancyInput label="休市时长" value={closeMs} onChange={setCloseMs} />
                </div>
                <div className="pt-2">
                  <FancyBtn label="保存时长设置" loading={loading === 'durations'}
                    onClick={() => action('durations', '更新时长', () => api.post('/admin/market/durations', { openMs: parseInt(openMs), closeMs: parseInt(closeMs) }))} />
                </div>
              </div>
            </div>
          )}

          {/* === NEWS & MANUAL EVENTS TAB === */}
          {activeTab === 'news' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="新闻管理" desc="生成、排队、发布新闻，并创建手动事件" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <h3 className="text-sm font-semibold mb-3">新闻调度</h3>
                <div className="flex flex-wrap gap-3">
                  <FancyBtn label="生成一条新闻" loading={loading === 'generate'} onClick={generateNews} />
                  <FancyBtn label="立即发布队列顶部新闻" color="green" loading={loading === 'publish'} onClick={publishNews} />
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">提示：生成新闻只会进入待发布队列。发布会立即把队列顶部新闻推送到前台，并开始影响股价。</p>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><Zap size={16} className="text-amber-500" />手动事件</h3>
                <p className="text-xs text-[var(--text-muted)] mb-5">
                  为指定股票生成事件新闻。价格会按新闻冲击曲线逐步变化，而不是瞬间跳变。
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <FancySelect label="目标股票" value={manualStockId} onChange={setManualStockId} options={[
                    ...stocks.map(s => ({ value: s.id, label: `${s.name} (${s.symbol})` }))
                  ]} placeholder="选择股票" />

                  <FancySelect label="事件方向" value={manualImpact} onChange={(v: string) => setManualImpact(v as any)} options={[
                    { value: 'positive', label: '利多（慢慢上涨）' },
                    { value: 'negative', label: '利空（慢慢下跌）' }
                  ]} />

                  <FancyInput label="目标影响幅度 (%)" value={manualImpactPercent} onChange={setManualImpactPercent} hint="建议填写 3 到 10。更大的输入也会按系统规则自动收敛。" />

                  <FancySelect label="新闻风格" value={manualStyle} onChange={(v: string) => setManualStyle(v as any)} options={[
                    { value: 'neutral', label: '常规' },
                    { value: 'breaking', label: '突发' },
                    { value: 'funny', label: '搞笑' }
                  ]} />
                </div>

                <div className="mt-5">
                  <label className="mb-1.5 ml-1 block text-xs font-medium text-[var(--text-secondary)]">事件提示</label>
                  <textarea
                    value={manualEventHint} onChange={e => setManualEventHint(e.target.value)}
                    placeholder="可选。例如：CEO 沉迷网恋导致公司机密泄露。"
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <FancyBtn label="加入待发布队列" loading={loading === 'manualQueue'} onClick={() => submitManualNews(false)} />
                  <FancyBtn label="开盘中立即发布" color="red" loading={loading === 'manualPublish'} onClick={() => submitManualNews(true)} />
                </div>
              </div>
            </div>
          )}

          {/* === AI TAB === */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="AI 设置" desc="配置新闻生成使用的 AI 服务，并查看最近的调用状态" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <FancySelect label="AI 服务商" value={aiProvider} onChange={(v: string) => setAiProvider(v as any)} options={[
                    { value: 'openai', label: 'OpenAI 兼容接口' },
                    { value: 'claude', label: 'Claude 接口' }
                  ]} />
                  <FancyInput label="模型" value={aiModel} onChange={setAiModel} placeholder={aiProvider === 'claude' ? 'claude-3-5-sonnet-latest' : 'gpt-4o'} />
                </div>
                <FancyInput label="API Base URL" value={aiBase} onChange={setAiBase} placeholder="默认如: https://api.openai.com/v1" />

                <div>
                  <FancyInput label="API Key" type="password" value={aiKey} onChange={setAiKey} placeholder={aiSettings?.hasApiKey ? '留空则继续使用当前密钥' : '输入新的 API Key'} />

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={cn('font-mono font-semibold', aiSettings?.hasApiKey ? 'text-green-500' : 'text-red-400')}>
                      {aiSettings?.hasApiKey ? `已配置 API Key: [${aiSettings.apiKeyPreview}]` : '未配置 API Key，系统将使用本地模板新闻'}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--text-muted)] hover:text-red-400 transition-colors">
                      <input type="checkbox" checked={clearAiKey} onChange={e => setClearAiKey(e.target.checked)} className="accent-red-500 rounded border-gray-600" />
                      清空当前 API Key
                    </label>
                  </div>
                </div>

                {aiSettings?.health ? (
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">上游健康状态</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          超时 {aiSettings.requestTimeoutMs}ms · 最多重试 {aiSettings.maxRetries} 次 · 退避基准 {aiSettings.retryBaseDelayMs}ms
                        </p>
                      </div>
                      <span className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                        getAiHealthTone(aiSettings.health.status),
                      )}>
                        {getAiHealthLabel(aiSettings.health.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <DiagnosticStat label="连续失败" value={`${aiSettings.health.consecutiveFailures}`} />
                      <DiagnosticStat label="累计成功" value={`${aiSettings.health.totalSuccesses}`} />
                      <DiagnosticStat label="累计失败" value={`${aiSettings.health.totalFailures}`} />
                      <DiagnosticStat label="最近耗时" value={formatLatency(aiSettings.health.lastLatencyMs)} />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <DiagnosticStat label="最近成功时间" value={formatAdminDateTime(aiSettings.health.lastSuccessAt)} />
                      <DiagnosticStat label="最近失败时间" value={formatAdminDateTime(aiSettings.health.lastFailureAt)} />
                      <DiagnosticStat label="最近成功使用的尝试次数" value={formatAttemptCount(aiSettings.health.lastAttemptCount)} />
                    </div>

                    <div className="mt-3 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                      最近错误：{aiSettings.health.lastError || '暂无'}
                    </div>
                  </div>
                ) : null}

                <div className="pt-4 border-t border-[var(--border-color)] flex gap-3">
                  <FancyBtn label="保存 AI 设置" loading={loading === 'saveAi'} onClick={saveAiSettings} />
                  <FancyBtn label="测试连接" color="green" loading={loading === 'testAi'} onClick={testAiSettings} />
                  {aiSettings?.health?.status === 'down' && (
                    <FancyBtn label="手动恢复 AI" color="red" loading={loading === 'resetAi'}
                      onClick={() => action('resetAi', '重置 AI 健康状态', () => api.post('/admin/ai/reset-health'))} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === DISPLAY TAB === */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="显示设置" desc="统一设置全站涨跌颜色" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <p className="text-sm font-medium mb-4">涨跌颜色方案</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <ColorSettingCard
                    title="红涨绿跌"
                    desc="国内证券常见显示方式。"
                    mode="red-up-green-down"
                    isActive={priceColorMode === 'red-up-green-down'}
                    onClick={() => setPriceColorMode('red-up-green-down')}
                  />
                  <ColorSettingCard
                    title="绿涨红跌"
                    desc="海外市场常见显示方式。"
                    mode="green-up-red-down"
                    isActive={priceColorMode === 'green-up-red-down'}
                    onClick={() => setPriceColorMode('green-up-red-down')}
                  />
                </div>
                <div className="mt-6">
                  <FancyBtn label="保存并应用" loading={loading === 'saveDisplay'} onClick={saveDisplaySettings} />
                </div>
              </div>
            </div>
          )}

          {/* === SEASON & MORE === */}
          {activeTab === 'season' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="赛季管理" desc="创建新赛季，或补齐默认成就数据" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">当前赛季</h3>
                    {currentSeason ? (
                      <>
                        <p className="mt-2 text-lg font-semibold">{currentSeason.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {formatDateRange(currentSeason.startDate, currentSeason.endDate)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">当前没有进行中的赛季。</p>
                    )}
                  </div>
                  {currentSeason && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                      进行中
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 space-y-4">
                <h3 className="text-sm font-semibold">创建新赛季</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  创建后会先结算当前赛季，再切到新赛季，并把所有账户重置回 100 万起始资金。
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FancyInput label="赛季名称" value={seasonName} onChange={setSeasonName} placeholder="例如：第 9 赛季" />
                  <FancyInput label="开始时间" type="datetime-local" value={seasonStart} onChange={setSeasonStart} />
                  <FancyInput label="结束时间" type="datetime-local" value={seasonEnd} onChange={setSeasonEnd} />
                </div>
                <div className="pt-2">
                  <FancyBtn label="创建赛季" color="green" loading={loading === 'createSeason'} icon={<Trophy size={14} />}
                    onClick={createSeason} />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">全部赛季</h3>
                  <span className="rounded-full bg-[var(--bg-primary)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                    共 {seasons.length} 个
                  </span>
                </div>

                {seasons.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">还没有赛季记录。</p>
                ) : (
                  <div className="space-y-3">
                    {seasons.map((season) => (
                      <div key={season.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--bg-primary)] p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{season.name}</p>
                            {season.isActive && (
                              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                                当前赛季
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {formatDateRange(season.startDate, season.endDate)}
                          </p>
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          创建于 {formatAdminDateTime(season.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5"><Shield size={16} />初始化成就数据</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">如果重建了数据库或缺少默认成就，可以重新写入系统内置成就。</p>
                </div>
                <FancyBtn label="初始化成就" loading={loading === 'seed'} icon={<Fingerprint size={14} />} onClick={() => action('seed', '初始化成就', () => api.post('/achievements/seed'))} />
              </div>
            </div>
          )}

          {/* === USERS TAB === */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Header title="用户管理" desc="查看所有注册用户" />

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">用户列表</h3>
                  <FancyBtn label="加载用户" loading={loading === 'loadUsers'} onClick={async () => {
                    setLoading('loadUsers');
                    try {
                      const res = await api.get('/admin/users?limit=50');
                      setAdminUsers(res.data.items || []);
                      setAdminUsersTotal(res.data.total || 0);
                    } catch { }
                    setLoading(null);
                  }} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-4">共 {adminUsersTotal} 位用户</p>
                {adminUsers.length > 0 ? (
                  <div className="space-y-2">
                    {adminUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4 border border-transparent hover:border-accent-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                              {u.username?.slice(0, 1)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold">{u.username}</p>
                            <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full', u.role === 'admin' ? 'bg-amber-500/10 text-amber-600' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]')}>
                            {u.role}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">{formatAdminDateTime(u.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] text-center p-8 bg-[var(--bg-primary)] rounded-xl border border-dashed border-[var(--border-color)]">点击"加载用户"查看列表</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// === Sub Components === //
function Header({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-[var(--text-secondary)] text-sm mt-1">{desc}</p>
    </div>
  );
}

function SystemCard({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 shadow-sm">
      {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-accent-primary/10 rounded-full blur-2xl transition-all" />}
      <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2">{label}</div>
      <div className={cn("text-2xl font-mono tracking-tight", highlight && "text-accent-primary animate-pulse")}>{value}</div>
    </div>
  );
}

function DiagnosticStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function FancyInput({ label, value, onChange, placeholder, type = "text", hint }: any) {
  return (
    <div className="w-full">
      <label className="mb-1.5 ml-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
      />
      {hint && <p className="mt-1 ml-1 text-[10px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function FancySelect({ label, value, onChange, options, placeholder }: any) {
  return (
    <div className="w-full">
      <label className="mb-1.5 ml-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-all focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 appearance-none"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FancyBtn({ label, loading, onClick, color, icon }: any) {
  const base = "group relative overflow-hidden inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  let variants = "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-accent-primary/50 hover:bg-accent-primary/5 hover:text-accent-primary";
  if (color === 'red') variants = "bg-red-500/10 text-red-500 border border-transparent hover:bg-red-500 hover:text-white shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]";
  if (color === 'green') variants = "bg-green-500/10 text-green-500 border border-transparent hover:bg-green-500 hover:text-white shadow-[0_0_15px_-3px_rgba(34,197,94,0.2)]";

  return (
    <button onClick={onClick} disabled={loading} className={cn(base, variants)}>
      {icon && <span className={cn(loading && "animate-spin")}>{icon}</span>}
      {loading && !icon && <RefreshCw size={14} className="animate-spin" />}
      {loading ? '处理中...' : label}
    </button>
  );
}

function ColorSettingCard({ title, desc, mode, isActive, onClick }: any) {
  const palette = PRICE_COLOR_MODE_PREVIEWS[mode as PriceColorMode];
  return (
    <div onClick={onClick} className={cn(
      "cursor-pointer rounded-2xl border p-5 transition-all duration-300",
      isActive ? "border-accent-primary bg-accent-primary/5 shadow-soft ring-4 ring-accent-primary/10" : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]"
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">{title}</h4>
        <div className={cn("h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center", isActive ? "border-accent-primary" : "border-[var(--text-muted)]")}>
          {isActive && <div className="h-2 w-2 rounded-full bg-accent-primary" />}
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-4">{desc}</p>
      <div className="flex gap-2 text-[11px] font-bold tracking-wider">
        <span className="rounded-full px-3 py-1.5 border border-transparent" style={{ backgroundColor: palette.upSoft, color: palette.up }}>↑ 上行 +9.9%</span>
        <span className="rounded-full px-3 py-1.5 border border-transparent" style={{ backgroundColor: palette.downSoft, color: palette.down }}>↓ 下行 -4.2%</span>
      </div>
    </div>
  );
}

function getMarketStatusLabel(status: string) {
  if (status === 'opening') return '开盘中';
  if (status === 'settling') return '结算中';
  if (status === 'closed') return '休市中';
  return status;
}

function getSentimentLabel(sentiment: string) {
  if (sentiment === 'bullish') return '利好';
  if (sentiment === 'bearish') return '利空';
  if (sentiment === 'funny') return '搞笑';
  if (sentiment === 'breaking') return '突发';
  return '中性';
}

function getImpactLevelLabel(level: string) {
  if (level === 'major') return '重大影响';
  if (level === 'medium') return '中等影响';
  return '轻微影响';
}

function getAiHealthLabel(status: AIHealthSummary['status']) {
  if (status === 'healthy') return '正常';
  if (status === 'degraded') return '不稳定';
  if (status === 'down') return '异常';
  if (status === 'unconfigured') return '未配置';
  return '尚未检测';
}

function getAiHealthTone(status: AIHealthSummary['status']) {
  if (status === 'healthy') return 'bg-emerald-500/15 text-emerald-600';
  if (status === 'degraded') return 'bg-amber-500/15 text-amber-600';
  if (status === 'down') return 'bg-rose-500/15 text-rose-600';
  if (status === 'unconfigured') return 'bg-slate-500/15 text-slate-600';
  return 'bg-sky-500/15 text-sky-600';
}

function formatAdminDateTime(value: string | null) {
  if (!value) return '暂无';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

function formatLatency(value: number | null) {
  return value === null ? '暂无' : `${value}ms`;
}

function formatAttemptCount(value: number | null) {
  return value === null ? '暂无' : `第 ${value} 次`;
}
