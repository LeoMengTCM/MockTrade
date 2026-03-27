export interface Stock {
  id: string;
  symbol: string;
  name: string;
  persona: string;
  sector: string;
  basePrice: number;
  currentPrice: number;
  openPrice: number;
  prevClosePrice: number;
  dailyHigh: number;
  dailyLow: number;
  volume: number;
  isActive: boolean;
  createdAt: string;
}

export interface StockTick {
  stockId: string;
  price: number;
  volume: number;
  timestamp: string;
}

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
