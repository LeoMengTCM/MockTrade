export type OrderType = 'market' | 'limit';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'expired';

export interface Order {
  id: string;
  userId: string;
  stockId: string;
  seasonId: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  quantity: number;
  filledPrice: number | null;
  filledQuantity: number | null;
  status: OrderStatus;
  commission: number;
  createdAt: string;
  filledAt: string | null;
}

export interface Position {
  id: string;
  userId: string;
  stockId: string;
  seasonId: string;
  quantity: number;
  avgCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface PositionVO extends Position {
  stockName: string;
  stockSymbol: string;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface AccountInfo {
  availableCash: number;
  frozenCash: number;
  totalAssets: number;
  totalPnl: number;
  returnRate: number;
}
