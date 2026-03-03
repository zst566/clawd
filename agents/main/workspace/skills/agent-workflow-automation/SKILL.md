# Agent 工作流自动化

本技能定义多 Agent 协作的标准工作流和自动化协议。

---

## 并行审查流程

### 流程图

```
                    ┌─────────────────┐
                    │   代码提交/PR    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────────────┐
    │ Guardian        │ │ Inspector       │
    │ 安全审查(并行)   │ │ 质量审查(并行)   │
    └────────┬────────┘ └────────┬────────┘
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   审查结果汇总   │
              │  (项目经理或自动化)│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  自动通知码匠    │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   码匠修复问题   │
              └─────────────────┘
```

### 执行方式

使用 `sessions_spawn` 同时启动两个审查任务：

```javascript
// 1. 启动 Guardian 安全审查
const guardianResult = await sessions_spawn({
  agentId: "guardian",
  task: `安全审查代码文件：${filePath}
  
审查重点：
- SQL 注入风险
- XSS 漏洞
- 敏感信息泄露
- 权限绕过
- 不安全的依赖

请输出：
1. 审查结果摘要（高危/警告/建议数量）
2. 详细问题列表（行号、问题描述、修复建议）
3. 整体安全评级（A/B/C/D）`,
  label: `Guardian-${fileName}`,
  runTimeoutSeconds: 300
});

// 2. 启动 Inspector 质量审查
const inspectorResult = await sessions_spawn({
  agentId: "inspector",
  task: `质量审查代码文件：${filePath}
  
审查重点：
- 代码规范（ESLint/Prettier）
- 代码复杂度
- 重复代码
- 最佳实践遵循
- 性能优化建议

请输出：
1. 审查结果摘要（错误/警告/建议数量）
2. 详细问题列表（行号、问题描述、修复建议）
3. 代码质量评级（A/B/C/D）`,
  label: `Inspector-${fileName}`,
  runTimeoutSeconds: 300
});

// 3. 等待两者完成并汇总
const summary = `
📋 审查结果汇总
━━━━━━━━━━━━━━━━━━━━
🔒 Guardian（安全）: ${guardianResult.summary}
✅ Inspector（质量）: ${inspectorResult.summary}

详细报告：
[Guardian详细结果]
${guardianResult.details}

[Inspector详细结果]
${inspectorResult.details}

⏰ 请 @zhou_codecraft_bot 开始修复
📢 @小d 已抄送
`;

// 4. 通知码匠
sessions_send({
  sessionKey: "agent:codecraft:telegram:group:-1003531397239",
  message: summary
});
```

### 并行 vs 串行对比

| 方式 | 耗时 | 适用场景 | 备注 |
|------|------|----------|------|
| **串行** | Guardian 5min + Inspector 5min = 10min | 资源受限 | 简单实现 |
| **并行** | max(Guardian 5min, Inspector 5min) = 5min | 标准流程 | **推荐** |

**效果**: 并行执行可节省 50% 审查时间。

---

## 并行开发工作流

### 场景1: 前后端并行开发

当开发一个新功能时，前端和后端可以同时进行。

#### 流程图

```
┌─────────────────┐
│   需求评审完成   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ 后端开发 │ │ 前端开发 │
│ @码匠   │ │ @码匠   │
│ (API)   │ │ (UI)    │
└────┬────┘ └────┬────┘
     │           │
     │  Mock数据  │
     │◄─────────►│
     │           │
     └─────┬─────┘
           │
           ▼
    ┌─────────────────┐
    │   联调测试      │
    │ @tester        │
    └─────────────────┘
```

#### 执行方式

```javascript
// 1. 启动后端开发任务
const backendTask = sessions_spawn({
  agentId: "codecraft",
  task: `开发后端API: /api/v1/dashboard/stats
  
需求:
- 实现数据统计API
- 接口文档: /docs/api/dashboard.md
- 返回格式: JSON
- 需要鉴权: JWT

交付物:
1. API实现代码
2. 单元测试 (Jest)
3. 接口文档更新`,
  label: "后端-Dashboard-Stats-API",
  runTimeoutSeconds: 600
});

// 2. 启动前端开发任务（使用Mock数据）
const frontendTask = sessions_spawn({
  agentId: "codecraft",
  task: `开发前端页面: Dashboard统计页面
  
需求:
- 使用Mock数据开发UI
- 设计稿: /design/dashboard.fig
- 组件: Vue3 + Element Plus
- 状态管理: Pinia

Mock数据格式:
{
  "totalUsers": 1000,
  "activeUsers": 800,
  "growthRate": 15.5
}

交付物:
1. Vue组件代码
2. 单元测试 (Vitest)
3. E2E测试 (Playwright)`,
  label: "前端-Dashboard-Stats-页面",
  runTimeoutSeconds: 600
});

// 3. 等待两者完成
const [backendResult, frontendResult] = await Promise.all([
  backendTask, 
  frontendTask
]);

// 4. 启动联调测试
sessions_spawn({
  agentId: "tester",
  task: `联调测试: Dashboard统计功能
  
测试内容:
1. API与前端集成测试
2. 数据格式匹配验证
3. 错误处理测试
4. 性能测试 (响应时间 < 200ms)

输出:
- 测试报告
- Bug列表（如有）`,
  label: "联调测试-Dashboard"
});
```

#### 优势

| 方式 | 耗时 | 说明 |
|------|------|------|
| **串行** | 后端5h + 前端5h = 10h | 等待API完成才能开发前端 |
| **并行** | max(后端5h, 前端5h) = 5h | Mock数据解耦，同时进行 |

---

### 场景2: 前端多模块并行开发

大型前端项目可以按模块拆分，多个Agent并行开发。

#### 流程图

```
┌─────────────────┐
│   页面设计完成   │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐
│Header││Sidebar││Content│
│开发  ││开发  ││开发  │
└─────┘└─────┘└─────┘
    │    │    │
    └────┼────┘
         │
         ▼
┌─────────────────┐
│   集成测试      │
└─────────────────┘
```

#### 执行方式

```javascript
// 同时启动多个前端模块开发
const modules = [
  { name: "Header", component: "AppHeader.vue", props: ["user", "nav"] },
  { name: "Sidebar", component: "AppSidebar.vue", props: ["menu", "active"] },
  { name: "Content", component: "DashboardContent.vue", props: ["data", "charts"] }
];

const moduleTasks = modules.map(module => 
  sessions_spawn({
    agentId: "codecraft",
    task: `开发前端组件: ${module.component}
    
组件规范:
- 框架: Vue3 + TypeScript
- UI库: Element Plus
- 样式: Tailwind CSS
- 测试: Vitest

Props接口:
${JSON.stringify(module.props, null, 2)}

交付标准:
1. 组件实现
2. 单元测试 (>80%覆盖率)
3. Storybook文档`,
    label: `前端模块-${module.name}`,
    runTimeoutSeconds: 480
  })
);

// 等待所有模块完成
await Promise.all(moduleTasks);

// 集成测试
sessions_spawn({
  agentId: "tester",
  task: `集成测试: Dashboard页面所有模块
  
测试内容:
- 模块间数据传递
- 整体布局渲染
- 响应式适配
- 性能测试`,
  label: "集成测试-前端模块"
});
```

#### 模块拆分原则

| 原则 | 说明 |
|------|------|
| **高内聚** | 每个模块功能单一、完整 |
| **低耦合** | 模块间通过Props/Event通信 |
| **独立测试** | 每个模块可独立开发、测试 |
| **接口先行** | 先定义Props接口，再并行开发 |

---

### 场景3: 后端多API并行开发

后端服务可以按API或按领域拆分，多个任务并行进行。

#### 流程图

```
┌─────────────────┐
│   API设计完成   │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐
│用户  ││订单  ││商品  │
│API   ││API   ││API   │
└─────┘└─────┘└─────┘
    │    │    │
    └────┼────┘
         │
         ▼
┌─────────────────┐
│   API集成测试   │
└─────────────────┘
```

#### 执行方式

```javascript
// 定义API开发任务
const apiModules = [
  {
    name: "用户API",
    endpoints: ["/api/users", "/api/users/:id", "/api/auth/login"],
    database: ["users", "auth_tokens"],
    features: ["CRUD", "登录", "权限验证"]
  },
  {
    name: "订单API", 
    endpoints: ["/api/orders", "/api/orders/:id", "/api/orders/:id/status"],
    database: ["orders", "order_items"],
    features: ["CRUD", "状态流转", "支付集成"]
  },
  {
    name: "商品API",
    endpoints: ["/api/products", "/api/products/:id", "/api/products/search"],
    database: ["products", "categories"],
    features: ["CRUD", "搜索", "分类管理"]
  }
];

// 并行启动所有API开发
const apiTasks = apiModules.map(api => 
  sessions_spawn({
    agentId: "codecraft",
    task: `开发后端API模块: ${api.name}
    
API端点:
${api.endpoints.map(e => `- ${e}`).join('\n')}

数据库表:
${api.database.map(t => `- ${t}`).join('\n')}

功能特性:
${api.features.map(f => `- ${f}`).join('\n')}

技术栈:
- Node.js + TypeScript
- Express.js
- Prisma ORM
- MySQL

交付标准:
1. API实现 (RESTful)
2. 单元测试 (Jest + Supertest)
3. API文档 (Swagger)
4. 数据库迁移脚本`,
    label: `后端API-${api.name}`,
    runTimeoutSeconds: 600
  })
);

// 等待所有API完成
await Promise.all(apiTasks);

// API集成测试
sessions_spawn({
  agentId: "tester",
  task: `API集成测试: 所有模块
  
测试场景:
- 用户注册 -> 登录 -> 创建订单 -> 添加商品
- 跨API数据一致性
- 事务回滚测试
- 并发性能测试`,
  label: "集成测试-后端API"
});
```

#### API开发规范

| 规范 | 说明 |
|------|------|
| **接口先行** | 先定义OpenAPI/Swagger文档 |
| **独立部署** | 每个API模块可独立测试、部署 |
| **共享基础** | 共享数据库连接、中间件、工具函数 |
| **统一返回** | 统一响应格式 {code, data, message} |

---

### 场景4: 数据处理并行（多个数据文件）

当需要处理多个数据文件或数据集时，可以并行处理提高效率。

#### 适用场景

- 多个CSV/Excel文件数据导入
- 批量数据清洗和转换
- 大数据集分片处理
- 多表数据同步

#### 流程图

```
┌─────────────────┐
│   获取数据文件   │
│   (10个CSV)     │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐
│文件1││文件2││文件3│
│处理 ││处理 ││处理 │
└─────┘└─────┘└─────┘
    │    │    │
    └────┼────┘
         │
         ▼
┌─────────────────┐
│   结果合并汇总   │
└─────────────────┘
```

#### 执行方式

```javascript
// 假设有多个数据文件需要处理
const dataFiles = [
  { name: "users_2024_01.csv", size: "50MB", records: 100000 },
  { name: "users_2024_02.csv", size: "55MB", records: 110000 },
  { name: "users_2024_03.csv", size: "48MB", records: 98000 },
  { name: "orders_2024_q1.csv", size: "120MB", records: 50000 }
];

// 并行处理所有数据文件
const processTasks = dataFiles.map(file =>
  sessions_spawn({
    agentId: "data_bot",
    task: `数据处理: ${file.name}
    
文件信息:
- 大小: ${file.size}
- 记录数: ${file.records}

处理步骤:
1. 数据清洗（去重、空值处理）
2. 格式标准化（日期、货币格式）
3. 数据验证（字段完整性检查）
4. 导入数据库（MySQL）

输出:
- 处理报告（成功/失败数）
- 错误日志（如有）
- 导入数据库表名`,
    label: `数据处理-${file.name}`,
    runTimeoutSeconds: 600
  })
);

// 等待所有处理完成
const results = await Promise.all(processTasks);

// 汇总处理结果
const summary = results.map(r => ({
  file: r.fileName,
  status: r.status,
  processed: r.processedCount,
  failed: r.failedCount,
  time: r.duration
}));

console.table(summary);
```

#### 数据处理规范

| 规范 | 说明 |
|------|------|
| **独立性** | 每个文件处理不依赖其他文件 |
| **幂等性** | 重复执行不会产生冲突结果 |
| **错误隔离** | 单个文件失败不影响其他文件 |
| **结果汇总** | 统一收集所有处理结果 |

---

### 场景5: 文档编写并行

技术文档的不同章节可以由不同Agent并行编写。

#### 适用场景

- API文档 + 用户手册同时编写
- 多语言文档翻译
- 技术文档不同章节
- 文档 + 教程 + FAQ 并行

#### 流程图

```
┌─────────────────┐
│   文档大纲确定   │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐
│API  ││用户 ││部署  │
│文档 ││手册 ││指南 │
└─────┘└─────┘└─────┘
    │    │    │
    └────┼────┘
         │
         ▼
┌─────────────────┐
│   文档审核整合   │
└─────────────────┘
```

#### 执行方式

```javascript
// 定义文档任务
const docTasks = [
  {
    type: "API文档",
    content: "后端API接口文档",
    format: "Markdown + Swagger",
    sections: ["认证", "用户", "订单", "商品"]
  },
  {
    type: "用户手册", 
    content: "前端用户使用指南",
    format: "Markdown",
    sections: ["快速开始", "功能介绍", "常见问题"]
  },
  {
    type: "部署文档",
    content: "系统部署和运维指南", 
    format: "Markdown",
    sections: ["环境准备", "部署步骤", "监控配置"]
  }
];

// 并行编写文档
const writingTasks = docTasks.map(doc =>
  sessions_spawn({
    agentId: "codecraft",  // 或专门的文档Agent
    task: `编写文档: ${doc.type}
    
文档类型: ${doc.content}
格式要求: ${doc.format}
章节结构:
${doc.sections.map(s => `- ${s}`).join('\n')}

要求:
- 使用Markdown格式
- 包含代码示例
- 配图说明（如有必要）
- 术语表（专业术语解释）

输出:
- 完整文档文件
- 文档大纲
- 更新日志`,
    label: `文档-${doc.type}`,
    runTimeoutSeconds: 480
  })
);

// 等待所有文档完成
const docs = await Promise.all(writingTasks);

// 文档审核
sessions_spawn({
  agentId: "inspector",
  task: `审核文档:
${docs.map(d => `- ${d.title}: ${d.filePath}`).join('\n')}

审核要点:
- 格式规范性
- 内容完整性
- 术语一致性
- 代码示例正确性`,
  label: "文档审核"
});
```

#### 文档协作规范

| 规范 | 说明 |
|------|------|
| **大纲先行** | 先确定文档结构，再并行编写 |
| **术语统一** | 使用统一的术语表和命名规范 |
| **格式一致** | 统一使用Markdown格式和样式 |
| **交叉引用** | 文档间引用使用相对路径 |

---

### 场景6: 多环境部署并行

开发环境、测试环境、准生产环境可以同时部署。

#### 适用场景

- 开发环境 + 测试环境同时部署
- 多地区服务器同时部署
- 前端CDN + 后端服务同时发布
- 数据库迁移 + 应用部署并行

#### 流程图

```
┌─────────────────┐
│   代码审查通过   │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
┌─────┐┌─────┐┌─────┐
│开发 ││测试 ││准生产│
│环境 ││环境 ││环境  │
└─────┘└─────┘└─────┘
    │    │    │
    └────┼────┘
         │
         ▼
┌─────────────────┐
│   部署验证      │
└─────────────────┘
```

#### 执行方式

```javascript
// 定义部署环境
const deployEnvironments = [
  {
    name: "开发环境",
    host: "dev.example.com",
    type: "docker",
    database: "dev_db",
    steps: ["构建镜像", "推送仓库", "部署容器", "健康检查"]
  },
  {
    name: "测试环境",
    host: "test.example.com", 
    type: "docker",
    database: "test_db",
    steps: ["构建镜像", "推送仓库", "部署容器", "运行E2E测试"]
  },
  {
    name: "准生产环境",
    host: "staging.example.com",
    type: "docker",
    database: "staging_db",
    steps: ["构建镜像", "推送仓库", "部署容器", "性能测试"]
  }
];

// 并行部署所有环境
const deployTasks = deployEnvironments.map(env =>
  sessions_spawn({
    agentId: "deployer",
    task: `部署到${env.name}
    
目标主机: ${env.host}
部署方式: ${env.type}
数据库: ${env.database}

部署步骤:
${env.steps.map((s, i) => `${i+1}. ${s}`).join('\n')}

验证要求:
- 健康检查通过
- 基础功能正常
- 日志无错误

回滚策略:
- 保留上一版本镜像
- 一键回滚命令`,
    label: `部署-${env.name}`,
    runTimeoutSeconds: 600
  })
);

// 等待所有部署完成
const deployResults = await Promise.all(deployTasks);

// 部署结果汇总
const deploySummary = deployResults.map(r => ({
  environment: r.environment,
  status: r.status,
  version: r.version,
  deployTime: r.duration,
  healthCheck: r.healthStatus
}));

// 通知团队
message.send({
  action: "send",
  message: `🚀 多环境部署完成
${deploySummary.map(s => 
  `- ${s.environment}: ${s.status} (${s.deployTime})`
).join('\n')}`
});
```

#### 部署规范

| 规范 | 说明 |
|------|------|
| **环境隔离** | 各环境配置独立，互不干扰 |
| **版本一致** | 同一时间部署相同版本代码 |
| **健康检查** | 每个环境部署后必须健康检查 |
| **快速回滚** | 保留旧版本，支持快速回滚 |

---

## 并行任务判断原则

### 核心原则

> **只要任务之间没有冲突（资源冲突、数据依赖、执行顺序依赖），就可以并行执行。**

### 可并行的特征 ✅

| 特征 | 说明 | 示例 |
|------|------|------|
| **独立数据** | 操作不同的数据文件/表 | 处理多个CSV文件 |
| **独立资源** | 使用不同的服务器/环境 | 多环境部署 |
| **无顺序依赖** | 任务A不需要等待任务B完成 | 前后端并行开发 |
| **模块独立** | 功能模块之间低耦合 | 前端组件并行开发 |
| **只读共享** | 共享只读资源，不修改 | 基于同一设计稿开发 |

### 不可并行的特征 ❌

| 特征 | 说明 | 示例 |
|------|------|------|
| **数据依赖** | 任务B需要任务A的输出数据 | 先建表后插入数据 |
| **资源冲突** | 同时写入同一文件/数据库 | 同时修改同一配置文件 |
| **顺序依赖** | 必须按A→B→C顺序执行 | 编译→打包→部署 |
| **互斥操作** | 操作互斥资源 | 同时部署到同一服务器 |

### 快速判断流程

```
新任务
  │
  ├──→ 是否依赖其他任务的数据？ ──→ 是 → 串行执行（等待依赖完成）
  │                             └──→ 否 → 继续判断
  │
  ├──→ 是否与其他任务争夺同一资源？ ──→ 是 → 串行执行（避免冲突）
  │                                 └──→ 否 → 继续判断
  │
  ├──→ 是否需要其他任务先完成？ ──→ 是 → 串行执行（顺序依赖）
  │                             └──→ 否 → 继续判断
  │
  └──→ 可以并行执行 ✅
       使用 Promise.all() 或 sessions_spawn() 并行启动
```

---

### 并行开发最佳实践

#### 1. 任务拆分原则

```
大任务 → 分析依赖 → 拆分为独立子任务 → 并行执行 → 集成验证
```

| 拆分维度 | 适用场景 | 示例 |
|----------|----------|------|
| **前后端** | 全栈功能开发 | 后端API + 前端页面 |
| **模块** | 大型前端项目 | Header + Sidebar + Content |
| **API** | 后端服务开发 | 用户API + 订单API + 商品API |
| **功能** | 复杂功能开发 | 数据导入 + 数据处理 + 报表生成 |

#### 2. 依赖管理

```javascript
// 有依赖的任务：先A后B
const taskA = await sessions_spawn({ agentId: "codecraft", task: "开发基础组件" });
// 等待A完成
await taskA;
// 再启动B
const taskB = await sessions_spawn({ agentId: "codecraft", task: "开发依赖组件" });

// 无依赖的任务：并行执行
const [taskC, taskD, taskE] = await Promise.all([
  sessions_spawn({ agentId: "codecraft", task: "模块C" }),
  sessions_spawn({ agentId: "codecraft", task: "模块D" }),
  sessions_spawn({ agentId: "codecraft", task: "模块E" })
]);
```

#### 3. 进度追踪

```javascript
// 创建任务追踪表
const taskTracker = {
  tasks: [
    { id: "backend", name: "后端API", status: "running", progress: 0 },
    { id: "frontend", name: "前端页面", status: "running", progress: 0 },
    { id: "test", name: "测试", status: "pending", progress: 0 }
  ],
  
  updateProgress(id, progress) {
    const task = this.tasks.find(t => t.id === id);
    if (task) task.progress = progress;
  },
  
  getOverallProgress() {
    const total = this.tasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / this.tasks.length);
  }
};

// 定期报告进度
setInterval(() => {
  const progress = taskTracker.getOverallProgress();
  console.log(`总体进度: ${progress}%`);
}, 60000); // 每分钟报告
```

---

## 自动化触发协议

### 触发器类型

| 触发条件 | 触发动作 | 执行 Agent |
|----------|----------|------------|
| 代码提交到 develop | 自动运行测试 + 审查 | Guardian + Inspector |
| PR 创建 | 自动审查 + 评论 | Guardian + Inspector |
| 审查完成 | 自动通知开发者 | 项目经理/自动化 |
| 修复完成 | 自动重新审查 | Guardian + Inspector |
| 审查通过 | 自动合并（可选） | Deployer |

### 配置示例

```javascript
// 自动化审查触发器
const autoReviewTrigger = {
  on: "code_commit",
  branch: ["develop", "feature/*"],
  action: async (commitInfo) => {
    // 并行启动审查
    await Promise.all([
      triggerGuardianReview(commitInfo.files),
      triggerInspectorReview(commitInfo.files)
    ]);
    
    // 汇总并通知
    notifyDeveloper(commitInfo.author);
  }
};
```

---

## Agent 角色与职责

### 角色职责矩阵

| Agent | 主要职责 | 次要职责 | 协作对象 | 响应时间 |
|-------|---------|---------|---------|---------|
| **@zhou_codecraft_bot** | 前后端开发 | 技术文档、单元测试 | 我, Guardian, Inspector, Tester | 5min |
| **@zhou_data_bot** | 数据分析 | 数据核对、报表生成 | 我, 码匠 | 5min |
| **@guardian** | 安全审查 | 合规检查、漏洞扫描 | 码匠, 我 | 即时 |
| **@inspector** | 代码质量审查 | 最佳实践、性能优化 | 码匠, 我 | 即时 |
| **@tester** | 自动化测试 | 测试用例生成、覆盖率分析 | 码匠, 我 | 5min |
| **@小d (我)** | 项目管理 | 任务协调、进度跟踪 | 所有Agent | 即时 |

### 协作原则

1. **自动化优先**
   - 能自动通知的，不手动转发
   - 能并行执行的，不串行等待
   - 能自动触发的，不人工干预

2. **信息透明**
   - 所有Agent共享 MEMORY.md 作为知识库
   - 审查结果自动同步给相关方
   - 阻塞问题立即升级

3. **响应承诺**
   - 收到任务 5 分钟内必须回应
   - 20 分钟无响应主动提醒
   - 阻塞问题立即升级处理

---

## 最佳实践

### Do's ✅

- 使用 `sessions_spawn` 启动独立任务
- 并行执行独立任务（如 Guardian + Inspector）
- 审查完成后**自动**通知开发者
- 所有通知抄送项目经理（我）
- 使用标准格式输出审查结果

### Don'ts ❌

- 串行执行可并行的任务
- 等待项目经理中转通知
- 审查后不主动通知
- 使用非标准名称联系 Agent
- 收到任务不回应直接开始工作

---

## 故障处理

### 审查 Agent 无响应

```javascript
// 20分钟后 Guardian 无响应
if (guardianTimeout > 20min) {
  // 1. 提醒 Guardian
  sessions_send({
    sessionKey: "agent:guardian:main",
    message: "[提醒] 审查任务已超时 20 分钟，请更新进度"
  });
  
  // 2. 通知项目经理
  message.send({
    action: "send",
    message: "@guardian 审查任务阻塞，请检查"
  });
}
```

### 开发者无响应

```javascript
// 通知码匠后 20 分钟无响应
if (codecraftNoResponse > 20min) {
  message.send({
    action: "send",
    message: "@zhou_codecraft_bot 审查结果已发出 20 分钟，请确认收到"
  });
}
```

### 测试Agent无响应

```javascript
// Tester 测试任务超时
if (testerTimeout > 30min) {
  sessions_send({
    sessionKey: "agent:tester:main",
    message: "[提醒] 测试任务已超时 30 分钟，请更新进度"
  });
}
```

---

## 使用示例汇总

### 示例1：完整开发流程（前后端并行）

```javascript
// 项目经理（我）分配任务
async function startFeatureDevelopment(featureName) {
  // 1. 并行启动前后端开发
  const [backend, frontend] = await Promise.all([
    sessions_spawn({
      agentId: "codecraft",
      task: `开发后端: ${featureName}`,
      label: `${featureName}-后端`
    }),
    sessions_spawn({
      agentId: "codecraft", 
      task: `开发前端: ${featureName}`,
      label: `${featureName}-前端`
    })
  ]);
  
  // 2. 并行审查
  const [guardian, inspector] = await Promise.all([
    sessions_spawn({
      agentId: "guardian",
      task: `安全审查: ${featureName}`,
      label: `${featureName}-安全审查`
    }),
    sessions_spawn({
      agentId: "inspector",
      task: `质量审查: ${featureName}`,
      label: `${featureName}-质量审查`
    })
  ]);
  
  // 3. 测试
  const tester = await sessions_spawn({
    agentId: "tester",
    task: `测试: ${featureName}`,
    label: `${featureName}-测试`
  });
  
  // 4. 汇总报告
  return {
    feature: featureName,
    backend: backend.status,
    frontend: frontend.status,
    security: guardian.summary,
    quality: inspector.summary,
    test: tester.summary
  };
}
```

### 示例2：多模块并行开发

```javascript
// 启动多个模块并行开发
async function developModules(modules) {
  const tasks = modules.map(m => 
    sessions_spawn({
      agentId: "codecraft",
      task: `开发模块: ${m.name}\n需求: ${m.requirements}`,
      label: `模块-${m.name}`
    })
  );
  
  // 等待所有模块完成
  const results = await Promise.all(tasks);
  
  // 启动集成测试
  return sessions_spawn({
    agentId: "tester",
    task: `集成测试: ${modules.map(m => m.name).join(', ')}`,
    label: "集成测试"
  });
}
```

---

**创建时间**: 2026-03-03
**更新时间**: 2026-03-03  
**适用范围**: 所有 Agent
**更新频率**: 根据团队实践定期更新

**重要**: 所有 Agent 必须熟悉此技能文档中的工作流和协议。

### 示例3：数据处理并行（多个文件）

```javascript
// 多个数据文件并行处理
const dataFiles = ["users_01.csv", "users_02.csv", "orders_q1.csv"];

const processTasks = dataFiles.map(file =>
  sessions_spawn({
    agentId: "data_bot",
    task: `数据处理: ${file}`,
    label: `数据处理-${file}`
  })
);

// 等待所有处理完成
await Promise.all(processTasks);
console.log("所有数据处理完成");
```

### 示例4：文档编写并行

```javascript
// 多种文档并行编写
const docTypes = ["API文档", "用户手册", "部署指南"];

const docTasks = docTypes.map(type =>
  sessions_spawn({
    agentId: "codecraft",
    task: `编写文档: ${type}`,
    label: `文档-${type}`
  })
);

// 等待所有文档完成
await Promise.all(docTasks);
// 然后统一审核
sessions_spawn({
  agentId: "inspector",
  task: "审核所有文档",
  label: "文档审核"
});
```

### 示例5：多环境部署并行

```javascript
// 多个环境并行部署
const environments = ["开发环境", "测试环境", "准生产环境"];

const deployTasks = environments.map(env =>
  sessions_spawn({
    agentId: "deployer",
    task: `部署到${env}`,
    label: `部署-${env}`
  })
);

// 等待所有部署完成
const results = await Promise.all(deployTasks);
console.log("多环境部署完成:", results.map(r => `${r.environment}: ${r.status}`));
```

### 示例6：复杂项目全流程并行

```javascript
// 完整项目开发流程（最大化并行）
async function developProject(projectName) {
  // Phase 1: 设计与文档（并行）
  const [apiDesign, uiDesign] = await Promise.all([
    sessions_spawn({ agentId: "codecraft", task: "API设计", label: "API设计" }),
    sessions_spawn({ agentId: "codecraft", task: "UI设计", label: "UI设计" })
  ]);
  
  // Phase 2: 前后端开发（并行）
  const [backend, frontend] = await Promise.all([
    sessions_spawn({ agentId: "codecraft", task: "后端开发", label: "后端开发" }),
    sessions_spawn({ agentId: "codecraft", task: "前端开发", label: "前端开发" })
  ]);
  
  // Phase 3: 审查（并行）
  const [guardian, inspector] = await Promise.all([
    sessions_spawn({ agentId: "guardian", task: "安全审查", label: "安全审查" }),
    sessions_spawn({ agentId: "inspector", task: "质量审查", label: "质量审查" })
  ]);
  
  // Phase 4: 测试与部署（并行）
  const [tester, deployer] = await Promise.all([
    sessions_spawn({ agentId: "tester", task: "功能测试", label: "功能测试" }),
    sessions_spawn({ agentId: "deployer", task: "部署到测试环境", label: "部署" })
  ]);
  
  return {
    project: projectName,
    phases: {
      design: { api: apiDesign.status, ui: uiDesign.status },
      development: { backend: backend.status, frontend: frontend.status },
      review: { security: guardian.summary, quality: inspector.summary },
      release: { test: tester.summary, deploy: deployer.status }
    }
  };
}
```
