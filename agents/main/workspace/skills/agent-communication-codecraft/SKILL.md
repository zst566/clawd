---
name: agent-communication-codecraft
description: 与 @zhou_codecraft_bot（码匠）的通讯规范和工作流程。使用当需要分配任务给码匠、跟进进度、或进行项目协调时。适用于润德教育 Dashboard 优化等前端/后端开发任务。
---

# 与码匠（@zhou_codecraft_bot）通讯规范

## 通讯原则

1. **默认使用 `sessions_spawn`**：所有任务分配必须使用 `sessions_spawn` 工具
   - 简单任务（<30分钟）：默认超时 1800秒（30分钟）
   - 常规任务（1-2小时）：设置超时 7200秒（2小时）
   - 复杂任务（半天）：设置超时 14400秒（4小时）
   - 超长任务：拆分为多个子任务，每个2-4小时

2. **并发执行**：无依赖的任务使用多个 `sessions_spawn` 并发启动

3. **提前完成响应**：子任务完成后自动汇报，立即确认并触发下一阶段

4. **明确交付物**：每次分配任务必须明确交付物、截止时间、验收标准

## 任务分配方式（必须使用 sessions_spawn）

### 简单任务（默认30分钟超时）
```javascript
sessions_spawn({
  agentId: "codecraft",
  task: "具体任务描述...",
  runTimeoutSeconds: 1800  // 30分钟
})
```

### 常规开发任务（2小时超时）
```javascript
sessions_spawn({
  agentId: "codecraft",
  task: "具体任务描述...",
  runTimeoutSeconds: 7200  // 2小时
})
```

### 复杂任务（4小时超时）
```javascript
sessions_spawn({
  agentId: "codecraft",
  task: "具体任务描述...",
  runTimeoutSeconds: 14400  // 4小时
})
```

### 并发任务示例
```javascript
// 同时启动多个无依赖的子任务
const tasks = await Promise.all([
  sessions_spawn({ agentId: "codecraft", task: "子任务A", runTimeoutSeconds: 7200 }),
  sessions_spawn({ agentId: "codecraft", task: "子任务B", runTimeoutSeconds: 7200 }),
  sessions_spawn({ agentId: "codecraft", task: "子任务C", runTimeoutSeconds: 7200 })
]);
```

## ⚠️ 禁止事项
- ❌ 禁止使用 `sessions_send` 分配开发任务
- ❌ 禁止仅使用 Telegram @mention 分配任务
- ❌ 禁止不设置超时或使用过短超时（<30分钟）

## 进度响应机制（sessions_spawn 自动汇报）

### 子任务完成自动响应

**流程**：
1. 子任务完成 → 自动发送完成报告到当前session
2. 我收到报告 → 立即确认完成
3. 检查是否全部完成 → 自动触发下一阶段
4. 在群组同步进度

### 超时处理

如果子任务超时未完成：
1. 检查实际进度（通过子任务返回信息）
2. 如接近完成，考虑延长超时
3. 如阻塞，询问码匠原因
4. 必要时重新分配任务

## 项目阶段检查清单

### 阶段4 - 前端设计细化
**分配方式**：`sessions_spawn`，超时 2小时
**交付物**：`rundeedu-dashboard-optimization/DESIGN.md`
**响应方式**：子任务完成后自动汇报，立即确认

### 阶段5 - 前端实现
**分配方式**：`sessions_spawn`，超时 4小时
**交付物**：`views/Dashboard/` 目录下的代码
**响应方式**：子任务完成后自动汇报，立即确认

## 任务分配模板（sessions_spawn）

### 简单任务示例
```javascript
sessions_spawn({
  agentId: "codecraft",
  label: "task-name",           // 任务标识
  mode: "run",                  // run或session
  runTimeoutSeconds: 1800,      // 30分钟超时
  task: `
    【任务名称】XXX
    
    **目标**: 简要说明任务目标
    
    **交付物**:
    - [ ] 交付物1
    - [ ] 交付物2
    
    **验收标准**:
    - 标准1
    - 标准2
    
    **预计耗时**: 30分钟
    
    完成后立即汇报！
  `
})
```

### 开发任务示例（带并发）
```javascript
// 主协调任务
sessions_spawn({
  agentId: "codecraft",
  label: "backend-stage2",
  mode: "run",
  runTimeoutSeconds: 7200,
  task: `
    【阶段2】基础架构搭建 - 并发子任务
    
    同时启动以下4个子任务：
    
    子任务2.1: 数据库配置（30-60分钟）
    子任务2.2: Redis+码池（30-60分钟）
    子任务2.3: 认证中间件（45-90分钟）
    子任务2.4: 工具函数（30-60分钟）
    
    每个子任务完成后立即汇报，我会自动响应！
  `
})
```

## 阻塞处理流程

### sessions_spawn 任务阻塞处理

1. **任务超时（2-4小时）**
   - 检查子任务返回的最后状态
   - 询问码匠实际进度和阻塞原因
   - 决定是否延长超时或重新分配

2. **子任务汇报异常**
   - 立即查看错误信息
   - 分析问题原因
   - 协助解决或调整方案

3. **技术阻塞**
   - 立即升级，寻求其他Agent协助
   - 必要时调整技术方案

### 常见错误纠正

| 错误 | 正确做法 |
|------|----------|
| 使用 `sessions_send` 分配任务 | **必须使用 `sessions_spawn`** |
| 使用 Telegram @mention 分配任务 | **必须使用 `sessions_spawn`** |
| 不设置超时或超时过短 | 根据任务难度设置 30分钟-4小时 |
| 等待码匠主动汇报 | 子任务完成后**自动汇报**，立即响应 |
| 混淆阶段4和阶段5 | 阶段4完成后再进入阶段5 |
| 接受模糊的进度回复 | 要求具体的交付物状态 |
| 允许无限期延迟 | 明确的超时和验收标准 |

## 通讯记录

### ⚠️ 重要：根据当前群组选择正确的 Session Key

| 当前群组 | Session Key 后缀 | 完整 Session Key |
|---------|-----------------|-----------------|
| **润德教育讨论群** | `-1003531397239` | `agent:codecraft:telegram:group:-1003531397239` |
| **茂名文旅讨论群** | `-5157029269` | `agent:codecraft:telegram:group:-5157029269` |
| 商场促销项目群 | `-5039017209` | `agent:codecraft:telegram:group:-5039017209` |
| dv项目运维群 | `-5099457733` | `agent:codecraft:telegram:group:-5099457733` |
| 福禄英语预约平台 | `-5187551770` | `agent:codecraft:telegram:group:-5187551770` |
| 鹿状元讨论群 | `-5130812403` | `agent:codecraft:telegram:group:-5130812403` |

### 任务分配时必须指定正确的 sessionKey

```javascript
// 茂名文旅群（当前项目）
sessions_spawn({
  agentId: "codecraft",
  sessionKey: "agent:codecraft:telegram:group:-5157029269",  // ⚠️ 必须指定
  task: "任务描述...",
  runTimeoutSeconds: 7200
})

// 润德教育群
sessions_spawn({
  agentId: "codecraft",
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",  // ⚠️ 必须指定
  task: "任务描述...",
  runTimeoutSeconds: 7200
})
```

- **Agent ID**: codecraft
- **别名**: 码匠、@zhou_codecraft_bot（仅作识别，不用于任务分配）

> ⚠️ **重要**: 任务分配必须使用 `sessions_spawn`，禁止使用 Telegram @ 或 `sessions_send`

## 历史问题参考

### 2026-02-28 发现的问题
- **问题**：码匠一直在等待确认，没有主动推进工作
- **原因**：没有建立定期进度检查机制
- **解决**：建立每5分钟检查一次的机制
