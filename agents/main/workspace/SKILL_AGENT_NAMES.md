# Agent 名称记忆与使用规范

## 核心原则

**联系 Agent 前，必须先确认正确的名称。**

错误示例：
- ❌ `@guardian_dev_bot` → 应该是 `@guardian`
- ❌ `@codecraft_dev_bot` → 应该是 `@zhou_codecraft_bot` 或 `@码匠`
- ❌ `@inspector_dev_bot` → 应该是 `@inspector`

## 正确流程

### 步骤 1：查询 MEMORY.md
每次联系 Agent 前，先读取 `MEMORY.md` 的 "Agent 联系方式" 章节：

```
## Agent 联系方式 (重要)

| Agent | 正式名称 | 群组 @ | Session Key (内部) | 用途 |
|-------|----------|--------|-------------------|------|
| **码匠** | @码匠 / codecraft / **@zhou_codecraft_bot** | **@zhou_codecraft_bot** (主) / @码匠 / @codecraft | `agent:codecraft:telegram:group:-1003531397239` | 前后端开发 |
```

### 步骤 2：使用正确的名称
根据 MEMORY.md 的优先级使用：
1. **第一优先级**：标注为"(主)"的名称
2. **第二优先级**：其他列出的名称
3. **绝对禁止**：自己添加后缀（如 `_dev_bot`）

### 步骤 3：验证响应
发送消息后，确认 Agent 能正确收到：
- 如果无响应，尝试其他备用名称
- 如果仍无响应，使用 `sessions_send` 到正确的 session key

## 常见 Agent 正确名称速查

| Agent | 正确名称（主） | 备用名称 | Session Key |
|-------|---------------|----------|-------------|
| 码匠 | **@zhou_codecraft_bot** | @码匠, @codecraft | `agent:codecraft:telegram:group:-1003531397239` |
| 数据助理 | **@zhou_data_bot** | - | `agent:data_bot:telegram:group:-1003531397239` |
| Guardian | **@guardian** | - | `agent:guardian:main` |
| Inspector | **@inspector** | - | `agent:inspector:main` |

## 错误后果

使用错误名称会导致：
1. Agent 收不到消息
2. 任务分配失败
3. 项目进度阻塞
4. 重复催促浪费资源

## 纠正措施

如果发现使用了错误名称：
1. 立即使用正确名称重新发送
2. 更新长期记忆，记录正确的名称
3. 向用户确认名称是否正确

## 记忆更新

每次确认 Agent 名称后，更新到：
- `MEMORY.md` - 长期记忆
- `AGENTS.md` - 如果有的话
- 当前项目文档

---

**创建时间**: 2026-02-28 00:29
**原因**: 防止再次发生类似 `@guardian_dev_bot` 的错误
