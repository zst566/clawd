# OpenClaw 多项目群组管理操作指南

## 场景

通过Telegram群组实现多项目并行管理，每个项目独立群聊，Bot在对应群聊中响应。

---

## 第一步：创建Telegram群组

1. 打开Telegram，点击左上角 ☰ → **新建群组**
2. 添加成员（可以先不加人，创建后再邀请）
3. 设置群名称和头像
4. 完成创建

**示例群组**：
- 文旅项目讨论
- 润德教育讨论
- 个人工作任务

---

## 第二步：获取群组ID

群组ID是负数格式（如 `-1001234567890`），用于OpenClaw配置。

**方法1：使用@userinfobot（推荐）**
1. 在群里转发任意一条消息给 @userinfobot
2. Bot会回复包含 `chat id: -1001234567890` 的信息
3. 复制这个负数ID

**方法2：通过群链接**
- 如果是公开群组，链接格式为 `https://t.me/username`
- 私人群组的 invite link 如 `https://t.me/+rKc4XqtY7zc5NmI1`
- invite link的hash部分不是群组ID，需要用方法1获取真实ID

---

## 第三步：关闭Bot Privacy Mode（关键！）

Telegram Bot默认只能收到@提及的消息，必须关闭Privacy Mode才能接收所有群消息。

1. 打开 @BotFather
2. 发送 `/setprivacy`
3. 选择你的Bot（如 `@asurazhoubot`）
4. 选择 **Disable**（关闭隐私模式）

**重要**：关闭Privacy Mode后，必须：
1. 把Bot**踢出群组**
2. 重新**邀请Bot进群**
才能生效

---

## 第四步：配置OpenClaw

需要配置两个地方：

### 1. 添加群组到groups白名单

```json
{
  "channels": {
    "telegram": {
      "groups": {
        "-1001234567890": {
          "requireMention": false
        },
        "-1009876543210": {
          "requireMention": false
        }
      }
    }
  }
}
```

**说明**：
- `groups` 是群组白名单，只列出在里面的群组才能接收消息
- `requireMention: false` 表示不需要@也能响应
- 如果设置 `true`，则必须@Bot才会回复

### 2. 允许群组内用户发送消息

如果 `groupPolicy` 是 `"allowlist"`（默认），需要确保用户被允许：

```json
{
  "channels": {
    "telegram": {
      "groupPolicy": "allowlist",
      "allowFrom": ["5947526755"]  // 你的用户ID
    }
  }
}
```

**简化方案**（推荐）：
将 `groupPolicy` 改成 `"open"`，允许所有用户：

```json
{
  "channels": {
    "telegram": {
      "groupPolicy": "open"
    }
  }
}
```

---

## 第五步：重启OpenClaw

配置修改后需要重启服务生效：

```bash
# 方式1：通过命令行
openclaw gateway restart

# 方式2：如果命令行不可用
cd /Users/asura.zhou/.npm-global/lib/node_modules/openclaw
node openclaw.mjs gateway restart
```

---

## 使用方式

### 群聊中直接对话
- 不需要@Bot，直接发送指令
- Bot会像DM一样响应

### 区分不同项目
- 文旅项目 → 文旅项目讨论群
- 润德教育 → 润德教育讨论群
- 个人任务 → 个人工作任务群

### 切换项目
- 不同群聊处理不同项目
- 每个群聊有独立的会话上下文
- 长期项目不会丢失历史

---

## 常见问题

### Q1：Bot收不到群消息
**原因**：Privacy Mode未关闭
**解决**：参考第三步，关闭Privacy Mode后重新邀请Bot进群

### Q2：配置已添加但还是收不到
**原因**：Privacy Mode改动后需要踢出重进
**解决**：把Bot踢出群，再重新邀请

### Q3：如何获取真实群组ID
**原因**：invite link的hash不是群组ID
**解决**：群里转发消息给@userinfobot获取

### Q4：需要@才能回复
**原因**：`requireMention` 设置为 `true`
**解决**：改为 `false`，参考第四步

### Q5：多群组如何配置
**解决**：在 `groups` 对象中添加多个群组ID

---

## 快速配置模板

```json
{
  "channels": {
    "telegram": {
      "groups": {
        "-1003531397239": {
          "requireMention": false
        },
        "-5157029269": {
          "requireMention": false
        }
      },
      "groupPolicy": "open"
    }
  }
}
```

---

## 注意事项

1. **Privacy Mode是最大坑** - 必须关闭才能收群消息
2. **改Privacy Mode后必须重邀Bot** - 否则不生效
3. **群组ID是负数** - 不要搞成正数
4. **配置修改后需要重启** - 不重启不生效
5. **建议使用公开群组** - 更方便获取ID和管理

---

*文档更新时间：2026-02-02*
