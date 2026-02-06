# Kimi Coding 正确配置记录

**记录日期**: 2026-02-06  
**来源**: openclaw-kimi-coding-setup.md

---

## 📋 配置总结

### 三个关键错误

| 错误项 | 错误配置 | 正确配置 |
|--------|---------|---------|
| Provider 名称 | `kimi-coding` | `kimi-code` |
| Base URL | `https://api.kimi.com/coding` | `https://api.kimi.com/coding/v1` |
| 认证文件 | 缺少 auth-profiles.json | 需要单独创建 |

---

## 📁 两个配置文件

### 1. 主配置文件
```
~/.openclaw/openclaw.json
```

### 2. 认证配置文件
```
~/.openclaw/agents/main/agent/auth-profiles.json
```

---

## 🧪 测试命令

验证 API Key 是否有效：
```bash
curl -H "Authorization: Bearer sk-kimi-xxx" \
  https://api.kimi.com/coding/v1/models
```

---

## ✅ 正确模型选择

当前可用的正确模型路径：
- `kimi-code/kimi-for-coding` ✓

错误的路径（不可用）：
- ~~`kimi-coding/k2p5`~~ ✗
- ~~`kimi-coding/k2.5`~~ ✗

---

## 💡 切换命令

```bash
# 正确的切换方式
/model kimi-code/kimi-for-coding

# 或切回默认
/model default
```

---
*记录 by 小d*
