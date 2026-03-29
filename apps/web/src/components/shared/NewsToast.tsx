'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Newspaper } from 'lucide-react';
import { cn } from '@/lib/cn';

interface NewsToastData {
    id: string;
    title: string;
    sentiment: string;
}

export function NewsToast({ news, onDismiss }: { news: NewsToastData | null; onDismiss: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (news) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 300);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [news, onDismiss]);

    if (!news) return null;

    return (
        <div
            className={cn(
                'fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200]',
                'max-w-sm w-[calc(100%-2rem)]',
                'rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg',
                'p-4 flex items-start gap-3',
                'transition-all duration-300',
                visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 pointer-events-none',
            )}
        >
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Newspaper size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">新闻速报</p>
                <Link
                    href={`/news/${news.id}`}
                    className="text-sm font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors line-clamp-2"
                    onClick={() => { setVisible(false); setTimeout(onDismiss, 100); }}
                >
                    {news.title}
                </Link>
            </div>
            <button
                onClick={() => { setVisible(false); setTimeout(onDismiss, 100); }}
                className="shrink-0 p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
                <X size={14} />
            </button>
        </div>
    );
}
