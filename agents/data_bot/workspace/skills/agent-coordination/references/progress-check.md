# Progress Check Patterns

## The Multi-Source Rule

**Never rely on a single source!** Agent responses may appear in:
1. sessions_history (direct replies)
2. OpenClaw gateway.log (system-level activity)
3. Subagent announcements (spawned tasks)
4. Cron job outputs (scheduled tasks)

---

## Pattern 1: Quick Status Check (30 seconds)

```javascript
// Check direct session
const sessionCheck = sessions_history({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  limit: 3
})

// Check logs for hidden activity
const logCheck = exec(
  "grep -i 'codecraft\|dashboard' ~/.openclaw/logs/gateway.log | tail -10"
)

// Combine results
if (sessionCheck.messages.length > 0) {
  return "Agent responded in session"
} else if (logCheck.stdout.includes("commit")) {
  return "Activity found in logs!"
} else {
  return "No activity detected"
}
```

---

## Pattern 2: Deep Activity Search (2 minutes)

```javascript
// Search multiple log patterns
const searches = [
  "grep 'codecraft' ~/.openclaw/logs/gateway.log | tail -20",
  "grep 'commit\|completed\|finished' ~/.openclaw/logs/gateway.log | grep -i codecraft | tail -10",
  "ls -lt ~/.openclaw/agents/codecraft/workspace/ | head -5"
]

for (const cmd of searches) {
  const result = exec(cmd)
  if (result.stdout) {
    console.log("Found activity:", result.stdout)
  }
}
```

---

## Pattern 3: Before Marking Blocked

**Mandatory checklist** before marking any agent as "blocked":

- [ ] Checked sessions_history (last 5 messages)
- [ ] Checked gateway.log for agent name
- [ ] Checked subagents list for running tasks
- [ ] Checked cron jobs for scheduled tasks
- [ ] Waited at least 15 minutes since first contact
- [ ] Used at least 2 communication methods

**If all checked and no activity** → Mark as blocked

---

## Common Log Patterns to Search

### Finding Commits/Completes
```bash
grep -E "(commit|completed|finished|done)" ~/.openclaw/logs/gateway.log | grep <agent_name>
```

### Finding Errors
```bash
grep -E "(error|fail|timeout)" ~/.openclaw/logs/gateway.log | grep <agent_name>
```

### Finding Task Starts
```bash
grep -E "(started|received|assigned)" ~/.openclaw/logs/gateway.log | grep <agent_name>
```

### Real-time Monitoring
```bash
# Watch logs in real-time (useful during active coordination)
tail -f ~/.openclaw/logs/gateway.log | grep <agent_name>
```

---

## Case Study: The Missing Response

**Scenario**: Guardian appeared unresponsive for 20 minutes

**What sessions_history showed**:
```json
{
  "messages": [
    { "role": "user", "content": "Start security review...", "timestamp": 1772244446 }
  ],
  "truncated": false
}
// No assistant response!
```

**What gateway.log showed**:
```
2026-02-28T11:04:22.548 - Found correct path
2026-02-28T11:04:22.549 - Starting security review
2026-02-28T11:04:22.550 - Reading DashboardHeader.vue
2026-02-28T11:04:25.123 - Reading MonthlyDataTable.vue
...
2026-02-28T11:15:30.456 - Review completed, writing report
```

**Conclusion**: Guardian was actively working but not posting to Telegram session!

**Lesson**: Always check logs!

---

## Recommended Log Check Frequency

| Task Duration | Log Check Frequency |
|---------------|---------------------|
| < 30 minutes | Every 5 minutes |
| 30 min - 2 hours | Every 10 minutes |
| > 2 hours | Every 15 minutes |

---

## Log Analysis Quick Reference

```javascript
// 1. Recent activity
exec("tail -50 ~/.openclaw/logs/gateway.log | grep <agent>")

// 2. Specific time range (replace timestamp)
exec("grep '2026-02-28T11:' ~/.openclaw/logs/gateway.log | grep <agent>")

// 3. Find all agent mentions
exec("grep -o 'agent:[a-z_]*' ~/.openclaw/logs/gateway.log | sort | uniq -c")

// 4. Check for errors
exec("grep -i error ~/.openclaw/logs/gateway.log | tail -20")
```

---

**Remember**: Sessions history = what agent posted to chat. Gateway log = everything the agent did!
