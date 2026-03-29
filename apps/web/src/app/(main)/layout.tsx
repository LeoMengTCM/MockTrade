'use client';

import { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { NewsToast } from '@/components/shared/NewsToast';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketStore } from '@/stores/market-store';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/websocket';
import { api } from '@/lib/api';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { loadFromStorage } = useAuthStore();
  const { setStocks, updateStockPrice, setMarketStatus } = useMarketStore();
  const [toastNews, setToastNews] = useState<{ id: string; title: string; sentiment: string } | null>(null);
  const dismissToast = useCallback(() => setToastNews(null), []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    // Fetch initial stock data
    api.get('/market/stocks').then(res => setStocks(res.data)).catch(() => {});
    api.get('/market/status').then(res => {
      setMarketStatus(res.data.status, res.data.countdown || 0);
    }).catch(() => {});

    // Connect WebSocket
    const socket = connectSocket();
    socket.on('tick', (ticks: any) => {
      if (Array.isArray(ticks)) {
        ticks.forEach((t: any) => updateStockPrice(t.stockId, t.price, t.volume));
      } else {
        updateStockPrice(ticks.stockId, ticks.price, ticks.volume);
      }
    });
    socket.on('market:status', (data: any) => {
      setMarketStatus(data.status, data.countdown);
      api.get('/market/stocks').then(res => setStocks(res.data)).catch(() => {});
    });
    socket.on('news:published', (data: any) => {
      if (data?.id && data?.title) {
        setToastNews({ id: data.id, title: data.title, sentiment: data.sentiment || 'neutral' });
      }
    });

    // Countdown timer
    const timer = setInterval(() => {
      useMarketStore.getState().decrementCountdown();
    }, 1000);

    return () => {
      disconnectSocket();
      clearInterval(timer);
    };
  }, [setStocks, updateStockPrice, setMarketStatus]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 pb-20 md:pb-8 pt-4">
        {children}
      </main>
      <BottomNav />
      <NewsToast news={toastNews} onDismiss={dismissToast} />
    </div>
  );
}
