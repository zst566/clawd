# OpenClaw 完整恢复指南

本文档说明如何从本仓库完整恢复 OpenClaw 配置。

## 📋 仓库内容概览

本仓库包含以下配置：

```
clawd/
├── agents/                    # Agent 工作区配置（核心）
│   ├── main/workspace/        # 小d（主Agent）完整配置
│   ├── codecraft/workspace/   # CodeCraft 配置
│   ├── deployer/workspace/    # Deployer 配置
│   ├── guardian/workspace/    # Guardian 配置
│   ├── inspector/workspace/   # Inspector 配置
│   └── zhou_data_bot/workspace/  # 数据助理配置
├── openclaw-config/           # OpenClaw 系统配置（核心）
│   ├── openclaw.json          # 主配置文件
│   ├── clawdbot.json          # Clawdbot 配置
│   ├── identity/              # 设备身份
│   ├── credentials/           # 凭证
│   ├── memory/                # 记忆数据库
│   └── ...                    # 其他配置
├── project-rules/             # 项目规则文档
├── scripts/                   # 自动化脚本
├── skills/                    # 技能库
├── config/                    # 配置模板
├── cron/                      # 定时任务
├── docs/                      # 项目文档
└── ...
```

## 🚀 完整恢复步骤

### 1. 克隆仓库

```bash
git clone https://github.com/zst566/clawd.git
cd clawd
```

### 2. 安装 OpenClaw

```bash
npm install -g openclaw
```

### 3. 恢复 OpenClaw 配置

```bash
# 创建 .openclaw 目录（如果不存在）
mkdir -p ~/.openclaw

# 恢复核心配置
cp -r openclaw-config/* ~/.openclaw/

# 确保权限正确
chmod 600 ~/.openclaw/*.json
chmod 700 ~/.openclaw/credentials
chmod 700 ~/.openclaw/identity
```

### 4. 验证配置

```bash
# 检查配置文件
ls -la ~/.openclaw/openclaw.json
ls -la ~/.openclaw/clawdbot.json
ls -la ~/.openclaw/identity/

# 查看配置版本
cat ~/.openclaw/openclaw.json | grep "lastTouchedVersion"
```

### 5. 启动 OpenClaw

```bash
# 启动 Gateway
openclaw gateway start

# 或者后台运行
openclaw gateway start --daemon
```

### 6. 验证 Agent 工作区

OpenClaw 会自动读取 `openclaw.json` 中配置的 workspace 路径：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "workspace": "/Users/asura.zhou/clawd/agents/main/workspace"
      }
    ]
  }
}
```

确保路径正确指向本仓库中的 `agents/*/workspace/` 目录。

## 🔧 常见问题

### 问题1：设备未配对

**症状**: `openclaw gateway start` 提示设备未授权

**解决**:
```bash
# 重新配对设备
openclaw device pair

# 或者复制已配对的设备信息
cp -r clawd/openclaw-config/identity/* ~/.openclaw/identity/
```

### 问题2：Telegram Bot 无响应

**症状**: Bot 不回复消息

**解决**:
1. 检查 Telegram Bot Token 是否过期
2. 在 Telegram @BotFather 重新获取 Token
3. 更新 `~/.openclaw/openclaw.json` 中的 `channels.telegram.accounts.main.botToken`

### 问题3：OAuth 凭证过期

**症状**: MiniMax 或其他 OAuth 服务无法连接

**解决**:
```bash
# 重新授权
openclaw models auth login --provider minimax-portal --method oauth-cn --set-default
```

### 问题4：记忆丢失

**症状**: Agent 不记得之前的对话

**解决**:
记忆数据库已备份在 `openclaw-config/memory/` 中：
```bash
# 恢复记忆数据库
cp clawd/openclaw-config/memory/*.sqlite ~/.openclaw/memory/
```

### 问题5：定时任务不执行

**症状**: cron 任务没有按预期运行

**解决**:
```bash
# 恢复 cron 配置
cp -r clawd/openclaw-config/cron/* ~/.openclaw/cron/

# 重启 OpenClaw
openclaw gateway restart
```

## 📁 目录对照表

| 仓库路径 | 系统路径 | 用途 |
|----------|----------|------|
| `clawd/agents/main/workspace/` | `~/clawd/agents/main/workspace/` | 主Agent工作区 |
| `clawd/openclaw-config/` | `~/.openclaw/` | OpenClaw系统配置 |
| `clawd/openclaw-config/identity/` | `~/.openclaw/identity/` | 设备身份 |
| `clawd/openclaw-config/credentials/` | `~/.openclaw/credentials/` | 第三方凭证 |
| `clawd/openclaw-config/memory/` | `~/.openclaw/memory/` | 记忆数据库 |

## ⚠️ 注意事项

1. **私有仓库**: 本仓库包含敏感信息，请保持私有状态
2. **定期备份**: 修改配置后，及时更新 `openclaw-config/` 目录
3. **版本匹配**: 确保 OpenClaw CLI 版本与配置版本兼容
4. **路径一致**: 确保 `openclaw.json` 中的 workspace 路径正确

## 🔄 备份更新流程

当配置发生变化时，更新备份：

```bash
cd ~/clawd

# 更新 openclaw-config/
cp ~/.openclaw/openclaw.json openclaw-config/
cp ~/.openclaw/clawdbot.json openclaw-config/
cp -r ~/.openclaw/memory/* openclaw-config/memory/
# ... 其他更新的文件

# 提交更新
git add openclaw-config/
git commit -m "backup: 更新 OpenClaw 配置 $(date +%Y-%m-%d)"
git push
```

## 🆘 紧急恢复

如果系统完全损坏，最快恢复方式：

```bash
# 1. 新机器上执行
git clone https://github.com/zst566/clawd.git
cd clawd

# 2. 安装依赖
npm install -g openclaw

# 3. 一键恢复
./scripts/restore-openclaw.sh  # 如果有这个脚本的话

# 或者手动复制
mkdir -p ~/.openclaw
cp -r openclaw-config/* ~/.openclaw/

# 4. 启动
openclaw gateway start
```

## 📞 支持

如有问题，检查以下资源：
- `openclaw-config/README.md` - 配置详细说明
- `openclaw-config/INSTANCE2-README.md` - 多实例配置
- `agents/main/workspace/AGENTS.md` - Agent 工作规范
- OpenClaw 官方文档: https://openclaw.dev

---

**最后更新**: 2026-02-27
**配置版本**: 2026.2.26
