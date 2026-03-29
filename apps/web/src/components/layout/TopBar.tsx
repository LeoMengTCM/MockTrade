'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { MarketStatusBadge } from '@/components/shared/MarketStatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { LogOut, User, Settings, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function TopBar() {
  const { user, isAuthenticated, isHydrated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] glass-bar">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">MockTrade</Link>
          <MarketStatusBadge />
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">市场</Link>
          <Link href="/portfolio" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">持仓</Link>
          <Link href="/leaderboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">排名</Link>
          <Link href="/news" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">新闻</Link>
        </nav>

        <div className="flex items-center gap-3">
          {!isHydrated ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--bg-hover)]" />
          ) : isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--bg-hover)]">
                <UserAvatar
                  username={user?.username}
                  avatarUrl={user?.avatarUrl}
                  className="h-8 w-8 text-sm"
                />
                <span className="hidden md:block text-sm">{user?.username}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg py-1">
                  {user?.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-hover)]" onClick={() => setMenuOpen(false)}>
                      <Settings size={16} /> 管理后台
                    </Link>
                  )}
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-hover)]" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> 个人资料
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[var(--bg-hover)]">
                    <LogOut size={16} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-primary/80">
              登录
            </Link>
          )}

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all ml-1"
            >
              {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
