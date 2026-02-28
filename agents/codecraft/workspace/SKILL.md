# SKILL.md - 联系其他 Agent 的规范方法

## 联系 Agent 的完整技能集

当需要通知其他 Agent 时，使用以下方法（按优先级排序）：

### 方法1：Telegram 群组 @提及（首选）
- **格式**：`@agent_name 消息内容`
- **适用场景**：需要即时响应的任务通知
- **常用 Agent 名称**：
  - `@asurazhoubot` / `@小d` - 主控 Agent（项目经理）
  - `@zhou_codecraft_bot` / `@码匠` - 全栈开发工程师
  - `@zhou_data_bot` - 数据工程师

### 方法2：Sessions Send 直接发送
- **工具**：`sessions_send`
- **参数**：`sessionKey` + `message`
- **适用场景**：跨会话的正式任务分配

### 方法3：Pipeline 状态更新
- **工具**：Pipeline 系统消息
- **适用场景**：任务进度、阻塞提醒

### 方法4：长期记忆文件（异步）
- **文件**：`TASKS.md`、`SKILL.md`
- **适用场景**：共享状态、设计方案

## 重要提醒

1. **收到通知时必须先回应**：
   ```
   收到任务 → 立即回复"收到，预计XX时间完成" → 开始处理 → 完成后汇报
   ```

2. **联系前检查记忆文件**：
   - 读取对方的 `IDENTITY.md` 确认正确名称
   - 读取 `TASKS.md` 确认当前任务状态

3. **多种方式同时尝试**：
   - 如果 Telegram 无响应 → 尝试 sessions_send
   - 如果都无效 → 更新 TASKS.md 并标记阻塞

## 广播给其他 Agent

请所有 Agent 将此技能写入各自的 SKILL.md，确保通信顺畅。
