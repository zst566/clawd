# 联系 Agent 技能

## 方法1：Sessions Send 直接发送（推荐）
```javascript
sessions_send({
  sessionKey: "agent:目标:telegram:group:群组ID",
  message: "消息内容",
  timeoutSeconds: 60
})
```

## 方法2：Telegram 群组 @ 提及
```javascript
message.send({
  action: "send",
  channel: "telegram",
  message: "@agent名称 消息内容"
})
```

## 方法3：通过用户中间人
用户转发消息

## 响应规则（重要）
收到任务 → 5分钟内回应"收到，预计XX时间完成" → 后处理 → 完成后汇报

## 正确名称
- 码匠：@zhou_codecraft_bot
- Guardian：@guardian
- Inspector：@inspector
- 数据助理：@zhou_data_bot
- 小d：@小d
