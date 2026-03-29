# Changelog

All notable changes to this project are documented in this file.

## [0.1.1] - 2026-03-29

### Deployment
- Added `docker-compose.dockerhub.yml` for pull-based VPS deployment without local source builds
- Added `docker/nginx.Dockerfile` so nginx can be shipped as a prebuilt image instead of relying on a bind-mounted config
- Published Docker Hub distribution flow in both Chinese and English READMEs
- Added per-image overrides plus documented Docker registry mirrors for China-based VPS deployments
- Added `NODE_IMAGE`, `NGINX_IMAGE`, and `PNPM_REGISTRY` support so source builds can also use domestic mirrors
- Slimmed the backend runtime image by deploying production-only dependencies instead of copying the full workspace `node_modules`

### Frontend
- Default frontend API, WebSocket, and asset URLs now fall back to same-origin when `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are unset
- Fixed `docker/web.Dockerfile` to actually forward `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` build args into the Next.js build

## [0.1.0] - 2026-03-29

### 🎉 Initial Release

#### Market Engine
- 25 virtual stocks with unique personas and backstories
- Brownian motion + mean-reversion price engine with configurable volatility
- Event impact curve system for news-driven price changes
- Automatic open/close trading session rotation with countdown

#### Trading System
- Market orders (instant execution) and limit orders (auto-matching)
- Commission calculation (0.1% fee rate)
- Position management with average cost tracking
- Fund freezing for pending limit orders
- Limit order expiration on market close

#### AI News Engine
- OpenAI / Claude compatible API integration
- Two-phase news publishing: event clue → day-after review
- Bull queue-based scheduling with priority ordering
- 3-stage JSON repair pipeline for robust AI output parsing
- Fallback template generator when AI is unavailable
- Manual event creation with custom parameters

#### AI Reliability
- Request timeout with configurable duration
- Automatic retry with exponential backoff
- Circuit breaker (auto-open after 5 consecutive failures)
- Redis-persisted health state monitoring
- Admin-triggered manual health reset

#### Leaderboard
- Redis-backed real-time leaderboard with sorted sets
- Total assets & return rate dual-dimension rankings
- Automatic refresh after each trade execution
- Season-scoped rankings with reset on new season

#### Admin Dashboard
- System overview: market status, connections, cycle count, AI health
- Market control: pause/resume, duration configuration
- News management: generate, publish, manual events
- AI settings: provider, model, API key, connection testing
- Display settings: price color scheme (red-up / green-up)
- Queue observability: buffer + scheduler waiting/delayed/completed/failed stats
- User management: paginated user list with role display
- Site statistics: total users, orders, filled volume

#### Frontend
- Apple-inspired minimal design with glassmorphism effects
- Light/dark theme system via CSS custom properties
- Real-time WebSocket price updates with Socket.IO
- K-line charts with 1m/1d/1w/1M resolution switching
- Homepage news ticker (infinite scroll)
- Sparkline mini charts on stock cards
- WebSocket news push notifications (Toast)
- Responsive layout with bottom navigation for mobile
- Avatar upload with nginx static serving
- Chinese-localized UI throughout

#### Infrastructure
- Monorepo with pnpm workspaces (apps/server, apps/web, packages/shared)
- Docker Compose production deployment (5 containers)
- Nginx reverse proxy with WebSocket support
- PostgreSQL 16 with TypeORM migrations
- Redis 7 for caching, queues, and leaderboard
- JWT-based authentication with role-based access control

### Bug Fixes (Pre-release)
- Fixed season creation time validation edge cases
- Fixed old season settlement flow on new season creation
- Fixed leaderboard not refreshing on trade execution
- Fixed limit order expiration on market close
- Fixed avatar upload path and nginx volume mapping
- Fixed AI JSON parsing for edge-case outputs with repair pipeline
- Fixed WebSocket reconnection handling
- Fixed price color mode persistence across themes
- Fixed automatic news publishing getting stuck after server restart because Bull scheduler job IDs collided with retained completed jobs
