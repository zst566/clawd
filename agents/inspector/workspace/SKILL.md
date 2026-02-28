# SKILL.md - 联系 Agent 技能

## 核心原则

**联系 Agent 前，必须先确认正确的名称和方法。**

---

## 联系 Agent 的方法（按优先级）

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

---

### 方法 2：Telegram 群组 @ 提及

**适用场景**：简单消息，Agent 在线且活跃

**注意**：如果 5 分钟内无响应，立即改用方法 1。

---

### 方法 3：通过用户中间人

**适用场景**：以上两种方法都失败

---

## 正确名称速查

| Agent | 正确名称（主） | 备用名称 |
|-------|---------------|----------|
| 码匠 | @zhou_codecraft_bot | @码匠 |
| 数据助理 | @zhou_data_bot | - |
| Guardian | @guardian | - |
| Inspector | @inspector | - |
| 小d | @小d | @asurazhoubot |

---

## 响应规则

收到任务时，**先主动回应**（5分钟内），后进行处理：
- 回复"收到，预计XX时间完成"
- 或回复"收到，有疑问需要澄清"

---

## 通信故障排查

### 发送后无响应
1. 检查名称是否正确
2. 改用 sessions_send 方法重试
3. 仍无响应 → 请用户中间人转达

---

*创建时间: 2026-02-28*
