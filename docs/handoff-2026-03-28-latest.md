# MockTrade 最新交接说明

> 更新时间: 2026-03-29
> 适用场景: 在新窗口继续接手本仓库开发

## 这轮已完成

> 以下为 2026-03-29 完成的新闻自动发布修复：

- **修复服务重启后新闻不再自动更新**：
  - 根因是 `NewsPublisherService` 先前为 Bull 延迟发布任务使用固定 `jobId`：`news-publish:${cycle}:${index}`。
  - `MarketStateService` 在服务重启后会从 `cycleCount = 0` 重新计数，而 Bull 的 `removeOnComplete: 50` 会保留最近完成过的一批 job。
  - 结果是重启后新周期生成的任务 ID 会撞上 Redis 里还没清掉的旧 completed job，日志看起来像“已经调度”，实际并没有重新入队执行。
  - 现已改为在 `NewsPublisherService` 启动时生成一次 `schedulerRunId`，新的 job ID 形如 `news-publish:${schedulerRunId}:${cycle}:${index}`，从根上避开跨重启冲突。
  - 已于本地通过 `pnpm --filter server build`、`docker compose up -d --build server`、`curl http://localhost/api/news/latest` 和服务日志验证，新闻会在重启后继续正常发布。

> 以下为 2026-03-29 完成的最新行情真实性升级：

- **市场阶段切换**：
  - 新建 `MarketRegimeService`，市场会在 `bull / neutral / bear` 三种阶段间按多个开盘周期轮换。
  - `bull` 时整体涨多跌少，`bear` 时整体跌多涨少，`neutral` 更接近震荡；阶段持续越久，偏向越明显。

- **板块轮动**：
  - 每个阶段会抽取领涨板块与承压板块，同一市场里不同板块开始出现分化，不再所有股票一起横着抖。

- **个股性格画像**：
  - 新建 `stock-behavior.ts`，为股票映射 `steadyCompounder / defensiveGrower / cyclicalMover / highBeta / memeRocket / turnaround` 等画像。
  - 稳健股更容易慢慢走趋势，高弹性股更容易过山车、跳涨和跳水。

- **趋势记忆引擎**：
  - 新建 `trend-engine.ts`，为每只股票维护长期锚点和短波段趋势，让价格可以连续涨一段、跌一段。

- **价格合成升级**：
  - `PriceSynthesizer` 现在把市场阶段、板块角色、个股画像、随机波动、均值回归和新闻冲击叠加生成价格。

- **状态接口补强**：
  - `GET /api/market/status` 现在会返回 `regime`，包含当前阶段、中文标签、剩余周期、强度以及领涨 / 承压板块。
  - `GET /api/admin/engine/status` 现在会返回 `marketRegime`，便于后台观察当前行情阶段。

- **前端阶段可视化**：
  - 首页新增 `MarketRegimePanel`，直接展示当前市场阶段、阶段强度、领涨板块和承压板块。
  - 股票详情页会根据当前股票所属行业标记它是领涨板块、承压板块还是中性板块。
  - 管理后台总览页新增当前行情阶段面板，顶栏状态角标会显示简版阶段标签。

- **前端 Docker 构建稳定化**：
  - 移除 `next/font/google` 的 `Inter` 在线拉取，改成 Apple 风格系统字体栈。
  - 解决此前 `docker compose build web` 偶发卡在 `fonts.gstatic.com` 的问题。

- **K 线 / 分时图颗粒度修正**：
  - 后端 `KLineService` 新增 `tick` 分辨率，按每次价格跳动输出一组；逐跳 K 线的 `open` 取上一跳价格，这样单跳涨跌能在 K 线上直接看出来。
  - `1m` 现已改成真实按时间分桶，不再是“固定 10 条 tick 合成一根”的伪分钟线。
  - 前端 `StockChart` 改为 `逐跳 / 1分 / 5分 / 15分`，分时图与 K 线共用同一套数据，`逐跳` 时会打开秒级时间轴。
  - 首页 `Sparkline` 也改为读取逐跳数据，迷你走势线会更贴近真实波动节奏。

- **个人资料页重构与头像更换**：
  - 个人页已重做为更完整的 Apple 风格资料页，拆成资料总览、编辑区、账户表现和赛季历史四个区域。
  - 用户现在可以在个人页直接更换头像并修改昵称，不再只能在注册时上传头像。
  - 前端 `auth-store` 新增 `updateUser()`，资料保存后会同步刷新顶部导航、排行榜、动态页和评论区中的头像与昵称。
  - 后端 `PATCH /api/users/me` 已补上 DTO 校验和用户名唯一性检查，昵称冲突会返回明确错误，不再冒数据库原始异常。

> 以下为 2026-03-29 完成的 v0.1.0 功能补完：

- **Bull 队列可观测性**：
  - 新建 `news-queue-stats.service.ts`，后端新增 `GET /api/admin/news/queue-stats` 返回 buffer/scheduler 两个队列的 waiting/active/delayed/completed/failed 统计。
  - 管理后台仪表盘 Tab 新增队列监控面板。

- **AI 上游熔断 / 手动恢复**：
  - `AIHealthService` 新增 `isCircuitOpen()`（连续失败 ≥5 次触发）和 `resetHealth()` 方法。
  - `AIService.executeWithRetry` 开头加入熔断短路检查。
  - 后端新增 `POST /api/admin/ai/reset-health` 端点。
  - 管理后台 AI 区块新增"手动恢复 AI"按钮（仅在 `down` 时显示）。

- **首页新闻跑马灯 (NewsTicker)**：
  - 新建 `NewsTicker.tsx`，CSS 动画无限循环滚动最新 8 条新闻标题。

- **股票迷你走势线 (Sparkline)**：
  - 新建 `Sparkline.tsx`，纯 SVG polyline，自动涨跌着色。
  - 首页每只股票卡片右上角展示最近 20 个 K 线数据走势。

- **WebSocket 新闻推送 Toast**：
  - 新建 `NewsToast.tsx`，底部浮动通知 4s 自动消失。
  - `layout.tsx` 新增 `news:published` WebSocket 事件监听。

- **排行榜实时化**：
  - `TradeService` 在市价买/卖和限价单成交后异步调用 `LeaderboardService.updateAssets()`。
  - `TradeModule` 新增导入 `LeaderboardModule`。

- **管理后台增强**：
  - 后端新增 `GET /api/admin/users`（分页用户列表）和 `GET /api/admin/stats`（全站统计：用户数/订单数/成交额）。
  - `AdminModule` 新增 `UserEntity`/`OrderEntity` TypeORM 注入。
  - 管理后台新增用户管理 Tab 和系统统计卡片。

- **项目文档**：
  - 新建 `README.md`（中文）、`README_EN.md`（英文）、`CHANGELOG.md`。

- **构建验证**：`@mocktrade/shared` + `server` + `web` 全部编译通过，12 路由生成。

> 以下为本轮之前已完成的所有工作（保留原始记录）：

- **前端注册/登录多端界面高级化重铸 (Apple/Claude风)**：
  - 彻底抛弃由固定数字 1~8 组成的干瘪头像框。新增了 `<ImageUploader />` 并对接后端上传落库。
  - 对 `/login` 和 `/register` 进行去边框化、加入极致玻璃态及背景光晕重塑。
- **多维度 K 线图交互 (K-Line Enhancements)**：
  - 图表现已进一步校正为 `逐跳 / 1分 / 5分 / 15分` 四档，其中 `逐跳` 对应每次价格变化，`1分` 为真实分钟线，不再使用伪日线/周线/月线名称误导玩家。
- **全新三大排行榜趣味系统**：
  - 从纯单一维度剥离，在 `/leaderboard` 分设“收益战神榜🏆”、“资本大鳄榜💰”和带有反向查询（`order: 'asc'`）支撑下寻找垫底选手的“破产惨剧榜📉”。
- **股票详情浏览动线改造**：
  - 彻底拆除了下方 Tab 的遮掩，极大提高了对于公司特色/虚拟介绍的人设文本曝光率，并采用了直接的信息瀑流列布新闻。
- **管理后台 (Admin) 全盘重写**：
  - 退役原本无重点大杂烩的一拉到底长表单，拆解建立由带流畅动画效果的垂直 Tabs 左栏配合多视图的内容大屏。
  - 加入对开关、表单、提示器的新世代拟物金融卡片封装。
- **全站极简/轻量化 Apple 风格视觉迭代 (Light & Dark Themes)**:
  - 抛弃早期的粗边霓虹光效 (Glow) 与暗黑锁定，在 `globals.css` 中写入全套支持深浅双主题切换的变量，采用克制的 iOS Stocks 质感（无干扰阴影、留白巨大）。
  - `TopBar` 中原生集成了日夜模式切换按钮（基于 `next-themes` 和系统偏好跟随）。
  - 各大核心版块（如 `page.tsx` 的卡片与 `TradeModal` 等）退去色块填充，以高级软边距和严谨高对比字体为主导，数字全息 `tabular-nums` 防抖对齐。
- **前端 UI 全局重构 (Modern Finance Dashboard)**:
  - `globals.css` 和 `tailwind.config.ts` 引入了细致的微渐变霓虹涨跌色 (`#ef4444` 和 `#10b981`) 以及针对涨跌的发光阴影/文字特效 (`shadow-glow-up`等)。
  - `TopBar` 和 `BottomNav` 升级为 Glassmorphism (`backdrop-blur-xl` + 半透明背景)。
  - 首页 `page.tsx` 完全重写，增加了环境聚光灯渐变反射、卡片悬浮浮起等现代金融交互体验。
  - `PriceDisplay.tsx` 引入 `tabular-nums` 并在价格变动时自动触发背景闪烁和发光动画，强化看盘体验。
  - 股票详情页接入了全新的 `TradeModal` 高级交易弹窗，实现了类似真实炒股软件的全仓半仓一键选择、按股数/金额双向自动折算与输入防呆系统。
- 新闻系统改为两段式:
  - 当日发布 `event` 事件新闻，只给线索，不公开真实涨跌。
  - 下一交易日自动生成 `recap` 复盘新闻，再公布实际涨跌。
- 新闻接口不再把股票 UUID 直接暴露给前端展示，改为返回 `relatedStocks`（股票名 + 代码）。
- 事件新闻的公开标签不再显示“利好 / 利空”，统一改成中性的“事件线索”。
- 新闻中心的筛选入口也同步改成“事件线索 / 次日复盘 / 突发 / 搞笑”，避免剧透方向。
- 管理后台新增 AI 运行时配置，可以设置 provider、API Base URL、模型、API Key 并测试连接。
- AI 上游调用稳定性已完成第一轮加固:
  - `AIService` 统一加入了 timeout、最多 2 次重试、指数退避和随机抖动。
  - 新增 `AIHealthService`，把最近成功/失败、最近错误、最近耗时、连续失败次数写进 Redis。
  - `GET /api/admin/ai/settings` 会返回 `requestTimeoutMs / maxRetries / retryBaseDelayMs / health`。
  - `GET /api/admin/engine/status` 会返回 `aiStatus / aiConsecutiveFailures`。
  - 2026-03-28 22:34 CST 本地验证时，AI 健康状态为 `healthy`。
- 管理后台新增全站涨跌配色设置:
  - 默认 `红涨绿跌`
  - 可切换成 `绿涨红跌`
- 前端把涨跌颜色改成全局 CSS 变量驱动，管理员切换后全站统一生效。
- 股票详情图表重新调整:
  - 默认展示更像股票软件的分时线
  - 仍可切换到 K 线
  - 增加开盘参考线、MA5、MA20、成交量
- AI 新闻生成链路已加固:
  - 不再是“模型文本 -> 直接 `JSON.parse` -> 失败即模板 fallback”
  - 现在会先提取 JSON 候选、修正常见格式问题、做字段归一化
  - 失败后再走一次低温 JSON 修复器和一次低温重试
  - 只有全部修复都失败，或 AI 上游本身 `fetch failed` 时，才 fallback 模板新闻
- Bull 队列已真实接入:
  - `news-buffer` 负责待发布新闻缓冲
  - `news-scheduler` 负责开盘周期内的延迟发布 job
  - 启动时会自动把旧 Redis `news:pending` 迁入 Bull
- 股票详情与交易节奏体验问题已修复:
  - 休市 / 结算期间股价不再继续变化
  - 开市 / 休市剩余时间现在可见
  - K 线 / 分时线里会显示历史买卖点箭头
  - 股票详情的相关新闻不再长期显示“暂时还没有相关新闻”
- 手动事件新闻后台已进一步补强:
  - `impactPercent` 输入上限已放宽到 100%，但真实生效值仍会按涨跌停和事件上限自动收敛
  - 普通新闻 / 手动事件 / 发布新闻在请求过程中都会先显示“正在生成 / 发布”的明确文案
  - 新加入的手动事件会优先显示在待发布队列预览顶部
- 市场前台与登录注册页文案已做一轮“说人话”清理:
  - 首页、个股页、新闻页、持仓页、排行榜、交易弹窗、导航和登录注册页都改成了更直接的中文。
  - 去掉了“龙头 / 异动 / 事件线索 / 次日复盘 / 做多 / 离谱”等过度修饰表达。
  - 事件类新闻统一显示“事件新闻”，回顾类显示“结果回顾”。
- 赛季链路已补完整:
  - 管理后台创建赛季改为支持具体到分钟的开始/结束时间，不再只有日期。
  - `SeasonService.createSeason()` 现在会先结算当前赛季，再创建新赛季；旧赛季结果会写入 `season_records`。
  - 赛季结算时会先把旧赛季未成交挂单统一过期，避免跨赛季串单。
  - 管理后台新增“当前赛季 / 全部赛季”展示，个人页会显示当前赛季名称和时间范围。
- 排行榜已改为当前赛季实时榜:
  - 前端不再错误读取 `/seasons/:id/results` 作为当前排行榜。
  - 后端会在读取当前赛季榜单前即时刷新 Redis 排名。
  - `leaderboard/page.tsx` 现在同时显示当前赛季时间、用户头像、总资产和收益率。
- 头像显示链路已补齐:
  - 新增共享组件 `UserAvatar`，TopBar、个人页、动态页和排行榜都优先显示真实头像。
  - nginx 已代理 `/uploads/` 到后端，`http://localhost/uploads/...` 可直接访问头像。
  - Docker Compose 为服务端上传目录新增 `server_uploads` volume，重建或重启容器后头像文件仍会保留。
- 个人资料编辑链路已补齐:
  - `apps/web/src/app/(main)/profile/page.tsx` 现支持头像上传预览、昵称编辑和资料保存。
  - `apps/web/src/components/shared/ImageUploader.tsx` 支持响应 `defaultImage` 变化，适合用于资料页回显与重置。
  - `apps/server/src/modules/user/dto/update-me.dto.ts` 负责 `PATCH /api/users/me` 的资料校验。
- 本地 Docker 已按最新代码重建验证通过:
  - `http://localhost` 正常
  - `http://localhost/api/health` 返回 healthy
  - `http://localhost/api/market/status` 返回市场状态和倒计时
  - `GET /api/market/stocks/:id/kline?resolution=tick` 返回逐跳数据，时间戳精确到秒级
  - `GET /api/market/stocks/:id/kline?resolution=1m` 返回真实整分钟时间桶
  - `http://localhost/profile` 返回 200
  - `GET /api/admin/ai/settings` 返回 `healthy`
  - `POST /api/admin/news/manual` 在 `impactPercent=21` 时可成功入队
  - `/api/admin/news/queue` 会立即看到新的手动事件排在预览首位
  - `POST /api/seasons` 创建带具体时间的新赛季后，旧赛季 `/api/seasons/:id/results` 能立即看到结算记录
  - `POST /api/upload/avatar` 返回的 `/uploads/...` 地址可通过 nginx 访问
  - 重启 `server` 容器后，刚上传的测试头像仍可访问

## 关键文件

- 后端行情真实性
  - `apps/server/src/modules/market/engine/stock-behavior.ts`
  - `apps/server/src/modules/market/engine/trend-engine.ts`
  - `apps/server/src/modules/market/market-regime.service.ts`
  - `apps/server/src/modules/market/kline.service.ts`
  - `apps/server/src/modules/market/engine/price-synthesizer.ts`
  - `apps/server/src/modules/market/engine/tick-scheduler.ts`
  - `apps/server/src/modules/market/market.controller.ts`
  - `apps/server/src/modules/admin/admin.controller.ts`
  - `apps/server/src/modules/market/market.module.ts`
- 前端行情阶段可视化
  - `apps/web/src/lib/market-regime.ts`
  - `apps/web/src/components/shared/MarketRegimePanel.tsx`
  - `apps/web/src/components/shared/MarketStatusBadge.tsx`
  - `apps/web/src/stores/market-store.ts`
  - `apps/web/src/app/(main)/layout.tsx`
  - `apps/web/src/app/(main)/page.tsx`
  - `apps/web/src/app/(main)/stock/[id]/page.tsx`
  - `apps/web/src/app/(main)/admin/page.tsx`
- 前端构建稳定化
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/globals.css`
- 后端显示设置
  - `apps/server/src/modules/market/display-settings.service.ts`
  - `apps/server/src/modules/market/market.controller.ts`
  - `apps/server/src/modules/admin/admin.controller.ts`
  - `apps/server/src/modules/admin/dto/update-display-settings.dto.ts`
- 后端 AI 稳定性
  - `apps/server/src/modules/ai/ai.service.ts`
  - `apps/server/src/modules/ai/ai-health.service.ts`
  - `apps/server/src/modules/ai/ai-settings.service.ts`
  - `apps/server/src/modules/ai/ai.module.ts`
- 前端显示设置与UI优化
  - `apps/web/src/lib/market-display.ts`
  - `apps/web/src/app/providers.tsx`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/(main)/admin/page.tsx`
  - `apps/web/src/app/(main)/page.tsx` (完全重写的 Dashboard)
  - `apps/web/src/components/layout/TopBar.tsx`
  - `apps/web/src/components/layout/BottomNav.tsx`
  - `apps/web/src/components/shared/PriceDisplay.tsx` (数字跳动动效)
  - `apps/web/src/components/shared/TradeModal.tsx` (高级双轨交易弹窗)
- 新闻防剧透
  - `apps/web/src/components/shared/SentimentTag.tsx`
  - `apps/web/src/app/(main)/news/page.tsx`
  - `apps/web/src/app/(main)/news/[id]/page.tsx`
  - `apps/web/src/app/(main)/stock/[id]/page.tsx`
  - `apps/server/src/modules/news/news.controller.ts`
- 新闻时序与复盘
  - `apps/server/src/modules/news/news-publisher.service.ts`
  - `apps/server/src/modules/market/engine/event-impact.ts`
  - `apps/server/src/entities/news.entity.ts`
- Bull 队列与 JSON 修复
  - `apps/server/src/app.module.ts`
  - `apps/server/src/modules/news/news.module.ts`
  - `apps/server/src/modules/news/news.constants.ts`
  - `apps/server/src/modules/news/news-queue.processor.ts`
  - `apps/server/src/modules/news/news-generator.service.ts`
- 图表
  - `apps/web/src/components/shared/StockChart.tsx`
- 赛季 / 排行榜 / 头像
  - `apps/server/src/modules/season/season.service.ts`
  - `apps/server/src/modules/season/season.controller.ts`
  - `apps/server/src/modules/leaderboard/leaderboard.service.ts`
  - `apps/server/src/modules/trade/trade.service.ts`
  - `apps/server/src/modules/trade/limit-order-matcher.service.ts`
  - `apps/server/src/modules/user/user.controller.ts`
  - `apps/server/src/modules/user/user.service.ts`
  - `apps/server/src/modules/user/dto/update-me.dto.ts`
  - `apps/web/src/app/(main)/admin/page.tsx`
  - `apps/web/src/app/(main)/leaderboard/page.tsx`
  - `apps/web/src/app/(main)/profile/page.tsx`
  - `apps/web/src/components/shared/UserAvatar.tsx`
  - `apps/web/src/components/shared/ImageUploader.tsx`
  - `apps/web/src/lib/asset-url.ts`
  - `apps/web/src/stores/auth-store.ts`
  - `docker/nginx/nginx.conf`
  - `docker-compose.yml`
- 市场状态与股票详情
  - `apps/server/src/modules/market/market-state.service.ts`
  - `apps/server/src/modules/market/market.gateway.ts`
  - `apps/server/src/modules/trade/trade.controller.ts`
  - `apps/web/src/app/(main)/stock/[id]/page.tsx`

## 新增接口

- 公共接口（响应补强）
  - `GET /api/market/status` — 现返回 `regime`
- 公共接口
  - `GET /api/market/stocks/:id/kline` — 现支持 `tick / 1m / 5m / 15m`，兼容旧别名 `1d / 1w / 1M`
  - `GET /api/market/display-settings`
- 管理后台接口（响应补强）
  - `GET /api/admin/engine/status` — 现返回 `marketRegime`
- 管理后台接口
  - `GET /api/admin/ai/settings`
  - `POST /api/admin/ai/settings`
  - `POST /api/admin/ai/test`
  - `GET /api/admin/display-settings`
  - `POST /api/admin/display-settings`
  - `POST /api/admin/news/manual`
- 管理后台接口（新增）
  - `GET /api/admin/news/queue-stats` — 队列统计
  - `POST /api/admin/ai/reset-health` — 手动恢复 AI 健康
  - `GET /api/admin/users` — 分页用户列表
  - `GET /api/admin/stats` — 全站统计

## 已完成验证

- `pnpm --filter web exec tsc --noEmit`
- `pnpm --filter server build`
- `pnpm --filter web build`
- `docker compose up -d --build server`
- `docker compose up -d --build web`
- `docker compose ps web server` 显示 `mocktrade-web-1` 与 `mocktrade-server-1` 已于 2026-03-29 12:15 CST 重建启动
- `docker compose ps server` 显示 `mocktrade-server-1` 已于 2026-03-29 12:02 CST 重建启动
- `curl http://localhost/api/health` 返回 healthy
- `curl http://localhost/api/market/status` 返回 `regime`
- `curl http://localhost/api/admin/engine/status` 在管理员 token 下返回 `marketRegime`
- `curl -I http://localhost` 返回 `HTTP/1.1 200 OK`
- `pnpm --filter @mocktrade/shared build`
- `pnpm --filter server build`
- `pnpm --filter web build`
- `docker compose up -d --build`
- `docker compose ps`
- `curl http://localhost/api/health`
- `curl http://localhost/api/market/status`
- `curl http://localhost/api/seasons/current`
- `curl http://localhost/api/leaderboard/return`
- `POST /api/seasons` 创建带具体时间的新赛季
- `GET /api/seasons/:oldSeasonId/results` 返回结算记录
- `POST /api/upload/avatar` 后 `http://localhost/uploads/...` 可访问
- `docker compose restart server` 后测试头像仍可访问
- `GET /api/admin/ai/settings` returns `healthy`
- `GET /api/admin/engine/status` returns `aiStatus` and `aiConsecutiveFailures`
- `POST /api/admin/news/manual` with `impactPercent=21`
- `GET /api/admin/news/queue` shows the new manual item at the top
- Redis 中可见 `bull:news-buffer:*` 和 `bull:news-scheduler:*` 队列键
- 2026-03-29 构建验证
  - `pnpm --filter @mocktrade/shared build` ✅
  - `pnpm --filter server build` ✅
  - `pnpm --filter web build` ✅ (12 routes)

## 建议下一步

1. 给管理员补可调的阶段参数和个股画像配置，便于调玩法
2. 补后台更细的行情观测面板，包含阶段切换历史、各板块强弱和涨跌分布
3. 补行情行为回归测试，覆盖阶段切换、板块轮动、稳健股与高弹性股差异
4. 做一轮真实 UI 验收（深浅主题、管理后台、涨跌配色、响应式）
5. 生产环境部署前的安全审查（JWT Secret、CORS、Rate Limiting）

## 新对话建议 Prompt

```text
请接手 /Volumes/Leo/Projects/MockTrade 这个项目，先阅读以下文件再继续：
1. /Volumes/Leo/Projects/MockTrade/AGENTS.md
2. /Volumes/Leo/Projects/MockTrade/CLAUDE.md
3. /Volumes/Leo/Projects/MockTrade/docs/progress.md
4. /Volumes/Leo/Projects/MockTrade/docs/handoff-2026-03-28-latest.md

当前已完成的重要修复与更新：
- 前端已完成现代金融主题大重构，并且额外经历了一次“脱胎换骨般的高定极简风脱敏”——目前全站原生支持无缝日夜切换（Light & Dark），抛弃繁冗赛博色块，采用了彻底的 Apple / Claude 式干净白灰底、`shadow-soft` 弥散柔边，以及字重严密精排的排版设计规范。
- 新增真实证券级交易面板（弹窗），支持按金额/股数双向自动折算、资金不足防呆报错与全仓半仓快捷一键输入，并已做扁平化无感视觉处理。
- 新闻改为 event / recap 两段式，当日不再公开真实涨跌
- 新闻详情不再显示 UUID，而是股票名和代码
- 公开事件新闻不再显示利好/利空标签，避免剧透
- 管理后台支持 AI 运行时配置
- AI 上游 `fetch failed` 已完成第一轮稳定性加固，现已接入 timeout、retry、backoff 和 Redis 健康状态记录
- 管理后台支持全站涨跌颜色模式切换，默认红涨绿跌，可切换绿涨红跌
- 股票详情图表默认改为更像股票软件的分时线，并保留 K 线
- Bull 队列已真实接入新闻系统
- AI 新闻 JSON 已改为本地修复 + JSON 修复器 + 低温重试链路
- 市场前台和登录注册页的文案已清理成直白中文
- 休市不再继续变价，股票详情已显示开休市倒计时
- K 线已显示历史买卖点，股票详情相关新闻也已恢复
- 手动事件新闻支持更大输入幅度，且本地 Docker 已验证 `impactPercent=21` 可正常入队并显示在队列预览中
- 市场价格引擎已升级为“市场阶段 + 板块轮动 + 个股性格 + 趋势记忆 + 新闻冲击”分层模型
- `GET /api/market/status` 已返回 `regime`，`GET /api/admin/engine/status` 已返回 `marketRegime`
- 首页、股票详情页、管理后台和顶栏已可直接看到当前市场阶段与板块轮动信息
- 前端已移除 Google Fonts 外网依赖，`docker compose up -d --build web` 可稳定完成

请先检查当前工作区变更、确认 Docker 运行状态与最近构建结果，然后继续处理剩余高优先级问题。优先关注：
1. 行情参数后台可调 / 观测能力补强
2. 行情行为回归测试
3. 任何我在新对话里继续补充的问题
```
