import { cn } from '@/lib/cn';

const SENTIMENT_CONFIG = {
  bullish: { label: '\u5229\u597D \uD83D\uDD25', color: 'text-up', bg: 'bg-up/10' },
  bearish: { label: '\u5229\u7A7A \uD83D\uDC80', color: 'text-down', bg: 'bg-down/10' },
  funny: { label: '\u641E\u7B11 \uD83E\uDD23', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  neutral: { label: '\u4E2D\u6027 \uD83D\uDCF0', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-tertiary)]' },
  breaking: { label: '\u7A81\u53D1 \u26A1', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

export function SentimentTag({ sentiment, size = 'sm' }: { sentiment: keyof typeof SENTIMENT_CONFIG; size?: 'sm' | 'md' }) {
  const config = SENTIMENT_CONFIG[sentiment];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 font-medium', config.color, config.bg, size === 'sm' ? 'text-xs' : 'text-sm')}>
      {config.label}
    </span>
  );
}
