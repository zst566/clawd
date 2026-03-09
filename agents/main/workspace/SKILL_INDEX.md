# SKILL_INDEX.md - 全局技能索引

> 所有可用技能的快速参考目录
> 位置: `~/clawd/skills/`

---

## 🏠 自建核心技能（3个）

这些是我们团队开发的核心技能，用于项目管理和 Agent 协作。

| 技能 | 用途 | 触发词 | 详细文档 |
|------|------|--------|----------|
| **project-workflow** | 标准化项目启动与开发流程 | "启动项目", "阶段推进" | [SKILL.md](./skills/project-workflow/SKILL.md) |
| **agent-coordination** | 多 Agent 协调、进度跟踪、任务分配 | "协调 agents", "检查进度" | [SKILL.md](./skills/agent-coordination/SKILL.md) |
| **agent-workflow-automation** | 复杂工作流自动化（并行审查、前后端并行开发等） | "并行开发", "并行审查" | [SKILL.md](./skills/agent-workflow-automation/SKILL.md) |

### 详细说明

#### 1. project-workflow - 项目工作流
**适用场景：**
- 新项目启动时需要规范流程
- 项目阶段推进时需要确认检查点
- 团队成员需要遵循统一的项目管理规范
- 项目交付前需要验收清单

**核心内容：**
- 4个阶段：需求阶段 → 设计阶段 → 开发阶段 → 交付阶段
- 13个检查点
- 配套文档模板

---

#### 2. agent-coordination - Agent 协调
**适用场景：**
- 向任意 Agent 分配任务
- 跟踪进度、检查阻塞
- 管理跨 Agent 项目
- 需要 Agent 联系信息

**核心原则：**
- 每 5 分钟主动检查进度
- 多渠道验证（sessions_history + gateway.log + subagents）
- 永远不要相信工程师的时间估算
- 阻塞问题立即透明化

**超时策略：**
| 任务类型 | 耗时 | 超时设置 |
|---------|------|---------|
| 简单任务 | <30分钟 | 1800秒 |
| 常规任务 | 1-2小时 | 7200秒 |
| 复杂任务 | 半天 | 14400秒（拆分为子任务）|

**相关技能：**
- 复杂工作流设计（并行审查、前后端并行开发）→ [agent-workflow-automation](./skills/agent-workflow-automation/SKILL.md)

---

#### 3. agent-workflow-automation - 工作流自动化
**适用场景：**
- **并行审查**：Guardian + Inspector 同时审查代码
- **前后端并行开发**：后端 API + 前端 UI 同时进行
- **多模块并行**：大型项目拆分为独立模块并行开发
- **数据处理并行**：多个文件/数据集同时处理
- **多环境部署**：开发/测试/生产环境同时部署

**核心内容：**
- 并行审查流程模板（代码提交 → 并行审查 → 自动通知修复）
- 6大并行开发场景（前后端、多模块、多 API、数据处理、文档、多环境）
- 并行任务判断原则（可并行 vs 不可并行）
- 完整代码示例

**前置要求：**
- 熟悉基础 Agent 协调 → [agent-coordination](./skills/agent-coordination/SKILL.md)

---

## 🌐 第三方技能（9个）

这些是从社区或其他来源获取的技能。

| 技能 | 来源 | 用途 | 详细文档 |
|------|------|------|----------|
| **anthropics-skills** | Anthropic | Claude 官方技能集合 | [目录](./skills/anthropics-skills/) |
| **browser-use** | 社区 | 浏览器自动化操作 | [目录](./skills/browser-use/) |
| **browser-use-skill** | 社区 | 浏览器使用技能 | [目录](./skills/browser-use-skill/) |
| **api-design-principles** | 社区 | API 设计原则 | [目录](./skills/api-design-principles/) |
| **dev-env-deploy** | 自建 | Docker 开发环境部署 | [SKILL.md](./skills/dev-env-deploy/SKILL.md) |
| **frontend-design** | 社区 | 前端设计规范 | [目录](./skills/frontend-design/) |
| **nodejs-backend-patterns** | 社区 | Node.js 后端模式 | [目录](./skills/nodejs-backend-patterns/) |
| **tech-news-digest** | 社区 | 科技新闻摘要生成 | [SKILL.md](./skills/tech-news-digest/SKILL.md) |
| **vercel-skills** | Vercel | Vercel 部署相关 | [目录](./skills/vercel-skills/) |
| **web-design-guidelines** | 社区 | Web 设计指南 | [目录](./skills/web-design-guidelines/) |
| **wshobson-agents** | 社区 | Agent 相关工具 | [目录](./skills/wshobson-agents/) |

---

## 📂 技能目录结构

```
~/clawd/skills/
├── agent-coordination/               # Agent 协调 (含与码匠通讯规范)
│   ├── SKILL.md
│   └── references/
├── agent-workflow-automation/        # 工作流自动化
│   └── SKILL.md
├── project-workflow/                 # 项目工作流
│   ├── SKILL.md
│   ├── assets/
│   └── references/
├── anthropics-skills/                # Anthropic 官方技能
├── api-design-principles/            # API 设计原则
├── browser-use/                      # 浏览器自动化
├── browser-use-skill/                # 浏览器技能
├── dev-env-deploy/                   # 开发环境部署
│   └── SKILL.md
├── frontend-design/                  # 前端设计
├── nodejs-backend-patterns/          # Node.js 后端
├── tech-news-digest/                 # 科技新闻
│   └── SKILL.md
├── vercel-skills/                    # Vercel 技能
├── web-design-guidelines/            # Web 设计指南
└── wshobson-agents/                  # Agent 工具
```

---

## 🔧 技能使用优先级

### 项目启动时
1. `project-workflow` - 确定项目阶段和检查点
2. `agent-coordination` - 分配任务给各 Agent

### 开发阶段
1. `agent-communication-codecraft` - 与码匠沟通
2. `agent-workflow-automation` - 并行审查流程

### 环境部署
1. `dev-env-deploy` - Docker 环境配置

---

## 📝 维护说明

- **核心技能**（4个）由我们团队维护
- **第三方技能**定期从源更新
- 新增技能时同步更新此索引

---

*最后更新: 2026-03-08*
