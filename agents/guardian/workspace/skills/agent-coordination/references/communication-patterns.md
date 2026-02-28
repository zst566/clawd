# Communication Patterns

## Pattern 1: Coordinator Subagent (Recommended ⭐️)

**Use when**: Need to track multiple agents with deadline requirements

```javascript
// Spawn a coordinator subagent
sessions_spawn({
  agentId: "main",
  label: "coordinator-task-name",
  runTimeoutSeconds: 900,
  cleanup: "keep",
  task: `
    You are a task coordinator. Your job is to:
    1. Contact @agent1 via sessions_send
    2. Contact @agent2 via sessions_send
    3. Check progress every 5 minutes
    4. Report back after 15 minutes or when complete
    
    Target agents:
    - agent:guardian:telegram:group:-1003531397239
    - agent:inspector:telegram:group:-1003531397239
    
    Report format:
    - Agent status
    - Completion percentage
    - Any blockers
  `
})
```

**Benefits**:
- Automatic result announcement when complete
- Timeout protection (won't run forever)
- Doesn't block main agent
- Built-in retry and error handling

---

## Pattern 2: Direct sessions_send

**Use when**: Quick one-off messages, immediate response expected

```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "请开始任务X",
  timeoutSeconds: 30
})
```

**Limitations**:
- No automatic retry
- Must manually check for response
- Easy to miss replies if not polling

---

## Pattern 3: Telegram + sessions_send Combo

**Use when**: Need group visibility + agent notification

```javascript
// 1. Post to group for visibility
message({
  action: "send",
  message: "@guardian @inspector 请开始审查"
})

// 2. Direct notification via sessions_send
sessions_send({
  sessionKey: "agent:guardian:telegram:group:-1003531397239",
  message: "任务详情..."
})
```

---

## Pattern 4: Cron-Based Monitoring

**Use when**: Regular scheduled checks (every 5 min, hourly, etc.)

```json
{
  "schedule": { "kind": "every", "everyMs": 300000 },
  "payload": {
    "kind": "agentTurn",
    "message": "检查各Agent进度"
  }
}
```

---

## When to Use Each Pattern

| Scenario | Recommended Pattern | Why |
|----------|---------------------|-----|
| Urgent task with deadline | Coordinator Subagent | Timeout control, auto-announce |
| Quick question/confirmation | Direct sessions_send | Fast, simple |
| Multi-agent coordination | Coordinator Subagent | Parallel tracking |
| Regular status checks | Cron | Automated, no manual work |
| High-visibility announcement | Telegram + sessions_send | Group sees it |

---

## Anti-Patterns to Avoid

❌ **Don't**: Poll subagents in a loop
```javascript
// BAD - wastes tokens
while (true) {
  subagents({ action: "list" })
  sleep(60000)
}
```

✅ **Do**: Use auto-announce feature
```javascript
// GOOD - subagent reports when done
sessions_spawn({
  task: "...",
  // Results auto-announce on completion
})
```

❌ **Don't**: Use wrong session keys
```javascript
// BAD - won't post to Telegram
sessions_send({
  sessionKey: "agent:guardian:main"  // Internal only
})
```

✅ **Do**: Use group session keys
```javascript
// GOOD - posts to Telegram group
sessions_send({
  sessionKey: "agent:guardian:telegram:group:-1003531397239"
})
```
