'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SentimentTag } from '@/components/shared/SentimentTag';
import { timeAgo } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface NewsItem {
  id: string; title: string; content: string; sentiment: string;
  impact: string; impactLevel: string; publishedAt: string;
  relatedStockIds: string[];
}

const FILTERS = ['all', 'breaking', 'bullish', 'bearish', 'funny'] as const;

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 30 };
    if (filter !== 'all') params.sentiment = filter;
    api.get('/news', { params }).then(r => { setNews(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">News Center</h1>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap border',
              filter === f ? 'bg-accent-primary text-white border-accent-primary' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]')}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4">
        {loading && <div className="py-8 text-center text-[var(--text-muted)]">Loading...</div>}
        {!loading && news.length === 0 && <div className="py-8 text-center text-[var(--text-muted)]">No news found</div>}
        {news.map(n => (
          <Link key={n.id} href={`/news/${n.id}`}
            className={cn('block rounded-xl border bg-[var(--bg-secondary)] p-4 hover:bg-[var(--bg-hover)] transition-colors',
              n.sentiment === 'breaking' ? 'border-purple-500/30' : 'border-[var(--border-color)]')}>
            <div className="flex items-center gap-2 mb-2">
              <SentimentTag sentiment={n.sentiment as any} />
              <span className="text-xs text-[var(--text-muted)]">{timeAgo(n.publishedAt)}</span>
              {n.impactLevel === 'major' && <span className="text-xs bg-red-500/10 text-red-400 rounded px-1.5 py-0.5">Major</span>}
            </div>
            <h3 className="font-medium text-[var(--text-primary)]">{n.title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{n.content}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
