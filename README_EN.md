# MockTrade — Virtual Stock Exchange

An AI-driven virtual stock trading simulator. Players trade 25 virtual stocks in a simulated market, making decisions based on AI-generated news to compete for seasonal rankings.

> Current status (2026-03-31): both source-build Docker Compose and Docker Hub image deployments have been documented and verified. The default entrypoint is `http://localhost:9500`, and the health endpoint is `http://localhost:9500/api/health`.

## 📚 Documentation Map

- [`docs/progress.md`](docs/progress.md): development progress, phase summaries, and recent fixes
- [`docs/handoff-2026-03-28-latest.md`](docs/handoff-2026-03-28-latest.md): detailed handoff notes and latest verification results
- [`docs/wbs-plan.md`](docs/wbs-plan.md): full WBS and scope breakdown
- [`docs/ui-design.md`](docs/ui-design.md): frontend visual and interaction specification
- [`CLAUDE.md`](CLAUDE.md): project conventions, architecture summary, and common commands

## ✨ Key Features

- **AI-Powered News Engine** — Uses OpenAI / Claude to generate market news that dynamically impacts stock prices
- **Real-Time Market Data** — WebSocket-driven price updates, K-line charts with `tick / 1m / 5m / 15m`
- **Chinese Stock Platform Style Charts** — Time-sharing chart with dual-color baseline (prev close), VWAP line; candlestick with MA5/MA20
- **Full Trading Loop** — Market orders, limit orders with auto-matching, commissions, and position management
- **Seasonal Competition** — Independent leaderboards with total assets & return rate rankings
- **Multi-Layer Market Engine** — Market regime (bull/bear/neutral) + sector rotation + stock personality profiles + trend memory
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

# Seed stock data on a fresh DB
pnpm seed
```

> Local development connects directly to `localhost:3001` (backend) / `localhost:3000` (frontend), without nginx.

### Docker Deployment

```bash
# Create .env (change default passwords!)
cp .env.production.example .env

# Start all services
docker compose up -d --build

# Seed stock data on first boot
docker compose exec server node dist/database/seeds/run-seed.js

# Verify
docker compose ps
curl http://localhost:9500/api/health
```

Entrypoints:

- App: `http://localhost:9500`
- Health: `http://localhost:9500/api/health`
- Frontend direct debug: `http://localhost:9510`
- Backend direct debug: `http://localhost:9511/api/health`

> Default port mapping (override via `.env`):
>
> | Service | Host Port | Env Var |
> |---------|-----------|---------|
> | nginx (entry) | 9500 | `NGINX_PORT` |
> | web (Next.js) | 9510 | `WEB_PORT` |
> | server (NestJS) | 9511 | `SERVER_PORT` |
> | PostgreSQL | 9532 | `POSTGRES_PORT` |
> | Redis | 9579 | `REDIS_PORT` |

Notes:

- This source-build deployment path has been verified end-to-end: `postgres / redis / server / web / nginx` all reach `healthy`.
- The `web` container now health-checks `127.0.0.1:3000` and explicitly binds to `0.0.0.0`, avoiding the common Next standalone issue where it inherits a random container hostname.
- The nginx image now ships the full [`docker/nginx/nginx.conf`](docker/nginx/nginx.conf) as its main config, so `/api`, `/socket.io/`, and `/uploads/` are routed consistently.
- If the whole app is accessed from `http://localhost:9500`, the recommended setup is to leave `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` empty. The current build also treats bare local values like `http://localhost` as placeholders and resolves them against the active browser origin, so the homepage does not get stuck on the market loading state.

### Docker Hub Pull-Based Deployment (Recommended for VPS)

Published images:

- `drleomeng/mocktrade-server:v0.1.1`
- `drleomeng/mocktrade-web:v0.1.1`
- `drleomeng/mocktrade-nginx:v0.1.1`
- `latest` is also maintained
- Verified platforms right now: `mocktrade-server` is published for `linux/amd64`, while `mocktrade-web` and `mocktrade-nginx` are available for both `linux/amd64` and `linux/arm64`

```bash
# 1) Prepare environment variables
cp .env.production.example .env

# 2) Pull prebuilt images
docker compose -f docker-compose.dockerhub.yml pull

# 3) Start services
docker compose -f docker-compose.dockerhub.yml up -d

# 4) Seed data on first boot
docker compose -f docker-compose.dockerhub.yml exec server node dist/database/seeds/run-seed.js

# 5) Verify
docker compose -f docker-compose.dockerhub.yml ps
curl http://localhost:9500/api/health
```

Notes:

- `docker-compose.dockerhub.yml` is image-only, so your VPS does not need Node.js, pnpm, or local builds.
- By default it uses the stable `v0.1.1` image tags from `.env`. If you want rolling updates, change the `MOCKTRADE_*_IMAGE` values to `:latest`.
- If frontend and API are served behind the same nginx domain, you can leave `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` empty. The frontend will automatically use same-origin `/api` and `/socket.io/`.
- Public entrypoint is `http://YOUR_VPS_IP:9500` (default, configurable via `NGINX_PORT`), with `/api`, `/socket.io/`, and `/uploads/` routed by nginx.
- If you deploy from source, `docker-compose.yml` now also supports `POSTGRES_IMAGE / REDIS_IMAGE / NODE_IMAGE / NGINX_IMAGE / PNPM_REGISTRY`, so China-based servers can switch both Docker image sources and the pnpm registry.

### Domestic Mirror Sources for China-based VPS

Option 1: override image addresses in `.env`

```bash
POSTGRES_IMAGE=docker.m.daocloud.io/library/postgres:16-alpine
REDIS_IMAGE=docker.m.daocloud.io/library/redis:7-alpine
NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine
NGINX_IMAGE=docker.m.daocloud.io/library/nginx:alpine
PNPM_REGISTRY=https://registry.npmmirror.com
MOCKTRADE_SERVER_IMAGE=docker.m.daocloud.io/drleomeng/mocktrade-server:v0.1.1
MOCKTRADE_WEB_IMAGE=docker.m.daocloud.io/drleomeng/mocktrade-web:v0.1.1
MOCKTRADE_NGINX_IMAGE=docker.m.daocloud.io/drleomeng/mocktrade-nginx:v0.1.1
```

Option 2: configure Docker registry mirrors on the VPS host

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://dockerhub.icu"
  ]
}
```

Then apply it:

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://dockerhub.icu"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

Notes:

- Option 1 is the most direct and works for both pull-based deployment and source builds with `docker compose up -d --build`.
- Option 2 accelerates Docker pulls system-wide, including PostgreSQL, Redis, Node, and Nginx images.
- `PNPM_REGISTRY` only affects source-build installs during `pnpm install`; you can ignore it if your VPS only pulls prebuilt images.
- Mirror availability changes over time. If a mirror cannot serve `drleomeng/*`, switch that image back to the original Docker Hub address or rely on `registry-mirrors` only.

### Publishing Images to Docker Hub (For Developers)

If you have modified the code and wish to push new images to Docker Hub, this project provides two methods:
1. **Automated (GitHub Actions)**: Simply configure `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in your repository's GitHub Secrets. Pushing to the `main` branch or creating a `v*.*.*` tag will automatically build and push the `latest` and respective version-tagged images.
2. **Manual (Script)**: Run `./scripts/docker-push.sh <optional:version>` in your local terminal. The script will automatically build the `server`, `web`, and `nginx` images based on the files in `docker/` and push them to your Docker Hub namespace.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_PASSWORD` | ✅ | PostgreSQL password |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `ADMIN_EMAIL` | ✅ | Admin registration email |
| `AI_API_KEY` | Optional | AI service API key (falls back to template news if absent) |
| `AI_API_BASE` | Optional | AI service base URL |
| `AI_MODEL` | Optional | AI model name |
| `NGINX_PORT` | Optional | nginx host port, defaults to `9500` |
| `WEB_PORT` | Optional | Next.js host port, defaults to `9510` |
| `SERVER_PORT` | Optional | NestJS host port, defaults to `9511` |
| `POSTGRES_PORT` | Optional | PostgreSQL host port, defaults to `9532` |
| `REDIS_PORT` | Optional | Redis host port, defaults to `9579` |
| `POSTGRES_IMAGE` | Optional | PostgreSQL image reference, can point to a domestic mirror |
| `REDIS_IMAGE` | Optional | Redis image reference, can point to a domestic mirror |
| `NODE_IMAGE` | Optional | Base Node image used for source builds, defaults to `node:20-alpine` |
| `NGINX_IMAGE` | Optional | Base nginx image used for source builds, defaults to `nginx:alpine` |
| `PNPM_REGISTRY` | Optional | pnpm registry used during source builds, defaults to `https://registry.npmmirror.com` |
| `MOCKTRADE_SERVER_IMAGE` | Optional | Backend image reference, defaults to `drleomeng/mocktrade-server:v0.1.1` |
| `MOCKTRADE_WEB_IMAGE` | Optional | Frontend image reference, defaults to `drleomeng/mocktrade-web:v0.1.1` |
| `MOCKTRADE_NGINX_IMAGE` | Optional | nginx image reference, defaults to `drleomeng/mocktrade-nginx:v0.1.1` |

## 👤 Admin Bootstrap

- During registration, if the user email exactly matches `ADMIN_EMAIL` in `.env`, that account is created with the `admin` role.
- Recommended flow: set `ADMIN_EMAIL` first, then register that account through the app.
- After registration, the top-right user menu will expose the `/admin` entry.

## ✅ Recommended Verification Commands

After a source-build Docker deployment, run at least this set:

```bash
docker compose ps
curl http://localhost:9500/api/health
curl http://localhost:9500/api/market/status
curl -I http://localhost:9500
```

Expected results:

- all 5 services show `healthy` in `docker compose ps`
- `/api/health` returns `{"redis":"ok","database":"ok","status":"healthy"}`
- `/api/market/status` returns market status plus countdown metadata
- homepage responds with `HTTP/1.1 200 OK`

## 📋 Feature Overview

### Market System
- 25 virtual stocks with unique personas
- Market regime engine: auto-rotates bull / neutral / bear phases with sector rotation
- Stock personality profiles: steady stocks trend slowly, high-beta stocks ride roller coasters
- Brownian motion + mean-reversion + trend memory price engine
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
