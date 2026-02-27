# HEARTBEAT.md - Pipeline 进度监控

## 功能
当 Pipeline 任务执行时，每 5 分钟检查各 Agent 进度，卡住时主动提醒。

## 检查逻辑

1. **读取 PIPELINE_STATUS.json**
2. **检查当前阶段和负责 Agent**
3. **如果该 Agent 超过 5 分钟未响应 → 提醒**

## 提醒方式

```
[Agent 名称] 你在 [任务] 上已停留 X 分钟，请更新进度或说明阻塞原因。
```

## 当前状态

查看 `/Users/asura.zhou/clawd/PIPELINE_STATUS.json` 了解当前 Pipeline 状态。

## 阻塞处理

- **开发阶段** → 提醒 CodeCraft
- **审核阶段** → 提醒 Guardian  
- **测试阶段** → 提醒 Inspector
- **部署阶段** → 提醒 Deployer
