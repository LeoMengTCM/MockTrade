# MockTrade — 虚拟交易所

一款基于 AI 驱动新闻的虚拟股票交易模拟平台。玩家在仿真市场中买卖 25 只虚拟股票，通过阅读 AI 生成的新闻做出交易决策，争夺赛季排名。

> 当前状态（2026-03-31）：源码 Docker Compose 与 Docker Hub 拉镜像两种部署方式都已整理并验证。默认入口为 `http://localhost:9500`，健康检查接口为 `http://localhost:9500/api/health`。

## 📚 文档索引

- [`docs/progress.md`](docs/progress.md)：开发进度、阶段总结、最近修复记录
- [`docs/handoff-2026-03-28-latest.md`](docs/handoff-2026-03-28-latest.md)：详细交接文档与最近验证结果
- [`docs/wbs-plan.md`](docs/wbs-plan.md)：完整 WBS 与范围拆解
- [`docs/ui-design.md`](docs/ui-design.md)：前端视觉与交互规范
- [`CLAUDE.md`](CLAUDE.md)：项目开发约束、架构摘要与常用命令

## ✨ 核心特色

- **AI 驱动新闻引擎** — 使用 OpenAI / Claude 生成市场新闻，新闻发布后自动影响股价走势
- **实时行情系统** — WebSocket 推送价格变动，K 线图支持 `逐跳 / 1分 / 5分 / 15分`
- **国内炒股平台风格图表** — 分时图双色面积（昨收线上下分色）+ 均价线，K 线带 MA5/MA20
- **完整交易闭环** — 市价单即时成交、限价单自动撮合、手续费与持仓管理
- **赛季制竞技** — 独立排行榜，支持资产与收益率双维度排名
- **行情分层引擎** — 市场阶段（牛/熊/震荡）+ 板块轮动 + 个股性格画像 + 趋势记忆
- **Apple 级视觉** — 极简设计、毛玻璃效果、深浅主题切换、微动画

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| **前端** | Next.js 14 · React 18 · Zustand · Socket.IO Client · CSS Variables |
| **后端** | NestJS 10 · TypeORM · Bull (Redis Queue) · Passport JWT |
| **数据库** | PostgreSQL 16 · Redis 7 |
| **AI** | OpenAI / Claude 兼容接口 |
| **部署** | Docker Compose · Nginx |

## 📁 项目结构

```
MockTrade/
├── apps/
│   ├── server/          # NestJS 后端
│   │   └── src/modules/ # ai, market, news, trade, leaderboard, admin ...
│   └── web/             # Next.js 前端
│       └── src/
│           ├── app/     # 页面路由
│           ├── components/  # 共享组件
│           ├── stores/  # Zustand 状态管理
│           └── lib/     # 工具函数
├── packages/
│   └── shared/          # 类型、常量、工具函数
├── docker/              # Dockerfile 和 Nginx 配置
└── docker-compose.yml   # 生产编排
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 8
- PostgreSQL 16 + Redis 7（或使用 Docker）

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动数据库（如需要）
docker compose -f docker-compose.dev.yml up -d

# 启动开发服务
pnpm dev

# 分别启动
pnpm dev:server   # 后端：http://localhost:3001
pnpm dev:web      # 前端：http://localhost:3000

# 首次初始化股票种子（fresh DB 需要）
pnpm seed
```

> 本地开发直连 `localhost:3001` (后端) / `localhost:3000` (前端)，不走 nginx。

### Docker 部署

```bash
# 创建 .env（务必修改默认密码）
cp .env.production.example .env

# 启动全部服务
docker compose up -d --build

# 首次初始化股票种子（fresh DB 需要）
docker compose exec server node dist/database/seeds/run-seed.js

# 验证
docker compose ps
curl http://localhost:9500/api/health
```

访问入口：

- 首页：`http://localhost:9500`
- 健康检查：`http://localhost:9500/api/health`
- 前端直连调试：`http://localhost:9510`
- 后端直连调试：`http://localhost:9511/api/health`

> 默认端口映射（可通过 `.env` 覆盖）：
>
> | 服务 | 宿主机端口 | 环境变量 |
> |------|-----------|---------|
> | nginx (入口) | 9500 | `NGINX_PORT` |
> | web (Next.js) | 9510 | `WEB_PORT` |
> | server (NestJS) | 9511 | `SERVER_PORT` |
> | PostgreSQL | 9532 | `POSTGRES_PORT` |
> | Redis | 9579 | `REDIS_PORT` |

说明：

- 这套源码部署当前已经验证通过：`postgres / redis / server / web / nginx` 会全部进入 `healthy`。
- `web` 容器默认通过 `127.0.0.1:3000` 做健康检查，并显式绑定 `0.0.0.0`，避免 Next standalone 在容器内错误绑定到随机主机名。
- `nginx` 镜像会直接使用仓库中的完整 [`docker/nginx/nginx.conf`](docker/nginx/nginx.conf) 作为主配置文件，`/api`、`/socket.io/` 与 `/uploads/` 都会统一转发。

### Docker Hub 拉取部署（推荐 VPS 使用）

已发布镜像：

- `drleomeng/mocktrade-server:v0.1.1`
- `drleomeng/mocktrade-web:v0.1.1`
- `drleomeng/mocktrade-nginx:v0.1.1`
- 同时维护 `latest`
- 当前已验证架构：`mocktrade-server` 为 `linux/amd64`，`mocktrade-web` 与 `mocktrade-nginx` 为 `linux/amd64` + `linux/arm64`

```bash
# 1) 准备环境变量
cp .env.production.example .env

# 2) 拉取预构建镜像
docker compose -f docker-compose.dockerhub.yml pull

# 3) 启动
docker compose -f docker-compose.dockerhub.yml up -d

# 4) 首次初始化种子数据
docker compose -f docker-compose.dockerhub.yml exec server node dist/database/seeds/run-seed.js

# 5) 验证
docker compose -f docker-compose.dockerhub.yml ps
curl http://localhost:9500/api/health
```

说明：

- `docker-compose.dockerhub.yml` 只依赖镜像，不需要在 VPS 上安装 Node.js、pnpm 或本地构建源码。
- 默认会拉取 `.env` 中写好的稳定镜像标签 `v0.1.1`；如果你想追踪最新版本，可以把 `MOCKTRADE_*_IMAGE` 改成 `:latest`。
- 如果前端和 API 都走同一个域名下的 nginx 反代，`NEXT_PUBLIC_API_URL` 与 `NEXT_PUBLIC_WS_URL` 可以留空，前端会自动走同域 `/api` 和 `/socket.io/`。
- 对外访问入口是 `http://YOUR_VPS_IP:9500`（默认端口，可通过 `NGINX_PORT` 修改），`/api`、`/socket.io/` 与 `/uploads/` 都由 nginx 统一转发。
- 如果你是源码构建部署，`docker-compose.yml` 现在也支持 `POSTGRES_IMAGE / REDIS_IMAGE / NODE_IMAGE / NGINX_IMAGE / PNPM_REGISTRY`，国内服务器可以直接切到镜像代理或 npm 镜像。

### 国内镜像源（VPS 在国内时建议配置）

方式 1：直接在 `.env` 中改成镜像代理地址

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

方式 2：在 VPS 宿主机配置 Docker registry mirror

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://dockerhub.icu"
  ]
}
```

配置后执行：

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

说明：

- 方式 1 更直接，既适合 `docker-compose.dockerhub.yml` 直接拉预构建镜像，也适合 `docker compose up -d --build` 这种源码构建。
- 方式 2 是全局 Docker 加速，后续拉 PostgreSQL、Redis、Node、Nginx 等镜像也会一起受益。
- `PNPM_REGISTRY` 只影响源码构建阶段的 `pnpm install`；如果你只是在 VPS 上 `pull` 预构建镜像，可以不用改它。
- 不同镜像代理可用性会波动；如果某个代理拉不到 `drleomeng/*`，优先改回 Docker Hub 原地址，或者只保留 `registry-mirrors` 方式。

### 推送镜像到 Docker Hub（针对开发者）

如果您修改了代码并希望推送新的镜像到 Docker Hub，本项目提供了两种方式：
1. **自动化 (GitHub Actions)**：只需在 GitHub 仓库的 Secrets 中配置 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN`，当您推送到 `main` 分支或打上 `v*.*.*` 标签时，系统会自动构建并推送 `latest` 及对应版本号的镜像。
2. **手动推送 (脚本)**：在本地终端运行 `./scripts/docker-push.sh <可选:版本号>`，脚本将自动根据 `docker/` 下的构建文件打包 `server`、`web` 和 `nginx` 镜像，并推送到您的 Docker Hub 命名空间。

### 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_PASSWORD` | ✅ | PostgreSQL 密码 |
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `ADMIN_EMAIL` | ✅ | 管理员注册邮箱 |
| `AI_API_KEY` | 可选 | AI 服务 API Key（无则使用本地模板新闻） |
| `AI_API_BASE` | 可选 | AI 服务接口地址 |
| `AI_MODEL` | 可选 | AI 模型名称 |
| `NGINX_PORT` | 可选 | nginx 宿主机端口，默认 `9500` |
| `WEB_PORT` | 可选 | Next.js 宿主机端口，默认 `9510` |
| `SERVER_PORT` | 可选 | NestJS 宿主机端口，默认 `9511` |
| `POSTGRES_PORT` | 可选 | PostgreSQL 宿主机端口，默认 `9532` |
| `REDIS_PORT` | 可选 | Redis 宿主机端口，默认 `9579` |
| `POSTGRES_IMAGE` | 可选 | PostgreSQL 镜像地址，可替换为国内代理地址 |
| `REDIS_IMAGE` | 可选 | Redis 镜像地址，可替换为国内代理地址 |
| `NODE_IMAGE` | 可选 | 源码构建时使用的 Node 基础镜像，默认 `node:20-alpine` |
| `NGINX_IMAGE` | 可选 | 源码构建时使用的 nginx 基础镜像，默认 `nginx:alpine` |
| `PNPM_REGISTRY` | 可选 | 源码构建时的 pnpm registry，默认 `https://registry.npmmirror.com` |
| `MOCKTRADE_SERVER_IMAGE` | 可选 | 后端镜像地址，默认 `drleomeng/mocktrade-server:v0.1.1` |
| `MOCKTRADE_WEB_IMAGE` | 可选 | 前端镜像地址，默认 `drleomeng/mocktrade-web:v0.1.1` |
| `MOCKTRADE_NGINX_IMAGE` | 可选 | nginx 镜像地址，默认 `drleomeng/mocktrade-nginx:v0.1.1` |

## 👤 管理员初始化

- 注册时，若用户邮箱与 `.env` 里的 `ADMIN_EMAIL` 完全一致，该账号会自动拿到 `admin` 角色。
- 推荐流程：先在 `.env` 中写好 `ADMIN_EMAIL`，再访问注册页创建该账号。
- 注册成功后，顶部用户菜单会出现“管理后台”入口，对应 `/admin`。

## ✅ 推荐验收命令

源码 Docker 部署完成后，至少跑一遍下面这组命令：

```bash
docker compose ps
curl http://localhost:9500/api/health
curl http://localhost:9500/api/market/status
curl -I http://localhost:9500
```

预期结果：

- `docker compose ps` 中 5 个服务都显示 `healthy`
- `/api/health` 返回 `{"redis":"ok","database":"ok","status":"healthy"}`
- `/api/market/status` 能返回市场状态与倒计时
- 首页返回 `HTTP/1.1 200 OK`

## 📋 功能清单

### 市场系统
- 25 只虚拟股票，含人设与世界观
- 市场阶段引擎：自动在上行 / 震荡 / 下行间切换，板块轮动
- 个股性格画像：稳健股走趋势，高弹性股过山车
- 布朗运动 + 均值回归 + 趋势记忆价格引擎
- 事件冲击曲线影响股价
- 开盘 / 休市自动轮转

### 交易系统
- 市价单 / 限价单
- 自动撮合 + 挂单过期
- 手续费计算 + 资金冻结
- 持仓管理 + 盈亏计算

### 新闻系统
- AI 两段式发布：事件线索 → 次日复盘
- Bull 队列调度 + 优先级排序
- 新闻情感分析标签
- 首页新闻跑马灯 + WebSocket 推送 Toast

### 排行榜
- 赛季内实时更新
- 总资产 / 收益率双维度
- 交易后异步刷新

### 管理后台
- 市场暂停 / 恢复 / 时长设置
- AI 参数配置 + 连接测试 + 熔断恢复
- 新闻生成 / 发布 / 手动事件
- 队列可观测性面板
- 用户管理 + 全站统计
- 涨跌颜色方案切换

## 📄 License

MIT
