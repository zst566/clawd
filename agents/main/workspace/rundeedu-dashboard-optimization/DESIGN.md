/**
 * Dashboard 优化项目 - 设计文档
 * 
 * 项目：润德教育收入确认系统 Dashboard 重构
 * 目标：模块化、性能优化、最佳实践
 */

# Dashboard 优化设计文档

## 1. 现状问题

### 1.1 代码规模
- Dashboard.vue: 1540 行
- 混合新旧两个版本
- 业务逻辑与 UI 耦合

### 1.2 结构问题
- 单文件过大，难以维护
- 职责不单一
- 复用性低

### 1.3 性能问题
- 图表重复初始化
- 数据加载未优化
- 无缓存机制

## 2. 目标架构

```
views/Dashboard/
├── index.vue                    # 入口组件（< 200 行）
├── components/
│   ├── DashboardHeader.vue      # 头部操作区
│   ├── YearSelector.vue         # 年度选择器
│   ├── DataOverview.vue         # 数据概览（旧版）
│   ├── MonthlyDataTable.vue     # 月度数据表格
│   ├── TrendCharts.vue          # 趋势图表
│   ├── ZombieOrderPanel.vue     # 僵尸订单面板
│   └── ExportActions.vue        # 导出操作
├── composables/
│   ├── useDashboardData.js      # 数据获取
│   ├── useCharts.js             # 图表管理
│   ├── useExport.js             # Excel导出
│   └── useZombieScan.js         # 僵尸订单
└── constants/
    └── dashboard.js             # 常量配置
```

## 3. 组件设计

### 3.1 DashboardHeader.vue
**职责**: 顶部操作按钮区
**Props**:
- `loading`: boolean - 刷新状态
- `zombieCount`: number - 僵尸订单数

**Emits**:
- `refresh`: 刷新数据
- `scan-zombie`: 扫描僵尸订单
- `batch-calculate`: 批量统计
- `zombie-fix`: 修复消失订单
- `jiao-wu-script`: 教务脚本

### 3.2 YearSelector.vue
**职责**: 年度选择和数据加载
**Props**:
- `modelValue`: string - 选中年度
- `loading`: boolean

**Emits**:
- `update:modelValue`: 年度变化
- `load`: 加载数据
- `calculate-cache`: 计算月度缓存
- `export`: 导出Excel

### 3.3 MonthlyDataTable.vue
**职责**: 月度数据展示表格
**Props**:
- `data`: array - 表格数据
- `loading`: boolean
- `year`: string - 当前年度

**Features**:
- 自动汇总
- 格式化显示
- 加载状态

### 3.4 TrendCharts.vue
**职责**: ECharts 趋势图表
**Props**:
- `data`: array - 图表数据

**Charts**:
- 实收与退款趋势
- 确认收入趋势
- 预收款余额趋势

### 3.5 ZombieOrderPanel.vue
**职责**: 僵尸订单检查结果展示
**Props**:
- `stats`: array - 统计数据
- `loading`: boolean

**Emits**:
- `download`: 下载报告

## 4. Composables 设计

### 4.1 useDashboardData
```javascript
const {
  summaryData,        // 概览数据
  monthlyData,        // 月度数据
  databaseInfo,       // 数据库信息
  loading,            // 加载状态
  loadSummary,        // 加载概览
  loadMonthly,        // 加载月度
  refresh             // 刷新
} = useDashboardData()
```

### 4.2 useCharts
```javascript
const {
  initCharts,         // 初始化图表
  updateCharts,       // 更新数据
  disposeCharts       // 销毁图表
} = useCharts(containerRef)
```

### 4.3 useExport
```javascript
const {
  exporting,          // 导出中状态
  exportToExcel       // 导出方法
} = useExport()
```

### 4.4 useZombieScan
```javascript
const {
  scanning,           // 扫描中
  stats,              // 统计结果
  totalCount,         // 总数
  scan,               // 扫描方法
  downloadReport      // 下载报告
} = useZombieScan()
```

## 5. 性能优化策略

### 5.1 懒加载
- 图表组件按需加载
- 弹窗组件懒加载

### 5.2 缓存
- 数据缓存避免重复请求
- 图表实例复用

### 5.3 防抖节流
- 搜索输入防抖
- 刷新按钮节流

## 6. 安全考虑

### 6.1 XSS 防护
- 数据输出转义
- v-html 谨慎使用

### 6.2 权限控制
- 按钮级权限
- API 请求权限

## 7. 迁移计划

### Phase 1: 基础设施
- [x] 常量提取
- [ ] Composables 创建
- [ ] 工具函数整理

### Phase 2: 组件拆分
- [ ] DashboardHeader
- [ ] YearSelector
- [ ] MonthlyDataTable
- [ ] TrendCharts
- [ ] ZombieOrderPanel

### Phase 3: 主文件重构
- [ ] 新 index.vue
- [ ] 功能验证

### Phase 4: 性能优化
- [ ] 懒加载
- [ ] 缓存
- [ ] 安全审查

## 8. 后端架构设计

### 8.1 目录结构
```
backend-node/src/
├── routes/
│   └── dashboard/
│       ├── index.js              # 路由聚合器
│       ├── summary.controller.js # 概览数据
│       ├── cache.controller.js   # 缓存管理
│       └── stats.controller.js   # 统计数据
├── services/
│   └── dashboard/
│       ├── index.js
│       ├── cacheService.js       # 缓存读写
│       ├── statsService.js       # 统计计算
│       ├── monthlyService.js     # 月度数据
│       └── exportService.js      # 导出功能
├── validators/
│   └── dashboard.validator.js    # 参数校验
└── utils/dashboard/
    ├── dateUtils.js              # 日期工具
    └── formatUtils.js            # 格式化工具
```

### 8.2 Controller 设计

#### summary.controller.js
```javascript
// GET /api/dashboard/summary
// POST /api/dashboard/refresh
// GET /api/dashboard/cache-info
```

#### cache.controller.js
```javascript
// GET /api/dashboard/available-months
// GET /api/dashboard/cache-by-month
// POST /api/dashboard/batch-calculate
```

#### stats.controller.js
```javascript
// GET /api/dashboard/yearly-monthly-data
// GET /api/dashboard/yearly-order-count
// POST /api/dashboard/calculate-yearly-monthly-cache
```

### 8.3 Service 拆分策略

| 原 Service | 行数 | 拆分后 | 职责 |
|------------|------|--------|------|
| dashboardService.js | 1310 | cacheService.js | 缓存 CRUD |
| | | statsService.js | 统计计算 |
| | | monthlyService.js | 月度聚合 |
| | | exportService.js | Excel 导出 |

### 8.4 统一响应格式
```javascript
const createResponse = (data, message = 'success') => ({
  code: 200,
  message,
  data,
  timestamp: new Date().toISOString()
});

const createError = (message, code = 500) => ({
  code,
  message,
  data: null,
  timestamp: new Date().toISOString()
});
```

### 8.5 参数校验规则
```javascript
{
  year: { type: 'number', min: 2000, max: 2100 },
  yearMonth: { type: 'string', pattern: /^\d{4}-\d{2}$/ },
  dateThreshold: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ }
}
```

## 9. 性能优化策略

### 9.1 前端
- 路由懒加载
- 组件按需加载
- 数据缓存 (SWR 策略)
- 图表实例复用

### 9.2 后端
- SQL 查询优化 (索引检查)
- Redis 缓存层
- 分页查询
- 连接池优化

## 10. 安全加固

### 10.1 前端
- XSS: 数据转义输出
- CSRF: Token 验证
- 权限: 按钮级控制

### 10.2 后端
- 参数校验
- SQL 注入防护
- 限流 (Rate Limit)
- 权限中间件

## 11. 验收标准

### 前端
- [ ] Dashboard/index.vue < 200 行
- [ ] 所有组件 < 300 行
- [ ] 所有 composables < 400 行
- [ ] 功能完整，无回归

### 后端
- [ ] 每个 Controller < 200 行
- [ ] 每个 Service < 400 行
- [ ] API 响应时间 < 500ms (P95)
- [ ] 参数校验覆盖率 100%

### 全栈
- [ ] 性能无下降
- [ ] 代码通过 ESLint
- [ ] 单元测试覆盖率 > 60%
