---
name: agent-communication-best-practices
description: Agent间通讯的最佳实践指南。使用当需要与其他Agent协调任务、跟进进度、或确保消息送达时。
---

# 🤖 Agent 通讯最佳实践指南

## 📋 核心原则

**永远不要只使用一种方式联系其他 Agent！**

**检查进度时，不要只依赖 sessions_history！**

多管齐下 = 高送达率 + 准确状态

---

## 🔍 进度检查：多源验证（重要！）

Agent 活动可能出现在多个地方：

| 来源 | 命令 | 查找内容 |
|------|------|----------|
| **sessions_history** | `sessions_history({sessionKey: "..."})` | 直接回复 |
| **OpenClaw logs** ⭐ | `grep agent_name ~/.openclaw/logs/gateway.log` | 隐藏活动、系统消息 |
| **Subagents** | `subagents({action: "list"})` | 运行中的子代理 |
| **Cron jobs** | `cron({action: "list"})` | 定时任务 |

### 真实案例（2026-02-28）

**问题**：CodeCraft 显示 "75+分钟无响应"

**sessions_history 显示**：无回复 ❌

**gateway.log 显示**：
```
11:24:46 - 收到任务
11:24:47 - 开始修复 composables
11:24:49 - ✅ 修复完成！commit 9f013b0
```

**结论**：Agent 已完成工作，只是没发送到 Telegram session！

### 快速检查命令

```bash
# 检查特定 agent 的最近活动
grep -i 'agent_name' ~/.openclaw/logs/gateway.log | tail -20

# 查找提交/完成记录
grep -E "(commit|completed|finished)" ~/.openclaw/logs/gateway.log | grep agent_name

# 查找错误
grep -i error ~/.openclaw/logs/gateway.log | tail -10

# 实时监视
tail -f ~/.openclaw/logs/gateway.log | grep agent_name
```

### 标记阻塞前的检查清单

- [ ] 已检查 sessions_history
- [ ] **已检查 gateway.log** ⭐
- [ ] 已检查 subagents list
- [ ] 已检查 cron jobs
- [ ] 已等待至少15分钟
- [ ] 已使用至少2种通讯方式

**只有全部检查后才可标记为阻塞！**

---

## 🎯 推荐通讯组合（按优先级）

### 组合 1: 紧急任务（推荐 ⭐️⭐️⭐️⭐️⭐️）

```
1. Telegram 群组 @mention
2. sessions_send 到 group session  
3. sessions_spawn 子代理（带超时控制）
4. CLI openclaw agent（如可用）
```

**使用场景**: 关键任务分配、阻塞升级、紧急修复

**示例**:
```javascript
// 1. Telegram 群组
message({ action: "send", message: "@agent_name 紧急任务..." })

// 2. sessions_send
sessions_send({
  sessionKey: "agent:xxx:telegram:group:-1003531397239",
  message: "任务详情...",
  timeoutSeconds: 30
})

// 3. sessions_spawn（最可靠）
sessions_spawn({
  agentId: "main",
  label: "task-monitor",
  runTimeoutSeconds: 900,
  task: "监控 @agent_name 任务进度，每5分钟检查..."
})

// 4. CLI（备用）
exec("openclaw agent --agent xxx --message '...' --deliver")
```

---

### 组合 2: 常规任务（推荐 ⭐️⭐️⭐️⭐️）

```
1. Telegram 群组 @mention
2. sessions_send 到 group session
```

**使用场景**: 日常任务分配、进度汇报

---

### 组合 3: 后台监控（推荐 ⭐️⭐️⭐️⭐️⭐️）

```
1. Cron job 定时检查
2. sessions_spawn 持续监控
```

**使用场景**: 长时间任务监控、定时汇报

---

## 📡 4 种通讯方式详解

### 1️⃣ Telegram 群组 @mention

**优点**:
- ✅ 群组可见，透明度高
- ✅ 人类用户也能看到
- ✅ 支持富文本、图片

**缺点**:
- ❌ Agent 可能错过消息
- ❌ 无送达确认
- ❌ 无自动重试

**代码**:
```javascript
message({
  action: "send",
  message: "@zhou_codecraft_bot 请开始任务..."
})
```

---

### 2️⃣ sessions_send

**优点**:
- ✅ 直接发送到 Agent session
- ✅ 支持 ping-pong 对话（最多5轮）
- ✅ 有 timeout 控制

**缺点**:
- ❌ 需要正确的 session key
- ❌ Agent 可能不回复
- ❌ 无自动重试机制

**代码**:
```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "任务详情...",
  timeoutSeconds: 60
})
```

**⚠️ 注意**: 使用 `telegram:group` 结尾的 key，不是 `main`!

---

### 3️⃣ sessions_spawn（最推荐 ⭐️）

**优点**:
- ✅ **自动结果回传**（完成后自动 announce）
- ✅ **超时控制**（可设置 900s 等）
- ✅ **错误处理**（失败/超时都有状态）
- ✅ **隔离性**（独立 session 运行）
- ✅ **不阻塞主代理**

**缺点**:
- ⚠️ 只能 spawn agents_list 中的 agent
- ⚠️ 结果需要等待子代理完成

**代码**:
```javascript
sessions_spawn({
  agentId: "main",  // 或可用 agent
  label: "task-coordinator",
  runTimeoutSeconds: 900,
  cleanup: "keep",
  task: `
    你的任务描述...
    1. 联系 @agent1
    2. 联系 @agent2
    3. 每5分钟检查进度
    4. 15分钟后报告结果
  `
})
```

---

### 4️⃣ CLI openclaw agent

**优点**:
- ✅ 命令行直接触发
- ✅ 可指定 --deliver 发送到频道
- ✅ 支持 --local 本地运行

**缺点**:
- ❌ 需要 shell 执行权限
- ❌ 可能需要等待命令完成

**代码**:
```bash
openclaw agent \
  --agent codecraft \
  --message "请开始任务..." \
  --deliver \
  --reply-channel telegram \
  --reply-to "-1003531397239"
```

---

## 🔄 进度检查策略

### 每 5 分钟检查一次

```javascript
// 方法 1: Cron job（推荐）
cron({
  action: "add",
  job: {
    schedule: { kind: "every", everyMs: 300000 },
    payload: {
      kind: "agentTurn",
      message: "检查各 Agent 进度..."
    }
  }
})

// 方法 2: sessions_spawn 子代理
sessions_spawn({
  agentId: "main",
  label: "progress-monitor",
  runTimeoutSeconds: 1800,  // 30分钟
  task: `
    每5分钟检查一次：
    1. 读取各 Agent 的 sessions_history
    2. 检查最后活跃时间
    3. 超过15分钟无响应 → 提醒
    4. 超过30分钟无响应 → 标记阻塞
  `
})
```

---

## ⚠️ 常见错误

### 错误 1: 只使用一种方式

```javascript
// ❌ 错误 - 容易丢失消息
message({ action: "send", message: "@agent 请开始..." })
// 然后等待... 可能永远等不到回复
```

```javascript
// ✅ 正确 - 多管齐下
message({ action: "send", message: "@agent 请开始..." })
sessions_send({ sessionKey: "agent:xxx:telegram:group:...", message: "..." })
sessions_spawn({ agentId: "main", task: "监控进度..." })
```

---

### 错误 2: 使用错误的 session key

```javascript
// ❌ 错误 - 不会发送到 Telegram
sessions_send({
  sessionKey: "agent:codecraft:main",  // 内部 session
  message: "..."
})
```

```javascript
// ✅ 正确 - 发送到 Telegram 群组
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "..."
})
```

---

### 错误 3: 没有超时控制

```javascript
// ❌ 错误 - 可能永远等待
sessions_send({ sessionKey: "...", message: "..." })
// 没有 timeout，可能无限等待
```

```javascript
// ✅ 正确 - 设置超时
sessions_send({
  sessionKey: "...",
  message: "...",
  timeoutSeconds: 60  // 60秒超时
})
```

---

## 📞 Agent 通讯录（速查）

| Agent | Telegram | Group Session Key |
|-------|----------|-------------------|
| 码匠 | @zhou_codecraft_bot | `agent:codecraft:telegram:group:-1003531397239` |
| 数据助理 | @zhou_data_bot | `agent:data_bot:telegram:group:-1003531397239` |
| Guardian | @guardian | `agent:guardian:telegram:group:-1003531397239` |
| Inspector | @inspector | `agent:inspector:telegram:group:-1003531397239` |

---

## 🎯 快速决策表

| 场景 | 推荐方式 | 代码示例 |
|------|----------|----------|
| 紧急任务 | 4种全用 | 见"组合1" |
| 常规任务 | Telegram + sessions_send | 见"组合2" |
| 长时间监控 | Cron + spawn | 见"组合3" |
| 快速询问 | sessions_send | timeout: 30s |
| 需要结果 | sessions_spawn | timeout: 900s |

---

## 💡 Pro Tips

1. **总是设置超时** - 防止无限等待
2. **使用子代理监控** - 不阻塞主代理工作
3. **记录到 STATUS.md** - 保持状态透明
4. **检查 OpenClaw logs** - 不只依赖 sessions_history
5. **广播重要更新** - 让所有相关方知道

---

**最后更新**: 2026-02-28  
**版本**: v1.0
