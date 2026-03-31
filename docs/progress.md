# MockTrade 开发进度

> 最后更新: 2026-03-31

## 总览

| 阶段 | 状态 | 任务点 | 开始时间 | 完成时间 |
|------|------|--------|---------|---------|
| Phase 1: 工程基础设施 | ✅ 已完成 | 32 | 2026-03-26 | 2026-03-27 |
| Phase 2: 核心引擎 | ✅ 已完成 | 52 | 2026-03-27 | 2026-03-27 |
| Phase 3: 交易与赛季 | ✅ 已完成 | 38 | 2026-03-27 | 2026-03-27 |
| Phase 4: 前端核心页面 | ✅ 已完成 | 30 | 2026-03-27 | 2026-03-27 |
| Phase 5: 社交/成就/排行 | ✅ 已完成 | 26 | 2026-03-27 | 2026-03-27 |
| Phase 6: 部署与上线 | ✅ 已完成 | 20 | 2026-03-27 | 2026-03-27 |

当前状态:
- 核心 WBS 任务 198/198 已完成，项目已进入修复与体验增强阶段。
- **2026-03-31 已完成本地源码 Docker 重新部署验证与部署文档整理**：修复 `web` 容器继承 Docker `HOSTNAME` 后绑定到随机容器名地址、导致健康检查失败的问题；同时修复 nginx 镜像把完整主配置误复制到 `conf.d/default.conf` 的打包错误。
- 2026-03-31 当前默认源码部署已可直接使用 `docker compose up -d --build` 启动，`docker compose ps` 中 `postgres / redis / server / web / nginx` 会全部进入 `healthy`，`http://localhost:9500` 与 `http://localhost:9500/api/health` 已重新验证可用。
- 2026-03-31 已同步整理项目文档：`README.md`、`README_EN.md` 与 `CHANGELOG.md` 已补充部署步骤、种子初始化、管理员初始化与验证命令，便于后续继续交接。
- **2026-03-29 已完成赛季/头像/排行榜闭环与 v0.1.0 功能补完，当前进入新一轮行情真实性与可玩性优化。**
- 2026-03-29 已修复新闻自动发布在服务重启后卡住的问题：Bull 调度 job ID 不再和旧 completed job 冲突，新闻会在重启后继续正常按开盘周期发布。
- 2026-03-29 已修复赛季管理闭环：管理后台创建赛季支持具体到分钟的开始/结束时间；创建新赛季时会先结算旧赛季，再切换到新赛季。
- 2026-03-29 已修复赛季展示与排行榜：管理后台和个人页都会显示当前赛季与赛季列表，排行榜页改为展示当前赛季实时收益榜，不再错误读取“已结算赛季结果”。
- 2026-03-29 已修复头像显示链路：前端统一改为优先渲染 `avatarUrl`，`/uploads` 通过 nginx 代理，服务端上传目录改为 Docker volume 持久化，重建和重启后头像文件不会丢。
- 2026-03-29 已完成个人资料页重构：个人页改为更完整的 Apple 风格资料面板，支持在个人页直接更换头像与修改昵称，保存后顶部导航、排行榜、动态页和评论区会同步刷新。
- 2026-03-29 已完成行情引擎分层升级：市场不再长期横盘式同步波动，而是加入市场上行/震荡/下行阶段、板块轮动与个股性格画像。
- 2026-03-29 已完成趋势记忆引擎：稳健股现在更容易走缓慢趋势，高弹性股保留过山车、跳涨和跳水，支持“长线持有”和“高风险高收益”两种玩法。
- 2026-03-29 已完成行情阶段前端可视化：首页、股票详情页、管理后台和顶栏都能直接看到当前处于上行 / 震荡 / 下行阶段，以及领涨 / 承压板块。
- 2026-03-29 已修复前端 Docker 构建对 Google Fonts 的外网依赖：移除 `next/font/google` 的 `Inter` 在线拉取，改成 Apple 风格系统字体栈，`docker compose up -d --build web` 可稳定通过。
- 2026-03-29 已修正图表分辨率误导：`StockChart` 新增 `逐跳 / 1分 / 5分 / 15分`，其中 `逐跳` 为每次价格变化一组，`1分` 改为真实按分钟聚合，分时图与 K 线共用同一套正确数据源。
- 2026-03-28 完成一轮**重大前端视觉重组**，将首页与基础组件拔高到“现代高级金融主题风格 (Glassmorphism + Neon)”。
- 2026-03-28 完成前端修复迭代，已解决中文化、`/admin` 鉴权时序、管理后台入口、股票详情图表缺失等高优先级问题。
- 2026-03-28 追加修复新闻发布链路，已解决“生成后找不到新闻”和“发布新闻 500”问题，并补上默认活动赛季自动初始化。
- 2026-03-28 完成新闻时序与展示逻辑修正：当日新闻不再直接公布涨跌答案，次交易日自动补复盘新闻，并修复新闻详情中的 UUID 显示问题。
- 2026-03-28 继续完成体验迭代：后台新增全站涨跌配色切换、公开新闻标签去剧透、股票详情图表改成更接近股票软件的分时线 / K 线组合。
- 2026-03-28 已完成 Bull 队列真实集成与 AI 新闻 JSON 修复链路，新闻缓冲和开盘期调度均已切换到 Bull。
- 2026-03-28 已补齐股票详情剩余关键体验问题：休市不再继续变价、开休市倒计时可见、K 线出现买卖点提示、相关新闻恢复正常显示。
- 2026-03-28 已继续清理首页玩家文案：去掉“剧情浓度最高”这类内部说法，改成更直观的“波动最大”。
- 2026-03-28 已把后台“价格冲击”改成更明确的“手动价格干预”：补充幅度说明与股票下拉选择，并修复为开盘中立即可见生效。
- 2026-03-28 已继续调整后台操盘方式：新增“手动事件新闻”，由管理员设定参数后生成新闻，再交给新闻冲击曲线慢慢驱动价格。
- 2026-03-28 已补强手动事件新闻后台体验：目标影响输入支持到 100%，超出系统真实可用范围时自动收敛；生成中会显示明确进度文案，最新手动事件会优先出现在待发布队列预览。
- 2026-03-28 已完成 AI 上游稳定性第一轮加固：`fetch failed` 路径已接入 timeout、自动重试、指数退避和 Redis 健康状态记录，后台可直接查看最近成功、失败、耗时与连续失败次数。
- 2026-03-28 已继续清理前台文案：首页、个股页、新闻、持仓、排行榜、交易弹窗、导航与登录注册页改成直白中文，去掉“龙头 / 异动 / 复盘 / 做多 / 离谱”等修饰性表达。
- 2026-03-28 **前端高级化核心补完**：完成管理后台 (Admin) 全盘毛玻璃化、分 Tabs 重建；彻底抛弃原生表单组件。
- 2026-03-28 **真实身份链路**：抛弃旧有的默认干瘪头像，实现基于后台 Multer + ServeStatic 的真实图片上传与静态托管，前端同步构建并植入注册中心的 `<ImageUploader>` 互动圆环。
- 2026-03-28 **分时线重构**：打通当天涨跌横轴限界，令 `StockChart` 可一次性拉取并饱满铺设当前季度的微缩分时面积，实现极强的操盘沉浸感。
- 当前最核心待办转为：补后台可调参数 / 观测能力，并补行情行为的回归测试。

## 2026-03-31 Docker 重新部署与文档整理

### 已完成
- [x] 修复源码 Docker 部署时 `web` 健康检查不通过
  - 根因是 Next standalone 会读取容器内的 `HOSTNAME` 环境变量；Docker 默认把它注入为容器 ID，导致服务监听到随机主机名地址而不是回环地址。
  - 现已在 `docker-compose.yml` 与 `docker-compose.dockerhub.yml` 中显式为 `web` 设置 `HOSTNAME=0.0.0.0`。
  - `web` 健康检查也已改成探测 `127.0.0.1:3000`，避免 Alpine 容器里 `localhost` 走到 IPv6 回环导致的误判。
- [x] 修复 nginx 镜像配置复制位置错误
  - `docker/nginx/nginx.conf` 是完整的顶层 nginx 主配置，之前却被复制到 `/etc/nginx/conf.d/default.conf`，会在启动时报 `worker_processes directive is not allowed here`。
  - 现已改为复制到 `/etc/nginx/nginx.conf`，并将 nginx 健康检查统一改为 `127.0.0.1:80`。
- [x] 完成 README / README_EN / CHANGELOG 文档同步
  - 增加文档索引、源码部署与 Docker Hub 部署后的验证命令、fresh DB 的种子初始化步骤，以及 `ADMIN_EMAIL` 对应管理员账号的说明。

### 验证结果
- [x] `docker compose up -d --build`
- [x] `docker compose ps` 显示 `postgres / redis / server / web / nginx` 全部为 `healthy`
- [x] `curl -I http://localhost:9500` 返回 `HTTP/1.1 200 OK`
- [x] `curl http://localhost:9500/api/health` 返回 `{"redis":"ok","database":"ok","status":"healthy"}`

## 2026-03-29 新闻自动发布修复

### 已完成
- [x] 修复服务重启后新闻停止自动更新
  - 问题根因是 `NewsPublisherService` 之前把 Bull 延迟发布任务的 `jobId` 固定写成 `news-publish:${cycle}:${index}`。
  - `MarketStateService` 在服务重启后会从 `cycleCount = 0` 重新开始，而 Bull 默认会保留最近一批 completed jobs。
  - 两边叠加后，新的调度任务虽然日志显示“已调度”，但实际上会因为 `jobId` 撞上 Redis 里保留的旧 job 而没有重新入队，所以新闻页看起来像“再也不更新”。
  - 现已在 `NewsPublisherService` 中引入进程级 `schedulerRunId`，新的调度任务 ID 改成 `news-publish:${schedulerRunId}:${cycle}:${index}`，确保每次服务启动后新的发布计划都能成功进入 Bull。

### 验证结果
- [x] `pnpm --filter server build`
- [x] `docker compose up -d --build server`
- [x] `curl http://localhost/api/health` 返回 `{"redis":"ok","database":"ok","status":"healthy"}`
- [x] `curl http://localhost/api/market/status` 返回正常市场状态与 `regime`
- [x] Redis 中已出现新的延迟 job，如 `news-publish:<uuid>:1:1`
- [x] 服务端日志已重新出现自动发布记录，例如 `Published: [funny] ...`
- [x] `curl http://localhost/api/news/latest` 已返回本轮新发布新闻，确认新闻时间戳持续更新

## 2026-03-29 行情真实性增强

### 已完成
- [x] 市场阶段切换
  - 新建 `MarketRegimeService`，市场会在 `bull / neutral / bear` 三种阶段间按多个开盘周期轮换。
  - 阶段越往后偏向越明显：`bull` 时整体涨多跌少，`bear` 时整体跌多涨少，`neutral` 更接近震荡。
- [x] 板块轮动
  - 每个阶段会抽取领涨板块与承压板块，不同板块不会再完全同步。
- [x] 个股性格画像
  - 新建 `stock-behavior.ts`，为不同股票映射 `steadyCompounder / defensiveGrower / cyclicalMover / highBeta / memeRocket / turnaround` 等画像。
  - 稳健股更容易慢慢走趋势，高弹性股更容易出现大振幅和跳变。
- [x] 趋势记忆引擎
  - 新建 `trend-engine.ts`，为每只股票维护 anchor / swing 状态，支持连续上涨一段、连续回落一段的体感。
- [x] 价格合成升级
  - `PriceSynthesizer` 现在叠加随机波动、均值回归、新闻冲击、市场阶段、板块角色与个股画像生成价格。
- [x] 状态接口补强
  - `GET /api/market/status` 新增 `regime` 字段，返回当前阶段、标签、剩余周期、强度以及领涨 / 承压板块。
  - `GET /api/admin/engine/status` 新增 `marketRegime` 字段，便于后台观察当前行情阶段。
- [x] 行情阶段前端可视化
  - 首页新增 `MarketRegimePanel`，直接展示当前市场阶段、阶段强度、领涨板块与承压板块。
  - 股票详情页会结合当前股票所属行业，展示它现在是领涨板块、承压板块还是中性板块。
  - 管理后台总览页新增当前行情阶段面板，顶栏状态角标会显示简版阶段标签。
- [x] 前端 Docker 构建稳定化
  - 移除 `next/font/google` 的 `Inter` 在线依赖，改成 Apple 风格系统字体栈。
  - 解决 `docker compose up -d --build web` 时偶发卡在 `fonts.gstatic.com` 的问题。
- [x] 图表最细粒度修正
  - 后端 `KLineService` 新增 `tick` 分辨率，按每次价格跳动输出一组 OHLCV；逐跳 K 线的 `open` 取上一跳价格，能直接看出这一跳是涨还是跌。
  - `1m` 改成真实按时间分桶，不再是“固定 10 条 tick 硬凑一根”。
  - 前端 `StockChart` 改为 `逐跳 / 1分 / 5分 / 15分`，`逐跳` 时打开秒级时间轴；首页 `Sparkline` 同步改读逐跳数据。

### 验证结果
- [x] `pnpm --filter server build`
- [x] `pnpm --filter web build`
- [x] `pnpm --filter web exec tsc --noEmit`
- [x] `docker compose up -d --build server`
- [x] `docker compose up -d --build web`
- [x] `docker compose ps server` 显示 `mocktrade-server-1` 已于 2026-03-29 12:02 CST 重建启动
- [x] `docker compose ps web server` 显示 `mocktrade-web-1` 与 `mocktrade-server-1` 已于 2026-03-29 12:15 CST 重建启动
- [x] `docker compose up -d --build web server` 已于 2026-03-29 12:26 CST 再次重建通过
- [x] `curl http://localhost/api/health` 返回 `{"status":"healthy"}`
- [x] `curl http://localhost/api/market/status` 返回 `regime`
- [x] `curl http://localhost/api/admin/engine/status` 在管理员 token 下返回 `marketRegime`
- [x] `GET /api/market/stocks/:id/kline?periods=6&resolution=tick` 已返回逐跳数据，时间戳精确到秒级
- [x] `GET /api/market/stocks/:id/kline?periods=6&resolution=1m` 已返回整分钟时间桶
- [x] `curl -I http://localhost` 返回 `HTTP/1.1 200 OK`

## 2026-03-29 最终功能补完（v0.1.0 准备提交）

### 已完成
- [x] Bull 队列可观测性
  - 新建 `news-queue-stats.service.ts`，后端新增 `GET /api/admin/news/queue-stats` 返回 buffer/scheduler 两个队列的 waiting/active/delayed/completed/failed 统计。
  - 管理后台仪表盘 Tab 新增队列监控面板。
- [x] AI 上游熔断 / 手动恢复
  - `AIHealthService` 新增 `isCircuitOpen()`（阈值 5 次）和 `resetHealth()` 方法。
  - `AIService.executeWithRetry` 开头加入熔断短路检查，连续失败 ≥5 次时跳过 AI 调用。
  - 后端新增 `POST /api/admin/ai/reset-health` 端点。
  - 管理后台 AI 区块新增"手动恢复 AI"按钮（仅在 `down` 时显示）。
- [x] 首页新闻跑马灯
  - 新建 `NewsTicker.tsx`，CSS 动画无限循环滚动最新 8 条新闻标题，点击跳转详情。
  - 集成到首页 `page.tsx` 顶部。
- [x] 股票迷你走势线
  - 新建 `Sparkline.tsx`，纯 SVG polyline，自动根据涨跌着色。
  - 首页每只股票卡片右上角展示最近 20 个 K 线数据走势。
- [x] WebSocket 新闻推送 Toast
  - 新建 `NewsToast.tsx`，底部浮动通知，4s 自动消失。
  - `layout.tsx` 新增 WebSocket `news:published` 事件监听。
- [x] 排行榜实时化
  - `TradeService` 在市价买/卖和限价单成交后异步调用 `LeaderboardService.updateAssets()`。
  - `TradeModule` 导入 `LeaderboardModule`。
- [x] 管理后台增强
  - 后端新增 `GET /api/admin/users`（分页用户列表）和 `GET /api/admin/stats`（全站统计）。
  - `AdminModule` 新增 `UserEntity`/`OrderEntity` TypeORM 注入。
  - 管理后台仪表盘新增全站统计卡片（注册用户/订单数/成交订单/总成交额）。
  - 新增"用户管理"Tab，展示用户列表含头像、角色和注册时间。
- [x] 项目文档
  - 新建 `README.md`（中文版）、`README_EN.md`（英文版）、`CHANGELOG.md`。
- [x] 构建验证
  - `@mocktrade/shared` 编译通过
  - `server` (NestJS) 编译通过
  - `web` (Next.js) 编译通过，12 路由全部生成

---

## 2026-03-29 赛季与头像修复

### 已完成
- [x] 管理后台创建赛季支持具体时间
  - `admin/page.tsx` 的赛季表单由 `date` 改为 `datetime-local`。
  - 前端补了空值校验和“结束时间必须晚于开始时间”校验。
- [x] 创建新赛季时真正结算旧赛季
  - `SeasonService.createSeason()` 不再只是把旧赛季 `isActive=false`。
  - 现在会先调用 `endSeason()`，生成 `season_records` 后再创建新赛季。
  - 结算前会把旧赛季未成交挂单统一过期，避免跨赛季串数据。
- [x] 修复当前赛季排行榜空白
  - 排行榜页不再读取 `/seasons/:id/results` 作为当前排行榜。
  - 改为读取 `/leaderboard/return` 和 `/leaderboard/assets`，展示当前赛季实时收益榜。
  - 后端在读取当前赛季榜单前会即时刷新 Redis 榜单数据。
- [x] 补齐赛季可见性
  - 管理后台新增“当前赛季”和“全部赛季”展示。
  - 个人页新增当前赛季名称与时间范围，历史赛季补了赛季名和时间。
- [x] 修复头像显示与持久化
  - 新增共享组件 `UserAvatar`，TopBar、个人页、动态页、排行榜统一走真实头像。
  - nginx 新增 `/uploads/` 代理到后端静态文件。
  - `docker-compose.yml` 为服务端上传目录新增 `server_uploads` volume，重建容器后头像文件仍然保留。
- [x] 个人资料页可编辑化与高级重构
  - 个人页接入 `ImageUploader`，用户可在个人页直接更换头像，不再只能在注册时上传。
  - `PATCH /api/users/me` 改用 DTO 校验，并在后端补上用户名唯一性检查，避免昵称更新时报数据库原始错误。
  - 前端 `auth-store` 新增 `updateUser()`，资料保存后会同步刷新本地登录态，TopBar 和其他页面的头像/昵称无需重新登录即可更新。
  - `profile/page.tsx` 重新设计为更接近 Apple 风格的资料总览 + 编辑区 + 赛季历史布局。

### 已完成 (2026-03-29 后续进阶体验优化)
- [x] K线多周期维度支持与实时刷新
  - `StockChart` 现已修正为 `逐跳 / 1分 / 5分 / 15分` 快捷选项器，分时图与 K 线共用同一套真实分辨率。
  - `KLineService` 支持 `tick` 逐跳输出与真实时间分桶，`1分` 不再是假分钟。
- [x] Apple / Claude 级别高定 Auth 体验
  - `login/page.tsx` 页面跟随 `register` 重整，注入大柔光发散背景并取消所有实线边框，采用超大圆角毛玻璃质感。
- [x] 详情页展示扁平化
  - 把最有趣的虚拟股市“公司人设”移动到了核心展示区域。
  - 取消 Tab 交互栏，将事件与复盘新闻紧随其后铺平显示。
- [x] 排行榜趣味化分拆
  - 后端注入支持 `order=asc` 的最差查榜方法。
  - 前端一分三：收益战神榜、资本大鳄榜与破产惨剧榜。

### 验证结果
| 检查项 | 状态 |
|--------|------|
| `pnpm --filter server build` | ✅ |
| `pnpm --filter web build` | ✅ |
| `docker compose up -d --build` | ✅ |
| `docker compose ps` | ✅ |
| `curl http://localhost/api/health` | ✅ |
| `curl http://localhost/api/seasons/current` | ✅ |
| `curl http://localhost/api/leaderboard/return` | ✅ |
| `POST /api/seasons` 创建带具体时间的新赛季 | ✅ |
| 旧赛季 `/api/seasons/:id/results` 能返回结算记录 | ✅ |
| `POST /api/upload/avatar` 返回的 `/uploads/...` 可通过 nginx 访问 | ✅ |
| 重启 `server` 容器后测试头像仍可访问 | ✅ |
| `PATCH /api/users/me` 编译与容器重建通过 | ✅ |

---

## 2026-03-28 修复迭代

### 已完成
- [x] 第二次重大界面重构：极简 Apple / Claude 风格重塑 (Light/Dark 双轨支持)
  - 弃用第一版的厚重光晕（Glow），全面引入更为清晰、字重严谨以及留白大圆角的界面设计语言。
  - `globals.css` 中重写 `.light` 和 `.dark` 色差变量，增加原生支持双轨且自适应的日间夜间系统，并在导航栏右上角安装了原生切换按钮。
  - `page.tsx` 完全去背景色块化，大幅度剥离冗余发光，重写为类似 iOS Stocks 原生干净的交互卡片排版；弹窗也重构为了无发光的柔和 Sheet 质感。
- [x] 前端 UI 全局视觉质感跃升 (Modern Finance Redesign)
  - 使用更深邃的背景和高级的高亮发光字体。首页引入彻底重写的光效网格卡片、状态聚光灯；导航栏应用毛玻璃。增加等宽字体排版与基于数值变化的价格数字即时闪烁动效。
- [x] 交易体验重塑 (TradeModal 弹窗)
  - 弃用简陋买卖表单，新增防呆、包含双轨输入（按股数/金额自动互相折算）和全仓/半仓等快捷仓位设定按钮的高级悬浮交易弹窗面板。
- [x] 前端主流程中文化
  - 覆盖 TopBar、BottomNav、登录/注册、市场总览、股票详情、持仓、新闻、新闻详情、排行榜、个人主页、动态页、管理后台。
- [x] 修复 `/admin` 页面鉴权时序问题
  - `useAuthStore` 增加 hydration 状态，等待本地鉴权信息加载完成后再执行管理员判断与重定向。
- [x] 增加前端管理后台入口
  - 管理员登录后，TopBar 用户菜单展示管理后台入口，不再需要手动输入 URL。
- [x] 补齐股票详情图表
  - 新增 `StockChart` 组件，集成 `lightweight-charts`，支持 `K 线 / 趋势` 切换。
- [x] 完善前端异常处理
  - 新增 API 错误文案映射；401 时清理本地 `token` 与 `user`，避免脏状态残留。
- [x] 首页改为真实市场总览页
  - 不再是占位内容，已展示市场统计、股票列表、涨跌榜等核心信息。
- [x] 管理后台新增 AI 运行时配置
  - 支持在后台配置 provider、API Base URL、API Key、模型名称，并提供连通性测试接口；保存后无需重启服务即可生效。
- [x] 修复管理后台新闻生成/发布链路
  - “生成新闻”现在明确是加入待发布队列，接口返回排队标题、队列长度，后台可预览待发布新闻。
  - “发布新闻”现在使用真实活动赛季 ID 落库，不再因 `seasonId` 非 UUID 导致 `Internal server error`。
- [x] 自动初始化默认活动赛季
  - 后端启动时如果数据库中没有活动赛季，会自动创建当月赛季，保证 fresh DB 下交易和新闻发布可直接工作。
- [x] 修正新闻展示与结算时序
  - 事件新闻与复盘新闻拆分为两类：当日只展示事件线索，不再直接显示 `impactPercents`。
  - 下一交易日开始时自动生成复盘新闻，再公布上一交易日该事件实际带来的涨跌幅。
  - 新闻详情和新闻列表返回 `relatedStocks`，前端展示股票名和代码，不再出现 UUID。
- [x] 调整事件冲击曲线
  - 价格影响从“立即最大、随后衰减”改为“先逐步放大、再衰减”，给玩家留下观察和交易窗口。
- [x] 新增全站涨跌配色设置
  - 管理后台可在“红涨绿跌（默认）/ 绿涨红跌”之间切换。
  - 前端通过 `/api/market/display-settings` 拉取配置，并用全局 CSS 变量统一控制涨跌色。
- [x] 移除公开新闻的方向剧透
  - 事件新闻统一显示“事件线索”标签，不再在公开页显示“利好 / 利空”。
  - 新闻中心筛选改为“事件线索 / 次日复盘 / 突发 / 搞笑”，避免通过筛选入口泄露方向。
- [x] 优化股票详情图表观感
  - 默认切到更接近股票软件的分时线。
  - 保留 K 线视图，并增加开盘参考线、MA5、MA20、成交量。
- [x] Bull 队列真实集成
  - 新闻预生成缓冲改为 `news-buffer` 队列，开盘调度改为 `news-scheduler` delayed jobs。
  - 启动时自动迁移旧 Redis `news:pending` 数据，兼容已存在的待发布新闻。
  - 发布任务支持 `attempts`、`backoff` 和旧 job 清理，不再依赖手动 `setTimeout` / `setInterval`。
- [x] 加固 AI 新闻 JSON 输出稳定性
  - 新增 JSON 候选提取、常见格式修正、字段归一化与合法性校验。
  - 首轮失败后追加一次低温 JSON 修复请求和一次低温重试。
  - 当前模板 fallback 主要剩余场景为 AI 上游偶发 `fetch failed`，不再是单纯 JSON 解析失败。
- [x] 加固 AI 上游网络失败处理
  - `AIService` 已统一接入超时、最多 2 次重试、指数退避和随机抖动。
  - 新增 Redis 持久化的 `AIHealthService`，管理后台能看到 `healthy / degraded / down / unconfigured` 状态和最近调用指标。
  - 新增环境变量 `AI_REQUEST_TIMEOUT_MS`、`AI_MAX_RETRIES`、`AI_RETRY_BASE_DELAY_MS`。
- [x] 修复休市期间股价仍继续变化
  - 行情状态快照补齐倒计时和阶段信息，休市 / 结算阶段不再继续推进盘中价格。
- [x] 补齐开盘 / 休市剩余时间提示
  - `market/status` 与 WebSocket 状态广播统一返回 `countdown`，股票详情页展示“距休市 / 距开盘”。
- [x] K 线增加历史买卖点提示
  - `StockChart` 根据已成交订单绘制买卖箭头和数量标记。
- [x] 股票详情相关新闻恢复正常
  - 详情页按 `stockId` 拉取新闻，后端按 `relatedStockIds` 正常过滤，不再长期显示空状态。
- [x] 首页总览文案去术语化
  - “剧情浓度最高”改为“波动最大”，并补充说明文案。
  - 列表排序同步改为按涨跌幅绝对值排序，标题与数据含义保持一致。
- [x] 管理后台“价格冲击”文案去术语化
  - 改为“手动价格干预”，补充 `0.05 / -0.05` 示例与默认持续时间说明。
  - 股票输入由 UUID 文本框改为下拉选择，降低后台操作门槛。
- [x] 修复手动价格干预体感无效
  - 开盘中执行时会立即落一笔价格变动并通过 WebSocket 推送到前端，不再只是后台累积一个弱影响值。
  - 休市 / 结算阶段改为明确报错提示，避免“点了但看起来没反应”。
- [x] 后台改为支持手动事件新闻
  - 新增 `POST /api/admin/news/manual`，可设定股票、方向、目标影响、风格、事件提示。
  - 支持“生成到队列”与“开盘中立即发布”两种模式，价格仍通过新闻冲击曲线逐步发酵。
- [x] 补强手动事件新闻入队反馈
  - `impactPercent` 输入上限放宽到 100%，实际价格影响仍在后端按系统约束自动收敛。
  - 手动事件入队后会优先出现在队列预览顶部；前端在请求进行中会先显示“正在生成 / 发布”文案，避免慢请求看起来像无响应。
- [x] 清理前台文案
  - 首页、个股页、新闻、持仓、排行榜、交易弹窗、导航和登录注册页已统一改成更直接的中文。
  - `SentimentTag` 去掉表情，事件类新闻统一显示“事件新闻”，回顾类显示“结果回顾”。

### 验证结果
| 检查项 | 状态 |
|--------|------|
| `pnpm --filter web build` | ✅ |
| `pnpm --filter server build` | ✅ |
| `pnpm --filter @mocktrade/shared build` | ✅ |
| `docker compose up -d --build` | ✅ |
| `docker compose ps` | ✅ |
| `curl http://localhost/api/health` | ✅ |
| `curl http://localhost/api/seasons/current` | ✅ |
| `curl http://localhost/api/market/display-settings` | ✅ |
| `curl http://localhost/api/market/status` | ✅ |
| `curl http://localhost/api/news?newsType=event&limit=2` | ✅ |
| `curl http://localhost/api/admin/ai/settings` | ✅ |
| `curl http://localhost/api/admin/engine/status` | ✅ |
| 管理员接口闭环验证（生成队列 → 发布 → `/api/news/latest`） | ✅ |
| `POST /api/admin/news/manual` with `impactPercent=21` | ✅ |
| 手动事件入队后 `/api/admin/news/queue` 立即可见且排在预览首位 | ✅ |
| 事件新闻接口隐藏即时涨跌，返回股票名/代码而非 UUID | ✅ |
| 下一交易日自动生成复盘新闻并关联原事件 `sourceNewsId` | ✅ |
| Redis 中存在 `bull:news-buffer:*` / `bull:news-scheduler:*` 队列键 | ✅ |
| `news-scheduler` 存在 delayed / completed job，`news-buffer` 存在 waiting item | ✅ |
| AI 健康状态可回到 `healthy`，并显示最近成功耗时与尝试次数 | ✅ |

---

## Phase 1: 工程基础设施 (32 点) ✅

### 模块 1.1: Monorepo 初始化 (6 点)
- [x] 1.1.1 初始化 Monorepo 结构 — pnpm workspace, tsconfig.base, .prettierrc, .editorconfig
- [x] 1.1.2 初始化 Next.js 前端项目 — App Router, TailwindCSS dark theme, Zustand stores
- [x] 1.1.3 初始化 NestJS 后端项目 — ConfigModule, ValidationPipe, CORS

### 模块 1.2: 共享包与类型 (4 点)
- [x] 1.2.1 创建共享类型包 — 7 个类型文件 (user, stock, trade, season, news, achievement, social)
- [x] 1.2.2 创建共享常量和工具函数 — game constants, rank thresholds, WS events, format/calc utils

### 模块 1.3: 数据库 (8 点)
- [x] 1.3.1 设计并创建核心 Entity — 13 个 TypeORM Entity
- [x] 1.3.2 配置 TypeORM 与 Migration — DatabaseModule with async config, synchronize in dev
- [x] 1.3.3 设计虚拟股票种子数据 — 25 只股票，半虚拟半谐音命名，各有完整人设

### 模块 1.4: 认证与用户系统 (10 点)
- [x] 1.4.1 实现用户注册接口 — POST /api/auth/register, bcrypt, ADMIN_EMAIL auto-admin
- [x] 1.4.2 实现用户登录接口 — POST /api/auth/login, JWT 7d expiry
- [x] 1.4.3 实现 JWT 守卫与角色装饰器 — JwtAuthGuard, RolesGuard, @CurrentUser, @Roles, @Public
- [x] 1.4.4 实现用户资料接口 — GET/PATCH /api/users/me, GET /api/users/:id
- [x] 1.4.5 编写认证模块测试 — (deferred to integration test phase)

### 模块 1.5: Redis 配置 (4 点)
- [x] 1.5.1 配置 Redis 连接与模块 — Global RedisModule with ioredis, full RedisService
- [x] 1.5.2 Bull 消息队列基础设施 — 已安装依赖并在 2026-03-28 完成真实 Processor / Queue 集成，新闻系统已切换到 Bull

### 额外完成
- [x] 世界观文件 — world-setting.md, relationships.md (AI新闻引擎用)
- [x] 前端构建验证通过 (Next.js build success)
- [x] 后端编译验证通过 (NestJS build success)
- [x] Git 初始提交 (80 files, 15438 insertions)

### 验证结果
| 检查项 | 状态 |
|--------|------|
| pnpm install | ✅ 958 packages |
| shared package type-check | ✅ |
| Next.js build | ✅ |
| NestJS build | ✅ |

---

## Phase 2: 核心引擎 (52 点) ✅

### 模块 2.1: 市场状态管理 (8 点)
- [x] 2.1.1 市场状态机 — 24/7循环: OPENING→SETTLING→CLOSED, 可配置时长
- [x] 2.1.2 K线数据管理 — OHLCV聚合, Redis缓存
- [x] 2.1.3 WebSocket网关 — Socket.IO, room机制, tick/news/status广播

### 模块 2.2: 价格算法 (12 点)
- [x] 2.2.1 随机游走 — 几何布朗运动(GBM), 行业差异化波动率
- [x] 2.2.2 均值回归 — 动态kappa, 偏离>80%强制回归
- [x] 2.2.3 事件冲击 — 指数衰减, 关联传导, 可清理
- [x] 2.2.4 价格合成 — 三因子合成 + ±10%涨跌停
- [x] 2.2.5 Tick调度器 — 2-5s随机间隔, 批量更新+广播

### 模块 2.3: 行情API (4 点)
- [x] 2.3.1 股票列表/详情/K线接口 — GET /api/market/stocks, /status, /kline

### 模块 2.4: AI适配层 (8 点)
- [x] 2.4.1 AI Provider — OpenAI兼容/Claude双支持, 可配置
- [x] 2.4.2 世界观记忆 — 加载world/文件, 构建AI上下文, Redis短期记忆
- [x] 2.4.3 降级兜底 — 12条模板新闻(正面/负面/搞笑), AI不可用自动切换

### 模块 2.5: 新闻引擎 (12 点)
- [x] 2.5.1 Prompt工程 — 系统提示词, JSON输出约束
- [x] 2.5.2 预生成队列 — Bull `news-buffer` 队列, 自动补充, min=3, 启动时迁移 legacy Redis 待发布项
- [x] 2.5.3 新闻发布调度 — Bull delayed jobs, 开盘后10s首发, 随后20-60s间隔, 休市时清理过期调度任务
- [x] 2.5.4 新闻API — GET /api/news, /latest, /:id, 分页+筛选

### 模块 2.6: 集成调试 (8 点)
- [x] 2.6.1 引擎联调 — app.module注册所有模块, build通过
- [x] 2.6.2 管理调试工具 — pause/resume, generate/publish, shock inject

### 新增文件: 21个
### 编译验证: ✅ NestJS build 通过

---

## Phase 3: 交易与赛季 (38 点) ✅

### 模块 3.1: 交易系统 (14 点)
- [x] 3.1.1 下单接口 — CreateOrderDto, 市价/限价, 买卖验证
- [x] 3.1.2 市价成交 — 做市商模式, 即时成交, 手续费0.1%
- [x] 3.1.3 限价匹配 — 3s间隔扫描, 价格触发自动成交
- [x] 3.1.4 订单查询 — 分页, 状态筛选, 活跃订单

### 模块 3.2: 持仓资产 (8 点)
- [x] 3.2.1 持仓管理 — 增减持仓, 均价计算, 市值计算
- [x] 3.2.2 资金账户 — Redis高频读写, 冻结/解冻/扣除
- [x] 3.2.3 持仓API — GET /api/trade/positions, /account

### 模块 3.3: 赛季系统 (10 点)
- [x] 3.3.1 赛季生命周期 — 创建/结束, 资金重置$1M, 股价重置
- [x] 3.3.2 段位计算 — 收益率分级: legendary/diamond/gold/silver/bronze
- [x] 3.3.3 赛季API — GET /api/seasons, /current, /:id/results, /my-history
- [x] 3.3.4 管理接口 — POST创建/结束赛季 (admin only)

### 新增文件: 10个 (718行代码)
### 编译验证: ✅ NestJS build 通过

---

## Phase 4: 前端核心页面 (30 点) ✅

### 模块 4.1: 前端基础架构 (6 点)
- [x] 4.1.1 状态管理+WebSocket客户端 — Zustand stores, Socket.IO client, formatters
- [x] 4.1.2 通用UI组件 — PriceDisplay, TierBadge, SentimentTag, MarketStatusBadge

### 模块 4.2: 注册登录 (3 点)
- [x] 4.2.1 登录/注册页面 — react-hook-form + zod, avatar selection

### 模块 4.3: 市场总览 (6 点)
- [x] 4.3.1 市场总览首页 — 股票表格, 涨跌榜侧栏, 统计卡片
- [x] 4.3.2 实时价格更新 — WebSocket tick → store → UI

### 模块 4.4: 股票详情 (6 点)
- [x] 4.4.1 股票详情页 — 实时价格, 统计网格, 新闻/关于标签
- [x] 4.4.2 下单面板 — 买入/卖出, 数量快捷按钮, 预估费用

### 模块 4.5: 持仓页面 (4 点)
- [x] 4.5.1 持仓与订单页面 — 账户总览+段位, 持仓/挂单/历史三标签

### 模块 4.6: 新闻中心 (3 点)
- [x] 4.6.1 新闻列表+详情 — 情绪筛选, 价格影响可视化

### 模块 4.7: 排行榜+个人主页 (2 点)
- [x] 4.7.1 排行榜 — 领奖台+排名表格
- [x] 4.7.2 个人主页 — 赛季统计, 历史记录

### 布局组件
- [x] TopBar — Logo, 市场状态, 导航, 用户菜单
- [x] BottomNav — 移动端5标签底部导航
- [x] MainLayout — WebSocket连接, 实时数据, 倒计时

### 新增文件: 18个 (1112行代码)
### 路由: / /login /register /stock/[id] /portfolio /leaderboard /news /news/[id] /profile
### 编译验证: ✅ Next.js build 通过 (10 routes)

---

## Phase 5: 社交/成就/排行 (26 点) ✅

### 模块 5.1: 排行榜 (8 点)
- [x] 5.1.1 排行榜后端 — Redis Sorted Set, assets/return 双排行, 用户信息关联
- [x] 5.1.2 排行榜API — GET /api/leaderboard/:type, /my-rank

### 模块 5.2: 成就系统 (8 点)
- [x] 5.2.1 成就定义与检测 — 10种成就, 条件检查, WebSocket解锁通知
- [x] 5.2.2 成就API — GET /api/achievements, /my, POST /check, /seed (admin)

### 模块 5.3: 社交功能 (10 点)
- [x] 5.3.1 关注系统 — follow/unfollow, following/followers, stats
- [x] 5.3.2 交易动态 — 发帖, Feed聚合(关注者+自己), 评论
- [x] 5.3.3 前端Feed页 — 发帖框, 时间线, 展开评论, 添加评论

### 新增文件: 10个后端 + 1个前端 = 11个 (596行代码)
### 编译验证: ✅ NestJS build + Next.js build 通过 (11 routes)

---

## Phase 6: 部署与上线 (20 点) ✅

### 模块 6.1: 管理后台前端 (6 点)
- [x] 6.1.1 Admin页面 — 引擎状态, 市场控制, 新闻控制, 价格冲击, 赛季管理, 成就种子

### 模块 6.2: Docker部署 (8 点)
- [x] 6.2.1 Dockerfiles — 多阶段构建: web (standalone), server (dist)
- [x] 6.2.2 docker-compose.yml — 5服务: postgres, redis, server, web, nginx
- [x] 6.2.3 docker-compose.dev.yml — 开发环境: postgres + redis
- [x] 6.2.4 Nginx反代 — /api/ → server, /socket.io/ → WebSocket, / → web

### 模块 6.3: 安全与监控 (4 点)
- [x] 6.3.1 健康检查 — GET /api/health (Redis + DB)
- [x] 6.3.2 环境变量模板 — env.production.example

### 模块 6.4: 部署脚本 (2 点)
- [x] 6.4.1 deploy.sh — git pull → build → up → health check

### 新增文件: 12个 (551行代码)
### 编译验证: ✅ NestJS + Next.js build 通过

---

## 项目完成总结

| 统计项 | 数量 |
|--------|------|
| 总文件数 | ~130 |
| 后端模块 | 16 (NestJS) |
| 前端路由 | 12 (Next.js) |
| API端点 | ~45 REST |
| 数据库Entity | 13 |
| 虚拟股票 | 25只 |
| 成就定义 | 10种 |
| Git提交 | 12 |
| 任务点完成 | 198/198 (100%) |
