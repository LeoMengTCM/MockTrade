import { create } from 'zustand';
import type { Stock } from '@mocktrade/shared';
import { MarketStatus } from '@mocktrade/shared';

interface MarketState {
  stocks: Stock[];
  marketStatus: MarketStatus;
  countdown: number;
  setStocks: (stocks: Stock[]) => void;
  updateStockPrice: (stockId: string, price: number, volume: number) => void;
  setMarketStatus: (status: MarketStatus, countdown: number) => void;
  decrementCountdown: () => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  stocks: [],
  marketStatus: MarketStatus.CLOSED,
  countdown: 0,

  setStocks: (stocks) => set({ stocks }),

  updateStockPrice: (stockId, price, volume) =>
    set((state) => ({
      stocks: state.stocks.map((s) =>
        s.id === stockId
          ? {
              ...s,
              currentPrice: price,
              volume: s.volume + volume,
              dailyHigh: Math.max(s.dailyHigh, price),
              dailyLow: Math.min(s.dailyLow, price),
            }
          : s,
      ),
    })),

  setMarketStatus: (status, countdown) => set({ marketStatus: status, countdown }),

  decrementCountdown: () =>
    set((state) => ({
      countdown: Math.max(0, state.countdown - 1),
    })),
}));
