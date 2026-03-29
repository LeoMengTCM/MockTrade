'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { syncPriceColorMode } from '@/lib/market-display';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncPriceColorMode().catch(() => { });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      {children}
    </ThemeProvider>
  );
}
