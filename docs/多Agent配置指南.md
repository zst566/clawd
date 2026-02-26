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

## 参考

- Openclaw 官方文档：https://docs.openclaw.ai/concepts/multi-agent
- Telegram Bot 隐私模式：https://core.telegram.org/bots#privacy-mode
