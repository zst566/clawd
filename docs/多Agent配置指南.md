# Openclaw 多 Agent 配置指南

本文档总结如何在 Openclaw 中配置多个 Agent，以及如何在同一群组中让多个 Agent 响应和协作。

**适用版本**: Openclaw 2026.2.25+

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

## 二、群组多 Agent 配置（关键步骤）

### 2.1 目标

在同一群组中，实现智能协作：
- **主 Agent（小d）**: 监听所有消息，主动协调任务
- **子 Agent（数据助理）**: 只在被 @ 时响应

```
用户: 谁能帮我分析一下今天的数据？
        ↓
小d: 我来协调，@zhou_data_bot 请分析数据
        ↓
data_bot: 收到，正在分析...
          分析完成！结果是...
```

### 2.2 关键配置：requireMention

在 `openclaw.json` 的 `channels.telegram.accounts` 中配置：

```json
{
  "channels": {
    "telegram": {
      "accounts": {
        "main": {
          "botToken": "...",
          "groups": {
            "-1003531397239": {
              "requireMention": false
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

| Agent | requireMention | 行为 |
|-------|---------------|------|
| **main（小d）** | `false` | 监听所有群消息，主动协调 |
| **data_bot** | `true` | 只在被 @ 时响应 |

### 2.3 隐私模式设置

**必须关闭隐私模式！**

1. 在 **BotFather** 中执行：
   ```
   /setprivacy
   ```
2. 选择你的 Bot
3. 选择 `Disable`

**重要**：修改隐私模式后，需要**重新邀请 Bot 进群**才能生效！

---

## 三、Agent 间通信配置

### 3.1 启用 Agent 间通信

在 `openclaw.json` 中添加：

```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["main", "data_bot"]
    },
    "sessions": {
      "visibility": "all"
    }
  }
}
```

### 3.2 配置说明

| 配置项 | 说明 |
|--------|------|
| `tools.agentToAgent.enabled` | 启用 Agent 间通信（默认 false） |
| `tools.agentToAgent.allow` | 允许互相通信的 Agent ID 列表 |
| `tools.sessions.visibility` | 会话可见性，`all` = 能看到所有 Agent 的会话 |

### 3.3 工具使用

#### sessions_list
列出所有活跃的会话：
```bash
/sessions_list
```

#### sessions_send
向其他 Agent 发送消息：
```bash
/sessions_send \
  --sessionKey="agent:data_bot:telegram:group:-1003531397239" \
  --message="请分析这个文件" \
  --timeoutSeconds=60
```

**注意**：必须使用完整的 session key（如 `agent:data_bot:telegram:group:-1003531397239`），不能使用简写的 `"data_bot"`。

#### sessions_spawn
生成子 Agent 执行任务：
```bash
/sessions_spawn \
  --task="分析销售数据" \
  --label="data-analysis" \
  --thinking=high
```

---

## 四、Agent 个性化配置

### 4.1 主 Agent（小d）配置

**文件**: `~/clawd/agents/main/SOUL.md`

```markdown
## Multi-Agent Collaboration

你有能力协调其他 Agent 共同完成任务。

### 可协调的 Agent

- **@zhou_data_bot (数据助理)** - 擅长数据分析、统计计算
  - Telegram: @zhou_data_bot
  - 当需要数据分析时，主动 @ 它分配子任务

### 协调流程

1. **分析任务**：判断哪些部分可以分配给其他 Agent
2. **主动分配**：在群组中 @ 对应的 Agent
3. **等待结果**：让其他 Agent 先回复
4. **汇总汇报**：整合结果后向用户汇报
```

### 4.2 子 Agent（数据助理）配置

**文件**: `~/clawd/agents/zhou_data_bot/workspace/SOUL.md`

```markdown
## 响应协作任务

当 @zhou_data_bot 被召唤时，说明主Agent需要你协助。

### 响应流程

1. **确认收到**：立即回复 "收到，正在处理..."
2. **分析需求**：理解任务要求
3. **执行任务**：使用工具完成分析
4. **发送结果**：直接回复到群组

### 协作原则

- 专注于**数据分析**和**信息处理**
- 只在被 @ 时响应（requireMention=true）
- 结果简洁明了，方便主Agent汇总
```

---

## 五、完整配置示例

### openclaw.json（关键部分）

```json
{
  "agents": {
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
      "match": { "channel": "telegram", "accountId": "main" }
    },
    {
      "agentId": "data_bot",
      "match": { "channel": "telegram", "accountId": "data_bot" }
    },
    {
      "agentId": "data_bot",
      "match": {
        "channel": "telegram",
        "accountId": "data_bot",
        "peer": { "kind": "group", "id": "-1003531397239" }
      }
    }
  ],
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["main", "data_bot"]
    },
    "sessions": {
      "visibility": "all"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "accounts": {
        "main": {
          "botToken": "YOUR_MAIN_BOT_TOKEN",
          "dmPolicy": "pairing",
          "groups": {
            "-1003531397239": { "requireMention": false }
          }
        },
        "data_bot": {
          "botToken": "YOUR_DATA_BOT_TOKEN",
          "dmPolicy": "pairing",
          "groups": {
            "-1003531397239": { "requireMention": true }
          }
        }
      }
    }
  }
}
```

---

## 六、目录结构建议

```
~/clawd/                           # Git 仓库
├── agents/
│   ├── main/                      # 主 Agent
│   │   ├── AGENTS.md
│   │   ├── SOUL.md               # 添加 Multi-Agent Collaboration 章节
│   │   ├── TOOLS.md              # 添加 Agent 间通信工具说明
│   │   └── skills/
│   │
│   └── zhou_data_bot/             # 子 Agent
│       └── workspace/
│           ├── AGENTS.md
│           ├── SOUL.md           # 添加响应协作任务说明
│           └── MEMORY.md
│
├── config/
│   └── openclaw.json              # 配置文件备份
│
├── shared/                        # 共享目录（可选）
│   └── COLLABORATION.md          # 协作任务看板
│
└── workspace/                     # 项目文档
```

---

## 七、常见问题排查

### 问题 1：Agent 间无法通信

**检查**:
1. `tools.agentToAgent.enabled` 是否为 `true`
2. `tools.agentToAgent.allow` 是否包含相关 Agent ID
3. `tools.sessions.visibility` 是否为 `all`

### 问题 2：Bot 不响应 @

**检查**:
1. Telegram 隐私模式是否已关闭
2. Bot 是否已重新邀请进群
3. `requireMention` 配置是否正确

### 问题 3：sessions_send 失败

**检查**:
1. 是否使用了完整的 session key（如 `agent:data_bot:telegram:group:-1003531397239`）
2. 简写的 `"data_bot"` 会创建 webchat session，无法发送到 Telegram

### 问题 4：子 Agent 不响应主 Agent 的 @

**检查**:
1. 子 Agent 的 `requireMention` 是否为 `true`
2. 主 Agent 是否正确 @ 了子 Agent
3. 检查群组 ID 是否在 `groups` 配置中

---

## 八、备份建议

定期备份配置到 Git：

```bash
cd ~/clawd
git add .
git commit -m "backup: 更新多 Agent 配置"
git push origin main
```

---

## 参考

- Openclaw 官方文档：https://docs.openclaw.ai/concepts/multi-agent
- Session Tools 文档：https://docs.openclaw.ai/concepts/session-tool
- Telegram Bot 隐私模式：https://core.telegram.org/bots#privacy-mode
