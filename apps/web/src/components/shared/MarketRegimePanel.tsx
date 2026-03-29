import { Activity, ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  type MarketRegimeSnapshot,
  getMarketRegimeDescription,
  getMarketRegimeStrengthLabel,
  getMarketSectorRole,
  getMarketSectorRoleLabel,
} from '@/lib/market-regime';

interface MarketRegimePanelProps {
  regime: MarketRegimeSnapshot;
  focusSector?: string | null;
  compact?: boolean;
  title?: string;
  className?: string;
}

export function MarketRegimePanel({
  regime,
  focusSector,
  compact = false,
  title = '当前市场阶段',
  className,
}: MarketRegimePanelProps) {
  const sectorRole = getMarketSectorRole(regime, focusSector);
  const completedCycles = Math.max(0, regime.totalCycles - regime.cyclesRemaining);
  const progress = Math.max(8, Math.min(100, Math.round(regime.strength * 100)));
  const tone = getTone(regime.regime);
  const Icon = tone.icon;

  return (
    <section className={cn(
      'overflow-hidden rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-soft',
      compact ? 'p-5' : 'p-6 sm:p-7',
      className,
    )}>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            <Activity size={14} />
            {title}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold',
              tone.pillClass,
            )}>
              <Icon size={15} />
              {regime.label}
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              剩余 {regime.cyclesRemaining} / {regime.totalCycles} 轮
            </span>
            {focusSector && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                sectorRole === 'leader'
                  ? 'bg-up/10 text-up'
                  : sectorRole === 'laggard'
                    ? 'bg-down/10 text-down'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]',
              )}>
                {sectorRole === 'leader' ? <ArrowUpRight size={13} /> : sectorRole === 'laggard' ? <ArrowDownRight size={13} /> : <Activity size={13} />}
                {getMarketSectorRoleLabel(sectorRole)}
              </span>
            )}
          </div>

          <p className={cn(
            'mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]',
            compact && 'max-w-none',
          )}>
            {getMarketRegimeDescription(regime.regime)}
          </p>
        </div>

        <div className={cn(
          'min-w-[220px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]',
          compact ? 'px-4 py-3' : 'px-4 py-4',
        )}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span>阶段强度</span>
            <span>{getMarketRegimeStrengthLabel(regime.strength)}</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
            <div
              className={cn('h-full rounded-full transition-all duration-500', tone.barClass)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 text-xs text-[var(--text-secondary)]">
            已推进 {completedCycles} 轮，阶段偏向会逐步加强。
          </div>
        </div>
      </div>

      <div className={cn(
        'grid gap-4',
        compact ? 'mt-5 lg:grid-cols-2' : 'mt-6 lg:grid-cols-2',
      )}>
        <SectorBucket
          title="领涨板块"
          sectors={regime.leadingSectors}
          emptyText="当前没有特别强的领涨板块"
          tone="leader"
        />
        <SectorBucket
          title="承压板块"
          sectors={regime.laggingSectors}
          emptyText="当前没有特别弱的承压板块"
          tone="laggard"
        />
      </div>
    </section>
  );
}

function SectorBucket({
  title,
  sectors,
  emptyText,
  tone,
}: {
  title: string;
  sectors: string[];
  emptyText: string;
  tone: 'leader' | 'laggard';
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {tone === 'leader' ? <TrendingUp size={14} className="text-up" /> : <TrendingDown size={14} className="text-down" />}
        {title}
      </div>
      {sectors.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sectors.map((sector) => (
            <span
              key={sector}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium',
                tone === 'leader'
                  ? 'bg-up/10 text-up'
                  : 'bg-down/10 text-down',
              )}
            >
              {sector}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">{emptyText}</p>
      )}
    </div>
  );
}

function getTone(regime: MarketRegimeSnapshot['regime']) {
  if (regime === 'bull') {
    return {
      icon: TrendingUp,
      pillClass: 'border-up/20 bg-up/10 text-up',
      barClass: 'bg-up',
    };
  }

  if (regime === 'bear') {
    return {
      icon: TrendingDown,
      pillClass: 'border-down/20 bg-down/10 text-down',
      barClass: 'bg-down',
    };
  }

  return {
    icon: Activity,
    pillClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    barClass: 'bg-amber-500',
  };
}
