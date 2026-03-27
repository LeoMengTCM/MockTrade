# UI/UX Design Document - MockTrade

**Version**: 1.0
**Date**: 2026-03-26
**Platform**: Web (Next.js 14+ App Router + TailwindCSS)
**Theme**: Dark-first, with light mode toggle

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design Tokens](#2-design-tokens)
3. [Global Layout & Navigation](#3-global-layout--navigation)
4. [Page 1 - Market Overview (Home)](#4-page-1---market-overview-home)
5. [Page 2 - Stock Detail](#5-page-2---stock-detail)
6. [Page 3 - Portfolio & Trading](#6-page-3---portfolio--trading)
7. [Page 4 - Leaderboard](#7-page-4---leaderboard)
8. [Page 5 - Profile](#8-page-5---profile)
9. [Page 6 - News Center](#9-page-6---news-center)
10. [Page 7 - Auth (Register / Login)](#10-page-7---auth-register--login)
11. [Page 8 - Admin Dashboard](#11-page-8---admin-dashboard)
12. [Interaction Flows](#12-interaction-flows)
13. [Responsive Strategy](#13-responsive-strategy)
14. [Accessibility (A11y)](#14-accessibility-a11y)
15. [Design Recommendations](#15-design-recommendations)
16. [Component Library Summary](#16-component-library-summary)
17. [Developer Handoff Checklist](#17-developer-handoff-checklist)

---

## 1. Design Principles

### 1.1 User Goals
- Quickly grasp the market situation at a glance (who is up, who is down, what happened)
- Execute trades in under 3 seconds (the market window is only ~2 minutes)
- Enjoy the narrative: read funny/dramatic AI-generated news and connect it to stock movements
- Compete with friends: check rankings, show off achievements, share trading stories

### 1.2 Business Goals
- Maximize engagement through the entertainment layer (news stories, stock personalities, achievements)
- Create social stickiness: friends competing, following, commenting
- Low friction onboarding: start trading within 60 seconds of registration

### 1.3 Core Design Tenets
- **Speed**: real-time data updates, minimal clicks to trade, instant feedback
- **Clarity**: at any moment the user must know: market state (open/closed), their P&L, and what is happening
- **Delight**: the AI-generated narratives and stock "personalities" are the unique selling point; the UI must showcase them prominently
- **Familiarity**: borrow conventions from real trading apps (Robinhood, Tiger Trade, Futu) so users feel at home

---

## 2. Design Tokens

### 2.1 Color Palette

```
-- Background Layers (Dark Mode) --
bg-primary:       #0B0E11    (deepest background, page body)
bg-secondary:     #121519    (cards, panels)
bg-tertiary:      #1A1E24    (elevated panels, modals)
bg-hover:         #222830    (hover state for rows/cards)

-- Background Layers (Light Mode) --
bg-primary:       #F8F9FA
bg-secondary:     #FFFFFF
bg-tertiary:      #F1F3F5
bg-hover:         #E9ECEF

-- Market Colors (Chinese Convention: red=up, green=down) --
up / gain:        #E84142    (red, HSL 0 76% 57%)
up-bg:            #E8414215  (red with low opacity, for row highlights)
down / loss:      #00B96B    (green, HSL 150 100% 36%)
down-bg:          #00B96B15
flat / neutral:   #6B7280    (gray-500)

-- Brand / Accent --
accent-primary:   #3B82F6    (blue-500, links, primary CTA)
accent-secondary: #8B5CF6    (purple-500, premium/legendary accents)

-- Semantic --
warning:          #F59E0B    (amber-500)
info:             #3B82F6    (blue-500)
success:          #00B96B
error:            #E84142

-- Text (Dark Mode) --
text-primary:     #E5E7EB    (gray-200)
text-secondary:   #9CA3AF    (gray-400)
text-muted:       #6B7280    (gray-500)

-- Text (Light Mode) --
text-primary:     #111827    (gray-900)
text-secondary:   #4B5563    (gray-600)
text-muted:       #9CA3AF    (gray-400)
```

### 2.2 Rank Tier Colors

```
bronze:           #CD7F32    (bg: #CD7F3220)
silver:           #C0C0C0    (bg: #C0C0C020)
gold:             #FFD700    (bg: #FFD70020)
diamond:          #00BFFF    (bg: #00BFFF20)
legendary:        #A855F7    (bg: #A855F720, with animated glow)
```

Rank thresholds (by return rate):
- Legendary: >= 100%
- Diamond: >= 50%
- Gold: >= 20%
- Silver: >= 5%
- Bronze: < 5%

### 2.3 News Sentiment Tags

```
bullish:   label "#E84142" bg "#E8414220"  (icon: flame)
bearish:   label "#00B96B" bg "#00B96B20"  (icon: skull)
funny:     label "#F59E0B" bg "#F59E0B20"  (icon: laughing face)
neutral:   label "#6B7280" bg "#6B728020"  (icon: newspaper)
breaking:  label "#A855F7" bg "#A855F720"  (icon: lightning bolt, with pulse animation)
```

### 2.4 Typography

```
Font Family:      Inter (Latin), "Noto Sans SC" (Chinese fallback)
                  Monospace for numbers: "JetBrains Mono" or "SF Mono"

-- Headings --
h1:  text-3xl  (30px), font-bold,    tracking-tight
h2:  text-2xl  (24px), font-semibold, tracking-tight
h3:  text-xl   (20px), font-semibold
h4:  text-lg   (18px), font-medium

-- Body --
body:    text-sm   (14px), leading-relaxed    (primary body text)
caption: text-xs   (12px), leading-normal     (timestamps, labels)

-- Numbers / Prices --
price-large:   text-2xl (24px), font-mono, font-bold, tabular-nums
price-medium:  text-lg  (18px), font-mono, font-semibold, tabular-nums
price-small:   text-sm  (14px), font-mono, tabular-nums
```

### 2.5 Spacing Scale (Tailwind defaults)

```
1:  4px     (micro gaps)
2:  8px     (inline spacing, icon gaps)
3:  12px    (compact card padding)
4:  16px    (standard card padding)
6:  24px    (section gaps)
8:  32px    (major section separation)
12: 48px    (page-level vertical rhythm)
```

### 2.6 Shadows & Borders

```
Dark Mode:
  border-color:   #1F2937 (gray-800)
  card-shadow:    none (rely on bg layers for depth)

Light Mode:
  border-color:   #E5E7EB (gray-200)
  card-shadow:    0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)

Border radius:
  card:   rounded-xl  (12px)
  button: rounded-lg  (8px)
  badge:  rounded-full
  input:  rounded-lg  (8px)
```

---

## 3. Global Layout & Navigation

### 3.1 Layout Structure

**Desktop (>= 1024px)**:

```
+----------------------------------------------------------------+
| TopBar: [Logo "MockTrade"]  [MarketClock]  [SearchBar]  [Avatar]|
+----------------------------------------------------------------+
|                                                                  |
|  LeftSidebar (optional, collapsible)  |   Main Content Area      |
|  - Market                             |                          |
|  - Trading                            |   (route-specific)       |
|  - Leaderboard                        |                          |
|  - News                               |                          |
|  - Profile                            |                          |
|                                                                  |
+----------------------------------------------------------------+
```

Design note: On desktop the left sidebar is optional. The preferred desktop layout uses the TopBar for navigation links horizontally to maximize content width for charts and data tables. The sidebar mode can be toggled by power users.

**Mobile (< 1024px)**:

```
+----------------------------------+
| TopBar: [Logo] [Clock] [Avatar] |
+----------------------------------+
|                                  |
|         Main Content             |
|         (scrollable)             |
|                                  |
+----------------------------------+
| BottomNav:                       |
| [Market] [Trade] [Rank] [News] [Me] |
+----------------------------------+
```

### 3.2 Bottom Navigation (Mobile)

Five tabs, icon + label, 56px height:

| Tab     | Icon         | Route          |
|---------|-------------|----------------|
| Market  | chart-line  | /              |
| Trade   | wallet      | /portfolio     |
| Rank    | trophy      | /leaderboard   |
| News    | newspaper   | /news          |
| Me      | user-circle | /profile       |

Active tab: accent-primary color with filled icon.
Inactive tab: text-muted with outlined icon.

### 3.3 TopBar Component

```
TopBar
+-- Logo ("MockTrade", stylized, links to /)
+-- MarketClock
|   +-- MarketStatusBadge ("OPEN" green pulse dot / "CLOSED" gray)
|   +-- CountdownTimer ("Next open in 0:28" or "Closing in 1:32")
+-- SearchBar (desktop: expanded input; mobile: icon that expands)
+-- NavLinks (desktop only: Market | Trade | Rank | News)
+-- UserMenu
    +-- Avatar (small, 32px)
    +-- Dropdown: Profile, Settings, Theme Toggle, Logout
```

### 3.4 MarketClock Behavior

This is a critical ambient UI element. It must always be visible.

- **Market Open**: green pulse dot + "OPEN" badge + countdown "Closing in 1:32" in white text. The countdown ticks every second.
- **Market Closed (intermission)**: gray dot + "CLOSED" badge + countdown "Opens in 0:28" in muted text. Background of TopBar subtly dims.
- Transition animation: when market opens, a brief flash/pulse across the TopBar to draw attention.

### 3.5 Component Tree: Global Shell

```
RootLayout
+-- ThemeProvider (dark/light state)
+-- AuthProvider (user session)
+-- WebSocketProvider (real-time market data)
+-- TopBar
|   +-- Logo
|   +-- MarketClock
|   |   +-- MarketStatusBadge
|   |   +-- CountdownTimer
|   +-- SearchBar
|   +-- DesktopNavLinks (hidden on mobile)
|   +-- UserMenu
|       +-- Avatar
|       +-- DropdownMenu
+-- MainContent (children / page routes)
+-- BottomNav (visible only on mobile)
|   +-- NavTab (x5)
+-- ToastContainer (for global notifications)
+-- TradeConfirmModal (global, triggered from anywhere)
```

---

## 4. Page 1 - Market Overview (Home)

**Route**: `/`

### 4.1 Page Wireframe

```
+----------------------------------------------------------------+
| [TopBar with MarketClock]                                       |
+----------------------------------------------------------------+
| NEWS TICKER (horizontal scrolling marquee)                      |
| "AAMC up 15% after CEO caught dancing..." | "ZYX crashes..."  |
+----------------------------------------------------------------+
|                                                                  |
| SECTION: Market Indices Summary                                  |
| +------------------+------------------+------------------+       |
| | Total Market Cap | Today Volume     | Active Stocks    |       |
| | $12.5B (+2.3%)   | $890M            | 24/30            |       |
| +------------------+------------------+------------------+       |
|                                                                  |
| SECTION: Tabs [ All | Gainers | Losers | Hot | Watchlist ]      |
|                                                                  |
| STOCK CARDS GRID (or LIST toggle)                                |
| +---------------------------+  +---------------------------+     |
| | [Avatar] AAMC             |  | [Avatar] BFLY             |     |
| | "The Meme Lord"           |  | "The Steady Eddie"        |     |
| | $142.50  +12.3%  (red)    |  | $88.20   -3.1%  (green)   |     |
| | [Sparkline 24h --------/] |  | [Sparkline 24h ---\___]   |     |
| | Vol: 12.3K  MCap: $1.4B   |  | Vol: 5.6K   MCap: $882M   |     |
| +---------------------------+  +---------------------------+     |
| +---------------------------+  +---------------------------+     |
| | ...                       |  | ...                       |     |
| +---------------------------+  +---------------------------+     |
|                                                                  |
| SECTION: Side Panel (desktop right column)                       |
| +-------------------------------+                                |
| | TOP GAINERS        see all >  |                                |
| | 1. AAMC   +12.3%             |                                |
| | 2. DOGE   +8.7%              |                                |
| | 3. MOON   +6.2%              |                                |
| +-------------------------------+                                |
| | TOP LOSERS         see all >  |                                |
| | 1. SINK   -9.1%              |                                |
| | 2. OOPS   -7.4%              |                                |
| | 3. FALL   -5.8%              |                                |
| +-------------------------------+                                |
| | LATEST NEWS        see all >  |                                |
| | [tag] Headline...   2min ago  |                                |
| | [tag] Headline...   5min ago  |                                |
| +-------------------------------+                                |
|                                                                  |
+----------------------------------------------------------------+
```

**Mobile layout**: The side panel content (Gainers/Losers/News) moves above the stock grid as horizontally scrollable card rows. The stock grid becomes a single-column list.

### 4.2 Component Tree

```
MarketOverviewPage
+-- NewsTicker
|   +-- TickerItem (x N, auto-scrolling)
+-- MarketSummaryBar
|   +-- StatCard ("Total Market Cap")
|   +-- StatCard ("Today Volume")
|   +-- StatCard ("Active Stocks")
+-- MarketContentLayout (desktop: 2-column; mobile: stacked)
|   +-- MainColumn
|   |   +-- StockFilterTabs (All | Gainers | Losers | Hot | Watchlist)
|   |   +-- ViewToggle (Grid | List)
|   |   +-- StockGrid / StockList
|   |       +-- StockCard (x N)
|   |           +-- StockAvatar (AI-generated icon representing "personality")
|   |           +-- StockTicker + StockName
|   |           +-- PersonalityTag ("The Meme Lord")
|   |           +-- PriceDisplay (current price + change % + color)
|   |           +-- Sparkline (tiny inline chart, last 24h)
|   |           +-- VolumeAndMarketCap
|   +-- SideColumn (desktop only, sticky)
|       +-- RankingMiniCard ("Top Gainers")
|       |   +-- RankingRow (x 3-5)
|       +-- RankingMiniCard ("Top Losers")
|       |   +-- RankingRow (x 3-5)
|       +-- LatestNewsMini
|           +-- NewsRowCompact (x 3-5)
+-- MobileQuickPanels (mobile only, horizontal scroll)
    +-- HorizontalScrollSection ("Gainers")
    |   +-- MiniStockChip (x N)
    +-- HorizontalScrollSection ("Losers")
        +-- MiniStockChip (x N)
```

### 4.3 Key Component Definitions

#### `StockCard`

```typescript
interface StockCardProps {
  ticker: string              // e.g. "AAMC"
  name: string                // e.g. "AI Meme Corp"
  personality: string         // e.g. "The Meme Lord"
  avatarUrl: string           // AI-generated stock avatar
  currentPrice: number
  priceChange: number         // absolute change
  priceChangePercent: number  // percentage change
  sparklineData: number[]     // array of recent prices for mini chart
  volume: number
  marketCap: number
  isWatchlisted: boolean
  onPress: () => void         // navigate to detail
  onToggleWatchlist: () => void
}
```

Styling notes:
- Card background: `bg-secondary`, hover: `bg-hover`, border: 1px `border-color`
- Price text: red (`text-up`) if positive, green (`text-down`) if negative, gray if zero
- Sparkline: 60px wide, 24px tall, stroke matches gain/loss color
- Personality tag: small italic text in `text-muted`
- Watchlist star icon in top-right corner

#### `NewsTicker`

```typescript
interface NewsTickerProps {
  items: Array<{
    id: string
    headline: string
    sentiment: 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking'
    relatedTicker?: string
    timestamp: Date
  }>
}
```

Behavior:
- Horizontal marquee, auto-scrolling right-to-left at moderate speed
- Hover pauses the scroll
- Click on an item navigates to the news detail
- Breaking news items have a purple glow effect
- Each item shows: `[SentimentIcon] Headline... | TICKER +X.X% | time`

#### `MarketClock` (detailed)

```typescript
interface MarketClockProps {
  status: 'open' | 'closed' | 'pre-open'
  remainingSeconds: number
}
```

Visual states:
- Open: green dot (CSS pulsing animation), white countdown text, slightly brighter TopBar region
- Closed: gray dot, muted text, TopBar returns to default
- Pre-open (last 5 seconds of intermission): amber dot, countdown flashes

---

## 5. Page 2 - Stock Detail

**Route**: `/stock/[ticker]`

### 5.1 Page Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
| BACK ARROW   AAMC - AI Meme Corp          [Watchlist Star]      |
| "The Meme Lord" personality tag                                  |
|                                                                  |
| PRICE SECTION                                                    |
| $142.50                                                          |
| +$15.80 (+12.45%)  Today                         [red colored]   |
|                                                                  |
| CHART SECTION                                                    |
| +--------------------------------------------------------------+|
| |                                                               ||
| |              (K-Line / Line Chart)                            ||
| |                                                               ||
| |   /\    /\                                                    ||
| |  /  \  /  \     /\                                            ||
| | /    \/    \   /  \                                           ||
| |              \/    \_____/                                    ||
| |                                                               ||
| +--------------------------------------------------------------+|
| Time Range: [1D] [1W] [1M] [ALL]                                |
| Chart Type: [Line] [Candlestick]                                 |
|                                                                  |
| STATS ROW                                                        |
| +----------+----------+----------+----------+                    |
| | Open     | High     | Low      | Volume   |                    |
| | $126.70  | $145.20  | $125.30  | 28.5K    |                    |
| +----------+----------+----------+----------+                    |
| | Mkt Cap  | P/E      | 52W High | 52W Low  |                    |
| | $1.42B   | 24.5     | $180.00  | $45.20   |                    |
| +----------+----------+----------+----------+                    |
|                                                                  |
| TABS: [News] [About] [Trades]                                   |
|                                                                  |
| NEWS TAB (default):                                              |
| +--------------------------------------------------------------+|
| | [Bullish Tag] CEO announces dancing competition  2min ago     ||
| | Impact: AAMC +8.2%                               [red bar]   ||
| +--------------------------------------------------------------+|
| | [Funny Tag]  Intern accidentally buys 1M shares  15min ago   ||
| | Impact: AAMC +4.1%                               [red bar]   ||
| +--------------------------------------------------------------+|
| | [Bearish Tag] Rival company launches better meme  1hr ago    ||
| | Impact: AAMC -2.5%                               [green bar] ||
| +--------------------------------------------------------------+|
|                                                                  |
| ABOUT TAB:                                                       |
| Stock personality description, backstory, AI-generated lore      |
|                                                                  |
| TRADES TAB:                                                      |
| Recent trades by all players (anonymized or public)              |
|                                                                  |
+----------------------------------------------------------------+
| STICKY TRADE BAR (bottom of viewport)                            |
| [    BUY    ]                    [    SELL    ]                   |
+----------------------------------------------------------------+
```

### 5.2 Component Tree

```
StockDetailPage
+-- StockDetailHeader
|   +-- BackButton
|   +-- StockIdentity (ticker, name, personality tag)
|   +-- WatchlistToggle
+-- PriceHero
|   +-- CurrentPrice (large, font-mono)
|   +-- PriceChange (absolute + percent, colored)
|   +-- MarketStatusIndicator (tiny, inline with price)
+-- ChartSection
|   +-- ChartCanvas (K-line or Line, via lightweight-charts or recharts)
|   +-- TimeRangeSelector (1D | 1W | 1M | ALL)
|   +-- ChartTypeToggle (Line | Candlestick)
+-- StatsGrid
|   +-- StatItem (x 8: Open, High, Low, Volume, MktCap, P/E, 52W High, 52W Low)
+-- ContentTabs
|   +-- Tab: RelatedNewsList
|   |   +-- NewsCardWithImpact (x N)
|   |       +-- SentimentTag
|   |       +-- Headline + Timestamp
|   |       +-- ImpactBar (visual bar showing price impact %)
|   +-- Tab: StockAbout
|   |   +-- PersonalityProfile (avatar, backstory, traits)
|   +-- Tab: RecentTrades
|       +-- TradeRow (x N: user avatar, buy/sell, quantity, price, time)
+-- StickyTradeBar
    +-- BuyButton (accent color, opens TradePanel)
    +-- SellButton (secondary color, opens TradePanel)
```

### 5.3 Key Component Definitions

#### `ChartSection`

```typescript
interface ChartSectionProps {
  ticker: string
  initialData: CandlestickData[]
  onTimeRangeChange: (range: '1D' | '1W' | '1M' | 'ALL') => void
}

interface CandlestickData {
  time: number     // unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}
```

Implementation notes:
- Use `lightweight-charts` (TradingView open-source) for the chart canvas. It is performant and supports both line and candlestick modes natively.
- Real-time updates: subscribe to WebSocket for live price ticks; append to chart data in real-time.
- Crosshair on hover shows OHLCV tooltip.
- Time range buttons are pill-shaped toggles; active one has `bg-accent-primary` fill.

#### `NewsCardWithImpact`

```typescript
interface NewsCardWithImpactProps {
  id: string
  headline: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking'
  impactPercent: number        // e.g. +8.2 or -2.5
  affectedTicker: string
  publishedAt: Date
  onPress: () => void
}
```

Visual:
- Left edge has a colored accent bar matching sentiment
- Impact percent shown as a small horizontal bar chart (red bar for positive impact, green for negative)
- Timestamp is relative ("2min ago")

#### `StickyTradeBar`

```typescript
interface StickyTradeBarProps {
  ticker: string
  currentPrice: number
  marketOpen: boolean
  userHoldsShares: boolean     // affects Sell button state
}
```

Behavior:
- Fixed at bottom of viewport (above BottomNav on mobile)
- Two equal-width buttons: BUY (red/accent) and SELL (outlined or secondary)
- If market is closed: buttons show "Market Closed" and are disabled, with muted styling
- If user holds 0 shares: SELL button is disabled
- Tapping BUY or SELL opens the `TradeModal`

#### `TradeModal`

```typescript
interface TradeModalProps {
  mode: 'buy' | 'sell'
  ticker: string
  stockName: string
  currentPrice: number
  userBalance: number          // for buy: max affordable
  userShares: number           // for sell: max sellable
  onConfirm: (order: OrderRequest) => Promise<void>
  onClose: () => void
}

interface OrderRequest {
  ticker: string
  side: 'buy' | 'sell'
  orderType: 'market' | 'limit'
  quantity: number
  limitPrice?: number
}
```

Layout:
```
+------------------------------------------+
| [X]   BUY AAMC                           |
|                                          |
| Current Price: $142.50                   |
|                                          |
| Order Type: [Market] [Limit]             |
|                                          |
| Quantity:                                |
| [ -10 ] [ -1 ] [  250  ] [ +1 ] [ +10 ] |
|                                          |
| Quick: [25%] [50%] [75%] [MAX]           |
|                                          |
| Limit Price (if limit order):            |
| [ $142.50 ]                              |
|                                          |
| ----- Order Summary -----                |
| Quantity:     250 shares                 |
| Est. Cost:    $35,625.00                 |
| Available:    $124,350.00                |
|                                          |
| [ Confirm Buy - $35,625.00 ]            |
+------------------------------------------+
```

Interaction details:
- Quantity input supports direct typing, +/- steppers, and percentage quick buttons (25%/50%/75%/MAX of affordable shares or held shares)
- Order summary updates in real-time as quantity changes
- Confirm button shows total cost/revenue
- After confirmation: loading spinner on button, then success animation (checkmark) or error toast
- If market closes during modal open: show warning banner "Market has closed, order will be queued" or disable confirm

---

## 6. Page 3 - Portfolio & Trading

**Route**: `/portfolio`

### 6.1 Page Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
|                                                                  |
| PORTFOLIO HEADER                                                 |
| Total Assets: $1,245,680.00                                     |
| +$245,680.00 (+24.57%)  Since Start          [Gold Rank Badge]  |
|                                                                  |
| MINI ASSET CHART (area chart, last 7 days trend)                |
| [====================/\======]                                   |
|                                                                  |
| ASSET BREAKDOWN BAR                                              |
| [||||Cash: $320K||||][||||Stocks: $925K||||]                    |
|                                                                  |
| TABS: [Holdings] [Pending Orders] [History]                     |
|                                                                  |
| HOLDINGS TAB:                                                    |
| +--------------------------------------------------------------+|
| | AAMC   250 shares   Avg $120.30                               ||
| | Current: $142.50    P&L: +$5,550 (+18.5%)    [red]           ||
| | [Chart spark] ============================== [Trade btn]      ||
| +--------------------------------------------------------------+|
| | BFLY   100 shares   Avg $92.10                                ||
| | Current: $88.20     P&L: -$390 (-4.2%)       [green]         ||
| | [Chart spark] ============================== [Trade btn]      ||
| +--------------------------------------------------------------+|
| | ... more holdings ...                                         ||
| +--------------------------------------------------------------+|
|                                                                  |
| PENDING ORDERS TAB:                                              |
| +--------------------------------------------------------------+|
| | BUY AAMC  Limit $135.00  x100  Status: Pending  [Cancel]     ||
| +--------------------------------------------------------------+|
|                                                                  |
| HISTORY TAB:                                                     |
| +--------------------------------------------------------------+|
| | 2026-03-26 14:32  SELL BFLY x50 @ $90.10  +$205  Filled     ||
| | 2026-03-26 13:15  BUY AAMC x100 @ $138.20  -$13,820  Filled ||
| | ...                                                           ||
| +--------------------------------------------------------------+|
|                                                                  |
+----------------------------------------------------------------+
```

### 6.2 Component Tree

```
PortfolioPage
+-- PortfolioHeader
|   +-- TotalAssets (large price display)
|   +-- TotalPnL (absolute + percent, colored)
|   +-- RankBadge (tier icon + label)
+-- AssetTrendChart (small area chart, 7-day or 30-day asset value)
+-- AssetBreakdownBar (stacked horizontal bar: cash vs stock value)
+-- PortfolioTabs
    +-- Tab: HoldingsList
    |   +-- HoldingCard (x N)
    |       +-- StockIdentity (ticker, name)
    |       +-- HoldingInfo (shares, avg cost)
    |       +-- CurrentPrice
    |       +-- PnLDisplay (absolute + percent, colored)
    |       +-- Sparkline (inline, small)
    |       +-- QuickTradeButton (opens TradeModal for this stock)
    +-- Tab: PendingOrdersList
    |   +-- PendingOrderRow (x N)
    |       +-- OrderSide badge (BUY red / SELL green)
    |       +-- StockTicker
    |       +-- OrderType + Price
    |       +-- Quantity
    |       +-- Status badge
    |       +-- CancelButton
    +-- Tab: TradeHistory
        +-- HistoryFilters (date range, stock, side)
        +-- TradeHistoryRow (x N)
            +-- Timestamp
            +-- OrderSide badge
            +-- StockTicker
            +-- Quantity + Price
            +-- PnL (for sells)
            +-- Status badge
```

### 6.3 Key Component Definitions

#### `HoldingCard`

```typescript
interface HoldingCardProps {
  ticker: string
  name: string
  shares: number
  avgCost: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  sparklineData: number[]
  onTrade: () => void        // open TradeModal
  onPress: () => void        // navigate to stock detail
}
```

Layout: horizontal card, tap-to-navigate, with a small "Trade" icon button on the right.
P&L display: bold, colored (red for gain, green for loss per Chinese convention), with a small arrow icon.

#### `AssetTrendChart`

```typescript
interface AssetTrendChartProps {
  data: Array<{ date: string; value: number }>
  timeRange: '7D' | '30D' | 'ALL'
  onTimeRangeChange: (range: string) => void
}
```

Visual: smooth area chart with gradient fill (red-tinted if overall gain, green-tinted if loss). Height: 120px on mobile, 160px on desktop.

---

## 7. Page 4 - Leaderboard

**Route**: `/leaderboard`

### 7.1 Page Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
|                                                                  |
| LEADERBOARD HEADER                                               |
| Season: Season 3 (2026 Q1)           [Season Dropdown]          |
|                                                                  |
| TOP 3 PODIUM (hero section)                                     |
|        [2nd]        [1st]       [3rd]                            |
|      [Avatar]     [Avatar]    [Avatar]                           |
|      @silver      @goldking   @trader3                           |
|      +89.2%       +124.5%     +76.3%                             |
|     [Diamond]    [Legendary]  [Diamond]                          |
|                                                                  |
| RANKING DIMENSION TABS:                                          |
| [Total Assets] [Return %] [Weekly Star] [Win Rate]              |
|                                                                  |
| RANK   USER              ASSETS         RETURN    TIER           |
| +--------------------------------------------------------------+|
| |  4   [Av] @doge_fan    $1,892,000    +89.2%   [Diamond]      ||
| |  5   [Av] @moon_rider  $1,654,000    +65.4%   [Diamond]      ||
| |  6   [Av] @safe_bet    $1,423,000    +42.3%   [Gold]         ||
| |  7   [Av] @yolo_king   $1,198,000    +19.8%   [Silver]       ||
| | ...                                                           ||
| | ---- YOUR RANK (highlighted row, always visible) ----         ||
| | 23   [Av] @me          $1,067,000    +6.7%    [Silver]       ||
| +--------------------------------------------------------------+|
|                                                                  |
+----------------------------------------------------------------+
```

### 7.2 Component Tree

```
LeaderboardPage
+-- LeaderboardHeader
|   +-- SeasonTitle
|   +-- SeasonSelector (dropdown: current season, past seasons, all-time)
+-- TopThreePodium
|   +-- PodiumSlot (x3: 1st center/tallest, 2nd left, 3rd right)
|       +-- UserAvatar (large, with tier border glow)
|       +-- Username
|       +-- KeyMetric (return % or total assets)
|       +-- RankBadge
+-- DimensionTabs (Total Assets | Return % | Weekly Star | Win Rate)
+-- LeaderboardTable
|   +-- TableHeader (Rank, User, Assets, Return, Tier)
|   +-- LeaderboardRow (x N)
|   |   +-- RankNumber (1-3 have medal icons)
|   |   +-- UserIdentity (avatar + username)
|   |   +-- TotalAssets
|   |   +-- ReturnPercent (colored)
|   |   +-- TierBadge
|   +-- MyRankRow (sticky/highlighted, always visible if user is not in viewport)
+-- Pagination or InfiniteScroll
```

### 7.3 Key Component Definitions

#### `PodiumSlot`

```typescript
interface PodiumSlotProps {
  rank: 1 | 2 | 3
  userId: string
  username: string
  avatarUrl: string
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'
  metric: number           // the primary metric value
  metricLabel: string      // e.g. "+124.5%"
}
```

Visual:
- 1st place: center position, largest avatar (80px), gold crown icon above, tallest pedestal
- 2nd place: left, medium avatar (64px), silver medal, shorter pedestal
- 3rd place: right, medium avatar (64px), bronze medal, shortest pedestal
- Avatar border color matches tier color; legendary tier has animated glow (CSS `box-shadow` pulse)
- Pedestals are colored blocks (can use CSS shapes or SVG)

#### `TierBadge`

```typescript
interface TierBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean       // show text "Gold" etc
}
```

Visual: icon (shield/gem shape) + optional text label. Color from tier palette. Legendary tier has subtle sparkle animation.

#### `LeaderboardRow`

```typescript
interface LeaderboardRowProps {
  rank: number
  userId: string
  username: string
  avatarUrl: string
  tier: TierType
  totalAssets: number
  returnPercent: number
  isCurrentUser: boolean    // highlight if true
  onPress: () => void       // navigate to user profile
}
```

Behavior:
- `isCurrentUser` row: highlighted background (`bg-accent-primary/10`), slightly bolder text
- If user scrolls past their own rank, a floating "Your Rank: #23" bar appears at the bottom of the table area
- Tap on any row navigates to that user's public profile

---

## 8. Page 5 - Profile

**Route**: `/profile` (own) or `/profile/[userId]` (others)

### 8.1 Page Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
|                                                                  |
| PROFILE HEADER                                                   |
| +----------------------------------------------------------+    |
| |  [Large Avatar 80px]                                      |    |
| |  @username              [Follow Button] (if other user)   |    |
| |  "Trading since Mar 2026"                                 |    |
| |  [Legendary Badge with glow]                              |    |
| |                                                           |    |
| |  Followers: 42    Following: 18    Trades: 1,204          |    |
| +----------------------------------------------------------+    |
|                                                                  |
| STATS DASHBOARD (2x2 or 4-column grid)                          |
| +-------------+-------------+-------------+-------------+       |
| | Total Assets| Return %    | Win Rate    | Best Trade  |       |
| | $2,245,680  | +124.57%    | 62%         | +$52,300    |       |
| +-------------+-------------+-------------+-------------+       |
|                                                                  |
| ACHIEVEMENTS WALL                                                |
| [Medal1] [Medal2] [Medal3] [Medal4] [Medal5] ...   see all >   |
| "First Blood" "Diamond Hands" "YOLO King" "News Trader"        |
|                                                                  |
| TABS: [Activity] [Holdings] [Achievements]                      |
|                                                                  |
| ACTIVITY TAB (default):                                          |
| +--------------------------------------------------------------+|
| | @user bought 500 AAMC @ $135.20            15 min ago        ||
| | @user sold 200 BFLY @ $91.50, +$1,280      1 hour ago       ||
| | @user earned achievement "Diamond Hands"    3 hours ago      ||
| | ...                                                          ||
| +--------------------------------------------------------------+|
|                                                                  |
| HOLDINGS TAB (simplified, if viewing another user):             |
| Public portfolio snapshot (top holdings, no exact quantities)   |
|                                                                  |
| ACHIEVEMENTS TAB:                                                |
| Full grid of all achievements, earned ones highlighted          |
|                                                                  |
+----------------------------------------------------------------+
```

### 8.2 Component Tree

```
ProfilePage
+-- ProfileHeader
|   +-- UserAvatar (large)
|   +-- Username
|   +-- JoinDate
|   +-- TierBadge (large, with animation for legendary)
|   +-- FollowButton (only on other users' profiles)
|   +-- SocialStats (followers, following, trade count)
+-- StatsDashboard
|   +-- StatCard (x4: Total Assets, Return %, Win Rate, Best Trade)
+-- AchievementsPreview (horizontal scroll of earned achievement icons)
|   +-- AchievementIcon (x N, with tooltip on hover)
|   +-- SeeAllLink
+-- ProfileTabs
    +-- Tab: ActivityFeed
    |   +-- ActivityItem (x N)
    |       +-- ActivityIcon (buy/sell/achievement/rank-up)
    |       +-- ActivityDescription (rich text with stock links)
    |       +-- Timestamp
    +-- Tab: PublicHoldings (visible on other users' profiles)
    |   +-- HoldingRow (simplified: ticker, approx allocation %)
    +-- Tab: AchievementsGrid
        +-- AchievementCard (x all available)
            +-- AchievementIcon (gray if locked, colored if earned)
            +-- AchievementName
            +-- AchievementDescription
            +-- EarnedDate (if earned)
```

### 8.3 Key Component Definitions

#### `AchievementCard`

```typescript
interface AchievementCardProps {
  id: string
  name: string                // "Diamond Hands"
  description: string         // "Hold a stock through a 20% drawdown"
  iconUrl: string
  isEarned: boolean
  earnedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}
```

Visual:
- Earned: full color icon, subtle glow matching rarity color, name in white
- Locked: grayscale icon, name in muted text, shows progress bar if progress is trackable
- Rarity border: common=gray, rare=blue, epic=purple, legendary=gold with animation
- Grid layout: 3 columns on mobile, 4-5 on desktop

#### `ActivityItem`

```typescript
interface ActivityItemProps {
  type: 'trade' | 'achievement' | 'rank_change' | 'follow'
  description: string          // e.g. "Bought 500 shares of AAMC"
  relatedTicker?: string
  pnl?: number
  timestamp: Date
}
```

Visual: timeline-style list with small icons on the left. Trade items show P&L badge. Achievement items show the achievement icon. Stock tickers are tappable links.

---

## 9. Page 6 - News Center

**Route**: `/news` and `/news/[newsId]`

### 9.1 News List Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
|                                                                  |
| NEWS CENTER                                                      |
|                                                                  |
| FILTER BAR:                                                      |
| [All] [Breaking] [Bullish] [Bearish] [Funny]   [Stock Filter v] |
|                                                                  |
| NEWS CARDS (vertical list):                                      |
| +--------------------------------------------------------------+|
| | [BREAKING purple glow]                          5 min ago     ||
| |                                                               ||
| | CEO of AAMC Caught Dancing at Shareholder Meeting             ||
| |                                                               ||
| | The AI Meme Corp's CEO was spotted performing an elaborate    ||
| | breakdance routine during the quarterly earnings call...      ||
| |                                                               ||
| | Affected: AAMC +8.2% | BFLY -1.2%                           ||
| | [Bullish Tag]  [Funny Tag]                                    ||
| +--------------------------------------------------------------+|
| |                                                               ||
| | [BEARISH green accent bar]                     32 min ago     ||
| |                                                               ||
| | ZYX Corp's Latest Product Literally Catches Fire              ||
| |                                                               ||
| | Multiple reports of the ZYX Smart Toaster bursting into...    ||
| |                                                               ||
| | Affected: ZYX -12.4%                                         ||
| | [Bearish Tag]                                                 ||
| +--------------------------------------------------------------+|
| | ... more news ...                                             ||
| +--------------------------------------------------------------+|
|                                                                  |
+----------------------------------------------------------------+
```

### 9.2 News Detail Wireframe

```
+----------------------------------------------------------------+
| [TopBar]                                                         |
+----------------------------------------------------------------+
| BACK   [Bullish Tag] [Funny Tag]                   5 min ago    |
|                                                                  |
| CEO of AAMC Caught Dancing at Shareholder Meeting                |
|                                                                  |
| [Full article body, AI-generated, can be multiple paragraphs.   |
|  May include dramatic narration, humor, and fictional quotes.]  |
|                                                                  |
| PRICE IMPACT SECTION                                             |
| +--------------------------------------------------------------+|
| | Stock Impact Visualization                                    ||
| |                                                               ||
| | AAMC  $142.50  +$10.50 (+8.2%)  [===========>     ] red bar  ||
| | BFLY  $88.20   -$1.10  (-1.2%)  [<=====           ] grn bar  ||
| +--------------------------------------------------------------+|
|                                                                  |
| RELATED NEWS                                                     |
| +--------------------------------------------------------------+|
| | Earlier: "AAMC Hires Professional Dancer as CFO"  2hr ago    ||
| | Earlier: "BFLY CEO Calls AAMC Dancing 'Absurd'"   1hr ago    ||
| +--------------------------------------------------------------+|
|                                                                  |
+----------------------------------------------------------------+
```

### 9.3 Component Tree

```
NewsListPage
+-- NewsHeader ("News Center")
+-- NewsFilterBar
|   +-- SentimentFilter (All | Breaking | Bullish | Bearish | Funny)
|   +-- StockFilter (dropdown to filter by specific stock)
+-- NewsFeed (infinite scroll)
    +-- NewsCard (x N)
        +-- SentimentAccentBar (left border, colored by sentiment)
        +-- Timestamp (relative)
        +-- BreakingBadge (if breaking, with pulse animation)
        +-- Headline (bold, 1-2 lines)
        +-- Summary (2-3 lines, truncated)
        +-- AffectedStocks (list of ticker + impact %)
        +-- SentimentTags (pill badges)

NewsDetailPage
+-- BackButton
+-- SentimentTags
+-- Timestamp
+-- Headline (large)
+-- ArticleBody (rendered markdown/rich text)
+-- PriceImpactSection
|   +-- ImpactRow (x N affected stocks)
|       +-- StockTicker (tappable, links to stock detail)
|       +-- CurrentPrice
|       +-- PriceChange (absolute + %)
|       +-- ImpactBar (horizontal bar, width proportional to impact %)
+-- RelatedNews
    +-- NewsRowCompact (x N)
```

### 9.4 Key Component Definitions

#### `NewsCard`

```typescript
interface NewsCardProps {
  id: string
  headline: string
  summary: string
  sentiment: 'bullish' | 'bearish' | 'funny' | 'neutral' | 'breaking'
  affectedStocks: Array<{
    ticker: string
    impact: number           // e.g. +8.2 or -12.4
  }>
  publishedAt: Date
  isBreaking: boolean
  onPress: () => void
}
```

Visual:
- Left accent bar: 3px, colored by primary sentiment
- Breaking news: card has subtle purple glow border, "BREAKING" badge with pulse
- Funny news: slightly warmer card background tint
- Affected stocks row: each stock is a small chip with ticker + colored impact number

#### `ImpactBar`

```typescript
interface ImpactBarProps {
  ticker: string
  impact: number             // percentage, positive or negative
  maxImpact?: number         // for scaling the bar width, default 20
}
```

Visual: horizontal bar, red fill for positive impact (bullish), green fill for negative impact (bearish). Width proportional to `|impact| / maxImpact`. Animates on mount (grows from 0 to final width).

---

## 10. Page 7 - Auth (Register / Login)

**Route**: `/login` and `/register`

### 10.1 Login Wireframe

```
+----------------------------------------------------------------+
|                                                                  |
|                     [MockTrade Logo]                             |
|                  "The AI Stock Market Game"                      |
|                                                                  |
|              +-----------------------------+                     |
|              |                             |                     |
|              |  Welcome Back               |                     |
|              |                             |                     |
|              |  Email                      |                     |
|              |  [________________________] |                     |
|              |                             |                     |
|              |  Password                   |                     |
|              |  [________________________] |                     |
|              |                             |                     |
|              |  [Forgot Password?]         |                     |
|              |                             |                     |
|              |  [      LOG IN        ]     |                     |
|              |                             |                     |
|              |  ---- or ----               |                     |
|              |                             |                     |
|              |  Don't have an account?     |                     |
|              |  [Sign Up]                  |                     |
|              |                             |                     |
|              +-----------------------------+                     |
|                                                                  |
|              Animated stock ticker in background                 |
|                                                                  |
+----------------------------------------------------------------+
```

### 10.2 Register Wireframe

```
+----------------------------------------------------------------+
|                                                                  |
|                     [MockTrade Logo]                             |
|                  "Join the Market"                               |
|                                                                  |
|              +-----------------------------+                     |
|              |                             |                     |
|              |  Create Account             |                     |
|              |                             |                     |
|              |  Step 1: Credentials        |                     |
|              |  Email                      |                     |
|              |  [________________________] |                     |
|              |  Password                   |                     |
|              |  [________________________] |                     |
|              |  Confirm Password           |                     |
|              |  [________________________] |                     |
|              |                             |                     |
|              |  Step 2: Your Identity      |                     |
|              |  Username (unique)          |                     |
|              |  [________________________] |                     |
|              |  Avatar                     |                     |
|              |  [Choose Avatar Grid]       |                     |
|              |  or [Upload Custom]         |                     |
|              |                             |                     |
|              |  [     CREATE ACCOUNT  ]    |                     |
|              |                             |                     |
|              |  Already have an account?   |                     |
|              |  [Log In]                   |                     |
|              |                             |                     |
|              +-----------------------------+                     |
|                                                                  |
+----------------------------------------------------------------+
```

### 10.3 Component Tree

```
LoginPage
+-- AuthBackground (subtle animated stock chart lines in background)
+-- AuthCard (centered, max-width 400px)
    +-- Logo
    +-- Tagline
    +-- LoginForm
    |   +-- EmailInput
    |   +-- PasswordInput
    |   +-- ForgotPasswordLink
    |   +-- SubmitButton ("Log In")
    +-- Divider ("or")
    +-- SignUpLink

RegisterPage
+-- AuthBackground
+-- AuthCard (centered, max-width 480px)
    +-- Logo
    +-- Tagline
    +-- ProgressIndicator (Step 1 of 2 / Step 2 of 2)
    +-- RegisterForm
    |   +-- Step1: CredentialsForm
    |   |   +-- EmailInput
    |   |   +-- PasswordInput (with strength meter)
    |   |   +-- ConfirmPasswordInput
    |   +-- Step2: IdentityForm
    |       +-- UsernameInput (with real-time uniqueness check)
    |       +-- AvatarPicker
    |           +-- PresetAvatarGrid (8-12 pre-made avatars)
    |           +-- UploadCustomButton
    +-- SubmitButton ("Create Account")
    +-- LoginLink
```

### 10.4 Key Component Definitions

#### `AvatarPicker`

```typescript
interface AvatarPickerProps {
  presets: Array<{ id: string; url: string }>
  selectedId: string | null
  customFile: File | null
  onSelectPreset: (id: string) => void
  onUploadCustom: (file: File) => void
}
```

Visual:
- Grid of circular avatar thumbnails (4 per row)
- Selected avatar has a blue ring border
- "Upload Custom" is a dashed-border circle with a "+" icon
- On mobile, the grid scrolls horizontally as a single row

#### `PasswordStrengthMeter`

```typescript
interface PasswordStrengthMeterProps {
  password: string
}
```

Visual: 4-segment bar below password input. Segments fill and color from red (weak) through amber (fair) to green (strong). Text label: "Weak" / "Fair" / "Good" / "Strong".

---

## 11. Page 8 - Admin Dashboard

**Route**: `/admin` (protected, admin-only)

### 11.1 Wireframe

```
+----------------------------------------------------------------+
| [Admin TopBar]  MockTrade Admin       [@admin_user] [Logout]    |
+----------------------------------------------------------------+
| SIDEBAR              |  MAIN CONTENT                             |
| - Dashboard          |                                           |
| - Stocks             |  DASHBOARD VIEW (default):                |
| - News               |  +----------+----------+----------+      |
| - Users              |  | Active   | Today    | Total    |      |
| - Seasons            |  | Users:42 | Trades:  | News:    |      |
| - Settings           |  |          | 1,204    | 89       |      |
|                      |  +----------+----------+----------+      |
|                      |                                           |
|                      |  STOCKS MANAGEMENT:                       |
|                      |  +-------------------------------------+ |
|                      |  | Ticker | Name     | Personality      | |
|                      |  | AAMC   | AI Meme  | The Meme Lord    | |
|                      |  |        |          | [Edit] [Toggle]  | |
|                      |  | BFLY   | Butter.. | The Steady Eddie | |
|                      |  |        |          | [Edit] [Toggle]  | |
|                      |  +-------------------------------------+ |
|                      |                                           |
|                      |  STOCK EDIT MODAL:                        |
|                      |  - Ticker, Name, Personality              |
|                      |  - Backstory (rich text)                  |
|                      |  - Avatar upload                          |
|                      |  - Volatility parameter (slider)          |
|                      |  - Base price                             |
|                      |  - Enable/Disable toggle                  |
|                      |                                           |
|                      |  PARAMETERS:                              |
|                      |  - Market cycle duration (open/close)     |
|                      |  - News generation frequency              |
|                      |  - Starting capital                       |
|                      |  - Season dates                           |
|                      |                                           |
+----------------------------------------------------------------+
```

### 11.2 Component Tree

```
AdminLayout
+-- AdminTopBar
|   +-- Logo ("MockTrade Admin")
|   +-- AdminUserMenu
+-- AdminSidebar
|   +-- NavItem ("Dashboard", icon: chart)
|   +-- NavItem ("Stocks", icon: trending-up)
|   +-- NavItem ("News", icon: newspaper)
|   +-- NavItem ("Users", icon: users)
|   +-- NavItem ("Seasons", icon: calendar)
|   +-- NavItem ("Settings", icon: gear)
+-- AdminContent (route-based)

AdminDashboard
+-- StatCard (x4: Active Users, Today Trades, Total News, Market Status)
+-- RecentActivityFeed
+-- SystemHealthIndicators

AdminStocksPage
+-- StocksTable
|   +-- StockRow (x N)
|       +-- Ticker, Name, Personality, CurrentPrice
|       +-- EditButton -> StockEditModal
|       +-- EnableToggle (switch)
+-- AddStockButton -> StockEditModal (empty)

StockEditModal
+-- TickerInput
+-- NameInput
+-- PersonalityInput
+-- BackstoryEditor (textarea or rich text)
+-- AvatarUpload
+-- VolatilitySlider (0.1 - 5.0)
+-- BasePriceInput
+-- EnableToggle
+-- SaveButton / CancelButton

AdminNewsPage
+-- NewsTable (all generated news, with edit/delete)
+-- ManualNewsCreator (admin can write custom news events)

AdminUsersPage
+-- UsersTable (username, email, assets, tier, status)
+-- UserDetailModal (view details, reset account, ban)

AdminSeasonsPage
+-- SeasonsList (past and current seasons)
+-- CreateSeasonForm (name, start date, end date)
+-- EndSeasonButton (triggers final ranking snapshot)

AdminSettingsPage
+-- MarketCycleDuration (open minutes, close seconds)
+-- NewsFrequency (news per market cycle)
+-- StartingCapital (default $1,000,000)
+-- AIModelSettings (temperature, creativity parameters)
```

---

## 12. Interaction Flows

### 12.1 New User Onboarding Flow

```
START
  |
  v
[Landing / Login Page]
  |
  |--> [Click "Sign Up"]
  |
  v
[Register Step 1: Email + Password]
  |
  |--> Inline validation (email format, password strength)
  |--> [Click "Next"]
  |
  v
[Register Step 2: Username + Avatar]
  |
  |--> Username uniqueness check (debounced, 500ms)
  |--> Avatar selection (preset or upload)
  |--> [Click "Create Account"]
  |
  v
[Loading... Creating account]
  |
  |--> Success
  |     |
  |     v
  |   [Welcome Modal: "You have $1,000,000. Start trading!"]
  |     |
  |     |--> [Click "Go to Market"]
  |     |
  |     v
  |   [Market Overview Page]
  |
  |--> Error (email taken, server error)
        |
        v
      [Show inline error, stay on form]
```

### 12.2 Trade Execution Flow

```
[User on Stock Detail Page or Portfolio Page]
  |
  |--> [Tap "BUY" or "SELL"]
  |
  v
[TradeModal opens]
  |
  |--> Check market status
  |     |
  |     |--> Market CLOSED: show warning, allow limit order only
  |     |--> Market OPEN: all order types available
  |
  |--> [Select order type: Market / Limit]
  |--> [Enter quantity (or use quick %)]
  |--> [If limit: enter limit price]
  |
  |--> Order summary auto-calculates:
  |     - Total cost (buy) or total revenue (sell)
  |     - Remaining balance (buy) or remaining shares (sell)
  |
  |--> Validation:
  |     - Buy: quantity * price <= available cash?
  |     - Sell: quantity <= held shares?
  |     - Quantity > 0?
  |
  |--> [Tap "Confirm"]
  |
  v
[Loading state: button shows spinner, disabled]
  |
  |--> API success
  |     |
  |     v
  |   [Success animation (checkmark)]
  |   [Toast: "Bought 250 AAMC @ $142.50"]
  |   [Modal auto-closes after 1.5s]
  |   [Portfolio data refreshes]
  |
  |--> API error
        |
        v
      [Error toast: "Insufficient funds" / "Market closed" / etc]
      [Modal stays open, user can retry or adjust]
```

### 12.3 Real-time Data Update Flow

```
[App mounts]
  |
  v
[WebSocketProvider establishes connection]
  |
  |--> Subscribe to channels:
  |     - market_status (open/close events)
  |     - prices (real-time price ticks)
  |     - news (new news events)
  |     - portfolio (user's portfolio changes)
  |     - notifications (achievements, rank changes)
  |
  v
[Incoming: price_update { ticker: "AAMC", price: 143.20, change: +0.70 }]
  |
  |--> Update StockCard on Market Overview (price animates: flash green/red briefly)
  |--> Update ChartSection on Stock Detail (append data point)
  |--> Update HoldingCard on Portfolio (recalculate P&L)
  |--> Update LeaderboardRow on Leaderboard (re-sort if needed)
  |
[Incoming: market_status { status: "closed" }]
  |
  |--> MarketClock switches to "CLOSED" mode
  |--> StickyTradeBar buttons become disabled (or "market order" disabled, limit still allowed)
  |--> Brief flash animation on TopBar
  |
[Incoming: news { id: "...", headline: "...", sentiment: "breaking" }]
  |
  |--> Prepend to NewsTicker
  |--> Toast notification: "Breaking News: ..."
  |--> If on Stock Detail for affected stock: prepend to news tab
  |
[Incoming: achievement { type: "earned", achievement: "Diamond Hands" }]
  |
  |--> Toast notification with achievement icon
  |--> Update profile achievements count
```

### 12.4 State Transition Table: Trade Button

| State         | Market Status | User Holdings | Button State                |
|---------------|--------------|---------------|-----------------------------|
| BUY enabled   | OPEN         | Any           | Red filled, active          |
| BUY enabled   | CLOSED       | Any           | Outlined, "Limit Only"      |
| BUY disabled  | OPEN         | Any, no cash  | Grayed out, "No Funds"      |
| SELL enabled  | OPEN         | > 0 shares    | Secondary filled, active    |
| SELL enabled  | CLOSED       | > 0 shares    | Outlined, "Limit Only"      |
| SELL disabled | Any          | 0 shares      | Grayed out, "No Holdings"   |

### 12.5 State Transition Table: Market Clock

| Current State | Trigger                      | Next State | UI Change                                        |
|---------------|------------------------------|------------|--------------------------------------------------|
| OPEN          | Timer reaches 0              | CLOSED     | Flash animation, badge turns gray, buttons update |
| CLOSED        | Timer reaches 0              | PRE_OPEN   | Badge turns amber, countdown flashes             |
| PRE_OPEN      | Timer reaches 0 (5s to open) | OPEN       | Badge turns green with pulse, "OPEN" appears     |

---

## 13. Responsive Strategy

### 13.1 Breakpoints

| Name     | Range            | Layout Behavior                                      |
|----------|-----------------|------------------------------------------------------|
| mobile   | < 640px (sm)    | Single column, bottom nav, compact cards             |
| tablet   | 640-1023px (md) | Two columns for cards, bottom nav, slightly larger   |
| desktop  | >= 1024px (lg)  | Multi-column, top nav, sidebars, full data tables    |

### 13.2 Component-Level Responsive Behavior

#### Market Overview
- **Mobile**: Single column stock list (not grid). Gainers/Losers as horizontal scroll chips above the list. News ticker reduced to single line.
- **Tablet**: 2-column stock card grid. Side panel moves above main content as horizontal sections.
- **Desktop**: 3-column stock card grid with right sidebar for gainers/losers/news.

#### Stock Detail
- **Mobile**: Full-width chart (100vw, no padding). Stats grid 2x4 (2 columns). Sticky trade bar above bottom nav. Tabs below chart.
- **Tablet**: Chart takes 100% width. Stats grid 4x2 (4 columns). Trade bar full width.
- **Desktop**: Chart takes ~70% width, order panel can optionally be a persistent right sidebar instead of modal.

#### Leaderboard
- **Mobile**: Podium simplified (stacked vertically or overlapping). Table becomes card list (one card per user).
- **Desktop**: Full table with all columns visible.

#### News
- **Mobile**: Single column cards, full width.
- **Desktop**: Cards can be wider with 2-column layout for the news list.

#### Admin
- **Mobile**: Admin sidebar collapses to hamburger menu. Tables become card lists.
- **Desktop**: Persistent sidebar + full data tables.

### 13.3 Touch Optimization

- All tappable elements: minimum 44x44px touch target
- Stock cards: entire card is tappable (navigate to detail)
- Swipe gestures:
  - Swipe left on a HoldingCard to reveal quick Sell action
  - Pull-to-refresh on all list pages
- Bottom sheet pattern for TradeModal on mobile (slides up from bottom, can drag to dismiss)

### 13.4 Performance on Mobile

- Charts: use `lightweight-charts` which has good mobile performance. Reduce data points on mobile (aggregate candles).
- Images: all avatars and icons use `next/image` with responsive sizing and lazy loading.
- Lists: virtualize long lists (react-window or tanstack-virtual) on Portfolio history and Leaderboard.
- WebSocket: same connection, but mobile may throttle price updates to 1/second instead of real-time.

---

## 14. Accessibility (A11y)

### 14.1 Semantic HTML Requirements

| Component         | HTML Element                                  |
|-------------------|-----------------------------------------------|
| Navigation tabs   | `<nav>` with `<ul>/<li>/<a>`                  |
| Stock card grid   | `<ul>` with `<li>` children                   |
| Data tables       | `<table>` with `<thead>`, `<tbody>`, `<th>`   |
| Trade modal       | `<dialog>` or `role="dialog"`                 |
| Price changes     | Wrapped in `<span>` with `aria-label`         |
| Charts            | `role="img"` with `aria-label` summary        |
| Tabs              | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| Market status     | `aria-live="polite"` for status changes       |

### 14.2 Color and Contrast

- Do NOT rely solely on red/green to indicate gain/loss. Always accompany with:
  - Arrow icons (up arrow for gain, down arrow for loss)
  - Plus/minus sign prefix on numbers (+12.3% vs -3.1%)
- All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Dark mode default palette already provides high contrast (light text on dark backgrounds)

### 14.3 Keyboard Navigation

- Tab order follows visual flow: TopBar -> Main Content -> Sidebar -> Footer/BottomNav
- All interactive elements (buttons, links, tabs, cards) are keyboard-focusable
- Focus ring: `focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2`
- Trade modal: focus trap when open, ESC to close, focus returns to trigger button on close
- Chart: keyboard shortcuts for time range switching (1/W/M/A keys when chart is focused)

### 14.4 Screen Reader Considerations

- Price updates: do NOT read every real-time tick. Use `aria-live="polite"` only on the user's portfolio total P&L. Individual stock prices update silently.
- Market status changes: announce via `aria-live="assertive"` when market opens/closes.
- Charts: provide `aria-label="AAMC stock price chart. Current price $142.50, up 12.45% today."`
- News sentiment: announce as text, e.g., `aria-label="Bullish news"` on sentiment tags.

### 14.5 Reduced Motion

- Respect `prefers-reduced-motion`:
  - Disable marquee animation on NewsTicker (show static list instead)
  - Disable sparkline animations
  - Disable pulse effects on market status badge
  - Disable achievement glow effects
  - Trade confirmation: no animation, just show the checkmark

---

## 15. Design Recommendations

### 15.1 Micro-interactions That Create Delight

1. **Price Flash**: When a stock price updates in real-time, the price text briefly flashes with a colored background (red flash for price increase, green flash for decrease). The flash fades in 300ms. This gives the UI a "live trading floor" feel.

2. **Trade Success Animation**: On successful trade confirmation, show a brief animation: the stock ticker flies from the trade modal into the portfolio tab icon in the bottom nav (or into the TopBar profile area). Use Framer Motion for this.

3. **Achievement Unlock**: Full-screen overlay for 1.5 seconds with the achievement icon, name, and a burst of particles matching the rarity color. Auto-dismisses but can be tapped to dismiss earlier.

4. **Rank Up Animation**: When a user crosses a tier threshold (e.g., Silver to Gold), show a shield transformation animation where the old tier badge morphs into the new one with appropriate particle effects.

5. **Market Open/Close Gong**: Optional (settings toggle): play a subtle sound effect when the market opens (bell/gong) and closes (softer chime). Disabled by default.

6. **News Sentiment Gradient**: Breaking news cards have a subtle animated gradient border (purple shifting shades). Bullish news cards have a warm tint. This helps users scan sentiment at a glance without reading.

### 15.2 Real-time Data Architecture Recommendation

Use a layered approach:
- **WebSocket**: for real-time price ticks, market status, and news alerts. Use Socket.IO or native WebSocket.
- **SWR / React Query**: for initial data fetching and cache. When WebSocket pushes an update, mutate the SWR cache directly to keep all components in sync.
- **Optimistic Updates**: for trade actions. Show the trade as "pending" immediately in the portfolio, revert if the API rejects it.

### 15.3 Chart Library Recommendation

Use **lightweight-charts** (by TradingView):
- Extremely performant (renders thousands of candles smoothly)
- Native support for candlestick and line charts
- Built-in crosshair and tooltip
- Small bundle size (~45KB gzipped)
- Great documentation and React wrapper available (`lightweight-charts` + custom React hook)

For the small sparkline charts on cards, use a simple SVG path rendered via a custom component (no library needed, ~20 lines of code).

For the portfolio asset trend chart, **Recharts** is suitable (AreaChart with gradient fill).

### 15.4 Animation Library

Use **Framer Motion** for:
- Page transitions (fade/slide between routes)
- Modal entry/exit (slide up from bottom on mobile, fade in on desktop)
- Achievement unlock overlay
- List item enter/exit animations (staggered)
- Number counting animations (asset values ticking up/down)

Keep animation durations short:
- Micro-interactions: 150-300ms
- Page transitions: 200-400ms
- Celebration animations: 1000-1500ms

### 15.5 State Management Recommendation

- **Global State** (Zustand or Jotai):
  - User session / auth state
  - Market status (open/closed, countdown)
  - Theme (dark/light)
  - WebSocket connection state

- **Server State** (SWR or TanStack Query):
  - Stock list and prices
  - Portfolio holdings
  - Leaderboard data
  - News feed
  - Trade history

- **Local Component State** (useState):
  - Form inputs
  - Modal open/close
  - Tab selection
  - Filter selections

### 15.6 Key Font and Icon Sources

- **Body Font**: Inter (Google Fonts), with Noto Sans SC for Chinese characters
- **Monospace (numbers)**: JetBrains Mono (Google Fonts) or the system default monospace
- **Icons**: Lucide React (consistent, lightweight, tree-shakeable). Heroicons is also acceptable.
- **Emojis in news tags**: Use actual emoji characters rather than icon libraries for sentiment labels on news cards, because they have built-in personality.

### 15.7 Dark/Light Mode Implementation

- Use Tailwind `darkMode: 'class'` strategy
- Store preference in localStorage, default to dark
- CSS variables for semantic colors (defined in `globals.css`):

```css
:root {
  --bg-primary: #F8F9FA;
  --bg-secondary: #FFFFFF;
  --text-primary: #111827;
  --color-up: #E84142;
  --color-down: #00B96B;
}

.dark {
  --bg-primary: #0B0E11;
  --bg-secondary: #121519;
  --text-primary: #E5E7EB;
  --color-up: #E84142;
  --color-down: #00B96B;
}
```

Note: Up/down colors stay the same in both modes (red up, green down) for consistency.

### 15.8 Empty States and Edge Cases

Every list/page must have a designed empty state:

| Page / Section         | Empty State Message                                | CTA                    |
|------------------------|----------------------------------------------------|------------------------|
| Portfolio Holdings     | "No holdings yet. Start trading!"                  | "Go to Market" button  |
| Pending Orders         | "No pending orders."                               | None                   |
| Trade History          | "No trades yet. Make your first move!"             | "Go to Market" button  |
| Watchlist              | "Your watchlist is empty. Star stocks to track them." | None                |
| News (filtered)        | "No news matching this filter."                    | "Clear Filters" button |
| Leaderboard (empty season) | "Season has not started yet."                  | None                   |
| Achievements           | "No achievements earned yet. Keep trading!"        | None                   |
| Search (no results)    | "No stocks found for 'xxx'."                       | None                   |

Each empty state should include a simple illustration (can be a stock-market-themed line drawing or icon) above the text.

### 15.9 Loading States

| Component            | Loading Pattern                                          |
|----------------------|----------------------------------------------------------|
| Stock cards grid     | Skeleton cards (gray pulsing rectangles matching card shape) |
| Chart                | Skeleton rectangle with faint grid lines                 |
| News feed            | Skeleton cards (3 stacked)                               |
| Leaderboard table    | Skeleton rows (8 rows)                                   |
| Portfolio holdings   | Skeleton cards (3 stacked)                               |
| Price values         | Short skeleton bar in place of number                    |
| Trade modal          | Spinner on the confirm button only                       |
| Full page load       | Centered spinner with "Loading..." text                  |

Use Tailwind `animate-pulse` on skeleton elements.

---

## 16. Component Library Summary

### 16.1 Shared / Atomic Components

| Component              | Used In                           | Props Summary                        |
|------------------------|-----------------------------------|--------------------------------------|
| `PriceDisplay`         | Everywhere                        | value, change, size, showSign        |
| `TierBadge`            | Leaderboard, Profile, Portfolio   | tier, size, showLabel                |
| `SentimentTag`         | News, Stock Detail                | sentiment, size                      |
| `Sparkline`            | Stock Card, Holding Card          | data[], color, width, height         |
| `UserAvatar`           | Leaderboard, Profile, Activity    | url, size, tierBorder                |
| `StatCard`             | Market Overview, Dashboard        | label, value, change, icon           |
| `SkeletonLoader`       | All pages                         | variant (card, row, text, chart)     |
| `EmptyState`           | All lists                         | icon, message, ctaLabel, ctaAction   |
| `Toast`                | Global                            | type, message, duration              |
| `Modal`                | Trade, Admin Edit                 | title, children, onClose             |
| `BottomSheet`          | Mobile Trade, Filters             | children, onClose, snapPoints        |
| `Tabs`                 | Multiple pages                    | tabs[], activeTab, onChange           |
| `FilterPill`           | News, Market                      | label, isActive, onToggle            |
| `SearchInput`          | TopBar                            | value, onChange, placeholder          |
| `MarketStatusBadge`    | TopBar, Stock Detail              | status, compact                      |
| `CountdownTimer`       | TopBar                            | targetTime, onComplete               |

### 16.2 Feature Components

| Component              | Page                              | Description                          |
|------------------------|-----------------------------------|--------------------------------------|
| `StockCard`            | Market Overview                   | Card with price, sparkline, personality |
| `NewsCard`             | News Center                       | Card with sentiment, headline, impact |
| `NewsCardWithImpact`   | Stock Detail                      | News card with stock impact bar      |
| `HoldingCard`          | Portfolio                         | Holding with P&L and quick trade     |
| `LeaderboardRow`       | Leaderboard                       | Rank, user, metrics, tier            |
| `PodiumSlot`           | Leaderboard                       | Top 3 hero display                   |
| `TradeModal`           | Global (triggered from multiple)  | Order entry with validation          |
| `ChartSection`         | Stock Detail                      | Interactive price chart              |
| `AssetTrendChart`      | Portfolio                         | Portfolio value over time            |
| `ImpactBar`            | News Detail                       | Visual bar for price impact          |
| `AchievementCard`      | Profile                           | Achievement with rarity and status   |
| `ActivityItem`         | Profile                           | Activity feed entry                  |
| `AvatarPicker`         | Register                          | Avatar selection grid                |
| `NewsTicker`           | Market Overview                   | Auto-scrolling headline marquee      |

### 16.3 Layout Components

| Component              | Description                                             |
|------------------------|---------------------------------------------------------|
| `RootLayout`           | Providers, TopBar, BottomNav, MainContent slot          |
| `AdminLayout`          | Admin sidebar, admin TopBar, content slot               |
| `AuthLayout`           | Centered card layout with background animation          |
| `PageContainer`        | Max-width wrapper with standard padding                 |
| `TwoColumnLayout`      | Main + sidebar layout (responsive)                      |
| `TopBar`               | Global top navigation bar                               |
| `BottomNav`            | Mobile bottom tab navigation                            |
| `StickyTradeBar`       | Fixed bottom trade action bar on Stock Detail           |

---

## 17. Developer Handoff Checklist

### 17.1 Must-Have Before Development

- [x] Complete component tree for all 8 pages
- [x] Props interfaces (TypeScript) for all major components
- [x] Responsive breakpoint strategy
- [x] Interaction flow diagrams (trade, onboarding, real-time updates)
- [x] State transition tables for key interactive elements
- [x] Color palette with semantic naming
- [x] Typography scale
- [x] Spacing system

### 17.2 Implementation Priority Order

**Phase 1 - Core Loop** (Week 1-2):
1. Auth pages (Register / Login)
2. Global layout (TopBar, BottomNav, MarketClock)
3. Market Overview (stock list, basic cards)
4. Stock Detail (chart, price, trade modal)
5. WebSocket integration for real-time prices

**Phase 2 - Trading** (Week 3):
1. Trade Modal (buy/sell flow)
2. Portfolio page (holdings, P&L)
3. Pending orders and trade history

**Phase 3 - Social & Engagement** (Week 4):
1. Leaderboard page
2. Profile page (own and others)
3. News Center (list + detail)
4. Achievement system UI

**Phase 4 - Polish** (Week 5):
1. Admin dashboard
2. Animations and micro-interactions
3. Empty states and loading skeletons
4. Accessibility audit
5. Dark/light mode refinement
6. Performance optimization (virtualization, lazy loading)

### 17.3 Key Technical Dependencies

| Dependency               | Purpose                          | Install                          |
|--------------------------|----------------------------------|----------------------------------|
| `tailwindcss`            | Styling                          | Already in Next.js default       |
| `lightweight-charts`     | Stock price charts               | `npm i lightweight-charts`       |
| `recharts`               | Portfolio area charts            | `npm i recharts`                 |
| `framer-motion`          | Animations                       | `npm i framer-motion`            |
| `lucide-react`           | Icons                            | `npm i lucide-react`             |
| `swr` or `@tanstack/react-query` | Data fetching + cache    | `npm i swr`                      |
| `zustand`                | Global client state              | `npm i zustand`                  |
| `socket.io-client`       | WebSocket (if using Socket.IO)   | `npm i socket.io-client`         |
| `react-hook-form`        | Form management                  | `npm i react-hook-form`          |
| `zod`                    | Form validation                  | `npm i zod`                      |
| `next-themes`            | Dark/light mode                  | `npm i next-themes`              |

### 17.4 File Structure Suggestion

```
src/
+-- app/                           # Next.js App Router
|   +-- (auth)/
|   |   +-- login/page.tsx
|   |   +-- register/page.tsx
|   +-- (main)/
|   |   +-- layout.tsx             # TopBar + BottomNav shell
|   |   +-- page.tsx               # Market Overview (/)
|   |   +-- stock/[ticker]/page.tsx
|   |   +-- portfolio/page.tsx
|   |   +-- leaderboard/page.tsx
|   |   +-- news/page.tsx
|   |   +-- news/[id]/page.tsx
|   |   +-- profile/page.tsx
|   |   +-- profile/[userId]/page.tsx
|   +-- admin/
|       +-- layout.tsx             # Admin layout
|       +-- page.tsx               # Admin dashboard
|       +-- stocks/page.tsx
|       +-- news/page.tsx
|       +-- users/page.tsx
|       +-- seasons/page.tsx
|       +-- settings/page.tsx
+-- components/
|   +-- shared/                    # Atomic / shared components
|   |   +-- PriceDisplay.tsx
|   |   +-- TierBadge.tsx
|   |   +-- SentimentTag.tsx
|   |   +-- Sparkline.tsx
|   |   +-- UserAvatar.tsx
|   |   +-- StatCard.tsx
|   |   +-- SkeletonLoader.tsx
|   |   +-- EmptyState.tsx
|   |   +-- Toast.tsx
|   |   +-- Modal.tsx
|   |   +-- BottomSheet.tsx
|   |   +-- Tabs.tsx
|   |   +-- FilterPill.tsx
|   |   +-- SearchInput.tsx
|   |   +-- MarketStatusBadge.tsx
|   |   +-- CountdownTimer.tsx
|   +-- layout/                    # Layout components
|   |   +-- TopBar.tsx
|   |   +-- BottomNav.tsx
|   |   +-- PageContainer.tsx
|   |   +-- TwoColumnLayout.tsx
|   |   +-- StickyTradeBar.tsx
|   +-- market/                    # Market page components
|   |   +-- StockCard.tsx
|   |   +-- StockGrid.tsx
|   |   +-- StockFilterTabs.tsx
|   |   +-- NewsTicker.tsx
|   |   +-- MarketSummaryBar.tsx
|   |   +-- RankingMiniCard.tsx
|   +-- stock-detail/              # Stock detail components
|   |   +-- StockDetailHeader.tsx
|   |   +-- PriceHero.tsx
|   |   +-- ChartSection.tsx
|   |   +-- StatsGrid.tsx
|   |   +-- NewsCardWithImpact.tsx
|   +-- trade/                     # Trading components
|   |   +-- TradeModal.tsx
|   |   +-- OrderTypeSelector.tsx
|   |   +-- QuantityInput.tsx
|   |   +-- OrderSummary.tsx
|   +-- portfolio/                 # Portfolio components
|   |   +-- PortfolioHeader.tsx
|   |   +-- AssetTrendChart.tsx
|   |   +-- AssetBreakdownBar.tsx
|   |   +-- HoldingCard.tsx
|   |   +-- PendingOrderRow.tsx
|   |   +-- TradeHistoryRow.tsx
|   +-- leaderboard/               # Leaderboard components
|   |   +-- TopThreePodium.tsx
|   |   +-- PodiumSlot.tsx
|   |   +-- LeaderboardRow.tsx
|   |   +-- MyRankRow.tsx
|   +-- profile/                   # Profile components
|   |   +-- ProfileHeader.tsx
|   |   +-- StatsDashboard.tsx
|   |   +-- AchievementCard.tsx
|   |   +-- AchievementsPreview.tsx
|   |   +-- ActivityItem.tsx
|   +-- news/                      # News components
|   |   +-- NewsCard.tsx
|   |   +-- NewsFilterBar.tsx
|   |   +-- ImpactBar.tsx
|   +-- auth/                      # Auth components
|   |   +-- LoginForm.tsx
|   |   +-- RegisterForm.tsx
|   |   +-- AvatarPicker.tsx
|   |   +-- PasswordStrengthMeter.tsx
|   +-- admin/                     # Admin components
|       +-- AdminSidebar.tsx
|       +-- StockEditModal.tsx
|       +-- StocksTable.tsx
|       +-- UsersTable.tsx
+-- hooks/                         # Custom hooks
|   +-- useMarketStatus.ts         # market open/close state
|   +-- useStockPrice.ts           # real-time price for a ticker
|   +-- usePortfolio.ts            # user's holdings
|   +-- useWebSocket.ts            # WebSocket connection
|   +-- useCountdown.ts            # countdown timer logic
|   +-- useTheme.ts                # dark/light mode
+-- stores/                        # Zustand stores
|   +-- useAuthStore.ts
|   +-- useMarketStore.ts
|   +-- useTradeStore.ts
+-- lib/                           # Utilities
|   +-- api.ts                     # API client
|   +-- websocket.ts               # WebSocket client
|   +-- formatters.ts              # Price, date, number formatters
|   +-- validators.ts              # Form validation schemas (zod)
|   +-- constants.ts               # Colors, breakpoints, tier thresholds
+-- styles/
    +-- globals.css                # CSS variables, Tailwind base
```

---

*End of UI/UX Design Document*
