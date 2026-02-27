# 润德教育 Dashboard 优化项目 - 完整流程

## 项目概览

**目标**：Dashboard 全栈优化（前端 + 后端）  
**团队**：多 Agent 协作  
**周期**：预计 2-3 天

---

## 👥 团队角色

| 角色 | Agent | 职责 |
|------|-------|------|
| **项目经理** | 我 (小d) | 规划、协调、验收、汇报 |
| **后端开发** | @码匠 | 后端重构实现 |
| **前端开发** | @码匠 | 前端重构实现 |
| **数据顾问** | @zhou_data_bot | 数据模型评审、SQL优化、数据验证 |
| **安全审查** | @guardian | 安全漏洞扫描、合规检查 |
| **质量审查** | @inspector | 代码规范、架构评审、性能分析 |
| **测试工程师** | @码匠 + 我 | 测试用例、执行 |

---

## 📋 完整流程

### 阶段 0: 方案评审 [当前]
**负责人**: 我  
**参与者**: @zhou_data_bot (数据顾问) + @guardian (安全预审)

**任务**:
- [x] 架构设计文档
- [x] 常量提取
- [ ] 数据模型评审 (等待 @zhou_data_bot)
- [ ] SQL 优化建议 (等待 @zhou_data_bot)
- [ ] 缓存策略评审 (等待 @zhou_data_bot)
- [ ] 安全预审 (等待 @guardian - 识别潜在风险点)

**交付物**:
- `DESIGN.md` (架构设计)
- `constants/dashboard.js` (前端常量)
- 数据顾问评审意见
- 安全预审报告

---

### 阶段 1: 后端设计细化
**负责人**: @码匠  
**评审人**: 我 + @zhou_data_bot + @guardian

**任务**:
1. 细化 Controller 拆分方案
2. 细化 Service 拆分方案
3. 设计数据库索引优化
4. 设计 Redis 缓存层（如需要）
5. 安全设计（@guardian 输入）

**交付物**:
- `backend-design.md` (后端设计文档)
- 数据库索引建议
- 安全设计说明

**评审会议**:
- 我：审查架构合理性
- @zhou_data_bot：审查数据模型和 SQL
- @guardian：审查安全设计

---

### 阶段 2: 后端实现
**负责人**: @码匠  
**时间**: 6-8 小时

**任务**:
- [ ] P2: Controller 拆分
  - `routes/dashboard/index.js`
  - `routes/dashboard/summary.controller.js`
  - `routes/dashboard/cache.controller.js`
  - `routes/dashboard/stats.controller.js`
- [ ] P3: Service 拆分
  - `services/dashboard/cacheService.js`
  - `services/dashboard/statsService.js`
  - `services/dashboard/monthlyService.js`
- [ ] P4: 参数校验 + 限流
  - `validators/dashboard.validator.js`
  - 限流中间件

**编码规范**:
- 每个文件 < 400 行
- JSDoc 注释
- 统一错误处理

---

### 阶段 3: 后端代码审查 [并行审查]
**负责人**: @guardian + @inspector  
**汇总**: 我

**并行审查流程**:

```
@码匠 提交代码
    ↓
@guardian + @inspector 并行审查
    ↓
各自提交审查报告
    ↓
我汇总审查结果 → 标记优先级
    ↓
@码匠 修复 → 提交复查
    ↓
@guardian/inspector 确认修复
```

**@guardian 安全审查清单**:
- [ ] SQL 注入风险
- [ ] XSS 漏洞（API 返回数据）
- [ ] 权限绕过
- [ ] 敏感信息泄露（日志、错误信息）
- [ ] 输入验证缺失
- [ ] 认证/授权问题
- [ ] 限流/防刷机制

**@inspector 质量审查清单**:
- [ ] 代码风格规范（ESLint）
- [ ] 架构设计合理性
- [ ] 性能瓶颈（N+1查询、循环查询）
- [ ] 错误处理完整性
- [ ] 单元测试覆盖
- [ ] 代码复杂度（圈复杂度）
- [ ] 可维护性

**交付物**:
- `backend-security-report.md` (Guardian)
- `backend-quality-report.md` (Inspector)
- `backend-review-summary.md` (我 - 汇总)

---

### 阶段 4: 前端设计细化
**负责人**: @码匠  
**评审人**: 我 + @inspector

**任务**:
1. 组件拆分详细设计
2. Composables 设计
3. 状态管理设计
4. 路由懒加载策略

**交付物**:
- `frontend-design.md` (前端设计文档)

---

### 阶段 5: 前端实现
**负责人**: @码匠  
**时间**: 6-8 小时

**任务**:
- [ ] P5: Composables 提取
  - `useDashboard.js`
  - `useCharts.js`
  - `useExport.js`
  - `useZombieScan.js`
- [ ] P6: 组件拆分
  - `DashboardHeader.vue`
  - `YearSelector.vue`
  - `MonthlyDataTable.vue`
  - `TrendCharts.vue`
  - `ZombieOrderPanel.vue`
- [ ] P7: 主文件重构
  - `views/Dashboard/index.vue`

**编码规范**:
- 每个组件 < 300 行
- 每个 composable < 400 行
- 主文件 < 200 行

---

### 阶段 6: 前端代码审查 [并行审查]
**负责人**: @guardian + @inspector  
**汇总**: 我

**@guardian 安全审查清单**:
- [ ] v-html 使用安全
- [ ] 敏感数据存储（LocalStorage等）
- [ ] CSRF 防护
- [ ] 权限控制（按钮级）
- [ ] 输入验证
- [ ] 第三方库安全

**@inspector 质量审查清单**:
- [ ] 组件职责单一
- [ ] Props/Emits 规范
- [ ] 性能优化（memo、lazy、keep-alive）
- [ ] 可访问性（ARIA等）
- [ ] Vue 最佳实践
- [ ] 代码复用性

**交付物**:
- `frontend-security-report.md` (Guardian)
- `frontend-quality-report.md` (Inspector)
- `frontend-review-summary.md` (我 - 汇总)

---

### 阶段 7: 测试用例设计
**负责人**: @码匠 + 我  
**参与者**: @zhou_data_bot (数据验证)

**测试范围**:

| 类型 | 内容 | 负责人 |
|------|------|--------|
| 单元测试 | Service 函数 | @码匠 |
| 单元测试 | Composables | @码匠 |
| 集成测试 | API 接口 | 我 |
| E2E 测试 | 关键用户流程 | 我 |
| 数据验证 | 统计结果准确性 | @zhou_data_bot |
| 性能测试 | 加载时间 < 1s | 我 |
| 安全测试 | 漏洞扫描 | @guardian |

**交付物**:
- `test-plan.md` (测试计划)
- 测试用例列表

---

### 阶段 8: 测试执行
**负责人**: @码匠 + 我 + @guardian  
**时间**: 4-6 小时

**任务**:
- [ ] 单元测试编写和执行 (@码匠)
- [ ] 集成测试 (我)
- [ ] 安全扫描 (@guardian)
- [ ] Bug 修复 (@码匠)
- [ ] 回归测试

**数据验证** (关键):
- @zhou_data_bot 验证关键统计指标
- 对比重构前后的数据一致性

**安全测试**:
- @guardian 执行安全扫描
- 验证所有安全问题已修复

---

### 阶段 9: 集成测试 & Bug修复
**负责人**: 我  
**参与者**: 全部

**任务**:
- [ ] 前后端联调
- [ ] 端到端测试
- [ ] Bug 修复
- [ ] 性能回归测试

**Bug 分级**:
- 🔴 P0: 阻塞性问题，必须修复
- 🟡 P1: 功能缺陷，建议修复
- 🟢 P2: 优化建议，可选修复

**Bug 处理流程**:
```
发现问题 → 我标记优先级 → @码匠修复
     ↓
@guardian/inspector 验证修复
     ↓
关闭问题
```

---

### 阶段 10: 最终验收 & 文档
**负责人**: 我  
**参与者**: 全部

**验收清单**:
- [ ] 代码规范检查通过 (@inspector)
- [ ] 安全扫描通过 (@guardian)
- [ ] 测试覆盖率 > 60%
- [ ] 性能指标达标
- [ ] 数据准确性验证通过 (@zhou_data_bot)
- [ ] 文档完整

**验收签字**:
- [ ] @guardian: 安全验收
- [ ] @inspector: 质量验收
- [ ] @zhou_data_bot: 数据验收
- [ ] 我: 整体验收

**交付物**:
- `README.md` (项目文档)
- `CHANGELOG.md` (变更记录)
- 最终汇报

---

## 📅 时间线

| 阶段 | 预计时间 | 依赖 |
|------|----------|------|
| 0. 方案评审 | 2h | - |
| 1. 后端设计 | 2h | 阶段0 |
| 2. 后端实现 | 8h | 阶段1 |
| 3. 后端审查 | 2h | 阶段2 |
| 4. 前端设计 | 2h | 阶段3 |
| 5. 前端实现 | 8h | 阶段4 |
| 6. 前端审查 | 2h | 阶段5 |
| 7. 测试设计 | 2h | 阶段6 |
| 8. 测试执行 | 6h | 阶段7 |
| 9. 集成测试 | 4h | 阶段8 |
| 10. 最终验收 | 2h | 阶段9 |

**总计**: 约 40 小时 (5 个工作日)

---

## 📊 汇报机制

### 日常汇报
- 每阶段完成后，实施者在群内汇报
- 格式：
  ```
  [阶段X完成] 后端Controller拆分
  ✅ 完成项：...
  📊 代码变化：原363行 → 4个文件，平均120行/个
  ⚠️ 问题：...
  🔄 下一步：...
  ```

### 审查汇报
- @guardian/inspector 审查完成后提交报告
- 格式：
  ```
  [后端安全审查完成] @guardian
  🔴 严重问题：X个
  🟡 建议修复：X个
  🟢 通过项：X个
  📄 详细报告：backend-security-report.md
  ```

### 里程碑汇报
- 阶段 3, 6, 9, 10 完成后，由我进行里程碑汇报

### 阻塞上报
- 遇到阻塞问题立即在群内 @ 我
- 2小时内未解决升级处理

---

## 🎯 成功标准

### 代码质量 (@inspector 验收)
- [ ] 后端每个 Controller < 200 行
- [ ] 后端每个 Service < 400 行
- [ ] 前端主文件 < 200 行
- [ ] 前端每个组件 < 300 行
- [ ] ESLint 0 警告

### 安全 (@guardian 验收)
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 漏洞
- [ ] 权限控制完整
- [ ] 敏感信息保护
- [ ] 参数校验覆盖率 100%

### 性能
- [ ] API 响应时间 P95 < 500ms
- [ ] 页面加载时间 < 1s
- [ ] 内存占用无增长

### 功能 (@zhou_data_bot 验收)
- [ ] 100% 功能保留
- [ ] 数据准确性 100%
- [ ] 单元测试覆盖率 > 60%

---

## 📁 项目文件结构

```
workspace/rundeedu-dashboard-optimization/
├── DESIGN.md                    # 架构设计
├── PROJECT_PLAN.md              # 项目流程
├── constants/
│   └── dashboard.js             # 前端常量
├── backend-design.md            # 后端详细设计
├── frontend-design.md           # 前端详细设计
├── backend-security-report.md   # Guardian 安全报告
├── backend-quality-report.md    # Inspector 质量报告
├── backend-review-summary.md    # 后端审查汇总
├── frontend-security-report.md  # Guardian 安全报告
├── frontend-quality-report.md   # Inspector 质量报告
├── frontend-review-summary.md   # 前端审查汇总
├── test-plan.md                 # 测试计划
├── test-report.md               # 测试报告
├── CHANGELOG.md                 # 变更记录
└── README.md                    # 项目文档
```
