# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Deployment
- Fixed source-build Docker deployment so the `web` container explicitly binds Next standalone to `0.0.0.0` instead of inheriting the container hostname
- Changed `web` and `nginx` health checks from `localhost` to `127.0.0.1` to avoid loopback resolution issues inside Alpine containers
- Fixed nginx image packaging by copying the full top-level config to `/etc/nginx/nginx.conf` instead of `conf.d/default.conf`
- Re-verified local deployment with `docker compose up -d --build`, `docker compose ps`, `curl -I http://localhost:9500`, and `curl http://localhost:9500/api/health`

### Documentation
- Refreshed `README.md` and `README_EN.md` with a documentation map, seed/bootstrap instructions, admin bootstrap notes, and post-deploy verification commands
- Synced project docs with the current default entrypoint (`http://localhost:9500`) and the latest verified deployment flow
- Added the latest deployment-fix note to `docs/progress.md` for future handoff continuity

## [0.1.2] - 2026-03-31

### Security
- JWT default secret now refuses to start in production (`NODE_ENV=production`), logs a warning in development
- Enabled `@nestjs/throttler` rate limiting: global 100 req/min, auth endpoints 5 req/min
- Added nginx security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- WebSocket CORS changed from wildcard `*` to `CORS_ORIGIN` env var
- WebSocket `subscribe:user` channel now requires JWT authentication — clients can only subscribe to their own events

### Backend Robustness
- Added `cleanup()` / `resetAll()` to TrendEngine to prevent memory leaks from inactive stocks
- KLineService `JSON.parse` wrapped in try-catch to handle corrupted Redis cache
- AdminController `parseInt` now guards against NaN for pagination params
- `GET /api/market/stocks/:id` returns HTTP 404 instead of 200 with error body when stock not found
- Standardized all backend error messages to Chinese (trade, auth, social — 12 locations)
- Database connection pool configured: max=20, idle timeout 30s, connection timeout 5s

### Charts (Chinese Stock Platform Style)
- Time-sharing chart refactored to use `BaselineSeries` with dual-color fill above/below previous close price
- Added VWAP (volume-weighted average price) line to time-sharing chart — the signature element of Chinese stock platforms
- Removed MA5/MA20 from time-sharing mode (only shown on candlestick view, matching domestic platform conventions)
- Baseline changed from "first bar open" to actual `prevClosePrice` across both chart modes
- Stats panel differentiated: time-sharing shows latest/change/change%/VWAP/amplitude; candlestick shows latest/change/change%/prev-close/amplitude
- Legend adapts to chart mode: time-sharing shows VWAP + prev-close; candlestick shows MA5 + MA20 + prev-close

### Frontend Polish
- API client now has 30-second timeout
- WebSocket reconnection with exponential backoff (up to 20 attempts, max 30s delay) + auth token in handshake
- Replaced 10 silent `.catch(() => {})` calls with `console.warn` logging
- Portfolio page now shows loading state while fetching data
- Added ARIA accessibility attributes: `aria-expanded`, `aria-label`, `aria-current`, `role="dialog"`, `aria-modal`

### Infrastructure
- Default host ports changed to avoid common conflicts: nginx 9500, web 9510, server 9511, postgres 9532, redis 9579
- All ports configurable via env vars: `NGINX_PORT`, `WEB_PORT`, `SERVER_PORT`, `POSTGRES_PORT`, `REDIS_PORT`
- Added Docker health checks for server, web, and nginx containers
- nginx now waits for `service_healthy` condition on web and server before starting
- Added `worker_processes auto` and `worker_connections 2048` to nginx config
- Added proxy timeouts (connect 30s, send 60s, read 60s) to nginx

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
