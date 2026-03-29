# MockTrade — Virtual Stock Exchange

An AI-driven virtual stock trading simulator. Players trade 25 virtual stocks in a simulated market, making decisions based on AI-generated news to compete for seasonal rankings.

## ✨ Key Features

- **AI-Powered News Engine** — Uses OpenAI / Claude to generate market news that dynamically impacts stock prices
- **Real-Time Market Data** — WebSocket-driven price updates, K-line charts with 1m / 1d / 1w / 1M resolutions
- **Full Trading Loop** — Market orders, limit orders with auto-matching, commissions, and position management
- **Seasonal Competition** — Independent leaderboards with total assets & return rate rankings
- **Premium Design** — Apple-inspired minimal aesthetics, glassmorphism, light/dark themes, micro-animations

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 · React 18 · Zustand · Socket.IO Client · CSS Variables |
| **Backend** | NestJS 10 · TypeORM · Bull (Redis Queue) · Passport JWT |
| **Database** | PostgreSQL 16 · Redis 7 |
| **AI** | OpenAI / Claude compatible APIs |
| **Deployment** | Docker Compose · Nginx |

## 📁 Project Structure

```
MockTrade/
├── apps/
│   ├── server/          # NestJS backend
│   │   └── src/modules/ # ai, market, news, trade, leaderboard, admin ...
│   └── web/             # Next.js frontend
│       └── src/
│           ├── app/     # Page routes
│           ├── components/  # Shared components
│           ├── stores/  # Zustand state management
│           └── lib/     # Utility functions
├── packages/
│   └── shared/          # Types, constants, utilities
├── docker/              # Dockerfiles and Nginx config
└── docker-compose.yml   # Production orchestration
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- PostgreSQL 16 + Redis 7 (or Docker)

### Local Development

```bash
# Install dependencies
pnpm install

# Start databases (if needed)
docker compose -f docker-compose.dev.yml up -d

# Start dev servers
pnpm dev

# Or run individually
pnpm dev:server   # Backend: http://localhost:3001
pnpm dev:web      # Frontend: http://localhost:3000
```

### Docker Deployment

```bash
# Create .env (change default passwords!)
cp .env.example .env

# Start all services
docker compose up -d --build

# Open
open http://localhost
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_PASSWORD` | ✅ | PostgreSQL password |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `ADMIN_EMAIL` | ✅ | Admin registration email |
| `AI_API_KEY` | Optional | AI service API key (falls back to template news if absent) |
| `AI_API_BASE` | Optional | AI service base URL |
| `AI_MODEL` | Optional | AI model name |

## 📋 Feature Overview

### Market System
- 25 virtual stocks with unique personas
- Brownian motion + mean-reversion price engine
- Event impact curves affecting prices
- Automatic trading session rotation (open / close)

### Trading System
- Market orders / Limit orders
- Auto-matching + order expiration
- Commission calculation + fund freezing
- Position management + P&L tracking

### News System
- AI two-phase publishing: event clue → day-after review
- Bull queue scheduling with priority ordering
- Sentiment analysis tags
- Homepage news ticker + WebSocket push notifications

### Leaderboard
- Real-time updates within season
- Total assets / return rate dual rankings
- Async refresh after each trade

### Admin Dashboard
- Market pause / resume / duration control
- AI configuration + connection test + circuit breaker reset
- News generation / publishing / manual events
- Queue observability panel
- User management + site-wide statistics
- Price color scheme toggle (red-up / green-up)

## 📄 License

MIT
