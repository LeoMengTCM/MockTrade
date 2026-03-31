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
  relatedStockIds: string[];
  relatedStocks: Array<{ id: string; symbol: string; name: string }>;
  impactPercents: Record<string, number>;
  newsType: 'event' | 'recap';
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);

  useEffect(() => { api.get(`/news/${id}`).then(r => setNews(r.data)).catch((e) => console.warn('[MockTrade]', e?.message || e)); }, [id]);

  if (!news) return <div className="py-12 text-center text-[var(--text-muted)]">正在加载新闻...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="flex items-center gap-2">
        <SentimentTag sentiment={news.sentiment as any} newsType={news.newsType} size="md" />
        <span className="text-sm text-[var(--text-muted)]">{timeAgo(news.publishedAt)}</span>
      </div>

      <h1 className="text-2xl font-bold">{news.title}</h1>
      <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{news.content}</p>

      {news.relatedStocks.length > 0 && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="text-sm font-semibold mb-3">相关股票</h3>
          <div className="flex flex-wrap gap-2">
            {news.relatedStocks.map((stock) => (
              <span key={stock.id} className="rounded-full border border-[var(--border-color)] px-3 py-1 text-sm">
                {stock.name} ({stock.symbol})
              </span>
            ))}
          </div>
        </div>
      )}

      {news.newsType === 'event' && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="text-sm font-semibold mb-2">这条新闻还在影响价格</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            这是事件新闻。价格会在当前交易阶段里逐步变化，实际结果会在下一轮开始后公布。
          </p>
        </div>
      )}

      {news.newsType === 'recap' && Object.keys(news.impactPercents || {}).length > 0 && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h3 className="text-sm font-semibold mb-3">结果回顾</h3>
          {Object.entries(news.impactPercents).map(([stockId, pct]) => {
            const stock = news.relatedStocks.find((item) => item.id === stockId);
            return (
              <div key={stockId} className="mb-2 flex items-center gap-3">
                <span className="w-28 text-sm">
                  {stock ? `${stock.name} (${stock.symbol})` : stockId.slice(0, 8)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-primary)]">
                  <div
                    className={cn('h-full rounded-full', pct >= 0 ? 'bg-up' : 'bg-down')}
                    style={{ width: `${Math.min(Math.abs(pct) * 500, 100)}%` }}
                  />
                </div>
                <span className={cn('text-sm font-mono', pct >= 0 ? 'text-up' : 'text-down')}>{formatPercent(pct)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
