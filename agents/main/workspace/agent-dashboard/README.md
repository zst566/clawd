# 🤖 智能体任务看板与可视化工作间系统

一个用于管理多智能体协作任务的可视化系统，支持任务看板、智能体工作间和休息区的实时监控。

## ✨ 核心功能

### 📋 任务看板 (Task Board)
- 项目维度管理任务
- 拖拽式任务状态流转：待分配 → 执行中 → 已完成 / 暂停 / 异常
- 任务优先级标记
- 预计/实际执行时间统计

### 🏭 智能体工作间 (Workshop)
- 按智能体分区的工作间视图
- 支持多线程分身显示
- 实时显示每个分身的工作状态和进度
- 动态任务进度条

### 🛋️ 休息区 (Lounge)
- 空闲智能体列表
- 智能体能力标签展示
- 一键分配任务到指定智能体

### 🔔 Telegram 集成
- 任务分配自动通知
- 状态变更实时推送

## 🚀 快速开始

### 环境要求
- Docker
- Docker Compose

### 启动系统

```bash
cd agent-dashboard
./start.sh
```

系统启动后访问：
- 前端界面: http://localhost:8080
- API 服务: http://localhost:3000

### 停止系统

```bash
./stop.sh
```

## 📁 项目结构

```
agent-dashboard/
├── backend/              # Node.js 后端 API
│   ├── src/
│   │   ├── index.js     # 主入口
│   │   ├── database.js  # SQLite 数据库
│   │   ├── routes.js    # API 路由
│   │   └── telegram.js  # Telegram 通知
│   ├── Dockerfile
│   └── package.json
├── frontend/             # Vue3 前端应用
│   ├── src/
│   │   ├── views/       # 页面组件
│   │   │   ├── Dashboard.vue
│   │   │   ├── TaskBoard.vue
│   │   │   ├── Workshop.vue
│   │   │   └── Lounge.vue
│   │   ├── stores/      # Pinia 状态管理
│   │   ├── router/      # Vue Router
│   │   └── App.vue
│   ├── Dockerfile
│   └── package.json
├── data/                 # 数据库存储
├── docker-compose.yml
├── start.sh             # 启动脚本
└── stop.sh              # 停止脚本
```

## 🔌 API 接口

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目

### 任务管理
- `GET /api/projects/:id/tasks` - 获取项目任务
- `POST /api/projects/:id/tasks` - 创建任务
- `PUT /api/tasks/:id/status` - 更新任务状态
- `POST /api/tasks/:id/assign` - 分配任务

### 智能体管理
- `GET /api/agents` - 获取智能体列表
- `POST /api/agents/:id/spawn` - 创建分身

### 工作间状态
- `GET /api/workspace/lounge` - 休息区状态
- `GET /api/workspace/workshop` - 工作间状态
- `GET /api/workspace/stats` - 统计信息

## 🎨 界面预览

### 任务看板
```
┌─────────────────────────────────────────────────────┐
│  ⏳ 待分配    │  🔄 执行中   │  ✅ 已完成   │  ⏸️ 暂停  │
│  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │         │
│  │ 任务A  │  │  │ 任务C🟢│  │  │ 任务D  │  │         │
│  │ ⭐⭐⭐  │  │  │ 码匠-1 │  │  │ ✅     │  │         │
│  └────────┘  │  │ ⏱️ 30m │  │  └────────┘  │         │
└─────────────────────────────────────────────────────┘
```

### 工作间
```
┌─────────────────────────────────────────────┐
│  👨‍💻 码匠开发区                    [2/5]     │
│  ┌────────────┐  ┌────────────┐            │
│  │ 码匠-1     │  │ 码匠-2     │            │
│  │ 🟢 运行中   │  │ 💤 空闲    │            │
│  │ API重构    │  │            │            │
│  │ ████████░░ │  │            │            │
│  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────┘
```

## 🔧 配置说明

创建 `.env` 文件配置 Telegram 通知：

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 📊 预置智能体

系统预置了以下智能体：

| 智能体 | 角色 | 能力 | 最大分身数 |
|--------|------|------|-----------|
| 小d | 项目经理 | 项目协调、任务管理 | 1 |
| 码匠 | 开发工程师 | 前后端开发、代码审查 | 5 |
| 数据助理 | 数据分析师 | 数据分析、统计报告 | 3 |
| 安全审查 | 安全专家 | 安全扫描、漏洞检测 | 2 |
| 质量审查 | 代码审查员 | 代码质量、最佳实践 | 3 |

## 🗺️ 开发计划

- [x] Phase 1: 基础架构搭建
- [x] Phase 2: 任务看板实现
- [x] Phase 3: 智能体工作间
- [x] Phase 4: 休息区与分配功能
- [ ] Phase 5: Telegram 通知集成
- [ ] Phase 6: 智能体 SDK 开发
- [ ] Phase 7: 数据统计与报表

## 📝 更新日志

### v1.0.0 (2026-03-05)
- 初始版本发布
- 支持任务看板、工作间、休息区三大核心功能
- WebSocket 实时同步
- Docker 容器化部署

---

由 小d 开发 🎯
