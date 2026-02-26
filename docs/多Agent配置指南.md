# Openclaw 多 Agent 配置指南

本文档总结如何在 Openclaw 中配置多个 Agent，以及如何在同一群组中让多个 Agent 响应。

---

## 一、配置多 Agent

### 1.1 准备工作

确保已有多个 Agent 目录：
```bash
~/.openclaw/agents/
├── main/           # 默认 Agent
├── data_bot/       # 数据助理 Agent
└── ...
```

### 1.2 修改 openclaw.json

编辑 `~/.openclaw/openclaw.json`，添加 `agents.list` 和 `bindings`：

```json
{
  "agents": {
    "defaults": {
      // ... 默认配置
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "小d",
        "workspace": "/Users/asura.zhou/.openclaw/workspace",
        "agentDir": "/Users/asura.zhou/.openclaw/agents/main/agent"
      },
      {
        "id": "data_bot",
        "name": "数据助理",
        "workspace": "/Users/asura.zhou/clawd/agents/zhou_data_bot/workspace",
        "agentDir": "/Users/asura.zhou/.openclaw/agents/data_bot/agent"
      }
    ]
  },
  "bindings": [
    {
      "agentId": "main",
      "match": {
        "channel": "telegram",
        "accountId": "main"
      }
    },
    {
      "agentId": "data_bot",
      "match": {
        "channel": "telegram",
        "accountId": "data_bot"
      }
    }
  ]
}
```

### 1.3 配置 Telegram 账号

为每个 Agent 配置独立的 Telegram Bot：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "accounts": {
        "main": {
          "botToken": "YOUR_MAIN_BOT_TOKEN",
          "dmPolicy": "pairing"
        },
        "data_bot": {
          "botToken": "YOUR_DATA_BOT_TOKEN",
          "dmPolicy": "pairing"
        }
      }
    }
  }
}
```

### 1.4 重启 Gateway

```bash
openclaw gateway restart
```

验证配置：
```bash
openclaw agents list --bindings
```

---

## 二、群组多 Agent 配置

### 2.1 目标

在同一群组中，多个 Agent 都能被 @ 触发：
- `@asurazhoubot 你好` → 小d 响应
- `@zhou_data_bot 分析数据` → 数据助理响应

### 2.2 配置步骤

#### 步骤 1：添加群组路由

在 `openclaw.json` 的 `bindings` 中添加群组路由：

```json
{
  "bindings": [
    {
      "agentId": "main",
      "match": {
        "channel": "telegram",
        "accountId": "main"
      }
    },
    {
      "agentId": "data_bot",
      "match": {
        "channel": "telegram",
        "accountId": "data_bot"
      }
    },
    {
      "agentId": "data_bot",
      "match": {
        "channel": "telegram",
        "accountId": "data_bot",
        "peer": {
          "kind": "group",
          "id": "-1003531397239"
        }
      }
    }
  ]
}
```

#### 步骤 2：配置群组参数

为每个 Agent 添加群组配置：

```json
{
  "channels": {
    "telegram": {
      "accounts": {
        "main": {
          "botToken": "...",
          "groups": {
            "-1003531397239": {
              "requireMention": true
            }
          }
        },
        "data_bot": {
          "botToken": "...",
          "groups": {
            "-1003531397239": {
              "requireMention": true
            }
          }
        }
      }
    }
  }
}
```

#### 步骤 3：重启并验证

```bash
openclaw gateway restart
openclaw agents list --bindings
```

---

## 三、关键注意事项

### 3.1 Telegram 隐私模式

**必须关闭隐私模式！**

1. 在 **BotFather** 中执行：
   ```
   /setprivacy
   ```
2. 选择你的 Bot
3. 选择 `Disable`

**重要**：修改隐私模式后，需要**重新邀请 Bot 进群**才能生效！

### 3.2 Bot 权限

确保 Bot 在群组中有以下权限：
- ✅ 读取消息
- ✅ 发送消息
- ✅ 提及用户（@）

建议给 Bot **管理员权限**。

### 3.3 路由优先级

Openclaw 的路由规则是**最具体优先**：
1. `peer` 匹配（群组 ID）
2. `accountId` 匹配
3. 默认 fallback

所以群组路由要单独配置。

---

## 四、常见问题排查

### 问题 1：Bot 不响应 @

**现象**：@ Bot 后没有任何反应，没有"输入中"提示

**排查步骤**：
1. 检查隐私模式是否已关闭
2. 检查 Bot 是否已重新邀请进群
3. 检查 Bot 是否有读取消息权限
4. 检查 `openclaw.json` 中的 `groups` 配置
5. 查看日志：`tail -f ~/.openclaw/logs/gateway.log`

### 问题 2：消息被错误 Agent 处理

**现象**：@ data_bot 但 main 响应了

**解决方案**：
- 确保每个 Agent 有独立的 `accountId`
- 群组路由使用 `peer` 精确匹配

### 问题 3：配置不生效

**解决方案**：
```bash
openclaw gateway restart
# 或
openclaw doctor
```

---

## 五、目录结构建议

推荐的多 Agent 目录结构：

```
~/clawd/                           # Git 仓库
├── agents/
│   ├── main/                      # main agent
│   │   ├── AGENTS.md
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   └── skills/
│   │
│   └── zhou_data_bot/             # data_bot agent
│       ├── IDENTITY.md
│       ├── README.md
│       └── workspace/             # 统一工作目录
│           ├── AGENTS.md
│           ├── SOUL.md
│           ├── MEMORY.md          # 长期记忆
│           └── memory/            # 每日记忆
│
├── config/
│   └── openclaw.json              # 配置文件备份
│
└── workspace/                     # 项目文档
```

---

## 六、备份建议

定期备份配置到 Git：

```bash
cd ~/clawd
git add .
git commit -m "backup: 更新多 Agent 配置"
git push origin main
```

---

## 七、Agent 间通信（ sessions_send / sessions_spawn ）

Openclaw 提供了 **Session 工具** 让多个 Agent 之间可以互相通信和协作。

### 7.1 核心工具

| 工具 | 功能 | 用途 |
|------|------|------|
| `sessions_list` | 列出所有会话 | 发现其他 Agent 的会话 |
| `sessions_history` | 获取会话历史 | 查看其他 Agent 的对话记录 |
| `sessions_send` | 发送消息到另一个会话 | **Agent 间直接通信** |
| `sessions_spawn` | 生成子代理 | 创建临时 Agent 执行任务 |

### 7.2 sessions_send - Agent 间发送消息

让小d 给数据助理发送消息：

```bash
# 在会话中执行
/sessions_send --to data_bot --message "帮我分析一下昨天的销售数据"
```

参数说明：
- `sessionKey`: 目标会话 ID（可以用 `sessions_list` 查看）
- `message`: 要发送的消息
- `timeoutSeconds`: 
  - `0` = 发送后不等待回复（fire-and-forget）
  - `>0` = 等待 N 秒，获取回复

#### 使用场景示例

**场景 1：主 Agent 分配任务给数据助理**
```
用户: @小d 帮我做个数据分析
小d: 好的，我让数据助理来处理
    ↓ (调用 sessions_send)
数据助理: 收到，正在分析...
    ↓ (完成后回复)
小d: 数据助理已完成分析，结果是...
```

**场景 2：并行处理**
```
用户: @小d 同时做两件事：写代码 + 查资料
小d: 收到
    ↓ (sessions_spawn 或 sessions_send)
Dev Agent: 开始写代码...
Research Agent: 开始查资料...
    ↓ (都完成后)
小d: 代码已完成，资料已查到...
```

### 7.3 sessions_spawn - 生成子代理

创建一个临时子 Agent 执行特定任务：

```bash
# 示例：生成一个专门写 Python 代码的子 Agent
/sessions_spawn \
  --task "写一个 Python 脚本，统计 CSV 文件中的数据" \
  --label "csv-analysis" \
  --thinking high
```

参数说明：
- `task` (必需): 任务描述
- `label`: 任务标签（用于日志显示）
- `agentId`: 指定使用哪个 Agent（默认当前 Agent）
- `model`: 覆盖模型（如使用更强的模型）
- `thinking`: 思考级别
- `runTimeoutSeconds`: 超时时间（0 = 不限制）
- `mode`: 
  - `run` = 单次运行（默认）
  - `session` = 保持会话（需要 thread=true）

#### 子 Agent 特性

1. **隔离运行**：子 Agent 在独立的 session 中运行
2. **工具限制**：子 Agent 默认**不能**使用 session 工具（防止无限递归）
3. **自动归档**：子 Agent 会话在 `archiveAfterMinutes` 后自动归档（默认 60 分钟）
4. **结果通知**：子 Agent 完成后，会自动向父 Agent 发送结果

### 7.4 Session Key 格式

不同类型的会话有不同的 key 格式：

| 类型 | Key 格式 | 示例 |
|------|---------|------|
| 私聊 | `main` | `"main"` |
| 群组 | `agent:<agentId>:<channel>:group:<id>` | `agent:data_bot:telegram:group:-1003531397239` |
| 定时任务 | `cron:<job.id>` | `cron:daily-report` |
| 子 Agent | `agent:<agentId>:subagent:<uuid>` | `agent:main:subagent:abc-123` |

### 7.5 配置权限控制

限制 Agent 间的通信权限：

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

子 Agent 允许列表：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "subagents": {
          "allowAgents": ["data_bot", "dev_agent"],
          "maxConcurrent": 4
        }
      }
    ]
  }
}
```

### 7.6 共享内存模式

除了 Session 工具，还可以通过**共享文件**实现 Agent 间通信：

```
~/clawd/
├── shared/                    # 共享目录（所有 Agent 可读写）
│   ├── GOALS.md              # 共同目标
│   ├── DECISIONS.md          # 决策日志
│   └── TASKS.md              # 任务分配
│
├── agents/
│   ├── main/                 # 小d 的私有目录
│   └── data_bot/             # 数据助理的私有目录
```

每个 Agent 的 `AGENTS.md` 中说明共享目录的使用规则：

```markdown
## 共享内存
- 共享目录: ~/clawd/shared/
- 读取 GOALS.md 了解当前目标
- 完成重要任务后，在 DECISIONS.md 追加记录
```

### 7.7 实战示例

**目标**：让小d 协调数据助理完成数据分析任务

**步骤 1**：在小d 的 `SOUL.md` 中添加协调能力

```markdown
## 协调能力
- 使用 sessions_list 查看数据助理是否在线
- 使用 sessions_send 分配任务给数据助理
- 使用 sessions_spawn 创建临时分析 Agent
- 汇总结果后向用户汇报
```

**步骤 2**：用户请求
```
用户: @小d 分析一下上个月的销售数据
```

**步骤 3**：小d 执行协调
```
小d: 
1. sessions_list → 发现 data_bot 在线
2. sessions_send → 发送任务给 data_bot
   "请分析 ~/clawd/data/sales_2024.csv，关注趋势和异常"
3. 等待 data_bot 回复...
4. 收到 data_bot 回复后，汇总结果
5. 向用户汇报
```

**步骤 4**：数据助理执行
```
data_bot:
1. 读取 CSV 文件
2. 使用 Python 分析数据
3. 生成图表和报告
4. sessions_send → 回复小d
   "分析完成，发现以下趋势：..."
```

---

## 参考

- Openclaw 官方文档：https://docs.openclaw.ai/concepts/multi-agent
- Telegram Bot 隐私模式：https://core.telegram.org/bots#privacy-mode
- Session Tools 文档：https://docs.openclaw.ai/concepts/session-tool
