'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { SentimentTag } from '@/components/shared/SentimentTag';
import { timeAgo, formatPercent } from '@/lib/formatters';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NewsDetail {
  id: string; title: string; content: string; sentiment: string;
  impact: string; impactLevel: string; publishedAt: string;
  relatedStockIds: string[]; impactPercents: Record<string, number>;
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);

  useEffect(() => { api.get(`/news/${id}`).then(r => setNews(r.data)).catch(() => {}); }, [id]);

  if (!news) return <div className="py-12 text-center text-[var(--text-muted)]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-2">
        <SentimentTag sentiment={news.sentiment as any} size="md" />
        <span className="text-sm text-[var(--text-muted)]">{timeAgo(news.publishedAt)}</span>
      </div>

      <h1 className="text-2xl font-bold">{news.title}</h1>
      <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{news.content}</p>

      {/* Impact */}
      {Object.keys(news.impactPercents || {}).length > 0 && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="text-sm font-semibold mb-3">Price Impact</h3>
          {Object.entries(news.impactPercents).map(([stockId, pct]) => (
            <div key={stockId} className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono w-16">{stockId.slice(0, 8)}...</span>
              <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', pct >= 0 ? 'bg-up' : 'bg-down')}
                  style={{ width: `${Math.min(Math.abs(pct) * 500, 100)}%` }} />
              </div>
              <span className={cn('text-sm font-mono', pct >= 0 ? 'text-up' : 'text-down')}>{formatPercent(pct)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
