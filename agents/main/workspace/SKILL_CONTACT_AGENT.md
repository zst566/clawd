# 联系 Agent 技能 - 完整方法指南

## 核心原则

**联系 Agent 前，必须先确认正确的名称和方法。**

错误示例：
- ❌ `@guardian_dev_bot` → 应该是 `@guardian`
- ❌ `@codecraft_dev_bot` → 应该是 `@zhou_codecraft_bot` 或 `@码匠`

---

## 联系 Agent 的方法（按优先级排序）

### 场景区分（重要！）

| 场景 | 使用工具 | 说明 |
|------|----------|------|
| **日常沟通** | `sessions_send` | 询问进度、获取结果、简单对话 |
| **分配独立任务** | `sessions_spawn` | 让 Agent 独立执行一个完整任务 |

---

### 方法 1-A：Sessions Send - 日常沟通（推荐）

**适用场景**：
- 询问任务进度
- 获取之前的结果
- 简单问答
- 不需要 Agent 开启新会话

**优点**：
- ✅ 最可靠，消息直接到达 Agent
- ✅ 不依赖 Telegram 通知机制
- ✅ 支持复杂消息内容

**示例**：
```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "上次的数据分析完成了吗？",
  timeoutSeconds: 60
})
```

**返回值**：
- `status: "ok"` + `reply` - 成功收到回复
- `status: "timeout"` - 超时无响应
- `delivery.status: "pending"` - 消息已发送，等待 Agent 响应

---

### 方法 1-B：Sessions Spawn - 分配独立任务

**适用场景**：
- 需要 Agent 独立执行一个完整任务
- 任务可能需要较长时间
- 需要 Agent 在隔离会话中工作

**配置要求**：
- 需要在 `agents.list[].subagents.allowAgents` 中配置允许的 Agent ID
- 使用 `["*"]` 允许所有已定义的 Agent

**示例**：
```javascript
sessions_spawn({
  agentId: "data_bot",  // 必须是 agents.list 中定义的 ID
  task: "分析这个CSV文件并生成统计报告",
  label: "数据分析任务",
  // runTimeoutSeconds: 300,  // 可选，默认使用 agents.defaults.subagents.runTimeoutSeconds
  mode: "run"
})
```

**返回值**：
- `status: "accepted"` - 子 Agent 已启动
- `childSessionKey` - 子会话 key
- `runId` - 运行 ID
- 任务完成后自动返回结果到当前频道

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

| 场景 | 推荐工具 | 备选方法 |
|------|----------|----------|
| 询问进度/获取结果 | `sessions_send` | 群组 @ |
| 分配独立任务 | `sessions_spawn` | - |
| 紧急催促 | `sessions_send` | 用户中间人 |
| 简单确认 | 群组 @ | `sessions_send` |
| 复杂沟通 | `sessions_send` | 用户中间人 |

**关键区别**：
- `sessions_send` → 向 Agent 的**已有**会话发消息
- `sessions_spawn` → **启动新会话**让 Agent 独立执行任务

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

## 自动化通知协议

### 审查完成 → 自动通知开发者

当 Guardian 或 Inspector 完成代码审查后，必须**自动**通知相关开发者，无需等待项目经理中转。

#### 通知流程

```
审查完成 → 自动发送结果给开发者 → 抄送项目经理 → 开发者开始修复
```

#### 实现方式

**方式1：Guardian/Inspector 主动通知（推荐）**

```javascript
// Guardian 完成安全审查后
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "[安全审查完成] 🔒\n文件: src/utils/auth.js\n问题: 1个高危（SQL注入风险），2个警告\n详细报告: [见下方]\n@小d 已抄送"
})

// Inspector 完成质量审查后  
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "[质量审查完成] ✅\n文件: src/utils/auth.js\n问题: 3个代码风格问题，1个性能建议\n详细报告: [见下方]\n@小d 已抄送"
})
```

**方式2：项目经理汇总通知（并行审查场景）**

```javascript
// 同时启动 Guardian 和 Inspector 审查
const guardianTask = sessions_spawn({
  agentId: "guardian",
  task: "安全审查: ~/project/src/utils/auth.js",
  label: "Guardian安全审查"
});

const inspectorTask = sessions_spawn({
  agentId: "inspector", 
  task: "质量审查: ~/project/src/utils/auth.js",
  label: "Inspector质量审查"
});

// 等待两者都完成后，汇总通知
// [等待两个任务完成...]

sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "[审查汇总] 📋\nGuardian: 1高危 2警告\nInspector: 3风格 1建议\n请开始修复"
});
```

#### 通知内容规范

| 字段 | 说明 | 示例 |
|------|------|------|
| **审查类型** | 安全/质量/性能 | `[安全审查完成]` |
| **文件路径** | 被审查的文件 | `src/utils/auth.js` |
| **问题统计** | 按级别统计 | `1高危 2警告 3建议` |
| **详细报告** | 具体问题描述 | `[见附件或下方]` |
| **抄送** | 通知项目经理 | `@小d 已抄送` |

#### 响应时间要求

- **审查 Agent**：完成后立即通知（5分钟内）
- **开发者**：收到通知后确认（5分钟内）
- **阻塞处理**：20分钟无响应则升级提醒

---

**创建时间**: 2026-02-28 00:49
**更新时间**: 2026-03-03 19:46
**更新说明**: 
- 区分 `sessions_send`（日常沟通）和 `sessions_spawn`（分配独立任务）的使用场景
- 添加 `sessions_spawn` 配置要求和示例
- 更新最佳实践总结表
- **新增**: 自动化通知协议章节，规范审查完成后的自动通知流程

**重要提醒**: 所有 Agent 必须将此技能写入自己的长期记忆
