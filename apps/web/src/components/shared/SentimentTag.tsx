import { cn } from '@/lib/cn';

const SENTIMENT_CONFIG = {
  bullish: { label: '\u5229\u597D', color: 'text-up', bg: 'bg-up/10' },
  bearish: { label: '\u5229\u7A7A', color: 'text-down', bg: 'bg-down/10' },
  funny: { label: '\u8DA3\u95FB', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  neutral: { label: '\u4E2D\u6027', color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-tertiary)]' },
  breaking: { label: '\u7A81\u53D1', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

const EVENT_TAG_CONFIG = {
  label: '\u4E8B\u4EF6\u65B0\u95FB',
  color: 'text-sky-400',
  bg: 'bg-sky-400/10',
};

export function SentimentTag({
  sentiment,
  size = 'sm',
  newsType,
}: {
  sentiment: keyof typeof SENTIMENT_CONFIG;
  size?: 'sm' | 'md';
  newsType?: 'event' | 'recap';
}) {
  const config = newsType === 'event' ? EVENT_TAG_CONFIG : SENTIMENT_CONFIG[sentiment];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 font-medium', config.color, config.bg, size === 'sm' ? 'text-xs' : 'text-sm')}>
      {config.label}
    </span>
  );
}
