# MockTrade — 项目交接文档

> 交接时间: 2026-03-28
> 目的: 供 Codex / 下一轮 AI 会话继续开发

---

## 1. 项目概述

MockTrade 是一个 **AI 驱动的模拟炒股竞技 Web 游戏**，面向家人朋友娱乐。

**核心特色：**
- 虚拟股市 24/7 循环运行（开盘 2min → 休市 30s）
- 25 只虚拟股票，每只有搞笑"人设"（如"火锅控股"CEO 经常跟对手对骂）
- AI 生成新闻驱动股价涨跌（严肃+搞笑混搭，连续剧情线）
- 做市商模式，玩家想买就买想卖就卖
- 赛季制 + 段位（按收益率）+ 排行榜 + 成就 + 社交

**设计定稿详见**: `docs/wbs-plan.md`（47K字详细WBS）、`docs/ui-design.md`（84K字UI规范）

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 (App Router) + TypeScript + TailwindCSS |
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL + Redis |
| 实时 | WebSocket (Socket.IO) |
| AI | 可配置：OpenAI 兼容 API / Claude API |
| 部署 | Docker Compose (5 容器: nginx, web, server, postgres, redis) |
| 包管理 | pnpm workspace (monorepo) |

---

## 3. 项目结构

```
MockTrade/
├── apps/
│   ├── web/                    # Next.js 前端 (24 files)
│   │   ├── src/app/(auth)/     # 登录/注册页
│   │   ├── src/app/(main)/     # 主页面 (12 routes)
│   │   ├── src/components/     # shared + layout 组件
│   │   ├── src/lib/            # api, websocket, formatters, cn
│   │   └── src/stores/         # Zustand stores (auth, market)
│   └── server/                 # NestJS 后端 (16 modules)
│       ├── src/entities/       # 13 个 TypeORM Entity
│       ├── src/modules/
│       │   ├── auth/           # 注册/登录 JWT
│       │   ├── user/           # 用户资料
│       │   ├── market/         # 行情引擎 (状态机+价格算法+WebSocket)
│       │   ├── ai/             # AI 适配层 (多provider+世界观记忆+降级)
│       │   ├── news/           # 新闻引擎 (生成+发布+API)
│       │   ├── trade/          # 交易系统 (下单+持仓+资金+限价匹配)
│       │   ├── season/         # 赛季系统 (创建/结束/段位)
│       │   ├── leaderboard/    # 排行榜 (Redis Sorted Set)
│       │   ├── achievement/    # 成就系统 (10种)
│       │   ├── social/         # 社交 (关注/动态/评论)
│       │   ├── admin/          # 管理后台 API
│       │   ├── health/         # 健康检查
│       │   └── redis/          # Redis 全局模块
│       └── src/database/       # TypeORM config + 种子数据
├── packages/
│   └── shared/                 # 共享类型+常量+工具 (前后端共用)
├── world/                      # AI 世界观文件 (world-setting.md, relationships.md)
├── docker/                     # Dockerfiles + nginx.conf
├── docs/                       # 设计文档 + 进度追踪
├── docker-compose.yml          # 生产环境 5 容器
├── docker-compose.dev.yml      # 开发环境 (postgres+redis)
└── deploy.sh                   # 部署脚本
```

---

## 4. 开发进度 (198/198 任务点完成)

6 个 Phase 全部完成，代码已通过编译验证，Docker 本地部署成功运行。

详细进度见 `docs/progress.md`。

---

## 5. 已知问题 (需要修复)

### 问题 1: 前端全英文，需要中文化
**现状**: 所有前端页面的 UI 文案都是英文（Market, Trade, Rank 等）
**期望**: 界面应该是中文（市场、交易、排行等），因为目标用户是中国家人朋友
**范围**:
- `apps/web/src/components/layout/TopBar.tsx` — 导航链接
- `apps/web/src/components/layout/BottomNav.tsx` — 底部标签
- `apps/web/src/app/(auth)/login/page.tsx` — 登录页文案
- `apps/web/src/app/(auth)/register/page.tsx` — 注册页文案
- `apps/web/src/app/(main)/page.tsx` — 市场总览
- `apps/web/src/app/(main)/stock/[id]/page.tsx` — 股票详情
- `apps/web/src/app/(main)/portfolio/page.tsx` — 持仓页
- `apps/web/src/app/(main)/news/page.tsx` — 新闻
- `apps/web/src/app/(main)/news/[id]/page.tsx` — 新闻详情
- `apps/web/src/app/(main)/leaderboard/page.tsx` — 排行榜
- `apps/web/src/app/(main)/profile/page.tsx` — 个人主页
- `apps/web/src/app/(main)/feed/page.tsx` — 动态页
- `apps/web/src/app/(main)/admin/page.tsx` — 管理后台
- `apps/web/src/components/shared/SentimentTag.tsx` — 已有中文标签，OK
- `apps/web/src/components/shared/MarketStatusBadge.tsx` — 开盘/休市

### 问题 2: 注册后无法进入 /admin 页面
**现状**: 用 ADMIN_EMAIL 邮箱注册后，访问 /admin 会被重定向到首页
**可能原因**:
1. `admin/page.tsx` 中 `useEffect` 检查 `user?.role !== 'admin'` 时，auth store 可能还没从 localStorage 加载完毕
2. 注册成功后 setAuth 存储的 user 对象中的 role 可能没有正确传递
3. `(main)/layout.tsx` 的 `loadFromStorage` 可能在 admin 页面加载之后才执行
**修复建议**:
- 在 admin/page.tsx 中添加 loading 状态，等 auth 初始化完成后再判断
- 检查后端 `auth.service.ts` 的 `sanitizeUser` 是否返回了 role 字段（应该是OK的）
- 在 `useAuthStore` 中添加 `isLoading` 状态

### 问题 3: 前端缺少 K 线图表
**现状**: 股票详情页没有集成 TradingView Lightweight Charts，只有价格和统计
**期望**: 应有 K 线图/趋势图可切换
**依赖**: `lightweight-charts` 已安装，只需在 `stock/[id]/page.tsx` 添加图表组件

### 问题 4: Bull 消息队列未实际集成
**现状**: `@nestjs/bull` 和 `bull` 已安装，但没有实际创建 Bull 处理器
**现有替代**: 使用了 setTimeout/setInterval + Redis 手动队列实现新闻生成
**改进方向**: 可以用 Bull 替换手动队列，获得重试、延迟、监控等能力

### 问题 5: 前端缺少管理后台入口
**现状**: TopBar 没有 Admin 链接，只能手动输入 /admin URL
**修复**: 在 TopBar.tsx 的用户菜单中，如果 `user.role === 'admin'`，显示 Admin 链接

---

## 6. 核心业务规则

| 规则 | 值 |
|------|---|
| 初始资金 | $1,000,000 |
| 手续费 | 0.1% |
| 涨跌停 | ±10% (相对开盘价) |
| 交易模式 | T+0, 做市商 |
| 开盘时长 | 2 分钟 (可配置) |
| 休市时长 | 30 秒 (可配置) |
| 价格更新 | 每 2-5 秒随机 |
| 段位 | 传奇≥100%, 钻石≥50%, 黄金≥20%, 白银≥5%, 青铜<5% |
| AI 模式 | 混合制: 算法驱动常规波动 + AI 生成新闻事件 |
| 赛季 | 每月一季，结束时结算排名 |

---

## 7. API 端点清单

```
# Auth
POST   /api/auth/register
POST   /api/auth/login

# User
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/:id

# Market
GET    /api/market/status
GET    /api/market/stocks
GET    /api/market/stocks/:id
GET    /api/market/stocks/:id/kline

# News
GET    /api/news
GET    /api/news/latest
GET    /api/news/:id

# Trade
POST   /api/trade/orders
DELETE /api/trade/orders/:id
GET    /api/trade/orders
GET    /api/trade/orders/active
GET    /api/trade/positions
GET    /api/trade/account

# Seasons
GET    /api/seasons
GET    /api/seasons/current
GET    /api/seasons/:id/results
GET    /api/seasons/my-history
POST   /api/seasons              (admin)
POST   /api/seasons/:id/end      (admin)

# Leaderboard
GET    /api/leaderboard/:type
GET    /api/leaderboard/:type/my-rank

# Achievements
GET    /api/achievements
GET    /api/achievements/my
POST   /api/achievements/check
POST   /api/achievements/seed    (admin)

# Social
POST   /api/social/follow/:userId
DELETE /api/social/follow/:userId
GET    /api/social/following
GET    /api/social/followers
GET    /api/social/follow-stats/:userId
GET    /api/social/is-following/:userId
POST   /api/social/posts
GET    /api/social/feed
GET    /api/social/posts/user/:userId
POST   /api/social/posts/:postId/comments
GET    /api/social/posts/:postId/comments

# Admin
GET    /api/admin/engine/status
POST   /api/admin/market/pause
POST   /api/admin/market/resume
POST   /api/admin/market/durations
POST   /api/admin/news/generate
POST   /api/admin/news/publish
POST   /api/admin/stocks/:id/shock
GET    /api/admin/news/queue

# Health
GET    /api/health
```

---

## 8. WebSocket 事件

```
# 客户端 → 服务端
subscribe:stock    (stockId)     # 订阅单股行情
unsubscribe:stock  (stockId)
subscribe:user     (userId)      # 订阅个人通知

# 服务端 → 客户端
tick               # 价格更新 [{stockId, price, change, changePercent, volume}]
market:status      # {status: 'opening'|'closed', countdown}
news:published     # {id, title, sentiment, relatedStockIds}
order:filled       # {orderId, side, ticker, price, quantity}
order:cancelled    # {orderId}
achievement:unlocked # {code, name, rarity}
```

---

## 9. Docker 部署

```bash
# 本地开发
docker compose -f docker-compose.dev.yml up -d  # 只启动 PG + Redis
pnpm dev:server                                   # 后端
pnpm dev:web                                      # 前端

# 生产部署
cp env.production.example .env                    # 配置环境变量
docker compose build                              # 构建镜像
docker compose up -d                              # 启动 5 容器
docker compose exec server node dist/database/seeds/run-seed.js  # 首次种子

# 环境变量
DATABASE_PASSWORD=xxx    # 数据库密码
JWT_SECRET=xxx          # JWT 密钥 (≥32字符)
ADMIN_EMAIL=xxx         # 管理员邮箱
AI_API_KEY=xxx          # AI API key (可选，无则用模板新闻)
NEXT_PUBLIC_API_URL=http://YOUR_IP  # 前端API地址
CORS_ORIGIN=http://YOUR_IP          # CORS
```

---

## 10. 下一步待做清单 (优先级排序)

1. **[高] 前端中文化** — 所有 UI 文案改为中文
2. **[高] 修复 Admin 页面访问** — auth loading 状态 + TopBar admin 入口
3. **[高] 添加 K 线图表** — lightweight-charts 集成到股票详情页
4. **[中] 新闻滚动条** — 首页顶部 NewsTicker 组件
5. **[中] 迷你走势图** — 股票列表中的 Sparkline
6. **[中] 前端实时新闻推送** — WebSocket news 事件 → Toast 通知
7. **[中] 排行榜实时化** — 交易后更新 Redis Sorted Set → 排行榜刷新
8. **[低] 管理后台增强** — 股票人设编辑、用户管理、数据统计
9. **[低] 深色/浅色主题切换** — next-themes 已配置，需要加 toggle 按钮
10. **[低] 响应式优化** — 移动端细节适配

---

## 11. Git 提交历史

```
78dcd99 fix: Docker deployment fixes
dad432d docs: update progress - Phase 6 complete, project done!
e580a42 feat: Phase 6 - deployment and production setup
813f3dc docs: update progress - Phase 5 complete
b6979d0 feat: Phase 5 - social, achievements, and leaderboard
4679e0f docs: update progress - Phase 4 complete
c64dd97 feat: Phase 4 - frontend core pages
b77cee9 docs: update progress - Phase 3 complete
be6581c feat: Phase 3 - trading and season systems
ea8d652 docs: update progress - Phase 2 complete
91f2ad9 feat: Phase 2 - core engines (market + AI news)
47049c6 docs: update progress - Phase 1 complete
c220789 feat: Phase 1 - project infrastructure setup
```
