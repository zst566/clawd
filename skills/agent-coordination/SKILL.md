---
name: agent-coordination
description: Multi-agent project coordination, communication, and progress tracking. Use when assigning tasks to any Agent, tracking progress, checking for blockers, managing cross-agent projects, or when you need agent contact information (Telegram handles, session keys, aliases). Triggers on phrases like "coordinate agents", "check progress", "assign task to agent", "5-minute check", "contact @agent", "agent names", or when managing multi-agent workflows.
---

# Agent Coordination and Communication

## Core Principles

1. **Active Checking Every 5 Minutes**: Never wait for agents to report progress. Check every 5 minutes proactively.
2. **Clear Deliverables**: Every task assignment must specify deliverables, deadline, and acceptance criteria.
3. **Fast Progression**: Move to next phase immediately after current phase completes. Don't wait for approval.
4. **Transparent Blockers**: Mark blockers immediately when found. Don't hide delays.
5. **Check OpenClaw Logs**: Don't rely only on sessions_history. Check gateway.log for hidden activity.
6. **Always Use Multi-Channel Notification**: Never use just one method to contact agents.
7. **Confirm File Edits**: After any edit() or write(), always verify changes with read().
8. **NEVER Trust Estimated Completion Time**: Engineers' time estimates are unreliable. Check progress every 5 minutes regardless of what they say.
9. **Core Duty is Status Monitoring, Not Urging**: Your job is to understand status (work progress, availability, responsiveness, blockers), not to push them to work faster.

## ⚠️ Critical Lessons Learned

### Lesson 1: Single-Channel Notification Fails

**What happened (2026-02-28 12:00-12:17)**:
- Used only sessions_send for progress checks
- Agent didn't respond in expected timeframe
- Assumed agent was not working
- **Reality**: Agent was working but session was delayed

**Correct approach**:
```javascript
// ❌ WRONG - Single channel, no timeout
sessions_send({ sessionKey: "...", message: "check progress" })
// Wait... no response... mark blocked ❌

// ✅ CORRECT - Multi-channel with timeout
sessions_send({ sessionKey: "...", message: "...", timeoutSeconds: 30 })
exec("grep agent_name ~/.openclaw/logs/gateway.log | tail -20")
sessions_spawn({ agentId: "main", task: "follow up...", runTimeoutSeconds: 180 })
```

### Lesson 2: No Response ≠ No Progress

**What happened**:
- CodeCraft showed "75+ min no response" in sessions_history
- Actually completed work at 11:24 (visible in gateway.log)
- **Lesson**: Always check gateway.log before assuming blocked

### Lesson 8: Big Data Query Requires Batching (2026-03-05)

**What happened**:
- Assigned data analysis task to @zhou_data_bot
- Table: `revenue_recognition_child` with 522,709,877 records
- Query: GROUP BY with COUNT(DISTINCT goods_price)
- **Result**: Query timed out after 10+ minutes

**Root Cause**:
- Single GROUP BY on 500M+ records is too heavy
- Database cannot complete within reasonable timeout
- Agent kept trying same approach without success

**Solution - Batching Strategy**:
```python
# ✅ CORRECT - Batch by primary key range
import pymysql

conn = pymysql.connect(..., read_timeout=300)
cursor = conn.cursor()

# Step 1: Get ID range
cursor.execute("SELECT MIN(goods_id), MAX(goods_id) FROM table WHERE ...")
min_id, max_id = cursor.fetchone()

# Step 2: Process in batches
batch_size = 10000
all_results = []
for batch_start in range(min_id, max_id + 1, batch_size):
    batch_end = batch_start + batch_size - 1
    cursor.execute("""
        SELECT goods_id, goods_name,
               COUNT(DISTINCT goods_price) as price_count,
               MIN(goods_price) as min_price,
               MAX(goods_price) as max_price
        FROM revenue_recognition_child 
        WHERE deleted = 0 
          AND goods_id BETWEEN %s AND %s  # ← Batch filter
        GROUP BY goods_id, goods_name
        HAVING COUNT(DISTINCT goods_price) > 1
    """, (batch_start, batch_end))
    all_results.extend(cursor.fetchall())

# Step 3: Sort and export
all_results.sort(key=lambda x: x[4] - x[3], reverse=True)
export_to_csv(all_results)
```

**Key Takeaways**:
- **>100M records** → Must use batching
- **Batch size** → 10,000 items (balance speed vs memory)
- **Read timeout** → Set to 300s (5 minutes) minimum
- **Primary key** → Use for range-based batching
- **Self-solve** → Don't ask user for help, design batching yourself

**When to Apply**:
- Table has >100M records
- Query involves GROUP BY or JOIN
- Timeout occurs after 5+ minutes

**When NOT to Apply**:
- Simple COUNT(*) with indexes
- Indexed lookups by primary key
- Small tables (<10M records)

---

**What happened**: Multiple `edit()` calls failed silently  
- `STATUS.md` edits failed with "Could not find exact text"  
- No immediate retry or verification  
- Status tracking became inaccurate

**Correct approach**:
```javascript
// ❌ WRONG - Edit without verification
edit({ file_path: "STATUS.md", oldText: "...", newText: "..." })
// Assume it worked ❌

// ✅ CORRECT - Edit with verification
const result = edit({ file_path: "STATUS.md", oldText: "...", newText: "..." })
if (result.status === "error") {
  // Read file to check current state
  read({ file_path: "STATUS.md", limit: 50 })
  // Retry with exact text match
}

// Always verify by reading back
read({ file_path: "STATUS.md", limit: 30 })
```

**Rule**: After any `edit()` or `write()`, always `read()` to confirm changes applied!

**What happened with Guardian**:
- Assigned "security review" task
- Guardian waited 13 minutes for clarification
- **Missing**: Specific path, scope, deliverable format
- **Lesson**: Always include:
  - Exact file path
  - Specific scope
  - Expected deliverable format
  - Clear deadline

### Lesson 6: Never Trust Engineer's Time Estimates

**What happened**:
- Agent said "estimated 15:30 completion"
- Waited for agent to report at that time
- Result: No idea of actual progress, couldn't detect problems early

**User correction**:
> "Engineer's time estimates are unreliable. They might finish early, or they might encounter problems and need to delay. If you don't ask, you don't know the progress. You MUST ask every 5 minutes."

**Correct approach**:
```javascript
// ❌ WRONG - Trust estimate and wait
Agent: "I'll finish by 15:30"
Me: "OK, see you at 15:30"  // Wait 2 hours ❌

// ✅ CORRECT - Check every 5 minutes regardless
Agent: "I'll finish by 15:30"
Me: "OK. I'll check progress every 5 minutes."

Every 5 minutes:
- "Current progress percentage?"
- "Any blockers?"
- "Specific issues encountered?"

Until task ACTUALLY completes.
```

**New Iron Rule**: 
- NO MATTER what time agent estimates
- CHECK PROGRESS EVERY 5 MINUTES
- Until task is ACTUALLY done

---

### Lesson 7: Auto-Stop Cron Jobs on Project Completion

**Problem (2026-03-01 Dashboard Project)**:
- Project completed at 01:02 (Stage 10 passed)
- Cron job kept running for 4 more hours (200 executions)
- Caused LLM timeouts and resource waste
- Manual intervention required to stop

**Root Cause**:
- No automatic cleanup mechanism
- Relied on user to manually stop Cron
- Skill lacked project completion trigger rules

**Solution - Auto-Stop Rule**:
```javascript
// Trigger: When final stage completes
if (currentStage === finalStage && allAgentsCompleted) {
  // Find project-related cron jobs
  const projectCrons = await cron.list({ 
    name: projectName 
  });
  
  // Auto-disable
  for (const job of projectCrons) {
    if (job.enabled) {
      await cron.update({
        jobId: job.id,
        patch: { enabled: false }
      });
      log(`Auto-stopped: ${job.name}`);
    }
  }
  
  // Send completion summary
  sendCompletionReport(projectName);
}
```

**Conflict Check Before Adding**:
- ✅ No existing auto-stop rules (no conflict)
- ✅ Complements existing "cron" section
- ⚠️ Exception: Long-term monitoring projects (keep user override option)

**When to Apply**:
- All stages completed
- Final acceptance passed
- No pending tasks

**When NOT to Apply**:
- User explicitly requests continued monitoring
- Multi-project shared cron jobs
- Maintenance/ongoing monitoring mode

---

## Multi-Channel Notification Priority

**When contacting agents, follow this priority order:**

### Priority 1: sessions_spawn (Most Reliable ⭐️⭐️⭐️⭐️⭐️)
**Use for**: Critical tasks, long-running tasks, need guaranteed response

```javascript
sessions_spawn({
  agentId: "data_bot",
  label: "task-coordinator",
  runTimeoutSeconds: 900,
  task: `
    Execute data analysis task.
    Connect to database and run queries.
    Export results to Excel.
    Report back with results.
  `
})
```
**Why**: Auto result announce, timeout control, error handling, isolation

#### Timeout Strategy by Task Type

| Task Type | Duration | Timeout Setting | Example |
|-----------|----------|-----------------|---------|
| **Simple** | <30 min | `1800` (30 min) | Fix typo, config update |
| **Regular** | 1-2 hours | `7200` (2 hours) | Feature implementation |
| **Complex** | Half day | `14400` (4 hours) | Large refactor |
| **Extra Long** | >4 hours | Split into subtasks | Each subtask 2-4 hours |

#### Task Assignment Templates

**Simple Task Example:**
```javascript
sessions_spawn({
  agentId: "codecraft",
  label: "fix-typo",
  runTimeoutSeconds: 1800,
  task: `
    【Fix Typo】Update button text
    
    **Goal**: Change "Submit" to "Save" in login form
    **Deliverable**: Updated login.vue
    **Acceptance**: Button shows "Save"
    **ETA**: 10 minutes
  `
})
```

**Regular Task Example:**
```javascript
sessions_spawn({
  agentId: "codecraft",
  label: "feature-auth",
  runTimeoutSeconds: 7200,
  task: `
    【Feature】Add JWT authentication
    
    **Goal**: Implement login/logout with JWT
    **Deliverables**:
    - [ ] auth.js composable
    - [ ] Login.vue component
    - [ ] Auth middleware
    
    **Acceptance Criteria**:
    - Login returns valid JWT
    - Protected routes require auth
    - Logout clears token
    
    **ETA**: 1.5 hours
  `
})
```

**Concurrent Tasks Example:**
```javascript
// Launch multiple independent subtasks
const tasks = await Promise.all([
  sessions_spawn({ agentId: "codecraft", task: "Subtask A", runTimeoutSeconds: 7200 }),
  sessions_spawn({ agentId: "codecraft", task: "Subtask B", runTimeoutSeconds: 7200 }),
  sessions_spawn({ agentId: "codecraft", task: "Subtask C", runTimeoutSeconds: 7200 })
]);
```

---

### Priority 2: sessions_send (High Reliability ⭐️⭐️⭐️⭐️)
**Use for**: Direct communication, quick checks, progress inquiries

```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "Task details...",
  timeoutSeconds: 60
})
```
**Why**: Direct delivery, supports ping-pong (up to 5 rounds)

---

### Complex Workflow Design

> 需要设计**并行审查、前后端并行开发、多模块并行**等复杂工作流？
> 
> 查看 **[agent-workflow-automation](../agent-workflow-automation/SKILL.md)** 获取：
> - 并行审查流程模板（Guardian + Inspector）
> - 前后端并行开发场景
> - 多模块并行开发场景
> - 数据处理并行、多环境部署等

---

### Mandatory: Use Official Tools Only

**Correct task assignment flow:**
1. ✅ sessions_spawn - For independent task execution
2. ✅ sessions_send - For direct communication and inquiries

**Never use Telegram @mention for task assignment!**

---

### Notification Checklist

**Before marking "notification sent":**
- [ ] Used sessions_spawn for task assignment (if independent task)
- [ ] OR used sessions_send for direct communication
- [ ] (Optional) Spawned follow-up subagent for tracking
- [ ] Checked gateway.log after 5 minutes for hidden activity

**Never rely on informal methods!**

## Progress Check Strategy: Multi-Source Verification

**Don't just check sessions_history!** Agent activity may appear in:

| Source | Command | What to look for |
|--------|---------|------------------|
| **sessions_history** | `sessions_history({sessionKey: "..."})` | Direct messages |
| **OpenClaw logs** ⭐ | `exec("grep agent_name ~/.openclaw/logs/gateway.log")` | Hidden activity, system messages |
| **Subagents list** | `subagents({action: "list"})` | Running subagents |
| **Cron status** | `cron({action: "list"})` | Scheduled jobs |

### Why Check OpenClaw Logs?

**Real case (2026-02-28)**: CodeCraft appeared "75+ min unresponsive" in sessions_history, but gateway.log showed:
```
2026-02-28T11:24:46 - Received task
2026-02-28T11:24:47 - Started fixing composables
2026-02-28T11:24:49 - ✅ Fix completed! commit 9f013b0
```

**Lesson**: Always check logs before marking blocked!

### Recommended Check Sequence

```javascript
// Step 1: Check sessions_history (fast)
sessions_history({ sessionKey: "agent:xxx:telegram:group:...", limit: 5 })

// Step 2: Check OpenClaw logs (catches hidden activity)
exec("grep -i 'agent_name\|task_keyword' ~/.openclaw/logs/gateway.log | tail -20")

// Step 3: Check subagents
subagents({ action: "list" })

// Step 4: Check if agent has running cron jobs
cron({ action: "list" })
```

See [references/progress-check.md](references/progress-check.md) for detailed check patterns.

## Communication Methods (Ranked by Reliability)

| Method | Reliability | Best For | Key Features |
|--------|-------------|----------|--------------|
| **sessions_spawn** ⭐️⭐️⭐️⭐️⭐️ | Highest | Background tasks, parallel processing | Auto result announce, timeout control, error handling, isolation |
| **sessions_send** ⭐️⭐️⭐️⭐️ | High | Direct agent-to-agent messaging | Ping-pong up to 5 rounds, quick back-and-forth |
| **Cron/Hook** ⭐️⭐️⭐️⭐️ | High | Scheduled/event-driven tasks | Automatic triggering, no manual intervention |

### Recommended: sessions_spawn Pattern

For critical tasks with deadline requirements, use **sessions_spawn** to create a coordinator subagent:

```javascript
sessions_spawn({
  agentId: "data_bot",
  label: "data-analysis-task",
  runTimeoutSeconds: 900,  // 15 min timeout
  cleanup: "keep",
  task: `
    Execute data analysis.
    Connect to database and run queries.
    Report back with results.
  `
})
```

**Why sessions_spawn is best:**
- ✅ **Auto result announce** - Subagent automatically reports completion
- ✅ **Timeout control** - Configurable timeout (default 900s)
- ✅ **Error handling** - Clear status on failure/timeout
- ✅ **Isolation** - Runs in independent session
- ✅ **No polling needed** - Results pushed automatically

### ⚠️ Prohibited Practices

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Use `sessions_send` for task assignment | Use `sessions_spawn` for independent tasks |
| Use Telegram @mention for task assignment | Use `sessions_spawn` with proper sessionKey |
| Skip timeout or use very short timeout (<30 min) | Set timeout based on task complexity (30 min - 4 hours) |
| Wait for agent to report voluntarily | Check progress every 5 minutes proactively |
| Accept vague progress like "almost done" | Ask for specific percentage and deliverables |
| Allow indefinite delays | Set clear timeout and escalation rules |

### Common Mistakes & Corrections

| Mistake | Correction |
|---------|------------|
| Wait for agent to report | Check every 5 minutes proactively |
| Mix up different phases | Complete current phase before next |
| Accept vague progress | Ask for specific percentage and deliverables |
| Allow indefinite delay | Set clear timeout |
| Contact only one agent | Track all assigned agents simultaneously |
| Use wrong session key | Use `telegram:group` ending keys |
| Use informal methods (Telegram @) | Always use sessions_spawn or sessions_send |
| Trust engineer's time estimates | Check every 5 minutes regardless of estimate |

See [references/communication-patterns.md](references/communication-patterns.md) for detailed patterns.

## Agent Directory

| Agent | Group Session Key | Primary Role |
|-------|-------------------|--------------|
| CodeCraft / 码匠 | `agent:codecraft:telegram:group:-1003531397239` | Frontend/Backend Dev |
| Data Assistant | `agent:data_bot:telegram:group:-1003531397239` | Data Analysis |
| Guardian | `agent:guardian:telegram:group:-1003531397239` | Security Review |
| Inspector | `agent:inspector:telegram:group:-1003531397239` | Quality Review |
| Project Manager | `agent:main:telegram:group:-1003531397239` | Coordination |

### Agent Aliases (Name Mappings)

| What User Says | Agent ID |
|----------------|----------|
| "码匠", "codecraft" | codecraft |
| "数据助理", "data bot" | data_bot |
| "guardian", "安全审查" | guardian |
| "inspector", "质量审查" | inspector |
| "小d" | main |

See [references/naming-guide.md](references/naming-guide.md) for complete naming conventions.

## Communication Priority

1. **Primary**: Use `sessions_spawn` for independent task execution
2. **Secondary**: Use `sessions_send` to group's session key for direct communication

### Session Key Patterns

**Correct (Group Sessions)**:
```
agent:codecraft:telegram:group:-1003531397239
agent:data_bot:telegram:group:-1003531397239
agent:guardian:telegram:group:-1003531397239
agent:inspector:telegram:group:-1003531397239
```

**Avoid (Main Sessions)**: Won't post to Telegram group.

## Task Assignment Template

```
Start [Phase X - Task Name] via sessions_spawn:

**Agent**: [agent_id]
**Label**: [task_label]

**Task Details**:
[Detailed task description]

**Scope**:
1. [Specific item 1]
2. [Specific item 2]

**Deliverables**:
- [ ] [Deliverable 1 with path]
- [ ] [Deliverable 2 with path]

**Acceptance Criteria**:
- [Criterion 1]
- [Criterion 2]

**Timeout**: [seconds]

Execute and report results!
```

## 5-Minute Progress Check Template

```
sessions_send to agent: [agent_id]

⏰ 5-minute progress check:

**Current Task**: [Task name]

Confirm:
1. Current completion percentage?
2. Any blockers?
3. Estimated time to completion?

Reply immediately!
```

## Phase Progression Checklist

- [ ] Previous phase deliverables confirmed
- [ ] Acceptance criteria met
- [ ] Next phase task clarified
- [ ] Next responsible agent @mentioned

See [references/project-phases.md](references/project-phases.md) for detailed phase checklists by project type.

## Escalation Timeline

| Time | Action |
|------|--------|
| 10 min no response | @mention reminder |
| 20 min no response | Mark blocked, notify project manager |
| 40 min no response | Consider task reassignment |

## Response Time Expectations

| Agent | Acknowledgment | Task Completion |
|-------|---------------|-----------------|
| @zhou_codecraft_bot | 2-5 min | Simple: 15-30 min, Complex: 1-6 hrs |
| @zhou_data_bot | 2-5 min | 10-60 min depending on data size |
| @guardian | 5-10 min | 30-60 min for reviews |
| @inspector | 5-10 min | 30-60 min for reviews |

See [references/response-times.md](references/response-times.md) for detailed expectations.

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| Wait for agent to report | Check every 5 minutes proactively |
| Mix up different phases | Complete current phase before next |
| Accept vague progress | Ask for specific percentage and deliverables |
| Allow indefinite delay | Set clear timeout |
| Contact only one agent | Track all assigned agents simultaneously |
| Use wrong session key | Use `telegram:group` ending keys |
| Use informal methods (Telegram @) | Always use sessions_spawn or sessions_send |

## Group Chat Defaults

| Group Name | ID | Default Project |
|------------|-----|-----------------|
| 润德教育讨论群 | -1003531397239 | 润德教育 |
| 茂名文旅讨论群 | -5157029269 | 茂名文旅 |
| 商场促销项目群 | -5039017209 | 商场促销 |
| dv项目运维群 | -5099457733 | DV项目 |
| 福禄英语预约平台 | -5187551770 | 福禄英语 |

## Resources

- [references/naming-guide.md](references/naming-guide.md) - Complete agent naming conventions
- [references/project-phases.md](references/project-phases.md) - Phase checklists by project type
- [references/response-times.md](references/response-times.md) - Expected response times
- [references/communication-templates.md](references/communication-templates.md) - Message templates
