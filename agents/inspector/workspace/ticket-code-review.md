# 茂名文旅票根模块PC端代码审查报告

## 审查范围

| 文件 | 行数 | 状态 | 评级 |
|------|------|------|------|
| Merchants.vue | 974行 | ⚠️ 过大 | D |
| Types.vue | 831行 | ⚠️ 过大 | D |
| Review.vue | 800行 | ⚠️ 过大 | D |
| Statistics.vue | 745行 | 较大 | C |
| AIConfig.vue | 641行 | 较大 | C |
| API: ticket.js | 377行 | 适中 | B |

---

## 1. 代码质量评级详情

### D级 - 必须重构 (3个文件)

#### Merchants.vue (974行) - D级
**主要问题：**
1. 3个弹窗（商户表单、规则管理、规则表单）挤在一个组件
2. 表单验证规则硬编码
3. 分类选项、票种映射等静态数据未分离
4. CRUD逻辑未复用
5. Logo上传逻辑与表单逻辑耦合

#### Types.vue (831行) - D级
**主要问题：**
1. 8个图标组件直接导入
2. 样例图片管理逻辑复杂（约150行）
3. 表单验证规则重复
4. 票种字段配置逻辑未复用

#### Review.vue (800行) - D级
**主要问题：**
1. 卡片模板过长（约150行）
2. 详情弹窗内容复杂
3. 置信度格式化逻辑重复
4. 筛选表单重复定义

### C级 - 建议优化 (2个文件)

#### Statistics.vue (745行) - C级
**主要问题：**
1. 内置模拟数据生成逻辑
2. 图表区域未提取组件
3. 统计卡片样式未复用

#### AIConfig.vue (641行) - C级
**主要问题：**
1. 多个配置区块未分离
2. 模型选项计算逻辑可复用

### B级 - 可接受 (1个文件)

#### ticket.js API - B级
**评价：** API封装规范，注释完整，建议保持

---

## 2. 必须拆分的文件及原因

### Merchants.vue - 优先级 P0
**必须拆分原因：**
- 3个独立弹窗应拆分为独立组件
- 业务逻辑与UI高度耦合
- 可提取多个 composables

**拆分方案：**
```
Merchants/
├── Merchants.vue           # 主页面容器
├── components/
│   ├── MerchantForm.vue    # 商户表单弹窗 (~150行)
│   ├── RulesManager.vue    # 规则管理弹窗 (~200行)
│   └── RuleForm.vue        # 规则表单弹窗 (~120行)
└── composables/
    └── useMerchants.js     # 商户业务逻辑 (~100行)
```

### Types.vue - 优先级 P0
**必须拆分原因：**
- 图标组件导入混乱
- 样例管理逻辑复杂
- 票种类型管理应独立

**拆分方案：**
```
Types/
├── Types.vue                 # 主页面
├── components/
│   ├── TicketTypeForm.vue   # 票种表单弹窗 (~150行)
│   └── SampleManager.vue    # 样例图片管理 (~200行)
└── composables/
    └── useTicketTypes.js    # 票种类型逻辑 (~80行)
```

### Review.vue - 优先级 P1
**必须拆分原因：**
- 卡片模板过长
- 详情和审核逻辑可复用

**拆分方案：**
```
Review/
├── Review.vue              # 审核页面主容器
├── components/
│   ├── TicketCard.vue      # 票根卡片 (~150行)
│   ├── TicketDetail.vue    # 详情弹窗内容 (~100行)
│   └── ReviewDialog.vue    # 审核操作弹窗 (~80行)
└── composables/
    └── useReview.js        # 审核逻辑 (~60行)
```

---

## 3. 可提取的公共组件

### UI 组件层
| 组件名 | 用途 | 当前重复 |
|--------|------|----------|
| `CommonTable.vue` | 通用表格+分页 | 5个文件 |
| `StatusSwitch.vue` | 状态开关 | 4个文件 |
| `ImagePreview.vue` | 图片预览 | 3个文件 |
| `ImageUploader.vue` | 图片上传 | 2个文件 |
| `Pagination.vue` | 分页控件 | 5个文件 |
| `FormDialog.vue` | 表单弹窗包装 | 3个文件 |

### Composable 层
| Hook | 用途 | 包含逻辑 |
|------|------|----------|
| `usePagination.js` | 分页管理 | page, size, total, load |
| `useCrud.js` | CRUD通用 | add, edit, delete, submit |
| `useDialog.js` | 弹窗状态 | visible, open, close |
| `useForm.js` | 表单处理 | reset, validate, clear |
| `useUpload.js` | 文件上传 | upload, progress |

### 静态数据层
```
src/views/ticket/constants/
├── categories.js    # 商户分类选项
├── ticketTypes.js  # 票种类型选项
└── icons.js        # 图标映射表
```

---

## 4. 重构优先级建议

### P0 - 紧急 (1-2周内)
1. **拆分 Merchants.vue**
   - 提取3个子组件
   - 提取 useMerchants composable
   
2. **拆分 Types.vue**
   - 提取 SampleManager 组件
   - 提取 useTicketTypes composable

### P1 - 高优先级 (2-4周)
3. **拆分 Review.vue**
   - 提取 TicketCard 组件
   - 提取 useReview composable
   
4. **创建公共组件库**
   - CommonTable
   - StatusSwitch
   - ImagePreview

### P2 - 中优先级 (1个月内)
5. **拆分 Statistics.vue**
   - 提取统计卡片组件
   - 提取 composable
   
6. **拆分 AIConfig.vue**
   - 提取配置区块组件

### P3 - 优化项
7. **提取通用 composables**
   - usePagination
   - useCrud
   - useDialog
   - useUpload

---

## 5. 预期收益

| 指标 | 当前 | 重构后 |
|------|------|--------|
| 最大组件行数 | 974行 | ~350行 |
| 平均组件行数 | 798行 | ~200行 |
| 代码重复率 | ~40% | ~15% |
| 可维护性 | 差 | 良 |

---

## 6. 风险提示

1. **拆分过程中注意保持API兼容性**
2. **建议分批次重构，每次只改一个文件**
3. **重构后需回归测试所有功能**

---

*审查完成，建议按优先级逐步重构*