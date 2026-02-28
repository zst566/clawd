# RunDeEdu Dashboard 前端安全审查报告

**审查日期**: 2026-02-28  
**审查路径**: `/Volumes/SanDisk2T/dv-codeBase/RunDeEdu/revenue-recognition-management/frontend-pc/src/views/Dashboard/`  
**审查文件**: 13 个（8 个 Vue 组件 + 4 个 Composables + index.vue）

---

## 📊 审查概览

| 类别 | 问题数量 | 风险等级 |
|------|----------|----------|
| XSS 漏洞 | 2 | 🔴 高 |
| 输入校验 | 3 | 🟡 中 |
| 权限控制 | 2 | 🟠 中高 |
| 代码质量 | 2 | 🟢 低 |
| **总计** | **9** | - |

---

## 🔴 高风险问题

### 1. XSS 漏洞 - Tooltip HTML 注入

**位置**: 
- `TrendCharts.vue` (第 88-95 行、118-122 行、153-157 行)
- `useCharts.js` (第 47-54 行、78-82 行、113-117 行)

**问题描述**:
```javascript
// TrendCharts.vue
formatter: (params) => {
  let result = params[0].name + '<br/>'  // ❌ 未转义
  params.forEach(param => {
    result += `${param.seriesName}: ${param.value.toLocaleString('zh-CN')} 元<br/>`  // ❌ HTML拼接
  })
  return result
}
```

**风险**: 
- `params[0].name` 来自后端返回的月份数据，如果后端被攻破或数据被篡改，可能注入 `<script>` 标签
- 虽然 ECharts 有一定防护，但仍存在潜在风险

**修复建议**:
```javascript
// 使用 ECharts 的富文本格式或转义 HTML
import { escapeHtml } from '@/utils/security'

formatter: (params) => {
  let result = escapeHtml(params[0].name) + '<br/>'
  params.forEach(param => {
    result += `${escapeHtml(param.seriesName)}: ${param.value.toLocaleString('zh-CN')} 元<br/>`
  })
  return result
}
```

---

## 🟠 中高风险问题

### 2. 前端权限控制可被绕过

**位置**:
- `DashboardHeader.vue` (第 55-84 行)
- `YearSelector.vue` (第 44-51 行)
- `index.vue` 批量统计、修复消失订单功能

**问题描述**:
```javascript
// DashboardHeader.vue
const isAdmin = computed(() => authStore.user?.role === 'admin')

// 仅前端隐藏按钮，后端可能未做权限校验
<el-dropdown v-if="isAdmin" ...>
```

**风险**: 
- 攻击者可通过修改前端状态或直接向 API 发送请求来绕过前端权限控制
- 如果后端未做相同权限校验，可能导致未授权访问

**修复建议**:
```javascript
// 确保后端 API 也进行权限校验
// 后端应验证：
// 1. JWT Token 有效性
// 2. 用户 role 是否为 admin
// 3. 必要时检查用户是否有该数据库的访问权限
```

---

## 🟡 中等风险问题

### 3. 输入数据缺乏校验

**位置**:
- `index.vue` `updateSummaryData` 方法
- `ZombieOrderPanel.vue` (第 25 行)
- 多个 composables

**问题描述**:
```javascript
// ZombieOrderPanel.vue
{{ (row.totalBalance / 100).toFixed(2) }}

// 如果 row.totalBalance 为 null/undefined/string，会导致 NaN 或报错
```

**修复建议**:
```javascript
const formatBalance = (balance) => {
  const num = Number(balance)
  if (isNaN(num)) return '-'
  return (num / 100).toFixed(2)
}
```

### 4. 日期输入缺乏校验

**位置**:
- `ZombieDateDialog.vue` 
- `index.vue` `confirmZombieScan`

**问题描述**:
日期选择器虽然有 format，但未对选择的日期进行业务逻辑校验（如不能选择未来日期）

**修复建议**:
```javascript
const confirmZombieScan = async () => {
  const selectedDate = new Date(zombieDateForm.value.dateThreshold)
  const now = new Date()
  
  if (selectedDate > now) {
    ElMessage.warning('不能选择未来日期')
    return
  }
  // ...
}
```

### 5. API 响应数据未校验

**位置**:
- `index.vue` `confirmZombieScan` 方法

**问题描述**:
```javascript
const yearlyStatsData = countRes.yearlyStats || []
stats.value = yearlyStatsData.map(item => ({
  year: item.year || item.Year || item.YEAR,  // ❌ 未校验类型
  orderCount: item.orderCount || item.OrderCount || item.ORDER_COUNT || 0,
  totalBalance: item.totalBalance || item.TotalBalance || item.TOTAL_BALANCE || 0
}))
```

**风险**: 如果后端返回非预期格式数据，可能导致渲染错误

---

## 🟢 低风险问题

### 6. 敏感信息泄露

**位置**:
- `DataOverview.vue`
- `MonthlyDataTable.vue`
- `index.vue`

**问题描述**:
数据库连接信息（host、port、databaseName）直接显示在页面

**建议**: 评估是否有必要显示完整的数据库地址信息

### 7. 代码重复

**位置**:
- `index.vue` 和 `useDashboardData.js` 有重复的状态和方法定义
- `TrendCharts.vue` 和 `useCharts.js` 功能重复

**建议**: 统一使用 composables，避免重复代码

---

## ✅ 良好实践

1. **使用 v-model 和 computed 实现双向绑定** - `MonthSelectorDialog.vue`、`ZombieDateDialog.vue`
2. **API 错误统一处理** - 使用 try-catch 和 ElMessage 提示错误
3. **数字格式化统一** - 金额统一除以 100 转换为元
4. **组件拆分合理** - Dashboard 拆分为多个小组件，职责清晰

---

## 📋 修复优先级建议

| 优先级 | 问题 | 预计修复时间 |
|--------|------|--------------|
| P0 | XSS - Tooltip HTML 注入 | 30 分钟 |
| P1 | 后端权限校验补充 | 需后端配合 |
| P1 | 输入数据校验 | 1 小时 |
| P2 | 日期业务校验 | 30 分钟 |
| P2 | 敏感信息评估 | 15 分钟 |
| P3 | 代码重构去重 | 2 小时 |

---

## 🔧 修复代码示例

### HTML 转义工具函数

```javascript
// utils/security.js
export function escapeHtml(text) {
  if (typeof text !== 'string') return text
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
```

### 输入校验工具

```javascript
// utils/validation.js
export function validateNumber(value, defaultValue = 0) {
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

export function validateDateRange(date, minDate, maxDate) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  if (minDate && d < new Date(minDate)) return false
  if (maxDate && d > new Date(maxDate)) return false
  return true
}
```

---

**审查完成时间**: 2026-02-28 11:15  
**审查人**: Guardian (Security Review Agent)
