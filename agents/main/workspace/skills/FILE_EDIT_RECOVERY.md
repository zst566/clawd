# 文件编辑失败自动修复机制

## 问题现象
编辑 Markdown 文件时经常出现 "Could not find exact text" 失败

## 原因分析
1. 文件内容已被其他工具/进程修改
2. 换行符或空格不匹配
3. 行号偏移

## 自动修复策略

### 1. 编辑前准备
```javascript
// 编辑前先读取文件最新状态
const content = await read({ file_path: "...", limit: 50 });
// 根据实际内容构建 oldText
```

### 2. 失败后重试
```javascript
// 第一次失败
const result = await edit({ file_path, oldText, newText });

if (result.status === "error") {
  // 自动重试：重新读取并定位
  const fresh = await read({ file_path, limit: 50 });
  // 找到最接近的匹配位置
  // 重新尝试编辑
}
```

### 3. 备选方案
如果多次编辑失败：
1. 使用 `write` 覆盖整个文件（谨慎使用）
2. 或者分小段逐步修改
3. 或者创建新文件，保留旧文件备份

## 实施计划
- [x] 记录到 MEMORY.md
- [ ] 实现编辑失败自动重试逻辑
- [ ] 每次编辑后自动验证（read确认）
- [ ] 失败时自动通知用户并提供备选方案

---

*问题提出时间: 2026-03-05*
