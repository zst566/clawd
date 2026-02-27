# 第二个 OpenClaw 实例配置

这是一个完全独立的 OpenClaw 实例，配置如下：

## 与主实例的差异

| 项目 | 主实例 | 数据实例 |
|------|--------|----------|
| 配置文件 | `~/.openclaw/openclaw.json` | `~/.openclaw/openclaw-data.json` |
| Telegram Bot | @asurazhoubot (8382004551) | @zhou_data_bot (8704648490) |
| 工作目录 | `~/clawd` | `~/clawd-data` |
| Gateway 端口 | 18789 | 18790 |
| Control UI | http://127.0.0.1:18789 | http://127.0.0.1:18790 |

## 启动方式

### 方式1：使用环境变量（推荐）

```bash
# 在当前终端启动第二个实例
export OPENCLAW_CONFIG=~/.openclaw/openclaw-data.json
openclaw gateway start

# 或者在一条命令里
OPENCLAW_CONFIG=~/.openclaw/openclaw-data.json openclaw gateway start
```

### 方式2：复制配置文件到默认位置

```bash
# 临时切换
cp ~/.openclaw/openclaw-data.json ~/.openclaw/openclaw.json.backup
cp ~/.openclaw/openclaw-data.json ~/.openclaw/openclaw.json
openclaw gateway start

# 恢复主配置
mv ~/.openclaw/openclaw.json.backup ~/.openclaw/openclaw.json
```

## 注意事项

1. **端口冲突**：两个实例必须使用不同端口（已配置：18789 vs 18790）
2. **Workspace 隔离**：数据实例使用 `~/clawd-data`，与主实例 `~/clawd` 完全分离
3. **内存独立**：两个实例的 MEMORY.md、每日记录完全独立
4. **模型配置**：数据实例只配置了 Kimi K2.5，如需其他模型请自行添加
5. **Cron 任务**：数据实例的定时任务存储在 `~/clawd-data/cron/jobs.json`

## 创建必要的启动文件

```bash
# 创建数据实例的启动脚本
cat > ~/start-data-bot.sh << 'EOF'
#!/bin/bash
export OPENCLAW_CONFIG=~/.openclaw/openclaw-data.json
openclaw gateway start
EOF

chmod +x ~/start-data-bot.sh

# 创建停止脚本
cat > ~/stop-data-bot.sh << 'EOF'
#!/bin/bash
export OPENCLAW_CONFIG=~/.openclaw/openclaw-data.json
openclaw gateway stop
EOF

chmod +x ~/stop-data-bot.sh
```

## 测试步骤

1. 确保主实例已在运行（使用默认配置）
2. 在新终端运行：`OPENCLAW_CONFIG=~/.openclaw/openclaw-data.json openclaw gateway start`
3. 给第二个 Bot 发消息测试
4. 访问 http://127.0.0.1:18790 查看 Control UI

## 文件结构

```
~/clawd-data/
├── SOUL.md              # 数据助理的人格（可独立配置）
├── USER.md              # 用户信息
├── MEMORY.md            # 长期记忆
├── memory/              # 每日记录
│   └── 2026-02-24.md
├── cron/                # 定时任务
│   └── jobs.json
└── ...
```

你可以为数据助理配置完全不同的人格、技能、记忆。
