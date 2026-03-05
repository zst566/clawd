# 多智能体任务看板与可视化工作间系统
## 需求分析与设计方案

### 📋 需求理解

#### 核心功能模块

**1. 任务看板 (Task Board)**
- 项目维度管理任务
- 任务状态流转：待分配 → 执行中 → 已完成 / 暂停 / 异常
- 记录主Agent与用户的工作沟通内容

**2. 智能体工作间可视化 (Agent Workspace Visualization)**
- **休息区 (Lounge)**：空闲智能体列表，显示智能体名称、能力、当前状态
- **工作间 (Workshop)**：按智能体分区，支持多线程分身显示
  - 码匠工作间：码匠-1、码匠-2、码匠-3... 各自负责的任务
  - Inspector工作间：各分身审查状态
  - Guardian工作间：安全扫描任务
- **动态流程**：智能体从休息区 → 接收任务 → 移动到工作区 → 任务完成 → 返回休息区

**3. 数据流转与追踪**
- 任务分配记录（谁分配、给谁、什么时候）
- 状态变更历史
- 执行时间统计（任务耗时、智能体工作时长）

---

### 🏗️ 系统架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      前端可视化层                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  任务看板     │  │  休息区视图   │  │  智能体工作间     │  │
│  │  (Kanban)    │  │  (Lounge)    │  │  (Workshop)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebSocket (实时推送)
┌─────────────────────────┴───────────────────────────────────┐
│                      API 服务层                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Task API    │  │  Agent API   │  │  Workspace API   │  │
│  │  - CRUD      │  │  - Register  │  │  - Assign        │  │
│  │  - Status    │  │  - Heartbeat │  │  - Status Update │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      数据存储层                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   SQLite/    │  │   Redis      │  │   JSON Files     │  │
│  │   PostgreSQL │  │  (实时状态)   │  │  (配置/日志)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 📊 数据模型设计

#### 1. 任务表 (tasks)
```sql
CREATE TABLE tasks (
    id              TEXT PRIMARY KEY,        -- 任务ID (UUID)
    project_id      TEXT NOT NULL,           -- 所属项目
    title           TEXT NOT NULL,           -- 任务标题
    description     TEXT,                    -- 任务描述
    status          TEXT DEFAULT 'pending',  -- 状态: pending/running/paused/completed/failed
    priority        INTEGER DEFAULT 3,       -- 优先级 1-5
    created_by      TEXT,                    -- 创建者 (user/main)
    assigned_to     TEXT,                    -- 分配给哪个智能体
    assigned_instance TEXT,                  -- 分配给哪个分身 (如: codecraft-1)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at      DATETIME,                -- 开始执行时间
    completed_at    DATETIME,                -- 完成时间
    estimated_duration INTEGER,              -- 预计耗时(分钟)
    actual_duration INTEGER,                 -- 实际耗时(分钟)
    parent_task_id  TEXT,                    -- 父任务ID (子任务支持)
    tags            TEXT,                    -- JSON数组 ["backend", "urgent"]
    notes           TEXT                     -- 执行笔记/沟通记录
);
```

#### 2. 智能体表 (agents)
```sql
CREATE TABLE agents (
    id              TEXT PRIMARY KEY,        -- 智能体ID
    name            TEXT NOT NULL,           -- 显示名称
    alias           TEXT,                    -- 别名 (@码匠)
    role            TEXT,                    -- 角色: developer/reviewer/security
    capabilities    TEXT,                    -- JSON ["coding", "review", "analysis"]
    max_instances   INTEGER DEFAULT 1,       -- 最大并发分身数
    status          TEXT DEFAULT 'idle',     -- idle/busy/offline
    telegram_handle TEXT,                    -- Telegram账号
    session_key     TEXT,                    -- OpenClaw session key
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen       DATETIME                 -- 最后心跳时间
);
```

#### 3. 工作实例表 (agent_instances)
```sql
CREATE TABLE agent_instances (
    id              TEXT PRIMARY KEY,        -- 实例ID (如: codecraft-1)
    agent_id        TEXT NOT NULL,           -- 所属智能体
    instance_number INTEGER,                 -- 分身编号 1,2,3...
    status          TEXT DEFAULT 'idle',     -- idle/running/paused/error
    current_task_id TEXT,                    -- 当前执行的任务
    started_at      DATETIME,                -- 本实例启动时间
    task_started_at DATETIME,                -- 当前任务开始时间
    total_work_time INTEGER DEFAULT 0,       -- 累计工作时长(秒)
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (current_task_id) REFERENCES tasks(id)
);
```

#### 4. 任务分配历史表 (task_assignments)
```sql
CREATE TABLE task_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id         TEXT NOT NULL,
    agent_id        TEXT,
    instance_id     TEXT,
    action          TEXT,                    -- assigned/started/paused/resumed/completed/failed
    performed_by    TEXT,                    -- 谁执行的操作
    note            TEXT,                    -- 操作说明
    timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. 项目表 (projects)
```sql
CREATE TABLE projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    status          TEXT DEFAULT 'active',   -- active/archived
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    color           TEXT                     -- 看板颜色标识
);
```

---

### 🎨 前端界面设计

#### 1. 任务看板 (Kanban Board)
```
┌─────────────────────────────────────────────────────────────────┐
│  项目: 润德教育优化                    [+ 新建任务] [筛选 ▼]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │ 📝 待分配    │  │ 🔄 执行中    │  │ ✅ 已完成    │  │ ⏸️ 暂停 │ │
│  │    (3)      │  │    (2)      │  │    (5)      │  │  (1)   │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├────────┤ │
│  │ • 任务A      │  │ • 任务C 🟢  │  │ • 任务D     │  │ • 任务E│ │
│  │   优先级:高  │  │   码匠-1    │  │   2小时前   │  │  异常  │ │
│  │   预计:2h   │  │   已运行:30m│  │             │  │        │ │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  └────────┘ │
│  │ • 任务B      │  │ • 任务F 🟡  │  │ • 任务G     │             │
│  │   优先级:中  │  │   审查员-1  │  │   昨天      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. 休息区 (Agent Lounge)
```
┌─────────────────────────────────────────────────────────────────┐
│                     🛋️ 智能体休息区                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  🤖      │ │  👨‍💻     │ │  🔍      │ │  🛡️      │           │
│  │  @小d    │ │ @码匠    │ │@审查员   │ │@安全员   │           │
│  │  状态:💤 │ │ 状态:💤 │ │ 状态:💤 │ │ 状态:💤 │           │
│  │  能力:   │ │ 能力:    │ │ 能力:    │ │ 能力:    │           │
│  │ 项目管理 │ │ 前后端   │ │ 代码审查 │ │ 安全扫描 │           │
│  │ 任务协调 │ │ 技术文档 │ │ 质量检查 │ │ 合规检查 │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  点击智能体卡片 → 分配任务 / 查看详情                              │
└─────────────────────────────────────────────────────────────────┘
```

#### 3. 工作间 (Workshop Floor)
```
┌─────────────────────────────────────────────────────────────────┐
│                     🏭 智能体工作间                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔨 码匠开发区                    [并发: 3/5]            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│  │  │ 码匠-1   │  │ 码匠-2   │  │ 码匠-3   │              │   │
│  │  │ 🟢 运行中 │  │ 🟢 运行中 │  │ 💤 空闲   │              │   │
│  │  │          │  │          │  │          │              │   │
│  │  │ 任务:#42 │  │ 任务:#45 │  │          │              │   │
│  │  │ 前端优化 │  │ API重构  │  │          │              │   │
│  │  │ ⏱️ 45m  │  │ ⏱️ 12m  │  │          │              │   │
│  │  │ [查看]   │  │ [查看]   │  │ [唤醒]   │              │   │
│  │  └──────────┘  └──────────┘  └──────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔍 代码审查区                   [并发: 2/3]             │   │
│  │  ┌──────────┐  ┌──────────┐                            │   │
│  │  │审查员-1  │  │审查员-2  │                            │   │
│  │  │ 🟡 暂停  │  │ 🟢 运行中 │                            │   │
│  │  │          │  │          │                            │   │
│  │  │ 任务:#43 │  │ 任务:#46 │                            │   │
│  │  │ 等待反馈 │  │ 安全审查 │                            │   │
│  │  └──────────┘  └──────────┘                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🛡️ 安全扫描区                   [并发: 0/2]             │   │
│  │  ┌──────────┐  ┌──────────┐                            │   │
│  │  │安全员-1  │  │安全员-2  │                            │   │
│  │  │ 💤 空闲  │  │ 💤 空闲  │                            │   │
│  │  └──────────┘  └──────────┘                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. 任务分配动画流程
```
用户点击"分配任务" 
       ↓
弹出分配对话框 → 选择智能体/分身
       ↓
   [播放动画]
       ↓
智能体卡片从休息区"飞"到对应工作间
       ↓
工作间对应位置高亮显示新任务
       ↓
实时推送通知给智能体 (Telegram/WebSocket)
```

---

### 🔌 API 接口设计

#### 任务管理
```
GET    /api/projects                    # 获取项目列表
POST   /api/projects                    # 创建项目
GET    /api/projects/:id/tasks          # 获取项目任务列表
POST   /api/projects/:id/tasks          # 创建任务
GET    /api/tasks/:id                   # 获取任务详情
PUT    /api/tasks/:id                   # 更新任务
PUT    /api/tasks/:id/status            # 更新任务状态
POST   /api/tasks/:id/assign            # 分配任务
POST   /api/tasks/:id/unassign          # 取消分配
GET    /api/tasks/:id/history           # 获取任务历史
```

#### 智能体管理
```
GET    /api/agents                      # 获取智能体列表
POST   /api/agents/register             # 注册智能体
PUT    /api/agents/:id                  # 更新智能体信息
POST   /api/agents/:id/heartbeat        # 智能体心跳
GET    /api/agents/:id/instances        # 获取智能体实例列表
POST   /api/agents/:id/spawn            # 创建新分身
DELETE /api/agents/:id/instances/:inst  # 销毁分身
```

#### 工作间状态
```
GET    /api/workspace/lounge            # 获取休息区状态
GET    /api/workspace/workshop          # 获取工作间状态
GET    /api/workspace/stats             # 获取统计信息
GET    /api/workspace/timeline          # 获取时间线
```

#### WebSocket 事件
```javascript
// 客户端订阅事件
socket.on('task:created', (task) => {})
socket.on('task:assigned', ({task, agent, instance}) => {})
socket.on('task:status_changed', ({task, oldStatus, newStatus}) => {})
socket.on('agent:status_changed', ({agent, instance, status}) => {})
socket.on('instance:spawned', ({agent, instance}) => {})
socket.on('instance:destroyed', ({agent, instance}) => {})
socket.on('workshop:updated', (workshopState) => {})
```

---

### 🤖 智能体 SDK 设计

为了让智能体能与看板系统交互，提供一个简单的 SDK：

```python
# Python SDK 示例 (供各Agent使用)
from agent_dashboard import AgentSDK

# 初始化
sdk = AgentSDK(
    agent_id="codecraft",
    api_url="http://localhost:3000",
    api_key="xxx"
)

# 注册智能体
sdk.register(
    name="@码匠",
    capabilities=["coding", "review", "testing"],
    max_instances=5
)

# 心跳保活
sdk.heartbeat()

# 创建分身执行任务
instance = sdk.spawn_instance()

# 领取任务
task = sdk.claim_task(task_id="task-123")

# 更新任务状态
sdk.update_task_status("running", progress=50, note="正在编写代码...")

# 完成任务
sdk.complete_task(result="代码已提交到PR #42")

# 销毁分身
sdk.destroy_instance()
```

---

### 🐳 Docker 部署方案

#### 容器架构
```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用 (Nginx)
  dashboard-ui:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - dashboard-api

  # 后端API服务 (Node.js/Python)
  dashboard-api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=sqlite:///data/dashboard.db
      - REDIS_URL=redis://redis:6379
      - WS_PORT=3001
    volumes:
      - ./data:/app/data
    depends_on:
      - redis

  # WebSocket 服务 (实时推送)
  websocket:
    build: ./websocket
    ports:
      - "3001:3001"
    environment:
      - REDIS_URL=redis://redis:6379

  # Redis (状态缓存)
  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

### 📅 实施计划

#### Phase 1: 核心基础 (1-2天)
- [ ] 搭建 Docker 容器环境
- [ ] 设计数据库 Schema
- [ ] 实现基础 API (任务CRUD、智能体注册)
- [ ] 搭建前端框架

#### Phase 2: 任务看板 (2-3天)
- [ ] 实现 Kanban 看板界面
- [ ] 任务状态拖拽变更
- [ ] 项目切换功能
- [ ] 任务详情弹窗

#### Phase 3: 智能体工作间 (3-4天)
- [ ] 休息区可视化
- [ ] 工作间分区展示
- [ ] 分身实例管理
- [ ] 任务分配动画
- [ ] WebSocket 实时同步

#### Phase 4: 数据流转 (2-3天)
- [ ] 任务分配历史记录
- [ ] 执行时间统计
- [ ] 时间线视图
- [ ] 统计报表

#### Phase 5: 智能体集成 (2-3天)
- [ ] 开发 Python SDK
- [ ] 集成现有 Agent (@码匠、@zhou_data_bot 等)
- [ ] 心跳机制
- [ ] 自动任务分配

---

### 🎯 技术选型建议

| 组件 | 推荐方案 | 备选方案 |
|------|---------|---------|
| 前端 | React + TypeScript + Tailwind | Vue3 + Element Plus |
| 后端 | Node.js + Express/Fastify | Python + FastAPI |
| 数据库 | SQLite (本地) | PostgreSQL |
| 缓存 | Redis | 内存缓存 |
| 实时通信 | Socket.io | WebSocket原生 |
| 容器 | Docker + Docker Compose | Podman |
| UI组件库 | Ant Design / Chakra UI | Material-UI |

---

### 💡 创新功能建议

1. **智能体能力匹配**: 根据任务标签自动推荐合适的智能体
2. **负载均衡**: 自动将任务分配给负载最低的分身
3. **任务预估**: 基于历史数据预测任务完成时间
4. **异常告警**: 任务超时或智能体离线时自动通知
5. **工作日志**: 自动生成每日/每周工作报告
6. **语音播报**: 重要任务状态变更时语音提醒
7. **主题切换**: 暗黑模式、不同配色主题

---

### ❓ 需要确认的问题

1. **技术栈偏好**: 你更喜欢 React 还是 Vue3？Node.js 还是 Python 后端？
2. **智能体集成**: 需要立即集成现有的 @码匠、@zhou_data_bot 吗？
3. **持久化**: 使用 SQLite 本地存储还是需要 PostgreSQL？
4. **权限**: 需要多用户支持吗？还是只有你和小d使用？
5. **移动端**: 需要适配手机查看吗？
6. **通知**: 需要与 Telegram 集成推送通知吗？

---

这个方案可行吗？需要我调整哪些部分，或者你想先开始实现哪个阶段？
