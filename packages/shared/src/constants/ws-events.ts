export enum WsEvent {
  // Market
  TICK = 'tick',
  MARKET_STATUS = 'market:status',
  KLINE_UPDATE = 'kline:update',

  // News
  NEWS_PUBLISHED = 'news:published',
  NEWS_BREAKING = 'news:breaking',

  // Trade
  ORDER_FILLED = 'order:filled',
  ORDER_CANCELLED = 'order:cancelled',
  POSITION_UPDATED = 'position:updated',

  // Social
  ACHIEVEMENT_UNLOCKED = 'achievement:unlocked',
  NOTIFICATION = 'notification',
}

export enum MarketStatus {
  OPENING = 'opening',
  CLOSED = 'closed',
  SETTLING = 'settling',
}
