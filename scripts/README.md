# Scripts - 自动化脚本目录

本目录存放各种自动化脚本和工具脚本。

## 📁 脚本分类

### 🧪 测试脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| `e2e-carpool-flow-test.js` | 茂名文旅拼车流程 E2E 测试 | Playwright 测试脚本，验证完整业务流程 |
| `playwright-test.sh` | Playwright 全局测试工具 | 茂名文旅项目的 E2E 测试辅助脚本 |

### 🔧 系统维护脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| `restore-clawdbot-minimax.sh` | 恢复 MiniMax OAuth 配置 | 重装 clawdbot 后恢复配置的脚本 |
| `restore-clawdbot-minimax.md` | 恢复脚本的使用说明 | 详细说明文档 |

### 🎵 定时任务脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| `daily_push.py` | 每日定时推送 | 自动化消息推送脚本 |
| `play_music_at.py` | 定时播放音乐 | 在指定时间播放音乐 |
| `play_music_reliable.py` | 可靠的音乐播放 | 带重试机制的音乐播放脚本 |

## 🚀 使用方法

### 执行脚本

```bash
# 进入脚本目录
cd ~/clawd/scripts

# 执行脚本
./script-name.sh
python3 script-name.py
node script-name.js
```

### 添加新脚本

1. 将脚本文件放入本目录
2. 确保脚本有执行权限：`chmod +x script-name.sh`
3. 在上方表格中添加说明
4. 更新本 README.md

## 📝 脚本规范

### Shell 脚本
- 使用 `#!/bin/bash` 开头
- 添加注释说明用途
- 设置执行权限：`chmod +x *.sh`

### Python 脚本
- 使用 `#!/usr/bin/env python3` 开头
- 添加依赖说明（如果有）
- 建议使用虚拟环境运行

### Node.js 脚本
- 确保已安装所需 npm 包
- 使用 `node script.js` 运行

## ⚠️ 注意事项

- 部分脚本可能需要特定环境才能运行
- 涉及敏感信息的脚本请妥善保管
- 修改脚本前建议备份

---

**最后更新**: 2026-02-27

### 📊 数据分析脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| `analyze_zombie_2022.py` | 2022年僵尸订单分析 | 分析润德教育2022年僵尸订单情况 |
