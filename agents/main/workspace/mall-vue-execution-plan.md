# mall-vue 代码质量优化 - 并行执行计划

**项目**: Golden Coast Mall - mall-vue  
**执行日期**: 2026-03-03  
**执行方式**: 多 Agent 并行处理  

---

## 🎯 任务分解与分配

### 第一波：码匠多分身并行（组件拆分）

**执行方式**: 使用 `sessions_spawn` 启动 4 个 codecraft 子会话，**并行执行**

| 分身 | 任务 | 目标文件 | 拆分目标 | 预计时间 |
|------|------|----------|----------|----------|
| **codecraft-1** | 拆分商户首页 | `merchant/Home.vue` (1,192行) | 5个子组件 | 4小时 |
| **codecraft-2** | 拆分商品详情 | `customer/ProductDetail.vue` (1,160行) | 6个子组件 | 4小时 |
| **codecraft-3** | 拆分订单详情 | `merchant/OrderDetail.vue` (1,148行) | 5个子组件 | 4小时 |
| **codecraft-4** | 拆分促销详情 | `customer/PromotionDetail.vue` (1,104行) | 5个子组件 | 4小时 |

**并行优势**: 4个任务同时执行，总时间从 4天 缩短到 4小时

---

### 第二波：码匠单任务（代码清理）

**执行方式**: `sessions_spawn` 启动单任务，**串行执行**（等待第一波完成）

| 任务 | 内容 | 数量 | 预计时间 |
|------|------|------|----------|
| **codecraft-clean** | 清理 console.log | 324处 | 2小时 |

---

### 第三波：审查并行

**执行方式**: `sessions_spawn` 启动 2 个审查任务，**并行执行**（等待第二波完成）

| Agent | 任务 | 审查内容 | 预计时间 |
|-------|------|----------|----------|
| **inspector** | 质量审查 | 组件拆分质量、Props/Emits定义、类型安全 | 2小时 |
| **guardian** | 安全审查 | 敏感信息泄露、XSS风险、API安全 | 1小时 |

---

## ⏱️ 执行时间线

```
T+0:00  ┌─────────────────────────────────────────────────────────────┐
        │ 第一波：码匠4分身并行启动                                      │
        │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
        │ │ codecraft-1  │ │ codecraft-2  │ │ codecraft-3  │ │codecraft-4│ │
        │ │ Home拆分     │ │ Product拆分  │ │ Order拆分    │ │Promo拆分  │ │
        └─┴──────────────┴─┴──────────────┴─┴──────────────┴─┴──────────┴─┘
T+4:00  
        第一波完成 ✓
        
T+4:00  ┌─────────────────────────────────────┐
        │ 第二波：码匠清理任务启动               │
        │ ┌──────────────────────────────────┐  │
        │ │ codecraft-clean                  │  │
        │ │ 清理 324处 console.log           │  │
        └─┴──────────────────────────────────┴──┘
T+6:00  
        第二波完成 ✓
        
T+6:00  ┌──────────────────────────────────────────────────────────┐
        │ 第三波：审查并行启动                                        │
        │ ┌──────────────────────────┐ ┌──────────────────────────┐  │
        │ │ inspector                │ │ guardian                 │  │
        │ │ 质量审查                 │ │ 安全审查                 │  │
        └─┴──────────────────────────┴─┴──────────────────────────┴──┘
T+7:00  
        Guardian 完成 ✓
T+8:00  
        Inspector 完成 ✓
        
总计时间: 8小时（vs 串行执行的 3.5天）
```

---

## 🚀 启动命令

### 第一波：码匠4分身并行

```javascript
// 分身1: merchant/Home.vue 拆分
sessions_spawn({
  agentId: "codecraft",
  task: "拆分 mall-vue 的 merchant/Home.vue (1192行)。\n" +
        "目标：拆分为 5个子组件：StatisticCards, QuickActions, RecentOrders, OrderChart, MerchantInfo\n" +
        "要求：1.保持原有功能 2.使用Props/Emits 3.添加TypeScript类型 4.每个子组件<300行 5.通过ESLint检查\n" +
        "项目路径：/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue",
  label: "mall-vue-拆分-Home"
})

// 分身2: customer/ProductDetail.vue 拆分
sessions_spawn({
  agentId: "codecraft",
  task: "拆分 mall-vue 的 customer/ProductDetail.vue (1160行)。\n" +
        "目标：拆分为 6个子组件：ProductGallery, ProductInfo, PriceSection, VariantSelector, PromotionTags, ActionButtons\n" +
        "要求：同上",
  label: "mall-vue-拆分-ProductDetail"
})

// 分身3: merchant/OrderDetail.vue 拆分
sessions_spawn({
  agentId: "codecraft",
  task: "拆分 mall-vue 的 merchant/OrderDetail.vue (1148行)。\n" +
        "目标：拆分为 5个子组件：OrderInfo, CustomerInfo, ProductList, PaymentInfo, ActionButtons\n" +
        "要求：同上",
  label: "mall-vue-拆分-OrderDetail"
})

// 分身4: customer/PromotionDetail.vue 拆分
sessions_spawn({
  agentId: "codecraft",
  task: "拆分 mall-vue 的 customer/PromotionDetail.vue (1104行)。\n" +
        "目标：拆分为 5个子组件：PromotionHeader, VariantList, PriceCalculator, ActivityRules, ActionButtons\n" +
        "要求：同上",
  label: "mall-vue-拆分-PromotionDetail"
})
```

### 第二波：码匠清理任务

```javascript
// 清理 console.log
sessions_spawn({
  agentId: "codecraft",
  task: "清理 mall-vue 项目中的所有 console.log（共324处）。\n" +
        "策略：1.删除调试用的console.log 2.保留错误日志改为console.error 3.业务关键日志改为使用日志框架\n" +
        "项目路径：/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue\n" +
        "检查命令：grep -r \"console.log\" src/ --include=\"*.ts\" --include=\"*.vue\"",
  label: "mall-vue-清理-console"
})
```

### 第三波：审查并行

```javascript
// Inspector 质量审查
sessions_spawn({
  agentId: "inspector",
  task: "审查 mall-vue 组件拆分质量。\n" +
        "审查内容：1.子组件职责是否单一 2.Props/Emits定义是否完整 3.类型定义是否准确 4.是否符合Vue3最佳实践\n" +
        "被审查文件：merchant/Home.vue拆分、customer/ProductDetail.vue拆分、merchant/OrderDetail.vue拆分、customer/PromotionDetail.vue拆分\n" +
        "项目路径：/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue",
  label: "mall-vue-质量审查"
})

// Guardian 安全审查
sessions_spawn({
  agentId: "guardian",
  task: "审查 mall-vue 安全漏洞。\n" +
        "审查内容：1.敏感信息泄露（密钥、密码）2.XSS风险（v-html使用、用户输入）3.不安全的API调用\n" +
        "项目路径：/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue",
  label: "mall-vue-安全审查"
})
```

---

## 📋 执行检查清单

### 第一波检查（组件拆分）
- [ ] 4个码匠分身全部启动成功
- [ ] merchant/Home.vue 拆分完成
- [ ] customer/ProductDetail.vue 拆分完成
- [ ] merchant/OrderDetail.vue 拆分完成
- [ ] customer/PromotionDetail.vue 拆分完成
- [ ] 所有子组件通过 ESLint 检查
- [ ] 原有功能未受影响

### 第二波检查（代码清理）
- [ ] 324处 console.log 清理完成
- [ ] 无回归问题

### 第三波检查（审查）
- [ ] Inspector 质量审查通过
- [ ] Guardian 安全审查通过
- [ ] 所有问题修复完成

---

## 🔄 异常处理

### 如果某个码匠分身失败
1. 记录失败原因
2. 重新 spawn 该任务
3. 其他分身继续执行

### 如果审查发现问题
1. 汇总所有问题
2. 分配给码匠修复
3. 重新审查直到通过

---

**计划制定**: 2026-03-03  
**执行方式**: 多 Agent 并行  
**预计总时间**: 8小时（并行）vs 3.5天（串行）
