'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface TickerNewsItem {
    id: string;
    title: string;
    sentiment: string;
    newsType: string;
}

export function NewsTicker() {
    const [news, setNews] = useState<TickerNewsItem[]>([]);

    useEffect(() => {
        api.get('/news/latest?limit=8')
            .then(res => {
                const items = Array.isArray(res.data) ? res.data : [];
                setNews(items.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    sentiment: n.sentiment,
                    newsType: n.newsType || 'event',
                })));
            })
            .catch((e: any) => console.warn('[MockTrade]', e?.message || e));
    }, []);

    if (news.length === 0) return null;

    // Duplicate for seamless loop
    const doubled = [...news, ...news];

    return (
        <div className="relative overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] mb-5">
            <div className="flex items-center">
                <div className="shrink-0 z-10 bg-accent-primary text-white text-[11px] font-bold tracking-wider uppercase px-3 py-2 rounded-l-xl">
                    快讯
                </div>
                <div className="relative flex-1 overflow-hidden">
                    <div className="ticker-track flex items-center gap-8 whitespace-nowrap py-2 px-4">
                        {doubled.map((item, idx) => (
                            <Link
                                key={`${item.id}-${idx}`}
                                href={`/news/${item.id}`}
                                className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                            >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-primary opacity-60" />
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx>{`
        .ticker-track {
          animation: ticker-scroll ${Math.max(20, news.length * 5)}s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
