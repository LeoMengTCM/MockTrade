# MockTrade — 虚拟交易所

一款基于 AI 驱动新闻的虚拟股票交易模拟平台。玩家在仿真市场中买卖 25 只虚拟股票，通过阅读 AI 生成的新闻做出交易决策，争夺赛季排名。

## ✨ 核心特色

- **AI 驱动新闻引擎** — 使用 OpenAI / Claude 生成市场新闻，新闻发布后自动影响股价走势
- **实时行情系统** — WebSocket 推送价格变动，K 线图支持 1m / 1d / 1w / 1M 多周期聚合
- **完整交易闭环** — 市价单即时成交、限价单自动撮合、手续费与持仓管理
- **赛季制竞技** — 独立排行榜，支持资产与收益率双维度排名
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
```

### Docker 部署

```bash
# 创建 .env（务必修改默认密码）
cp .env.example .env

# 启动全部服务
docker compose up -d --build

# 访问
open http://localhost
```

### 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_PASSWORD` | ✅ | PostgreSQL 密码 |
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `ADMIN_EMAIL` | ✅ | 管理员注册邮箱 |
| `AI_API_KEY` | 可选 | AI 服务 API Key（无则使用本地模板新闻） |
| `AI_API_BASE` | 可选 | AI 服务接口地址 |
| `AI_MODEL` | 可选 | AI 模型名称 |

## 📋 功能清单

### 市场系统
- 25 只虚拟股票，含人设与世界观
- 布朗运动 + 均值回归价格引擎
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
