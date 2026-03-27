'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { MarketStatusBadge } from '@/components/shared/MarketStatusBadge';
import { LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">MockTrade</Link>
          <MarketStatusBadge />
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Market</Link>
          <Link href="/portfolio" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Trade</Link>
          <Link href="/leaderboard" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Rank</Link>
          <Link href="/news" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">News</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[var(--bg-hover)]">
                <div className="h-8 w-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm font-medium">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <span className="hidden md:block text-sm">{user?.username}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg py-1">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg-hover)]" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> Profile
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-[var(--bg-hover)]">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-primary/80">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
