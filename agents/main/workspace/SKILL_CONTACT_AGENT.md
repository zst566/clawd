# 联系 Agent 技能 - 完整方法指南

## 核心原则

**联系 Agent 前，必须先确认正确的名称和方法。**

错误示例：
- ❌ `@guardian_dev_bot` → 应该是 `@guardian`
- ❌ `@codecraft_dev_bot` → 应该是 `@zhou_codecraft_bot` 或 `@码匠`

---

## 联系 Agent 的方法（按优先级排序）

### 方法 1：Sessions Send 直接发送（推荐）

**适用场景**：所有需要确保消息送达的情况

**优点**：
- ✅ 最可靠，消息直接到达 Agent
- ✅ 不依赖 Telegram 通知机制
- ✅ 支持复杂消息内容

**示例**：
```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "任务分配...",
  timeoutSeconds: 60
})
```

**返回值**：
- `status: "ok"` + `reply` - 成功收到回复
- `status: "timeout"` - 超时无响应
- `delivery.status: "pending"` - 消息已发送，等待 Agent 响应

---

### 方法 2：Telegram 群组 @ 提及

**适用场景**：简单消息，Agent 在线且活跃

**优点**：
- ✅ 简单快捷
- ✅ 群组可见，便于追踪

**缺点**：
- ⚠️ 可能因 OpenClaw 通知机制延迟或丢失
- ⚠️ 复杂消息可能无法完整传递

**示例**：
```javascript
message.send({
  action: "send",
  channel: "telegram",
  message: "@zhou_codecraft_bot 请完成任务...",
  target: "telegram:-1003531397239"
})
```

**注意**：如果 5 分钟内无响应，立即改用方法 1。

---

### 方法 3：通过用户中间人

**适用场景**：以上两种方法都失败

**流程**：
1. 用户收到 Agent 的消息
2. 用户转发给我
3. 我发送回复给用户
4. 用户转发给 Agent

**示例**：
```
我 → 用户："请告诉 @zhou_codecraft_bot，任务..."
用户 → @zhou_codecraft_bot：转发消息
@zhou_codecraft_bot → 用户：回复
用户 → 我：转发回复
```

---

## 正确名称速查

| Agent | 正确名称（主） | 备用名称 | Session Key |
|-------|---------------|----------|-------------|
| 码匠 | **@zhou_codecraft_bot** | @码匠, @codecraft | `agent:codecraft:telegram:group:-1003531397239` |
| 数据助理 | **@zhou_data_bot** | - | `agent:data_bot:telegram:group:-1003531397239` |
| Guardian | **@guardian** | - | `agent:guardian:main` |
| Inspector | **@inspector** | - | `agent:inspector:main` |
| 小d (我) | **@小d** / @asurazhoubot | - | `agent:main:telegram:group:-1003531397239` |

---

## 响应规则（重要）

### 收到任务时的标准流程

1. **先主动回应**（5分钟内）
   - 回复"收到，预计XX时间完成"
   - 或回复"收到，有疑问需要澄清"

2. **后进行处理**
   - 开始实际工作
   - 完成后汇报结果

**目的**：让发送方知道任务已接收，避免重复催促。

---

## 通信故障排查

### 故障现象 1：发送后无响应
**排查步骤**：
1. 检查名称是否正确（查 MEMORY.md）
2. 改用 sessions_send 方法重试
3. 仍无响应 → 请用户中间人转达

### 故障现象 2：消息发送成功但 Agent 说没收到
**原因**：OpenClaw 通知机制延迟或丢失
**解决**：使用 sessions_send 方法

### 故障现象 3：Agent 回复了但我没收到
**原因**：消息在 OpenClaw 内部队列，未投递到我的 session
**解决**：通过用户中间人确认

---

## 最佳实践总结

| 场景 | 推荐方法 | 备选方法 |
|------|----------|----------|
| 任务分配 | Sessions Send | 群组 @ + Sessions Send |
| 紧急催促 | Sessions Send | 用户中间人 |
| 简单确认 | 群组 @ | Sessions Send |
| 复杂沟通 | Sessions Send | 用户中间人 |

---

## 错误案例

### 错误 1：使用错误名称
```javascript
// ❌ 错误
message.send("@guardian_dev_bot 请检查...")

// ✅ 正确
message.send("@guardian 请检查...")
```

### 错误 2：只使用一种方法
```javascript
// ❌ 错误 - 只发群组 @，无响应也不换方法
message.send("@码匠 请回复...")
// 等待 30 分钟... 无响应

// ✅ 正确 - 5 分钟无响应立即换方法
message.send("@码匠 请回复...")
// 5 分钟后...
sessions_send({ sessionKey: "agent:codecraft:telegram:group:-1003531397239", ... })
```

### 错误 3：收到任务不回应
```javascript
// ❌ 错误 - 收到任务直接开始工作，不回应
收到任务 → [沉默开始工作] → 30分钟后完成 → 汇报

// ✅ 正确 - 先回应，后处理
收到任务 → "收到，预计2小时完成" → 开始工作 → 完成后汇报
```

---

**创建时间**: 2026-02-28 00:49
**更新说明**: 包含所有联系方法、故障排查、最佳实践
**重要提醒**: 所有 Agent 必须将此技能写入自己的长期记忆
