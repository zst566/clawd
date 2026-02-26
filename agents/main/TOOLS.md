# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Agent 间通信

### 可用工具

#### sessions_list
列出所有活跃的会话，包括其他 Agent。

#### sessions_send
向其他 Agent 发送消息。

**参数：**
- `sessionKey`: 目标 Agent 的 session key
  - 对于 data_bot: 使用 `"data_bot"` 或 `"agent:data_bot:telegram:main"`
- `message`: 要发送的消息
- `timeoutSeconds`: 等待回复的时间（秒）

**示例：**
```markdown
我需要让数据助理分析文件。

使用 sessions_send 工具：
{
  "sessionKey": "data_bot",
  "message": "请分析 ~/data/sales.csv 文件，统计月度趋势",
  "timeoutSeconds": 60
}
```

### 会话 Key 格式

| Agent | 私聊 Key | 群组 Key |
|-------|---------|---------|
| main | `"main"` | `"agent:main:telegram:group:-1003531397239"` |
| data_bot | `"data_bot"` | `"agent:data_bot:telegram:group:-1003531397239"` |
