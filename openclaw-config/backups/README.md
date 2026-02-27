# OpenClaw 备份目录

本目录用于集中存放 OpenClaw 的所有备份文件。

## 📁 目录位置

```
~/.openclaw/backups/
```

## 📦 备份内容分类

### 1. 配置文件备份 (`openclaw.json.*`)

| 文件名 | 备份时间 | 说明 |
|--------|----------|------|
| `openclaw.json.bak` | 最新 | 当前配置备份 |
| `openclaw.json.bak.1~4` | 历史 | 历史版本备份 |
| `openclaw.json.backup.YYYYMMDD_HHMMSS` | 指定时间 | 按时间戳备份 |
| `openclaw.json.backup.final` | - | 最终稳定版本 |
| `openclaw.json.bak.before-restore-*` | 恢复前 | 恢复操作前的备份 |

### 2. Clawdbot 配置备份 (`clawdbot.json.*`)

| 文件名 | 备份时间 | 说明 |
|--------|----------|------|
| `clawdbot.json.backup.*` | 指定时间 | Clawdbot 配置备份 |
| `clawdbot-bak/` | - | Clawdbot 完整备份目录 |

### 3. Workspace 备份 (`workspace*.backup.*`)

| 目录名 | 备份时间 | 说明 |
|--------|----------|------|
| `workspace.backup.YYYYMMDD_HHMMSS` | 指定时间 | 旧主 workspace 备份 |
| `workspace-data.backup.*` | 指定时间 | 数据实例 workspace 备份 |
| `workspace-deployer.backup.*` | 指定时间 | Deployer workspace 备份 |
| `workspace-guardian.backup.*` | 指定时间 | Guardian workspace 备份 |
| `workspace-inspector.backup.*` | 指定时间 | Inspector workspace 备份 |

## 🔄 备份管理规范

### 自动备份规则

OpenClaw 在以下情况会自动创建备份：
1. **配置修改前** - 修改 `openclaw.json` 前自动备份
2. **恢复操作前** - 执行恢复操作前自动备份当前配置
3. **版本升级时** - 升级 OpenClaw 时备份配置

### 手动备份建议

执行以下操作前建议手动备份：
```bash
# 备份当前配置
cp ~/.openclaw/openclaw.json ~/.openclaw/backups/openclaw.json.backup.$(date +%Y%m%d_%H%M%S)

# 备份当前 clawdbot 配置
cp ~/.openclaw/clawdbot.json ~/.openclaw/backups/clawdbot.json.backup.$(date +%Y%m%d_%H%M%S)
```

### 备份保留策略

| 备份类型 | 保留时间 | 清理建议 |
|----------|----------|----------|
| 日常自动备份 | 30天 | 每月清理一次 |
| 重要操作备份 | 90天 | 季度清理一次 |
| 升级前备份 | 180天 | 半年清理一次 |
| Workspace 备份 | 7天 | 确认无误后删除 |

### 清理旧备份脚本

```bash
#!/bin/bash
# 清理 30 天前的备份（保留最近 5 个）
cd ~/.openclaw/backups/

# 清理旧的 openclaw.json 备份（保留最新 5 个）
ls -t openclaw.json.bak.* 2>/dev/null | tail -n +6 | xargs rm -f
ls -t openclaw.json.backup.* 2>/dev/null | tail -n +6 | xargs rm -f

# 清理 7 天前的 workspace 备份
find . -name "workspace*.backup.*" -mtime +7 -type d -exec rm -rf {} +

echo "备份清理完成"
```

## 🚨 恢复配置

### 从备份恢复 openclaw.json

```bash
# 停止 OpenClaw
openclaw gateway stop

# 恢复指定备份
cp ~/.openclaw/backups/openclaw.json.backup.20260227_120000 ~/.openclaw/openclaw.json

# 启动 OpenClaw
openclaw gateway start
```

### 从备份恢复 workspace

```bash
# 恢复 workspace 备份
cp -r ~/.openclaw/backups/workspace.backup.20260227_203847 ~/.openclaw/workspace
```

## 📝 备份记录

| 日期 | 操作 | 备份文件 | 操作人 |
|------|------|----------|--------|
| 2026-02-27 | 整理 workspace 备份 | workspace*.backup.20260227_* | 小d |
| - | - | - | - |

---

**注意**: 定期检查和清理备份文件，避免占用过多磁盘空间。
