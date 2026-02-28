# 联系 Agent 技能

## 核心资源
- **Skill 位置**: `~/clawd/agents/data_bot/workspace/skills/agent-coordination/SKILL.md`
- **核心原则**: 5分钟主动检查、多源验证、多管齐下

## ⚠️ Critical Lessons Learned（来自实战教训）

### Lesson 1: 单渠道通知必然失败
```javascript
// ❌ 错误 - 只用一种方式
message({ action: "send", message: "@agent check progress" })

// ✅ 正确 - 多渠道组合
message({ action: "send", message: "@agent check progress" })
sessions_send({ sessionKey: "agent:xxx:telegram:group:...", message: "...", timeoutSeconds: 30 })
exec("grep agent_name ~/.openclaw/logs/gateway.log | tail -20")
```

### Lesson 2: 无回复 ≠ 无进展
- 先检查 gateway.log 再标记阻塞
- 案例：CodeCraft 显示 75 分钟无响应，但日志显示 11:24 已完成

### Lesson 3: edit/write 后必须验证
```javascript
// ✅ 正确 - edit 后 read 确认
edit({ file_path: "...", oldText: "...", newText: "..." })
read({ file_path: "...", limit: 30 })  // 验证修改
```

## 通知优先级
1. sessions_spawn（最可靠，自动回传）
2. sessions_send（高可靠，支持 ping-pong）
3. Telegram @mention（群组可见）

## 最低要求：必须使用 2+ 方法
- ✅ sessions_send
- ✅ Telegram @mention
- ✅ (可选) sessions_spawn 监控

## 核心原则
**永远不要只使用一种方式！** 多管齐下 = 高送达率

⚠️ **新增：永远不要相信预估完成时间** - 不管 Agent 说几分钟完成，每5分钟必须检查进度

## 方法
1. Sessions Send 直接发送（推荐）
2. Telegram 群组 @ 提及
3. 通过用户中间人

## 紧急任务组合（4种全用）
1. Telegram 群组 @mention
2. sessions_send 到 group session
3. sessions_spawn 子代理
4. CLI openclaw agent

## 响应规则
收到任务 → 5分钟内回应"收到，预计XX时间完成" → 后处理 → 完成后汇报

## 正确名称
- 码匠：@zhou_codecraft_bot（系统：@codecraft）
- Guardian：@guardian
- Inspector：@inspector
- 数据助理：@zhou_data_bot（系统：@data_bot）
- 小d：@小d（系统：@main）

## Session Key 格式
- Telegram 群组：`agent:xxx:telegram:group:-1003531397239`
- ⚠️ 必须是 `telegram:group` 结尾，不是 `main`！

## 超时设置
- 常规：30-60秒
- 复杂任务：900秒（15分钟）

## 进度检查：多源验证
**不要只依赖 sessions_history！**

| 来源 | 命令 |
|------|------|
| sessions_history | `sessions_history({sessionKey: "..."})` |
| OpenClaw logs ⭐ | `grep agent_name ~/.openclaw/logs/gateway.log` |
| Subagents | `subagents({action: "list"})` |
| Cron jobs | `cron({action: "list"})` |

## 标记阻塞前检查清单
- [ ] 已检查 sessions_history
- [ ] 已检查 gateway.log ⭐
- [ ] 已检查 subagents list
- [ ] 已检查 cron jobs
- [ ] 已等待至少15分钟
- [ ] 已使用至少2种通讯方式

**只有全部检查后才可标记为阻塞！**
