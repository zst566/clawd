# OpenClaw 配置备份

本目录包含 OpenClaw 的完整配置备份，用于系统恢复。

## ⚠️ 重要提示

- **本目录包含敏感信息**（API密钥、凭证等）
- **请勿在公开仓库中分享此目录内容**
- **本仓库应为私有仓库**

## 📁 目录结构

```
openclaw-config/
├── openclaw.json              # 主配置文件（OpenClaw 核心配置）
├── clawdbot.json              # Clawdbot 配置
├── openclaw-data.json         # 数据实例配置
├── INSTANCE2-README.md        # 第二个实例配置说明
├── exec-approvals.json        # 执行审批配置
├── update-check.json          # 更新检查配置
├── identity/                  # 设备身份和认证
├── credentials/               # 凭证存储（Feishu等）
├── cron/                      # 定时任务配置
├── memory/                    # SQLite 记忆数据库
├── telegram/                  # Telegram Bot 配置
├── plugins/                   # 插件配置
├── devices/                   # 配对设备信息
├── feishu/                    # 飞书配置
├── subagents/                 # 子代理配置
├── canvas/                    # 画布配置
├── extensions/                # 扩展配置（minimax-portal-auth等）
├── completions/               # 补全历史
├── delivery-queue/            # 投递队列
└── backups/                   # 备份说明文档
```

## 🚀 恢复配置

### 完整恢复步骤

```bash
# 1. 安装 OpenClaw
npm install -g openclaw

# 2. 克隆本仓库
git clone https://github.com/zst566/clawd.git
cd clawd

# 3. 恢复 OpenClaw 配置
cp -r openclaw-config/* ~/.openclaw/

# 4. 启动 OpenClaw
openclaw gateway start
```

### 仅恢复配置文件

```bash
# 只恢复关键配置文件
cp openclaw-config/openclaw.json ~/.openclaw/
cp openclaw-config/clawdbot.json ~/.openclaw/
cp -r openclaw-config/identity/* ~/.openclaw/identity/
cp -r openclaw-config/credentials/* ~/.openclaw/credentials/
```

## 🔄 备份更新

当 OpenClaw 配置发生变化时，更新此目录：

```bash
# 从 ~/.openclaw 同步到仓库
cp ~/.openclaw/openclaw.json ~/clawd/openclaw-config/
cp ~/.openclaw/clawdbot.json ~/clawd/openclaw-config/
cp -r ~/.openclaw/identity/* ~/clawd/openclaw-config/identity/
cp -r ~/.openclaw/credentials/* ~/clawd/openclaw-config/credentials/
# ... 其他目录

# 提交更新
cd ~/clawd
git add openclaw-config/
git commit -m "backup: 更新 OpenClaw 配置"
git push
```

## ⚠️ 排除的目录

以下目录因体积过大或包含临时数据，未纳入版本控制：

| 目录 | 大小 | 原因 |
|------|------|------|
| `~/.openclaw/browser/` | ~357MB | 浏览器缓存，体积过大 |
| `~/.openclaw/agents/` | ~96MB | 运行时sessions，动态生成 |
| `~/.openclaw/logs/` | ~44MB | 日志文件，临时数据 |
| `~/.openclaw/media/` | ~6.5MB | 媒体文件，可重新下载 |
| `~/.openclaw/backups/*.json` | - | 已在 backups/ 目录中 |

## 📊 配置说明

### openclaw.json
- **作用**: OpenClaw 主配置文件
- **内容**: Agent 列表、模型配置、Telegram Bot 配置、Webhook 等
- **关键字段**: `agents.list`, `models`, `channels.telegram`

### clawdbot.json
- **作用**: Clawdbot 配置
- **内容**: 模型提供商配置、默认模型设置
- **关键字段**: `models.providers`

### identity/
- **作用**: 设备身份认证
- **内容**: 设备 ID、设备密钥
- **文件**: `device.json`, `device-auth.json`

### credentials/
- **作用**: 第三方服务凭证
- **内容**: Feishu 凭证、OAuth 令牌等
- **注意**: 高度敏感，请勿泄露

### memory/
- **作用**: SQLite 记忆数据库
- **内容**: Agent 的记忆数据、会话历史
- **文件**: `main.sqlite`, `data_bot.sqlite` 等

### telegram/
- **作用**: Telegram Bot 配置
- **内容**: Bot Token、群组配置、更新偏移量
- **文件**: `update-offset-*.json`

## 🔧 故障排除

### 恢复后无法启动
1. 检查配置文件权限：`chmod 600 ~/.openclaw/*.json`
2. 检查身份文件：`ls -la ~/.openclaw/identity/`
3. 重新配对设备：`openclaw device pair`

### 凭证过期
- Telegram Bot Token 可能过期，需要在 Telegram BotFather 重新获取
- OAuth 凭证可能需要重新授权

### 数据库损坏
- 如果 `memory/*.sqlite` 损坏，可以删除后重新生成（会丢失记忆）
- 或者从 `~/.openclaw/backups/` 恢复旧版本

## 📅 最后更新

- **更新日期**: 2026-02-27
- **OpenClaw 版本**: 2026.2.26
- **配置版本**: 与 `openclaw.json` 中的 `lastTouchedVersion` 一致

---

**注意**: 定期更新此备份，特别是在修改重要配置后！
