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
- Used only Telegram @mention for progress checks
- Agents didn't respond in Telegram group
- Assumed agents were not working
- **Reality**: Agents were working but not posting to Telegram

**Correct approach**:
```javascript
// ❌ WRONG - Single channel
message({ action: "send", message: "@agent check progress" })
// Wait... no response... mark blocked ❌

// ✅ CORRECT - Multi-channel
message({ action: "send", message: "@agent check progress" })
sessions_send({ sessionKey: "agent:xxx:telegram:group:...", message: "...", timeoutSeconds: 30 })
exec("grep agent_name ~/.openclaw/logs/gateway.log | tail -20")
sessions_spawn({ agentId: "main", task: "follow up with agent...", runTimeoutSeconds: 180 })
```

### Lesson 2: No Response ≠ No Progress

**What happened**:
- CodeCraft showed "75+ min no response" in sessions_history
- Actually completed work at 11:24 (visible in gateway.log)
- **Lesson**: Always check gateway.log before assuming blocked

### Lesson 4: File Edit Failures Must Be Confirmed

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

## Multi-Channel Notification Priority

**When contacting agents, follow this priority order:**

### Priority 1: sessions_spawn (Most Reliable ⭐️⭐️⭐️⭐️⭐️)
**Use for**: Critical tasks, long-running tasks, need guaranteed response

```javascript
sessions_spawn({
  agentId: "main",
  label: "task-coordinator",
  runTimeoutSeconds: 900,
  task: `
    Coordinate with @agent_name.
    Check progress every 5 minutes.
    Report back with results.
  `
})
```
**Why**: Auto result announce, timeout control, error handling, isolation

---

### Priority 2: sessions_send (High Reliability ⭐️⭐️⭐️⭐️)
**Use for**: Direct communication, quick checks

```javascript
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: "Task details...",
  timeoutSeconds: 60
})
```
**Why**: Direct delivery, supports ping-pong (up to 5 rounds)

---

### Priority 3: Telegram @mention (Group Visibility ⭐️⭐️⭐️)
**Use for**: Human awareness, transparency

```javascript
message({
  action: "send",
  message: "@agent_name Task assignment..."
})
```
**Why**: Visible to all, human can see

---

### Mandatory: Always Use 2+ Methods

**Minimum combo for any task assignment:**
1. ✅ sessions_send (direct to agent)
2. ✅ Telegram @mention (group visibility)

**For urgent/complex tasks, add:**
3. ✅ sessions_spawn (monitoring subagent)

---

### Notification Checklist

**Before marking "notification sent":**
- [ ] Used sessions_send to agent's group session
- [ ] Posted to Telegram group with @mention
- [ ] (Optional) Spawned follow-up subagent for tracking
- [ ] Checked gateway.log after 5 minutes for hidden activity

**Never rely on just one method!**

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
| **Telegram @mention** ⭐️⭐️⭐️ | Medium | Group visibility, human awareness | Visible to all, but may be missed |

### Recommended: sessions_spawn Pattern

For critical tasks with deadline requirements, use **sessions_spawn** to create a coordinator subagent:

```javascript
sessions_spawn({
  agentId: "main",
  label: "task-coordinator",
  runTimeoutSeconds: 900,  // 15 min timeout
  cleanup: "keep",
  task: `
    Coordinate with @guardian and @inspector.
    Check progress every 5 minutes.
    Report back in 15 minutes with status.
  `
})
```

**Why sessions_spawn is best:**
- ✅ **Auto result announce** - Subagent automatically reports completion
- ✅ **Timeout control** - Configurable timeout (default 900s)
- ✅ **Error handling** - Clear status on failure/timeout
- ✅ **Isolation** - Runs in independent session
- ✅ **No polling needed** - Results pushed automatically

See [references/communication-patterns.md](references/communication-patterns.md) for detailed patterns.

## Agent Directory

| Agent | Telegram @ | Group Session Key | Primary Role |
|-------|-----------|-------------------|--------------|
| CodeCraft / 码匠 | @zhou_codecraft_bot | `agent:codecraft:telegram:group:-1003531397239` | Frontend/Backend Dev |
| Data Assistant | @zhou_data_bot | `agent:data_bot:telegram:group:-1003531397239` | Data Analysis |
| Guardian | @guardian | `agent:guardian:telegram:group:-1003531397239` | Security Review |
| Inspector | @inspector | `agent:inspector:telegram:group:-1003531397239` | Quality Review |
| Project Manager | @asurazhoubot | `agent:main:telegram:group:-1003531397239` | Coordination |

### Agent Aliases (Name Mappings)

| What User Says | Use This Telegram @ |
|----------------|---------------------|
| "码匠", "codecraft" | @zhou_codecraft_bot |
| "数据助理", "data bot" | @zhou_data_bot |
| "guardian", "安全审查" | @guardian |
| "inspector", "质量审查" | @inspector |
| "小d" | @asurazhoubot |

See [references/naming-guide.md](references/naming-guide.md) for complete naming conventions.

## Communication Priority

1. **Primary**: Direct @mention in Telegram group (visible to all)
2. **Secondary**: Use `sessions_send` to group's session key
3. **Avoid**: Using `agent:xxx:main` (won't post to Telegram group)

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
@[agent_name] Start [Phase X - Task Name]:

**Scope**:
1. [Specific item 1]
2. [Specific item 2]

**Deliverables**:
- [ ] [Deliverable 1 with path]
- [ ] [Deliverable 2 with path]

**Acceptance Criteria**:
- [Criterion 1]
- [Criterion 2]

**Deadline**: [Time]

Confirm receipt and provide estimated completion time!
```

## 5-Minute Progress Check Template

```
@[agent_name] ⏰ 5-minute progress check:

**Current Task**: [Task name]

Confirm:
1. Current completion percentage?
2. Any blockers?
3. Can you meet the deadline?

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
| Allow indefinite delay | Set clear deadline |
| Contact only one agent | Track all assigned agents simultaneously |
| Use wrong session key | Use `telegram:group` ending keys |

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
