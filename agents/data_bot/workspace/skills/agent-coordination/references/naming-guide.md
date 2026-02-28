# Agent Naming Guide

## Official Names vs Aliases

### @zhou_codecraft_bot (CodeCraft / 码匠)

**Primary Telegram**: @zhou_codecraft_bot

**Valid Aliases**:
- 码匠 (Chinese name)
- codecraft (English alias)
- @码匠 (with @)
- @codecraft (with @)

**Usage**:
```
✅ Correct: @zhou_codecraft_bot 请开始...
✅ Acceptable: @码匠 请开始...
❌ Avoid: Just "码匠" without @ in groups
```

### @zhou_data_bot (Data Assistant / 数据助理)

**Primary Telegram**: @zhou_data_bot

**Valid Aliases**:
- 数据助理 (Chinese name)
- data bot (English)
- data assistant (English)

### @guardian (Guardian / 安全审查)

**Primary Telegram**: @guardian

**Valid Aliases**:
- Guardian (English)
- 安全审查 (Chinese role name)
- security (English role)

### @inspector (Inspector / 质量审查)

**Primary Telegram**: @inspector

**Valid Aliases**:
- Inspector (English)
- 质量审查 (Chinese role name)
- quality (English role)

### @asurazhoubot (Project Manager / 小d)

**Primary Telegram**: @asurazhoubot

**Valid Aliases**:
- 小d (Chinese nickname)
- 小D (variant)
- project manager (English role)

**Note**: Use @asurazhoubot when agents need to mention the coordinator.

## Session Key Patterns

### Full Format
```
agent:{agent_id}:{channel}:{context}
```

### Examples
```
agent:codecraft:telegram:group:-1003531397239
agent:data_bot:telegram:group:-1003531397239
agent:guardian:telegram:group:-1003531397239
agent:inspector:telegram:group:-1003531397239
```

### Important
- **Use**: `telegram:group` keys for group messages
- **Avoid**: `main` keys (won't post to Telegram)

## Quick Conversion Table

When user says | You should use
---------------|---------------
"让码匠去做" | @zhou_codecraft_bot
"数据助理分析一下" | @zhou_data_bot
"guardian检查一下" | @guardian
"inspector审查" | @inspector
"问问小d" | @asurazhoubot
