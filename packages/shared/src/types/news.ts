export type NewsImpact = 'positive' | 'negative' | 'neutral';
export type NewsLevel = 'minor' | 'medium' | 'major';
export type NewsSentiment = 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking';
export type NewsType = 'event' | 'recap';

export interface RelatedNewsStock {
  id: string;
  symbol: string;
  name: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  sentiment: NewsSentiment;
  impact: NewsImpact;
  impactLevel: NewsLevel;
  relatedStockIds: string[];
  impactPercents: Record<string, number>; // stockId -> impact%
  relatedStocks: RelatedNewsStock[];
  newsType: NewsType;
  sourceNewsId: string | null;
  publishedCycle: number;
  seasonId: string;
  storylineId: string | null;
  publishedAt: string;
}

export interface AINewsRequest {
  stockId: string;
  stockPersona: string;
  recentNews: string[];
  currentPrice: number;
  priceChange: number;
  direction?: 'positive' | 'negative';
}

export interface AINewsResponse {
  title: string;
  content: string;
  sentiment: NewsSentiment;
  impact: NewsImpact;
  impactLevel: NewsLevel;
  relatedStocks: Array<{ symbol: string; impactPercent: number }>;
  storylineId?: string;
}
