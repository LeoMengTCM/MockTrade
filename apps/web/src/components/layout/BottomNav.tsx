'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Wallet, Trophy, Newspaper, UserCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/', icon: BarChart3, label: '市场' },
  { href: '/portfolio', icon: Wallet, label: '持仓' },
  { href: '/leaderboard', icon: Trophy, label: '排名' },
  { href: '/news', icon: Newspaper, label: '新闻' },
  { href: '/profile', icon: UserCircle, label: '我的' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border-color)] glass-bar pb-safe md:hidden">
      <div className="flex h-14 items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href} aria-label={tab.label} aria-current={isActive ? 'page' : undefined} className={cn('flex flex-col items-center gap-0.5 px-3 py-1', isActive ? 'text-accent-primary' : 'text-[var(--text-muted)]')}>
              <tab.icon size={20} />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
