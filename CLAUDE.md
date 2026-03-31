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

## 4. 开发进度 (核心 WBS 198/198 已完成，进入修复优化阶段)

6 个 Phase 的核心开发已完成，代码已通过编译验证。

2026-03-28 本轮修复与体验升级已完成:
- **前端注册系统交互蜕变及落库**：实现了前端以拟物玻璃相机按钮的交互形态触发后端基于 Multer 的真实文件接纳。并且完成注册大版的高规格软边发光化重装。
- **管理中台 /admin 重启设计**：废弃表单直排式界面，采取垂直切分 Tabs 并用高质感动画重新构建了仪表盘、新闻指令中心、人工智能中纽与共识调色区。
- **分时大屏展现真·日内波动**：重整轻量化图表的渲染间隔使其可以毫无断点地拉满完整的开收盘循环横断面色块。
- **极简苹果级/Claude风格重塑**: 彻底完成了 Light/Dark 明暗双轨主题的接入，用原生高定阴影（`shadow-soft` 等）及浅净灰白取代了早期的赛博风格重光晕；所有组件排版向 iOS Stocks 原生效齐（如圆润卡片、干净且无边距的留白）。
- **前端核心视觉大重装**: 引入现代金融/交易所级别的 UI，全系应用 Glassmorphism毛玻璃、霓虹涨跌色 (`#ef4444`/`#10b981`) 以及数字价格变化闪烁动画，首页 `page.tsx` 得到 100% 重塑。
- **高级交易面板重构**: 引入了含有真实表单验证能力、支持全仓半仓以及双轨计算股数的弹窗式部件 `TradeModal`，并已更新为平滑纯净的拉出表单（Apple Sheet）。
- 前端主流程页面与导航中文化
- 管理后台与市场前台文案已统一改成直白中文，去掉“龙头 / 异动 / 复盘 / 做多 / 离谱”等不必要修饰
- `/admin` 页面鉴权时序修复
- TopBar 增加管理员后台入口
- 股票详情页补齐 `分时线 / K 线` 图表，并优化为更接近股票软件的视觉样式
- 管理后台支持运行时配置 AI provider / Base URL / API Key / 模型，并可测试连接
- 管理后台新闻链路修复: 生成新闻明确进入待发布队列, 支持队列预览, 发布后立即写入新闻页
- 新闻展示逻辑调整: 当日只显示事件线索, 次交易日自动生成复盘新闻, 再公布实际涨跌
- 管理后台新增全站涨跌配色切换: 默认红涨绿跌，可切换为绿涨红跌
- 公开新闻页移除事件新闻的“利好 / 利空”标签剧透，改为统一的中性事件标签
- fresh DB 自动补齐默认活动赛季, 避免交易与新闻发布因无赛季失败
- 前端 API 异常处理补强，401 自动清理本地鉴权残留
- AI 新闻生成链路新增 JSON 提取 / 清洗 / 修复 / 重试机制，显著减少因格式错误 fallback 到模板新闻
- AI 上游 `fetch failed` 已接入 timeout / retry / backoff / Redis 健康状态记录，后台可直接查看最近成功、失败、耗时和连续失败次数
- Bull 队列已真实接入新闻系统，拆分 `news-buffer` / `news-scheduler` 两个队列，替换手动 Redis list + `setTimeout`
- 启动时会自动把旧 Redis `news:pending` 待发布新闻迁移到 Bull
- 修复休市 / 结算期间股价仍继续变化的问题，并补齐开市 / 休市倒计时展示
- 股票详情图表补齐历史成交买卖点提示
- 股票详情“相关新闻”改为按股票正确过滤，不再长期显示空状态
- 首页市场总览文案去掉“剧情浓度”这类内部术语，改成更直接的“波动最大”，并按涨跌幅绝对值排序
- 管理后台“价格冲击”改成更直白的“手动价格干预”，补充正负值说明并改为股票下拉选择
- 手动价格干预改为开盘中立即推送一次可见价格变动，再叠加后续衰减影响；休市/结算时会明确提示当前不能立即生效
- 管理后台新增“手动事件新闻”：管理员可设股票、方向、目标影响、风格和事件提示，先生成新闻再由新闻冲击曲线慢慢推价格
- 手动事件新闻的目标影响输入放宽到最多 100%，实际落地仍会按涨跌停和事件上限自动收敛；新加入的手动事件会优先显示在待发布队列预览中
- 本地 Docker 已于 2026-03-28 18:27 CST 按最新代码重建验证通过，`http://localhost` 与 `/api/health` 正常

2026-03-29 新增一轮针对赛季与头像的修复:
- 管理后台创建赛季改为支持具体到分钟的开始时间和结束时间，不再只有日期。
- `SeasonService.createSeason()` 现在会先完整结算当前赛季，再创建新赛季，旧赛季结果会写入 `season_records`。
- 赛季结算时会把旧赛季未成交挂单统一过期，避免挂单跨赛季串到新赛季。
- 排行榜页改为读取当前赛季实时榜单 `/leaderboard/return` + `/leaderboard/assets`，不再错误读取已结算赛季结果。
- 管理后台新增“当前赛季 / 全部赛季”展示，个人页会显示当前赛季名称和时间范围。
- 前端新增统一头像组件 `UserAvatar`，TopBar、个人页、动态页和排行榜都改为优先显示真实头像。
- nginx 新增 `/uploads/` 代理，Docker Compose 为服务端上传目录增加 `server_uploads` volume；头像文件在重建或重启容器后仍可访问。
- 本地 Docker 已于 2026-03-29 08:28 CST 重新验证通过：创建新赛季后旧赛季可看到结算记录，测试头像可通过 `http://localhost/uploads/...` 访问，重启 `server` 容器后文件仍保留。

2026-03-29 新增一轮针对个人资料页体验与资料编辑的增强:
- **个人资料页 Apple 风格重构**：`/profile` 已改造成更完整的资料总览、编辑区、账户表现与赛季历史布局，不再是简单的三块基础卡片。
- **支持在个人页更换头像**：复用 `ImageUploader` 接入个人页，用户现在可以在个人资料页直接上传新头像并保存。
- **资料保存后全站同步**：前端 `auth-store` 新增 `updateUser()`，资料更新后 TopBar、排行榜、动态页和评论区都会立即刷新新的头像与昵称。
- **用户资料接口补强**：`PATCH /api/users/me` 改用 DTO 校验并补上用户名唯一性检查，昵称冲突会返回明确错误。
- **本地验证通过**：已于 2026-03-29 12:42 CST 执行 `pnpm --filter server build`、`pnpm --filter web exec tsc --noEmit`、`pnpm --filter web build` 与 `docker compose up -d --build web server`；`/api/health` 与 `http://localhost/profile` 均返回正常。

2026-03-29 新增一轮针对核心前端体验的增强:
- **K线 / 分时图颗粒度升级**：重构了后端 `KLineService`，新增 `逐跳` 分辨率并把 `1分` 修正为真实分钟聚合；前端 `StockChart` 改成 `逐跳 / 1分 / 5分 / 15分`，分时图与 K 线共用同一套真实数据源，`逐跳` 会显示秒级时间轴。
- **高定美学重塑 Auth 环节**：登录页（Login）与注册页（Register）完成了全面的大圆角毛玻璃化（backdrop-blur），取消了所有生硬线框，引入拟物风发光阴影与居中弥散极光背景。
- **股票详情页扁平化排版**：全面去除了晦涩的双屏 Tab 设计，直接把最具特色的公司简介（Persona）高亮置于核心价格看板下；所有关联新闻（事件/回顾）直接流水线全开展现，观感更像股票实盘。
- **趣味化多层排行榜体系**：原单一排行榜已分为具有强代入感的子榜：🏆 收益战神榜、💰 资本大鳄榜 与 📉 破产惨剧榜；后端增加 `order=asc` 翻转查询法展示垫底选手。

2026-03-29 新增一轮针对行情真实性与趣味性的增强:
- **市场阶段切换**：新增 `MarketRegimeService`，市场会在 `上行 / 震荡 / 下行` 三种阶段间按多个开盘周期轮换；同一阶段持续越久，偏向会越明显。
- **板块轮动**：每个阶段会抽取领涨板块和承压板块，同一市场里不再所有股票一起横着抖。
- **个股画像驱动**：新增 `stock-behavior.ts`，把股票拆成 `steadyCompounder / defensiveGrower / cyclicalMover / highBeta / memeRocket / turnaround` 等画像；稳健股更容易慢慢走趋势，高风险股更容易过山车和跳涨跳水。
- **趋势记忆引擎**：新增 `trend-engine.ts`，为每只股票维护长期锚点和短波段趋势，让价格可以连续涨一段、跌一段，而不是永远围着一条水平线抖动。
- **行情合成升级**：`PriceSynthesizer` 现在把市场阶段、板块角色、个股画像、随机波动、均值回归和新闻冲击叠加生成价格。
- **图表分辨率修正**：`tick` 现在表示每次价格跳动一组，`1分` 改为真实按时间分桶；首页迷你走势图也改成读取逐跳数据，不再误把固定 tick 数量当成“1分”。
- **可观测性补充**：`GET /api/market/status` 新增 `regime`，`GET /api/admin/engine/status` 新增 `marketRegime`，前后台都能读到当前市场所处阶段。
- **前端阶段可视化**：首页新增 `MarketRegimePanel`；股票详情页会结合当前股票所属行业显示“领涨 / 承压 / 中性板块”；管理后台总览页也能直接看到当前行情阶段；顶栏状态角标会显示简版阶段标签。
- **前端 Docker 构建稳定化**：移除 `next/font/google` 的 `Inter` 在线拉取，改成 Apple 风格系统字体栈，避免 `docker compose build web` 因外网字体请求卡住。
- **本地验证通过**：已于 2026-03-29 12:26 CST 执行 `pnpm --filter server build`、`pnpm --filter web build`、`pnpm --filter web exec tsc --noEmit` 与 `docker compose up -d --build web server`；`/api/health`、`/api/market/status`、`GET /api/market/stocks/:id/kline?resolution=tick`、`GET /api/market/stocks/:id/kline?resolution=1m` 与 `http://localhost` 均返回正常。

当前仍待完成的主要问题: 行情参数后台可调、后台观测面板细化、价格行为回归测试，以及部分前端体验增强。

2026-03-29 v0.1.0 功能补完（阶段性里程碑）:
- Bull 队列可观测性：新建 `news-queue-stats.service.ts`，后端新增 `GET /api/admin/news/queue-stats`，管理后台仪表盘新增 buffer/scheduler 队列监控面板
- AI 上游熔断：`AIHealthService` 新增 `isCircuitOpen()` 和 `resetHealth()`，`AIService.executeWithRetry` 加入连续失败 ≥5 次短路检查，管理后台新增"手动恢复 AI"按钮
- 首页新闻跑马灯：新建 `NewsTicker.tsx` CSS 动画无限循环滚动最新新闻
- 股票迷你走势线：新建 `Sparkline.tsx` 纯 SVG polyline 走势图，集成到首页股票卡片
- WebSocket 新闻推送：新建 `NewsToast.tsx` 底部浮动通知，`layout.tsx` 监听 `news:published` 事件
- 排行榜实时化：`TradeService` 在市价/限价单成交后异步调用 `LeaderboardService.updateAssets()`
- 管理后台增强：新增 `GET /admin/users`（分页用户列表）和 `GET /admin/stats`（全站统计），前端新增"用户管理"Tab
- 新建 `README.md`（中文）、`README_EN.md`（英文）、`CHANGELOG.md`
- 全部 3 个包构建验证通过

2026-03-29 新增一轮针对新闻自动发布停滞的修复:
- **修复服务重启后新闻自动发布卡死**：`NewsPublisherService` 之前给 Bull 延迟发布任务写死了 `jobId = news-publish:${cycle}:${index}`，而 `MarketStateService` 每次重启后会从 `cycleCount = 0` 重新开始，导致新的任务 ID 与 Redis 中尚未清理的 completed jobs 冲突。
- **调度任务 ID 已改为带运行实例前缀**：服务启动时会生成一次 `schedulerRunId`，新的任务 ID 形如 `news-publish:${schedulerRunId}:${cycle}:${index}`，避免跨重启重复。
- **本地验证通过**：已执行 `pnpm --filter server build`、`docker compose up -d --build server`，并确认 Redis 中出现新的 `news-publish:<uuid>:...` delayed jobs，服务日志重新出现自动发布记录，`/api/news/latest` 时间戳持续更新。

详细进度见 `docs/progress.md`。

---

## 5. 已知问题 / 修复状态

### 已解决 0: 提升整体前端科技感与质感 (UI Dashboard 重设计)
**状态**: 已于 2026-03-28 完成，并追加了全系极致清爽防剧透的 Apple级美感系统。
**修复范围**:
- `apps/web/src/app/globals.css` & `tailwind.config.ts`：扩展并覆盖双明暗（Light & Dark）的主题变量，引入 `shadow-soft` 代替外发光 Glow。
- `apps/web/src/app/providers.tsx`：深度集成 `next-themes` 以兼容自带支持设备切换。
- `apps/web/src/components/layout/TopBar.tsx` & `BottomNav.tsx`：应用高级背景虚化 `glass-bar` 与并在顶栏嵌入日月切换器（Sun / Moon toggle）。
- `apps/web/src/app/(main)/page.tsx`：大破大立重写整体结构，以柔和且字距紧凑（`tracking-tight`）的高排版阅读质量为重点，取消硬性背景填色并采用圆角极简 iOS 分块逻辑。
- `apps/web/src/components/shared/PriceDisplay.tsx`：基于变动保留 `tabular-nums` 并在变动时只追加了轻微无霓虹外光的 `flash` 特效。
- `apps/web/src/components/shared/TradeModal.tsx` & `stock/[id]/page.tsx`：构建了包含双向金额折算、资产实时读取阻断的高级抽屉模拟交易弹窗。

### 已解决 1: 前端全英文，需要中文化
**状态**: 已于 2026-03-28 完成。
**修复范围**:
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

### 已解决 2: 注册后无法进入 /admin 页面
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 在 `useAuthStore` 中增加 `isHydrated` 状态，明确区分“尚未从 localStorage 恢复”与“已完成恢复”。
- `apps/web/src/app/(main)/admin/page.tsx` 等待 hydration 完成后再判断 `user.role`，避免误重定向。
- `apps/web/src/components/layout/TopBar.tsx` 同步等待 hydration 完成后再渲染登录态相关 UI，避免闪烁和误判。

### 已解决 3: 前端缺少 K 线图表
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 新增 `apps/web/src/components/shared/StockChart.tsx`。
- 在 `apps/web/src/app/(main)/stock/[id]/page.tsx` 集成 `lightweight-charts`，支持 `分时线 / K 线` 切换。
- 默认切到更像股票软件的分时线视图，同时保留 K 线、开盘参考线、MA5 / MA20 和成交量。

### 已解决 4: Bull 消息队列已真实集成
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- `AppModule` 引入 `BullModule.forRootAsync`，统一复用 Redis 连接配置。
- `NewsModule` 注册 `news-buffer` 与 `news-scheduler` 两个队列。
- `NewsGeneratorService` 改为用 Bull waiting queue 维护待发布新闻，并在启动时迁移旧 Redis `news:pending` 数据。
- `NewsQueueProcessor` + `NewsPublisherService` 改为使用 delayed jobs 调度开盘期新闻发布，带 `attempts/backoff/removeOnComplete`。

### 已解决 5: 前端缺少管理后台入口
**状态**: 已于 2026-03-28 完成。
**修复方式**: 在 `TopBar.tsx` 的用户菜单中，当 `user.role === 'admin'` 且鉴权状态已完成 hydration 时，展示管理后台入口。

### 已解决 6: 生成新闻后页面找不到，发布新闻报 Internal server error
**状态**: 已于 2026-03-28 完成。
**问题根因**:
- `POST /api/admin/news/generate` 原本只会把新闻写入 Redis 待发布队列，不会直接落到新闻表，因此新闻页看不到。
- `POST /api/admin/news/publish` 在没有活动赛季时会写入 `seasonId: 'no-season'`，而 `news.seasonId` 是 UUID 字段，导致数据库报错。
**修复方式**:
- `NewsGeneratorService` 新增队列预览能力，管理后台可直接查看待发布新闻列表。
- `AdminController` 返回更明确的生成/发布结果与当前队列长度，前端按钮文案调整为“生成到队列 / 立即发布一条”。
- `SeasonService` 启动时自动创建默认活动赛季，保证 fresh DB 可立即交易和发布新闻。
- `NewsPublisherService` 发布时强制读取真实活动赛季 ID；若异常缺失，则返回明确提示而不是 500。

### 已解决 7: 新闻详情泄露即时涨跌，且股价影响区域显示 UUID
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- `NewsController` 统一将新闻接口序列化为前端友好的结构，返回 `relatedStocks`（股票名 + 代码），不再在新闻详情页显示 UUID。
- 新闻新增 `event / recap` 两种类型:
  - `event`: 当日事件新闻，只给市场线索，不对外暴露 `impactPercents`。
  - `recap`: 次交易日自动生成复盘新闻，公布上一交易日该事件最终带来的实际涨跌。
- `NewsPublisherService` 在新交易日开始时自动为上一交易日事件生成复盘新闻。
- `EventImpact` 改为“先爬坡、后衰减”的冲击曲线，避免新闻一出来就瞬间把影响打满。

### 已解决 21: 前端的K线与登录、排行缺乏质感，详情页折叠太深
**状态**: 已于 2026-03-29 完成。
**修复方式**:
- 前后端 K 线图联通增加 `resolution` 控制，现支持 `tick / 1m / 5m / 15m` 动态聚合。
- 登入、注册接口重铺全息背景玻璃拟物（Apple 审美）。
- 个股详情移除底部 Tab，强化股票“人设介绍”的存在感。
- 排行榜横向拆分为收益/资产/破产三榜，大幅度提升玩家竞争乐趣。

### 已解决 22: 当前“1分”K线其实不是逐跳也不是真 1 分钟
**状态**: 已于 2026-03-29 完成。
**问题根因**:
- 原 `KLineService` 按固定 tick 数量切片，把 10 条 tick 硬合成一根，导致前端写着“1分”，实际既不是每次波动一根，也不是每分钟一根。
- 分时图与 K 线共用同一批伪分钟数据，所以两种视图都会给人“颗粒度不对”的感觉。
**修复方式**:
- `apps/server/src/modules/market/kline.service.ts` 新增 `tick` 分辨率，按每次价格变化输出一组 OHLCV；逐跳 K 线的 `open` 取上一跳价格。
- `1m` 改为真实按时间戳的分钟桶聚合，新增 `5m / 15m` 作为更粗颗粒度选项，并兼容旧别名 `1d / 1w / 1M`。
- `apps/web/src/components/shared/StockChart.tsx` 改成 `逐跳 / 1分 / 5分 / 15分`，`逐跳` 时打开秒级时间轴；首页 `Sparkline` 同步改成读取逐跳数据。

### 已解决 8: 涨跌颜色写死，后台无法统一切换
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 新增 `DisplaySettingsService`，把全站涨跌配色持久化到 Redis。
- 管理后台新增“界面显示”区块，可在“红涨绿跌（默认）/ 绿涨红跌”之间切换。
- 前端在 `Providers` 中启动时拉取 `/api/market/display-settings`，并通过全局 CSS 变量统一驱动 `text-up / text-down / bg-up / bg-down`。

### 已解决 9: 事件新闻仍用利好/利空标签剧透方向
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- `SentimentTag` 新增 `newsType` 维度；事件新闻统一显示中性的“事件线索”标签。
- 新闻中心筛选从“利好 / 利空”调整为“事件线索 / 次日复盘 / 突发 / 搞笑”，避免公开页面从筛选入口泄露方向。

### 已解决 10: AI 新闻偶发输出不合法 JSON，过早 fallback 到模板新闻
**状态**: 已于 2026-03-28 完成主要可靠性增强。
**修复方式**:
- `NewsGeneratorService` 不再直接对模型原始文本做一次 `JSON.parse` 后失败即 fallback。
- 新流程会先提取 JSON 候选，再本地修正常见格式问题，并做字段归一化与合法性校验。
- 若首轮仍失败，会再触发一次低温“JSON 修复器”提示和一次低温重试。
- 只有全部修复链路都失败，或 AI 上游本身 `fetch failed` 时，才回退模板新闻。
**剩余尾巴**:
- 当前观察到的模板 fallback 主要已不是 JSON 解析问题，而是 AI 上游偶发不可达。

### 已解决 11: 休市中股价仍会继续变化
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 行情状态快照补齐 `cycleCount / countdown / openDuration / closeDuration`。
- 休市与结算阶段冻结当前价格，仅在下一轮开盘前重置新一轮 `openPrice / high / low / volume` 基准。

### 已解决 12: 开市和休市剩余时间不可见
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- `GET /api/market/status` 统一返回当前倒计时。
- WebSocket 初次连接和状态切换时同步广播 `countdown`。
- 股票详情页增加“距休市 / 距开盘”提示文案。

### 已解决 13: K 线中没有买入 / 卖出提示
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 股票详情页会拉取当前股票的已成交订单。
- `StockChart` 根据成交时间映射到最近 K 线时间点，绘制买卖箭头和数量标记。

### 已解决 14: 股票详情中的相关新闻始终为空
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 股票详情页改为按 `stockId` 拉取 `/api/news`。
- 后端新闻接口按 `relatedStockIds` 正常过滤并返回详情页可直接展示的数据结构。

### 已解决 15: 手动事件新闻超过 20% 被拦截，且生成到队列后不易感知
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- `GenerateManualNewsDto` 的 `impactPercent` 上限已调整为 `100`，并返回中文提示；输入值最终仍会在新闻生成阶段收敛到系统允许的真实冲击区间。
- `NewsGeneratorService.generateManualAndQueue` 对手动事件使用更高优先级和 `lifo`，队列预览会优先看到最新手动加入的新闻。
- 管理后台在生成普通新闻 / 手动事件 / 发布新闻时会先显示“正在生成 / 发布”的过程文案，避免 AI 请求较慢时看起来像没反应。
- 2026-03-28 18:27 CST 已用本地 Docker 实测：`impactPercent=21` 可成功入队，`/api/admin/news/queue` 能立即看到新事件排在预览首位。

### 已解决 16: 前端注册太简陋，缺失真实头像与科技感
**状态**: 已于最新重构中完成。
**修复方式**:
- 后端集成 Multer 设立 `/upload/avatar` 的静态图片直传口子。
- 前端剔除数字头像预选包，引入能够裁切透射背景的 `<ImageUploader />`，并在注册核心版图运用景深发散流光。
  
### 已解决 17: 管理后台极陈旧无序、分时线展现聚合失真
**状态**: 已于最新重构中完成。
**修复方式**:
- `admin/page.tsx` 完全换用侧翼定锚的 Tab 并发导航，让市场规则配置、新闻操控、AI 重载各安其位；辅佐极其圆滑的流体边距风格封装原生下拉窗和操控钮。
- `StockChart` 抛弃局部分流表现，强化拉取切片深度以 360 Ticks 全涵盖最新轮转，配以最高饱和的底部映射填充块让分时更加波澜起伏。

### 已解决 18: 创建赛季只有日期，没有具体时间
**状态**: 已于 2026-03-29 完成。
**修复方式**:
- `apps/web/src/app/(main)/admin/page.tsx` 中的赛季表单改为 `datetime-local`。
- 前端新增开始/结束时间必填校验，以及“结束时间必须晚于开始时间”的提示。
- 后端 `SeasonService.createSeason()` 增加时间合法性校验，避免无效时间入库。

### 已解决 19: 创建赛季后看不到赛季，排行榜也不显示
**状态**: 已于 2026-03-29 完成。
**问题根因**:
- 原来的 `createSeason()` 只把旧赛季 `isActive=false`，没有结算，所以不会生成 `season_records`。
- 排行榜页错误地把 `/seasons/:id/results` 当成当前赛季榜单来源，因此新赛季一直空白。
**修复方式**:
- `SeasonService.createSeason()` 现在会先 `endSeason()`，写入旧赛季结算结果后再创建新赛季。
- 赛季结算前会统一过期未成交挂单，避免跨赛季数据污染。
- `apps/web/src/app/(main)/leaderboard/page.tsx` 改为使用 `/leaderboard/return` 和 `/leaderboard/assets`。
- `apps/server/src/modules/leaderboard/leaderboard.service.ts` 增加当前赛季实时榜单刷新逻辑。
- 管理后台和个人页补上当前赛季与赛季列表展示。

### 已解决 20: 设置了头像仍然不显示
**状态**: 已于 2026-03-29 完成。
**问题根因**:
- 前端多个页面虽然拿到了 `avatarUrl`，但仍在显示用户名首字母。
- nginx 原先没有代理 `/uploads`，通过 `http://localhost` 打开时图片请求会落到前端服务。
- 服务端上传目录原本在容器内部，重建后文件会丢失。
**修复方式**:
- 新增 `apps/web/src/components/shared/UserAvatar.tsx`，并接入 TopBar、个人页、动态页和排行榜。
- `docker/nginx/nginx.conf` 新增 `/uploads/` 反向代理到后端。
- `docker-compose.yml` 为 `/app/apps/server/uploads` 增加 `server_uploads` 持久化卷。

### 已解决 23: 个人资料页过于简陋，且无法在页内更换头像
**状态**: 已于 2026-03-29 完成。
**修复方式**:
- `apps/web/src/app/(main)/profile/page.tsx` 重构为更接近 Apple 风格的资料总览页，整合头像、昵称、账户表现和赛季历史。
- `apps/web/src/components/shared/ImageUploader.tsx` 现在支持资料页场景，可根据 `defaultImage` 变化回显并在重置资料时恢复显示。
- `apps/web/src/stores/auth-store.ts` 新增 `updateUser()`，资料保存后可同步刷新本地登录态。
- `apps/server/src/modules/user/dto/update-me.dto.ts` 新增资料更新 DTO；`UserService.updateMe()` 补上用户名唯一性检查和更明确的错误返回。

### 已解决 24: 服务重启后新闻一直不更新
**状态**: 已于 2026-03-29 完成。
**问题根因**:
- `NewsPublisherService` 原先为 Bull 延迟发布任务使用固定 `jobId`：`news-publish:${cycle}:${index}`。
- `MarketStateService` 在服务重启后会从 `cycleCount = 0` 重新计数，而 Bull 会保留最近一批 completed jobs。
- 结果是重启后的新发布任务会与 Redis 中旧任务发生 `jobId` 冲突，看起来像“已调度”，实际没有重新入队，导致新闻页长时间不更新。
**修复方式**:
- `NewsPublisherService` 启动时新增进程级 `schedulerRunId`。
- 自动发布任务 ID 改成 `news-publish:${schedulerRunId}:${cycle}:${index}`，彻底避免跨重启冲突。
- 已通过本地 Docker 重建、Redis delayed job 检查、服务日志和 `/api/news/latest` 返回结果验证修复生效。

### 已解决 18: AI 上游偶发 `fetch failed` 时缺少超时 / 重试 / 健康状态
**状态**: 已于 2026-03-28 完成第一轮稳定性加固。
**修复方式**:
- `AIService` 统一接管上游调用，加入超时、最多 2 次重试、指数退避和随机抖动，默认总共最多尝试 3 次。
- 新增 `AIHealthService`，把最近成功/失败、连续失败次数、最近耗时、最近错误等状态写入 Redis，避免服务重启后丢失。
- `GET /api/admin/ai/settings` 现在会返回 `requestTimeoutMs / maxRetries / retryBaseDelayMs / health`，`GET /api/admin/engine/status` 也会返回 `aiStatus / aiConsecutiveFailures`。
- 2026-03-28 22:34 CST 本地验证时，后台 AI 健康状态为 `healthy`，最近一次成功耗时约 1921ms。

### 已解决 19: 市场前端文案过度修饰，不够直接
**状态**: 已于 2026-03-28 完成。
**修复方式**:
- 首页、个股页、新闻页、新闻详情、持仓页、排行榜、交易弹窗、图表说明、导航和登录注册页的文案已统一改成“状态 / 动作 / 结果”导向。
- 去掉“龙头 / 异动 / 事件线索 / 次日复盘 / 做多 / 离谱 / 开启这无聊的一天”等修饰性或内部化表达。
- `SentimentTag` 去掉表情，事件类新闻统一显示“事件新闻”，回顾类显示“结果回顾”，交易弹窗统一使用“买入 / 卖出 / 预计金额 / 预计股数 / 可用资金 / 可卖股数”。

### 已解决 21: 股票价格整体过于同步，长期像围着一条水平线抖动
**状态**: 已于 2026-03-29 完成第一轮行情真实性升级。
**修复方式**:
- 新增 `MarketRegimeService`，把市场拆成 `bull / neutral / bear` 三种阶段，并按多个开盘周期自动切换。
- 每个阶段会抽取领涨与承压板块，让不同板块在同一轮行情里出现分化，不再所有股票一起同涨同跌。
- 新增 `stock-behavior.ts` 与 `trend-engine.ts`，给不同股票分配稳健复利、防御、高贝塔、妖股、反转等画像，并保存趋势记忆。
- `PriceSynthesizer` 现在会把市场阶段、板块角色、个股画像、随机波动、均值回归和新闻冲击一起纳入价格生成。
- `GET /api/market/status` 已返回 `regime`，`GET /api/admin/engine/status` 已返回 `marketRegime`，便于后续前台展示和后台观测。

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
GET    /api/market/display-settings
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
GET    /api/admin/ai/settings
POST   /api/admin/ai/settings
POST   /api/admin/ai/test
GET    /api/admin/display-settings
POST   /api/admin/display-settings
POST   /api/admin/market/pause
POST   /api/admin/market/resume
POST   /api/admin/market/durations
POST   /api/admin/news/generate
POST   /api/admin/news/publish
POST   /api/admin/news/manual
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
docker compose -f docker-compose.dev.yml up -d  # 只启动 PG(9532) + Redis(9579)
pnpm dev:server                                   # 后端 :3001
pnpm dev:web                                      # 前端 :3000

# 生产部署
cp env.production.example .env                    # 配置环境变量
docker compose build                              # 构建镜像
docker compose up -d                              # 启动 5 容器
docker compose exec server node dist/database/seeds/run-seed.js  # 首次种子

# 默认端口 (可通过 .env 覆盖)
# NGINX_PORT=9500   (入口)
# WEB_PORT=9510     (Next.js)
# SERVER_PORT=9511  (NestJS)
# POSTGRES_PORT=9532
# REDIS_PORT=9579

# 环境变量
DATABASE_PASSWORD=xxx    # 数据库密码
JWT_SECRET=xxx          # JWT 密钥 (≥32字符)
ADMIN_EMAIL=xxx         # 管理员邮箱
AI_API_KEY=xxx          # AI API key (可选，无则用模板新闻)
AI_REQUEST_TIMEOUT_MS=15000      # AI 单次请求超时，默认 15000ms
AI_MAX_RETRIES=2                 # AI 失败后的额外重试次数，默认 2
AI_RETRY_BASE_DELAY_MS=800       # AI 重试退避基准延迟，默认 800ms
NEXT_PUBLIC_API_URL=http://YOUR_IP:9500  # 前端API地址
CORS_ORIGIN=http://YOUR_IP:9500          # CORS
```

---

## 10. 下一步待做清单 (优先级排序)

1. **[高] 行情参数后台可调** — 让管理员可配置 `bull / neutral / bear` 持续周期、强度和个股画像映射，便于调玩法
2. **[高] 行情观测面板** — 后台补充当前阶段历史、切换日志、各板块表现和涨跌分布，便于调优
3. **[中] 价格行为回归测试** — 补阶段切换、板块轮动、稳健股与高弹性股差异的集成测试，避免后续调参把行情打回”一起横盘”
4. **[中] AI 上游 provider 级告警** — 在现有 timeout / retry / circuit breaker 基础上补外部告警与更明确的降级策略
5. **[低] 响应式优化** — 移动端细节适配

已在 v0.1.2 完成:
- ~~主题细节打磨~~ — 安全加固、前端无障碍、错误处理、加载状态已补齐
- ~~K 线图表~~ — 已重构为国内炒股平台风格（分时双色面积 + 均价线 + 昨收基线）
- ~~端口冲突~~ — 默认端口已改为 9500 系列，可通过环境变量覆盖

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
