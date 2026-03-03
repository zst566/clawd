# mall-vue 问题修复 - 并行执行方案

**项目**: Golden Coast Mall - mall-vue  
**执行日期**: 2026-03-03  
**执行方式**: 多 Agent 并行修复  

---

## 📋 待修复问题清单

### 🔴 安全问题（Guardian发现）

| 优先级 | 问题 | 位置 | 修复内容 | 负责Agent |
|--------|------|------|----------|-----------|
| P0 | API日志泄露敏感信息 | `src/services/api.ts` | 过滤Authorization header | Guardian |
| P0 | 生产环境保留console | `vite.config.ts` | `drop_console: true` | Guardian |
| P1 | Token存储在localStorage | `src/utils/persistence.ts` | 改为sessionStorage | Guardian |
| P1 | Token通过URL参数传递 | `src/composables/useWechatParams.ts` | 登录后清除URL参数 | Guardian |
| P2 | 密码强度验证过弱 | `src/views/customer/Register.vue` | 加强验证规则 | Guardian |
| P2 | 头像上传验证不足 | `src/composables/useAvatarUpload.ts` | 增加扩展名检查 | Guardian |

### 🟡 质量问题（Inspector发现 + 组件优化）

| 优先级 | 问题 | 位置 | 修复内容 | 负责Agent |
|--------|------|------|----------|-----------|
| P1 | OrderInfo.vue过重 | `src/components/merchant/order/` | 拆分为3个子组件 | CodeCraft |
| P1 | 缺少Props类型定义 | `OrderInfo.vue`, `OrderTimeline.vue`, `CustomerInfo.vue` | 添加完整interface | CodeCraft |
| P2 | 抽取工具函数 | 全局 | 创建`@/utils/format.ts` | CodeCraft |
| P2 | 代码重复 | 7+组件 | 复用format工具函数 | CodeCraft |
| P3 | 注释不完整 | 大部分组件 | 添加JSDoc注释 | CodeCraft |

---

## 🚀 并行执行策略

### 第一波：安全问题修复（Guardian 6任务并行）
- 6个安全问题 → Guardian同时处理
- 预计时间：30分钟

### 第二波：质量优化并行
- CodeCraft处理：组件拆分 + 工具函数抽取
- Inspector同步：审查新拆分的组件
- 预计时间：1小时

### 第三波：代码统一优化
- CodeCraft：添加注释 + 统一types.ts
- Inspector：最终质量审查
- Guardian：最终安全审查
- 预计时间：30分钟

---

## 📊 执行时间线

```
T+0:00  ┌─────────────────────────────────────────────────────────────┐
        │ 第一波：Guardian 6个安全问题并行修复                           │
        │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
        │ │ API日志 │ │ drop_   │ │ Token   │ │ URL     │ │ 密码强度│  │
        │ │ 过滤    │ │ console │ │ 存储    │ │ 清除    │ │ 验证    │  │
        └─┴─────────┴─┴─────────┴─┴─────────┴─┴─────────┴─┴─────────┴──┘
T+0:30  第一波完成 ✓

T+0:30  ┌──────────────────────────────────────────────────────────────┐
        │ 第二波：质量优化并行                                           │
        │ ┌─────────────────────────────┐  ┌─────────────────────────┐  │
        │ │ CodeCraft                   │  │ Inspector               │  │
        │ │ - OrderInfo拆分             │  │ - 审查新拆分组件        │  │
        │ │ - 工具函数抽取              │  │ - Props类型检查         │  │
        │ │ - 代码重复修复              │  │                         │  │
        └─┴─────────────────────────────┴──┴─────────────────────────┴──┘
T+1:30  第二波完成 ✓

T+1:30  ┌──────────────────────────────────────────────────────────────┐
        │ 第三波：最终优化与审查                                         │
        │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
        │ │ CodeCraft    │ │ Inspector    │ │ Guardian     │           │
        │ │ - 添加注释   │ │ - 质量审查   │ │ - 安全审查   │           │
        │ │ - 统一types  │ │              │ │              │           │
        └─┴──────────────┴─┴──────────────┴─┴──────────────┴───────────┘
T+2:00  全部完成 ✓
```

总计时间: 2小时
