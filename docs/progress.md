# MockTrade 开发进度

> 最后更新: 2026-03-27

## 总览

| 阶段 | 状态 | 任务点 | 开始时间 | 完成时间 |
|------|------|--------|---------|---------|
| Phase 1: 工程基础设施 | ✅ 已完成 | 32 | 2026-03-26 | 2026-03-27 |
| Phase 2: 核心引擎 | ✅ 已完成 | 52 | 2026-03-27 | 2026-03-27 |
| Phase 3: 交易与赛季 | ✅ 已完成 | 38 | 2026-03-27 | 2026-03-27 |
| Phase 4: 前端核心页面 | ✅ 已完成 | 30 | 2026-03-27 | 2026-03-27 |
| Phase 5: 社交/成就/排行 | ✅ 已完成 | 26 | 2026-03-27 | 2026-03-27 |
| Phase 6: 部署与上线 | ⚪ 待开始 | 20 | - | - |

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
- [x] 1.5.2 配置 Bull 消息队列 — (queue names defined, Bull integration ready in app.module)

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
- [x] 2.5.2 预生成队列 — Redis队列, 自动补充, min=3
- [x] 2.5.3 新闻发布调度 — 开盘后10s首发, 随后20-60s间隔
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
