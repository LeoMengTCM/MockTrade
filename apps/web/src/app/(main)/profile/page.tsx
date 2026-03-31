'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { AccountInfo, Season, User } from '@mocktrade/shared';
import { api } from '@/lib/api';
import { translateApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateRange, formatPercent } from '@/lib/formatters';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { TierBadge } from '@/components/shared/TierBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useAuthStore } from '@/stores/auth-store';

interface SeasonHistory {
  id: string;
  seasonId: string;
  finalAssets: number;
  returnRate: number;
  tier: string;
  ranking: number;
}

interface ProfileAccount extends AccountInfo {
  frozenCash: number;
  marketValue: number;
  totalPnl: number;
}

interface ProfileFormState {
  username: string;
  avatarUrl: string;
}

export default function ProfilePage() {
  const { user, isHydrated, updateUser } = useAuthStore();
  const [account, setAccount] = useState<ProfileAccount | null>(null);
  const [history, setHistory] = useState<SeasonHistory[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState<ProfileFormState>({ username: '', avatarUrl: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      username: user.username,
      avatarUrl: user.avatarUrl || '',
    });
  }, [user]);

  useEffect(() => {
    if (!isHydrated || !user?.id) return;

    let active = true;
    setIsLoading(true);

    Promise.all([
      api.get('/users/me'),
      api.get('/trade/account'),
      api.get('/seasons/my-history'),
      api.get('/seasons/current'),
      api.get('/seasons'),
    ])
      .then(([meRes, accountRes, historyRes, currentSeasonRes, seasonsRes]) => {
        if (!active) return;

        const me = meRes.data as User;
        updateUser(me);
        setForm({
          username: me.username,
          avatarUrl: me.avatarUrl || '',
        });
        setAccount(accountRes.data || null);
        setHistory(historyRes.data || []);
        setCurrentSeason(currentSeasonRes.data || null);
        setSeasons(seasonsRes.data || []);
      })
      .catch((e) => {
        console.warn('[MockTrade]', e?.message || e);
        if (!active) return;
        setAccount(null);
        setHistory([]);
        setCurrentSeason(null);
        setSeasons([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isHydrated, updateUser, user?.id]);

  if (!isHydrated) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">正在加载个人资料...</div>;
  }

  if (!user) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">请先登录</div>;
  }

  const currentUser = user;
  const seasonMap = new Map(seasons.map((season) => [season.id, season]));
  const sortedHistory = [...history].sort((left, right) => {
    const leftEnd = seasonMap.get(left.seasonId)?.endDate || '';
    const rightEnd = seasonMap.get(right.seasonId)?.endDate || '';
    return new Date(rightEnd).getTime() - new Date(leftEnd).getTime();
  });

  const bestSeason = history.length > 0
    ? [...history].sort((left, right) => Number(right.returnRate) - Number(left.returnRate))[0]
    : null;
  const currentTier = getTier(account?.returnRate ?? 0);
  const joinedAtLabel = new Date(currentUser.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isDirty = form.username.trim() !== currentUser.username.trim()
    || form.avatarUrl !== (currentUser.avatarUrl || '');

  const seasonSummaryLabel = useMemo(() => {
    if (!currentSeason) return '无进行中赛季';
    return `${currentSeason.name}`;
  }, [currentSeason]);

  const handleAvatarUpload = (url: string) => {
    setForm((prev) => ({ ...prev, avatarUrl: url }));
    setSaveError('');
    setSaveSuccess('');
  };

  const handleFieldChange = (value: string) => {
    setForm((prev) => ({ ...prev, username: value }));
    setSaveError('');
    setSaveSuccess('');
  };

  const handleReset = () => {
    setForm({
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl || '',
    });
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = form.username.trim();
    const avatarUrl = form.avatarUrl.trim();

    if (username.length < 2 || username.length > 20) {
      setSaveError('昵称需为 2 到 20 个字符');
      return;
    }

    if (!avatarUrl) {
      setSaveError('请先上传头像');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await api.patch('/users/me', { username, avatarUrl });
      const nextUser = response.data as User;
      updateUser(nextUser);
      setForm({
        username: nextUser.username,
        avatarUrl: nextUser.avatarUrl || '',
      });
      setSaveSuccess('资料已保存。');
    } catch (error: any) {
      setSaveError(
        translateApiErrorMessage(
          error?.response?.data?.message,
          '保存失败，请稍后再试'
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-4">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        <UserAvatar
          username={currentUser.username}
          avatarUrl={currentUser.avatarUrl}
          className="h-24 w-24 shrink-0 rounded-full border border-[var(--border-color)] shadow-sm sm:h-28 sm:w-28"
        />
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{currentUser.username}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{currentUser.email}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center rounded-full bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
              {currentUser.role === 'admin' ? '管理员' : '普通玩家'}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              加入于 {joinedAtLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-secondary)]">
              {seasonSummaryLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-7">
          <SectionShell title="财务概览" description="您当前的资产状况与收益表现。">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
                <div>
                  <div className="text-sm text-[var(--text-muted)]">总资产</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)]">
                    {account ? formatCurrency(account.totalAssets) : '...'}
                  </div>
                </div>
                <div className="mt-6 pt-1">
                  <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 text-sm">
                    <span className="text-[var(--text-muted)]">可用现金</span>
                    <span className="font-medium tabular-nums text-[var(--text-primary)]">
                      {account ? formatCurrency(account.availableCash) : '...'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">股票市值</span>
                    <span className="font-medium tabular-nums text-[var(--text-primary)]">
                      {account ? formatCurrency(account.marketValue) : '...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
                <div>
                  <div className="text-sm text-[var(--text-muted)]">本季收益</div>
                  <div className={cn(
                    'mt-2 text-3xl font-semibold tracking-tight tabular-nums',
                    account ? (account.returnRate >= 0 ? 'text-up' : 'text-down') : 'text-[var(--text-muted)]'
                  )}>
                    {account ? formatPercent(account.returnRate) : '...'}
                  </div>
                </div>
                <div className="mt-6 pt-1">
                  <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 text-sm">
                    <span className="text-[var(--text-muted)]">当前段位</span>
                    <TierBadge tier={currentTier as any} size="sm" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">历史最佳</span>
                    <span className="font-medium tabular-nums text-[var(--text-primary)]">
                      {bestSeason ? `#${bestSeason.ranking}` : '暂无'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionShell>

          <SectionShell title="赛季历史" description="您参与过的所有赛季战绩。">
            {sortedHistory.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--border-color)] px-6 py-10 text-center">
                <div className="text-sm font-medium text-[var(--text-primary)]">还没有已结算的赛季</div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">赛季结束后，这里会展示您的表现记录。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((item) => {
                  const season = seasonMap.get(item.seasonId);
                  return (
                    <article
                      key={item.id}
                      className="flex items-center justify-between rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 transition-colors hover:bg-[var(--bg-hover)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-xs font-semibold text-[var(--text-primary)]">
                          #{item.ranking}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {season?.name || '已结算赛季'}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {season ? formatDateRange(season.startDate, season.endDate) : '缺失时间'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:flex">
                          <TierBadge tier={item.tier as any} size="sm" />
                        </div>
                        <div>
                          <div className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
                            {formatCurrency(Number(item.finalAssets))}
                          </div>
                          <div className={cn(
                            'text-xs font-medium tabular-nums',
                            Number(item.returnRate) >= 0 ? 'text-up' : 'text-down'
                          )}>
                            {formatPercent(Number(item.returnRate))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </SectionShell>
        </div>

        <div className="md:col-span-5">
          <SectionShell title="资料设置" description="修改对外形象，保存后全站即时同步。">
            <form onSubmit={handleSave} className="space-y-8 pt-2">
              <div className="flex flex-col items-center justify-center gap-4 rounded-[1.25rem] border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-8">
                <ImageUploader
                  defaultImage={form.avatarUrl}
                  onUploadSuccess={handleAvatarUpload}
                  avatarClassName="h-28 w-28 border-[var(--border-color)] shadow-sm"
                />
                <p className="text-center text-[13px] leading-5 text-[var(--text-muted)]">
                  建议上传正方形图片<br />系统会自动裁切与优化
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">公开昵称</label>
                  <input
                    value={form.username}
                    onChange={(event) => handleFieldChange(event.target.value)}
                    maxLength={20}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-black/20 focus:ring-4 focus:ring-black/5 dark:focus:border-white/20 dark:focus:ring-white/5"
                    placeholder="2 到 20 个字符"
                  />
                </div>

                {saveError && (
                  <div className="rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-red-500 dark:border-red-500/20 dark:bg-red-500/10">
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="rounded-xl border border-[#1f8f5f]/20 bg-[#1f8f5f]/10 px-4 py-3 text-sm text-[#1f8f5f]">
                    {saveSuccess}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!isDirty || isSaving}
                    className={cn(
                      'flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                      !isDirty || isSaving
                        ? 'cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        : 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                    )}
                  >
                    {isSaving ? '保存中...' : '保存更改'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isDirty || isSaving}
                    className={cn(
                      'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                      !isDirty || isSaving
                        ? 'cursor-not-allowed border-transparent text-[var(--text-muted)]'
                        : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    )}
                  >
                    还原
                  </button>
                </div>
              </div>
            </form>
          </SectionShell>
        </div>
      </div>
    </div>
  );
}

function getTier(rate: number) {
  if (rate >= 1.0) return 'legendary';
  if (rate >= 0.5) return 'diamond';
  if (rate >= 0.2) return 'gold';
  if (rate >= 0.05) return 'silver';
  return 'bronze';
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-6 shadow-sm sm:px-8 sm:py-7">
      <div className="mb-6 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </section>
  );
}
