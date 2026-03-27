export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface TradePost {
  id: string;
  userId: string;
  orderId: string | null;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface ActivityItem {
  type: 'trade' | 'achievement' | 'rank_change' | 'follow';
  description: string;
  relatedTicker?: string;
  pnl?: number;
  timestamp: string;
}
