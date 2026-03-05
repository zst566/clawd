# MEMORY.md - 长期记忆

## Agent 联系方式 (重要)

> 🚨 **重要变更 (2026-03-05)**: **已废除 Telegram @ 方式联系 Agent**。
> 
> 所有任务分配和正式沟通必须使用以下工具：
> - ✅ `sessions_spawn` - 分配独立任务（首选）
> - ✅ `sessions_send` - 日常沟通、询问进度
> 
> 表格中的 "@名称" 仅用于识别，不作为联系方式。

### 核心团队成员 (7个)

| Agent | 正式名称 | Session Key (内部) | 用途 |
|-------|----------|-------------------|------|
| **我** | 小d / main | **润德群**: `agent:main:telegram:group:-1003531397239`<br>**文旅群**: `agent:main:telegram:group:-5157029269` | 项目经理 |
| **数据助理** | @zhou_data_bot | **润德群**: `agent:data_bot:telegram:group:-1003531397239`<br>**文旅群**: `agent:data_bot:telegram:group:-5157029269` | 数据分析 |
| **码匠** | @码匠 / codecraft | **润德群**: `agent:codecraft:telegram:group:-1003531397239`<br>**文旅群**: `agent:codecraft:telegram:group:-5157029269` | 前后端开发 |
| **安全审查** | @guardian | `agent:guardian:main` | 安全扫描 |
| **质量审查** | @inspector | `agent:inspector:main` | 代码审查 |
| **部署专员** | @deployer | `agent:deployer:main` | 部署运维 |
| **测试专员** | @tester | `agent:tester:main` | 测试验证 |

> ⚠️ **重要**: 不同群组使用不同的 Session Key 后缀！<br>
> - 润德教育群: `-1003531397239`<br>
> - 茂名文旅群: `-5157029269`<br>
> - 商场促销群: `-5039017209`<br>
> - dv项目群: `-5099457733`<br>
> - 福禄英语群: `-5187551770`<br>
> - 鹿状元群: `-5130812403`

### 联系规则与技能文档

**Agent 跨群组 Session 建立方法**（2026-03-05 更新）：

当 Agent 在新群组没有 Session 时，使用以下方法自动建立（无需人工干预）：

```javascript
// 步骤1: 通过 Agent 的 main session 让它自己去目标群组发消息
sessions_send({
  sessionKey: "agent:codecraft:main",
  message: "请在目标群组（如茂名文旅群）发送消息建立 session"
})

// 步骤2: 等待 Agent 发送消息后，使用新 session 分配任务
sessions_spawn({
  agentId: "codecraft",
  sessionKey: "agent:codecraft:telegram:group:-5157029269",
  task: "开发任务..."
})
```

**必读技能文档**：
1. `SKILL_AGENT_NAMES.md` - Agent 名称使用规范
2. `SKILL_CONTACT_AGENT.md` - **联系 Agent 完整方法指南（重要！）**

**联系方法（3种，已移除 Telegram @ 方式）**：

| 方法 | 工具 | 场景 | 优先级 |
|------|------|------|--------|
| **Sessions Spawn** | `sessions_spawn` | 分配独立任务、需要隔离执行 | ⭐ 首选 |
| **Sessions Send** | `sessions_send` | 日常沟通、询问进度、获取结果 | ⭐ 次选 |
| 用户中间人 | 人工转发 | 以上都失败时 | 最后手段 |

> ⚠️ **重要更新 (2026-03-05)**: 已删除"Telegram 群组 @"方式。所有任务分配必须使用 `sessions_spawn` 或 `sessions_send` 工具。

**配置要求**：
- `sessions_spawn` 需要在 `agents.list[].subagents.allowAgents` 中配置允许的 Agent ID
- 当前配置：`allowAgents: ["*"]` 允许所有已定义的 Agent
- 默认超时：`runTimeoutSeconds: 300`, `archiveAfterMinutes: 60`

**响应规则**：
- 收到任务 → 5分钟内主动回应 → 后处理 → 完成后汇报

---

### Agent 角色与职责矩阵

| Agent | 主要职责 | 次要职责 | 协作对象 | 响应时间 |
|-------|---------|---------|---------|---------|
| **@zhou_codecraft_bot** (码匠) | 前后端开发 | 技术文档、单元测试 | 我, Guardian, Inspector | 5分钟内 |
| **@zhou_data_bot** (数据助理) | 数据分析 | 数据核对、报表生成 | 我, 码匠 | 5分钟内 |
| **@guardian** (安全审查) | 安全审查 | 合规检查、漏洞扫描 | 码匠, 我 | 即时 |
| **@inspector** (质量审查) | 代码质量审查 | 最佳实践、性能优化 | 码匠, 我 | 即时 |
| **@deployer** (部署专员) | 部署运维 | 环境配置、CI/CD | 码匠, 我 | 即时 |
| **@tester** (测试专员) | 测试验证 | E2E测试、Bug验证 | 码匠, 我 | 5分钟内 |
| **@小d** (我/项目经理) | 项目管理 | 任务协调、进度跟踪 | 所有Agent | 即时 |

### 自动化工作流

**并行审查流程**：
```
代码提交 → Guardian审查(并行) ┐
         → Inspector审查(并行) ┘
                          ↓
                    审查结果汇总
                          ↓
              自动通知码匠修复
```

**关键原则**：
1. **自动化优先** - 审查完成后自动通知，无需项目经理中转
2. **并行执行** - Guardian 和 Inspector 同时审查，节省时间
3. **信息透明** - 所有结果抄送项目经理

### 示例（已更新，移除 Telegram @ 方式）

```javascript
// ✅ 日常沟通：询问进度
sessions_send({
  sessionKey: "agent:data_bot:telegram:group:-1003531397239",
  message: "上次的数据分析完成了吗？",
  timeoutSeconds: 60
})

// ✅ 分配独立任务：让 data_bot 执行分析（推荐方式）
sessions_spawn({
  agentId: "data_bot",
  task: "分析这个CSV文件并生成报告",
  label: "数据分析任务"
})

// ❌ 错误：使用 Telegram @ 分配任务（已废弃）
// message.send({
//   action: "send",
//   message: "@zhou_data_bot 请检查代码"  // 不要使用！
// })

// ❌ 错误：使用 main session（不会发送到群组）
sessions_send({
  sessionKey: "agent:codecraft:main",  // ❌ 错
  message: "..."
})
```

---

## 项目目录

### 茂名交投文旅平台 (别名: 文旅、信宜文旅) ✅ 已完成
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台/`
- **描述**: 包含PC管理后台、后端API、小程序端、移动端H5
- **别名关键词**: 茂名、文旅、信宜、maoming
- **项目规则文档**: `~/clawd/project-rules/茂名文旅-项目规则.md`
- **技术栈**: Vue3, Element Plus, Node.js, Prisma, MySQL
- **项目状态**: 🎉 **已完成并交付** (2026-03-02)
  - ✅ 小程序注册备案
  - ✅ 环境配置（服务器+数据库）
  - ✅ 前端开发
  - ✅ 后端API开发
  - ✅ 图片上传功能
  - ✅ PC端页面联调
  - ✅ 功能测试与Bug修复
  - ✅ 容器打包与预上线测试
  - ✅ 2月14日正式上线
- **当前阶段**: 提交交付文档并关闭项目

---

### 润德教育 - 收入摊销系统 (别名: 润德、RunDeEdu)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/RunDeEdu/`
- **描述**: 收入摊销数据核对、财务报表分析系统
- **别名关键词**: 润德、RunDeEdu、润德教育
- **项目规则文档**: `~/clawd/project-rules/润德教育-项目规则.md` ⭐ **处理此项目前必读**
- **主要目录**:
  - `src/` - 核心源代码 (1.3G)
  - `revenue-recognition-management/` - 收入摊销管理模块 (660M)
  - `docs/` - 文档目录 (350M)
  - `scripts/` - 自动化脚本
  - `tests/` - 测试文件
  - `db/` - 数据库相关
- **主要脚本**:
  - `batch_order_chain_query.py` - 批量订单链查询
  - `extract_full_order_chain.py` - 提取完整订单链
  - `order_comparison_statistics.py` - 订单对比统计
  - `update_course_scheduling.py` - 更新课程安排
- **用途**: 财务数据核对、收入摊销计算、订单链分析

---

### 商场促销项目 (别名: Golden Coast Mall)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall`
- **描述**: 商场促销管理系统
- **别名关键词**: 商场促销、Golden Coast Mall、Golden_Coast_Mall

---

### 福禄英语预约平台 (别名: 福禄英语、fulu)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/山西-福禄英语`
- **描述**: 英语培训预约管理平台
- **别名关键词**: 福禄、福禄英语、fulu、fulu-english、预约平台
- **群组**: 福禄英语@预约平台 (Telegram id:-5187551770)
  - 群组讨论默认项目: 福禄英语

---

### 鹿状元 (别名: lzy)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/鹿状元`
- **描述**: 鹿状元教育培训管理系统（收据系统）
- **别名关键词**: 鹿状元、lzy
- **项目规则文档**: `~/clawd/project-rules/鹿状元-项目规则.md` ⭐ **处理此项目前必读**
- **生产环境**: https://xiaolu.lantel.net
- **准生产环境**: https://xiaolu-test.lantel.net
- **技术栈**: Vue3 + Tailwind CSS + Node.js + Express + MySQL

---

### DV项目 (别名: dv_mall)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/dv_mall/`
- **描述**: DV商城项目
- **别名关键词**: dv、dv_mall、DV项目
- **技术栈**: Node.js, Vue3, MySQL
- **开发环境MySQL**:
  - 端口: `13306`
  - Root用户: `root` / `root123456`
  - 普通用户: `dev_user` / `dev_password`
  - 数据库: `lzy_Dev`
- **主要服务端口**:
  - 前端(PC管理端): `8081`
  - 后端API: `9099`
  - Nginx: `80` (HTTP), `1212`

---

### 商场促销项目 (别名: Golden Coast Mall)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall`
- **描述**: 商场促销管理系统
- **别名关键词**: 商场促销、Golden Coast Mall、Golden_Coast_Mall
- **群组**: 商场促销项目群 (Telegram id:-5039017209)
  - 群组讨论默认项目: 商场促销项目
- **工作记录**: `WORKLOG.md` - 记录项目操作和变更

#### 🚀 启动命令

**启动开发环境：**
```bash
cd /Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall
./start-dev.sh
```

**停止开发环境：**
```bash
./stop-dev.sh
```

**服务访问地址（启动后）：**
| 服务 | 地址 | 容器端口 |
|------|------|---------|
| 移动端 H5 | http://localhost:18080 | 1300 |
| PC 管理端 | http://localhost:1314/pc-admin/ | 4000 |
| 后端 API | http://localhost:18080/api | 5001 |
| MySQL | localhost:13306 | 3306 |

**端口占用说明：**
- mall-vue-dev: 1300（原3000，与润德项目3001避免混淆）
- mall-pc-dev: 4000（保持不变）
- mall-node-dev: 5001（保持不变）
- mall-nginx-dev: 18080/1314/8443（PC端口从1213改为1314，避免与茂名文旅1212混淆）
- mysql_db: 13306（原3306，与茂名文旅3306避免混淆）

#### 📁 项目结构

| 目录/文件 | 说明 |
|----------|------|
| `mall-node/` | 后端API服务 (Node.js + TypeScript + Prisma + MySQL) |
| `mall-pc/` | PC管理后台 (Vue3 + TypeScript + Vite) |
| `mall-vue/` | 移动端H5 (Vue3 + TypeScript) |
| `mall-miniprogram/` | 微信小程序端 |
| `mall-nginx/` | Nginx配置目录 |
| `gz-shopping-mall/` | 广州商场相关配置 |
| `scripts/` | 自动化脚本 |
| `docs/` | 文档目录 |
| `tests/` | 测试文件 |
| `migrations/` | 数据库迁移文件 |
| `shared/` | 共享代码/类型定义 |
| `docker-compose.dev.yml` | Docker开发环境配置 |
| `start-dev.sh` | 启动开发环境脚本 |
| `stop-dev.sh` | 停止开发环境脚本 |

#### 🔧 技术栈

| 模块 | 技术栈 |
|------|--------|
| 后端 (mall-node) | Node.js + TypeScript + Prisma ORM + MySQL + Redis |
| PC管理端 (mall-pc) | Vue3 + TypeScript + Vite + Element Plus |
| 移动端H5 (mall-vue) | Vue3 + TypeScript + Vite |
| 小程序 (mall-miniprogram) | 微信原生开发 |

#### 📦 主要依赖

- **UI框架**: Vue3, Element Plus
- **ORM**: Prisma
- **构建工具**: Vite
- **测试**: Playwright, Vitest, Jest
- **代码规范**: ESLint, TypeScript, Husky

---

## 🔀 项目切换规则

> **重要**：为了避免项目之间搞混，请遵守以下规则

### 📦 Docker 开发环境规范

**MySQL 容器统一配置**:
- **用户名**: `root`
- **密码**: `root123456`
- **说明**: 所有项目的本地开发环境 MySQL 容器必须统一使用此账号密码，便于记忆和管理

---

### 规则1：说话带项目前缀
| 格式 | 例子 |
|------|------|
| `[文旅]` | `[文旅] 帮我看看景点管理页面` |
| `[润德]` | `[润德] 运行一下12月财务核对脚本` |

### 规则2：没说项目 → 我会确认
- 如果你没有带项目前缀，我会问清楚再执行
- 确认方式："你说的xx是茂名文旅还是润德教育？"

### 规则3：当前进行中项目
- 每次会话开始，我会记录"当前进行中的项目"到 TASKS.md
- 默认延续上一个项目，但每次说话最好带上前缀

### 规则4：群组默认项目
- **茂名文旅讨论群 (Telegram id:-5157029269)** → 默认项目: 文旅
  - 群组名称明确指向文旅项目，无需每次带前缀
  - 如群内讨论转向其他项目，需明确说明

---

## 📱 群组默认项目配置
| 群组名称 | 群组ID | 默认项目 |
|---------|--------|---------|
| 茂名文旅讨论群 | -5157029269 | 文旅 |
| 润德教育讨论群 | -1003531397239 | 润德教育 |
| 商场促销项目群 | -5039017209 | 商场促销项目 |
| dv项目运维群 | -5099457733 | DV项目 |
| 福禄英语预约平台 | -5187551770 | 福禄英语 |
| **鹿状元（深圳）讨论群** | **-5130812403** | **鹿状元** |

---

> **说明**：
> - **润德教育讨论群**：群内讨论的所有需求和工作均默认针对润德教育项目，无需每次带前缀
> - **茂名文旅讨论群**：群内讨论的所有需求和工作均默认针对文旅项目，无需每次带前缀
> - **商场促销项目群**：群内讨论的所有需求和工作均默认针对商场促销项目，无需每次带前缀
> - **dv项目运维群**：群内讨论的所有需求和工作均默认针对DV项目，无需每次带前缀
> - **福禄英语预约平台**：群内讨论的所有需求和工作均默认针对福禄英语项目，无需每次带前缀
> - 群组讨论内容如涉及其他项目，需明确说明

---

## 🚨 警告
> **禁止自动推断**：在没有明确项目信息的情况下，我**不能**自己猜是哪个项目，必须先确认！

### 茂名交投文旅平台 (别名: 文旅、信宜文旅)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台/`
- **描述**: 包含PC管理后台、后端API、小程序端、移动端H5
- **别名关键词**: 茂名、文旅、信宜、maoming
- **子目录**:
  - `apps/pc-admin` - PC端管理后台 (Vue3 + Element Plus)
  - `apps/backend` - 后端API (Node.js + Prisma + MySQL)
  - `apps/miniprogram` - 小程序端
  - `apps/mobile-h5` - 移动端H5
- **技术栈**: Vue3, Element Plus, Node.js, Prisma, MySQL
- **开发环境访问** (必须通过Nginx):
  - 移动端H5: `http://localhost`
  - PC管理端: `http://localhost/pc-admin/`
  - 后端API: `http://localhost/api/mobile`

#### 🚀 生产环境部署要素

**1. 小程序端环境检查**
- ✅ 确认域名已切换为正式环境域名
- 检查位置: `apps/miniprogram/` 相关配置文件
- 注意: 小程序需要重新提交审核才能更新域名配置

**2. 后端容器数据库连接检查**
- ✅ 确认数据库连接地址为生产库地址
- 生产数据库: 阿里云RDS域名（非固定IP）
- 数据库名: `wanda_platform`
- 部署前务必检查容器环境变量或配置文件中的数据库连接字符串

**📋 完整检查清单**: `docs/小程序生产环境部署清单.md`
- 每次部署前对照检查，避免遗漏
- 包含小程序配置、后端配置、第三方服务、发布后验证等完整流程

---

### 润德教育 - 收入摊销系统 (别名: 润德、RunDeEdu)
- **路径**: `/Volumes/SanDisk2T/dv-codeBase/RunDeEdu/`
- **描述**: 收入摊销数据核对、财务报表分析系统
- **别名关键词**: 润德、RunDeEdu、润德教育
- **主要目录**:
  - `src/` - 核心源代码 (1.3G)
  - `revenue-recognition-management/` - 收入摊销管理模块 (660M)
  - `docs/` - 文档目录 (350M)
  - `scripts/` - 自动化脚本
  - `tests/` - 测试文件
  - `db/` - 数据库相关
- **主要脚本**:
  - `batch_order_chain_query.py` - 批量订单链查询
  - `extract_full_order_chain.py` - 提取完整订单链
  - `order_comparison_statistics.py` - 订单对比统计
  - `update_course_scheduling.py` - 更新课程安排
- **用途**: 财务数据核对、收入摊销计算、订单链分析

## 数据库

### 茂名文旅平台数据库
- **生产环境**: 阿里云RDS域名（非固定IP）
- **数据库**: wanda_platform
- **说明**: 生产环境使用阿里云RDS域名连接

### 管理员账号
- **账号**: 13800000000
- **密码**: 123456
- **角色**: admin

## API端点

| 模块 | 端点 |
|------|------|
| 民宿 | `/api/pc/homestays` |
| 景点 | `/api/pc/attractions` |
| 资讯 | `/api/pc/articles` |

## 开发任务

### 2026-01-29
- [x] 民宿管理页面 - 修复前端字段名与后端返回不一致问题
  - coverImage → cover_image
  - roomCount → rooms?.length
  - sort → sort_order

---

## 🕐 时间处理规范（所有项目通用）

### 核心原则
- **时区标准**: 统一使用北京时间 (Asia/Shanghai, UTC+8)
- **后端职责**: 生成和存储时间全部为北京时间
- **前端职责**: 直接使用后端返回的时间，**禁止进行任何时区转换**
- **数据库**: 时间字段使用 `DATETIME` 类型，时区设为 `+8:00`

### 各端规范

#### 后端 (Node.js)
```javascript
// ✅ 正确：生成北京时间
const dayjs = require('dayjs')
const now = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')

// ✅ 正确：返回北京时间给前端
res.json({
  created_at: "2024-02-08 14:30:00"  // 北京时间
})
```

#### 前端 (Vue3)
```vue
<!-- ✅ 正确：直接使用后端返回的时间，不转换 -->
<span>{{ item.created_at }}</span>

<!-- ✅ 正确：仅做格式转换，不做时区转换 -->
<span>{{ dayjs(item.created_at).format('YYYY-MM-DD HH:mm') }}</span>
```

#### 数据库 (MySQL)
```sql
-- 时区配置
SET GLOBAL time_zone = '+8:00';

-- 字段类型
CREATE TABLE example (
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 存储北京时间
);
```

### ❌ 禁止事项
- 前端不要 `new Date(utcTime).toLocaleString(...)` 转换时间
- 后端不要返回 `toISOString()` 格式的 UTC 时间
- 不要在业务逻辑里进行时区加减操作

### 📄 详细文档
- 茂名文旅平台: `docs/TIMEZONE.md`
- 其他项目参照此规范执行

---

### ⚠️ 数据库时间写入注意事项

**问题描述**: 数据库容易把上传的原始时间自动转换为 UTC 时间，导致客户发起的拼车时间、订单创建时间等全部不正确。

**影响范围**:
- 客户拼车订单时间
- 订单创建时间
- 所有涉及时间的业务数据

**解决方案**:
1. **数据库层面**:
   ```sql
   -- 确保 MySQL 时区设置为北京时间
   SET GLOBAL time_zone = '+8:00';
   SET SESSION time_zone = '+8:00';
   ```

2. **后端代码层面**:
   ```javascript
   // 写入前确保是北京时间
   const dayjs = require('dayjs')
   const utc = require('dayjs/plugin/utc')
   const timezone = require('dayjs/plugin/timezone')
   dayjs.extend(utc)
   dayjs.extend(timezone)
   
   // 强制使用北京时间写入
   const beijingTime = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss')
   ```

3. **Prisma ORM 配置**:
   - 检查数据库连接配置中的时区设置
   - 确保连接字符串包含 `timezone=+8:00` 参数

**验证方法**:
- 写入数据后立即查询验证时间是否正确
- 对比数据库原始时间和业务显示时间
- 定期检查订单时间、创建时间等关键字段

---

## 🏠 家居设备维护记录

### 保险箱电池
- **更换日期**: 2026年1月31日
- **预计有效时间**: 约4个月
- **提醒时间**: 2026年5月15日左右开始提醒
- **确认更换后**: 记录新更换日期，重新计算4个月周期

---

## 💼 客户/项目记录（已放弃）

### 金蝶梁小姐小程序项目
- **时间**: 2026年1月31日
- **状态**: ❌ 已放弃
- **原因**: 客户预算太低，不值得投入
- **备注**: 后续如客户提高预算，可重新评估

---

## AI 模型配置

### Kimi Coding (当前默认)
- **提供商**: kimi-coding
- **Base URL**: https://api.kimi.com/coding
- **默认模型**: k2p5 (Kimi K2.5 Coding)
- **API Key**: `sk-kimi-697YICu32QZFOg0W9SNaNf24Uquf43qSMfhlYrVQ6XSnVdCqqNZ4ksyVL8BSpm8u`
- **更新日期**: 2026-02-06

### 其他可用模型
- **minimax/MiniMax-M2.1** - Minimax 模型
- **moonshot/kimi-k2.5** - Kimi K2.5 (Moonshot 国内)
- **moonshot/kimi-k2-0905-preview** - Kimi K2 (Moonshot 国内)
- **kimi-coding/kimi-k2-thinking** - Kimi K2 Thinking (Coding)

### 配置位置
- OpenClaw 配置: `~/.openclaw/openclaw.json`
- 详细记录: `memory/2026-02-06.md`

### 完成的工作

1. **12月三方平台流水核对**
   - 文件: `202512微信支付宝流水_核对结果.csv`
   - 数据量: 79,631行
   - 结果: 43,956条存在, 4条不存在, 35,671条为空

2. **11月三方平台流水核对**
   - 总订单编码: 57,751条 (去重后28,967)
   - 在sale_income_log中找到: 28,964
   - 未找到: 3条

3. **润德教育3.0数据清理** - ✅ 已修复
   - 问题: 9万+条重复记录

4. **订单平衡校验脚本**
   - 文件: `docs/查询sql/订单收入平衡校验.sql`
   - 用途: 检验收入摊销主表的跨月平衡

5. **跨月验证发现差异**
   - 2024-01差异: 375,162.54元
   - 原因: 36,181个订单在2023-12月有余额，但2024-01月没有记录
   - SQL文件: `docs/查询sql/2023年12月有余额2024年1月无记录订单.sql`

6. **僵尸订单问题发现** ⚠️
   - **问题**: 大量"僵尸订单"导致每月月末余额差异，无法通过月度订单平衡检查
   - **统计数据**:
     - 2022年之前有余额的僵尸订单: 6,102个
     - 2023年之前有余额的僵尸订单: 38,372个
     - 2024年之前有余额的僵尸订单: 248,211个
   - **检查脚本**: 详见 `workspace/rundeedu_scripts.md`

7. **后续行动** ✅
   - **时间**: 2026年2月1日
   - **行动**: 在润德教育研发群通知团队
   - **要求**: 检查僵尸订单产生原因，补上缺失的月份数据

---

## 2026年2月1日 - 新发现问题

### 财务数据与清洗库金额不一致 ⚠️
- **问题描述**: 润德教育的财务收入和退款数据与清洗库中的订单记录金额存在不一致
- **影响**: 部分订单的财务显示金额与清洗库中的实际金额不匹配
- **状态**: 尚未找到有效的核对方法
- **需要**: 进一步分析数据差异来源，设计针对性的核对方案
- **核对脚本**: 详见 `workspace/rundeedu_scripts.md`

---

## 2026年2月27日 - 润德教育 Dashboard 优化项目

### 项目概述
- **项目名称**: 润德教育 Dashboard 全栈优化
- **启动时间**: 2026-02-27 21:21
- **状态**: 🟡 进行中 (阶段0 - 方案评审)
- **负责人**: 我 (小d) - 项目经理

### 项目目标
1. **模块化**: 前端 Dashboard.vue (1540行) 拆分，后端 dashboardService.js (1310行) 拆分
2. **最佳实践**: Vue 3 + Node.js 规范
3. **性能优化**: 加载速度、缓存策略
4. **安全加固**: 参数校验、权限控制

### 团队配置
| 角色 | Agent | 状态 |
|------|-------|------|
| 项目经理 | 我 (小d) | ✅ 活跃 |
| 后端/前端开发 | @码匠 | ⏳ 等待阶段1 |
| 数据顾问 | @zhou_data_bot | ⏳ 评审中 |
| 安全审查 | @guardian | ⏳ 评审中 |
| 质量审查 | @inspector | ⏳ 评审中 |

### 项目文档位置
`~/clawd/agents/main/workspace/rundeedu-dashboard-optimization/`
- `DESIGN.md` - 架构设计
- `PROJECT_PLAN.md` - 完整项目流程
- `STATUS.md` - 实时状态跟踪
- `constants/dashboard.js` - 前端常量

### 定时检查机制
**Cron Job**: `dashboard-optimization-status-check`
- **频率**: 每5分钟（有明确任务时）
- **任务ID**: 4ee05bd0-364f-4102-ae5f-2b9423dd7f14
- **动作**: 检查各 Agent 任务状态、阻塞问题
- **输出**: 自动发送到润德教育讨论群
- **最佳方案**: ✅ **方案1+2组合** (强制read工具 + 提示)
  - 实施时间: 2026-02-27 22:52
  - 验证时间: 2026-02-27 22:54
  - 效果: **成功**，报告准确性100%

**持续激活策略** (2026-02-27 23:52 确立):
- 原则: 不换 Agent，不标记阻塞，持续联系直到响应
- 目标: 坚持"先修复问题，再下一步"
- 行动: 每5-10分钟尝试联系，不放弃

**测试记录**:
| 时间 | 方案 | 结果 |
|------|------|------|
| 22:44 | 原方案 | ❌ 滞后 |
| 22:49 | 原方案 | ❌ 滞后 |
| 22:54 | 方案1+2 | ✅ **成功** |

**提醒规则**:
- 每5分钟: 自动汇报状态
- 20分钟无响应: @ 提醒对应 Agent
- 40分钟无响应: 标记阻塞，升级处理

### 当前阶段任务
- [x] @zhou_data_bot: 数据模型评审 ✅ 已完成
- [x] @guardian: 安全预审 ✅ 已完成
- [x] @inspector: 架构预审 ✅ 已完成
- [x] @guardian: 后端代码安全审查 ✅ 已完成
- [x] @inspector: 后端代码质量审查 ✅ 已完成
- [ ] @码匠: Bug 修复 ⏳ 当前任务
- [ ] @码匠: 前端设计细化 ⏳ 当前任务

### 项目流程 (10阶段)
1. ✅ 方案评审 - 已完成
2. ✅ 后端设计细化 - 已完成
3. ✅ 后端实现 - @码匠 已完成
4. ✅ 后端代码审查 - @guardian/@inspector 已完成
5. 🔄 **前端设计细化 [当前]** - 等待开始
6. ⏳ 前端实现 (@码匠)
7. ⏳ 前端代码审查
8. ⏳ 测试设计
9. ⏳ 测试执行
10. ⏳ 最终验收
2. 后端设计细化
3. 后端实现 (@码匠)
4. 后端代码审查 (@guardian + @inspector)
5. 前端设计细化
6. 前端实现 (@码匠)
7. 前端代码审查 (@guardian + @inspector)
8. 测试设计
9. 测试执行
10. 最终验收

### 关键跟踪点
- **上次检查**: 2026-02-27 22:54 (方案1+2验证成功)
- **下次检查**: 每5分钟
- **阻塞问题**: 无
- **Agent 响应率**: 100% (4/4)

### 重要提醒
> **项目跟踪机制**: 本项目设置了定时 cron 检查，每小时自动检查 Agent 状态。即使 Agent 超时无响应，我也会记住任务并在适当时候跟进。项目状态保存在 `STATUS.md` 和本长期记忆中。
>
> **最佳实践已确定**: 方案1+2组合（强制read工具 + 提示）能有效解决缓存滞后问题。

---

## 2026年2月23日 - 预收款统计异步查询问题

### 问题描述 ⚠️
- **功能**: PC端预收款统计
- **问题**: 异步查询统计结果与同步查询结果不一致
- **实现方式**: 使用kimi进行异步查询
- **状态**: 待处理
- **记录时间**: 2026-02-23 01:03
- **处理时间**: 待定（晚点处理）

---

## 项目管理原则 (重要)

### 核心原则

**1. 先修复问题，再进行下一步**
- 发现的问题必须先修复，不能遗留
- 可以延迟后续工作，但不能把问题放在那里不管
- 一步一步走，总会走到终点

**2. 质量优先**
- 代码审查发现的问题必须修复后才能进入下一阶段
- 安全问题和性能问题优先处理

**3. 状态透明**
- 所有任务状态记录在 TASKS.md
- 定时检查确保信息同步
- 阻塞问题及时升级处理

**4. 沟通规则**
- 重要决策需要用户确认
- 阻塞问题立即汇报
- 里程碑完成后主动汇报

---

*更新时间: 2026-02-27*

---

## 🚨 运维故障排查记录

### DV项目 - 优惠配置/活动专场页面无法打开

**故障现象：**
- 优惠配置页面无法访问
- 活动专场页面无法访问

**排查步骤：**

1. **登录服务器**
   - 服务器：阿里云 CMS01

2. **检查 Node.js 服务状态**
   ```bash
   # 检查是否有 Node.js 进程在运行
   ps aux | grep node
   
   # 或者使用 pm2 查看（如果使用 pm2 管理）
   pm2 status
   ```

3. **启动服务（如未运行）**
   ```bash
   # 进入项目目录后启动
   npm start
   # 或
   node server.js
   # 或 pm2 方式
   pm2 start app.js
   ```

**备注：** 这两个页面对应的后端是 Node.js 服务，如果页面打不开通常是服务未启动导致。

---

## 🎯 任务执行规范 (重要 - 2026-03-05 确立)

### 任务复杂度评估与执行模式

**核心原则**：根据任务复杂度选择执行模式

| 维度 | 简单任务 | 复杂任务 |
|------|---------|---------|
| **执行者** | 我自己直接执行 | 多智能体协作 |
| **典型特征** | 单步骤、小数据量、快速完成 | 多步骤、大数据量、需要分析设计 |
| **响应时间** | 立即执行 | 先设计方案再分配 |
| **示例** | 查单条记录、修改单个文件、快速查询 | 数据分析、大型重构、多模块开发 |

### 简单任务标准（直接执行）

**适用条件**（满足以下任一）：
- ✅ 单步骤可完成
- ✅ 数据量小（< 1万条记录）
- ✅ 执行时间 < 30 秒
- ✅ 不需要复杂设计
- ✅ 无需跨 Agent 协调

**示例**：
- 查询单条数据库记录
- 修改单个配置文件
- 查看某个表的结构
- 简单的文件操作

### 复杂任务标准（多智能体协作）

**触发条件**（满足以下任一）：
- 🔴 大数据量（> 10万条记录）
- 🔴 需要多步骤分析
- 🔴 涉及多个模块/系统
- 🔴 需要专业领域知识（数据分析、安全审查等）
- 🔴 执行时间 > 1 分钟
- 🔴 需要导出报告或生成文件

**执行流程**：
```
1. 任务分析 → 评估复杂度
2. 方案设计 → 拆解子任务
3. 分配执行 → 调用合适 Agent
4. 结果汇总 → 整合输出
5. 交付验收 → 汇报用户
```

### Agent 专业分工矩阵

| Agent | 正式名称 | 专业领域 | 工作范围 | 响应时间 |
|-------|---------|---------|---------|---------|
| **@小d** | main | 项目管理、任务协调 | 任务分配、进度跟踪、跨Agent协调、方案设计 | 即时 |
| **@zhou_data_bot** | 数据助理 | 数据分析、统计 | 大数据查询、报表生成、数据核对、Excel导出 | 5分钟内 |
| **@zhou_codecraft_bot** | 码匠 | 前后端开发 | Vue3/Node.js开发、Bug修复、技术文档、单元测试 | 5分钟内 |
| **@guardian** | 安全审查 | 安全审计 | 安全扫描、漏洞检查、合规检查、依赖分析 | 即时 |
| **@inspector** | 质量审查 | 代码质量 | 代码审查、最佳实践、性能优化、架构建议 | 即时 |
| **@deployer** | 部署专员 | 部署运维 | 服务器部署、环境配置、CI/CD、容器编排 | 即时 |
| **@tester** | 测试专员 | 测试验证 | 功能测试、E2E测试、测试用例设计、Bug验证 | 5分钟内 |

### 任务分配决策树

```
任务到来
    ↓
是否需要数据分析/统计？
    ↓ 是 → sessions_spawn: data_bot
    ↓ 否
是否需要代码开发/修复？
    ↓ 是 → sessions_spawn: codecraft
    ↓ 否
是否需要安全审查？
    ↓ 是 → sessions_spawn: guardian
    ↓ 否
是否需要代码质量审查？
    ↓ 是 → sessions_spawn: inspector
    ↓ 否
是否需要部署/运维？
    ↓ 是 → sessions_spawn: deployer
    ↓ 否
是否需要测试验证？
    ↓ 是 → sessions_spawn: tester
    ↓ 否
复杂任务需协调？
    ↓ 是 → 我(小d)设计方案并分配
    ↓ 否 → 我直接执行
```

### 实际操作模板

**简单任务 - 直接执行**：
```
用户：查一下订单表的结构
我：直接执行查询 → 返回结果 ✅
```

**复杂任务 - 多智能体协作**：
```
用户：分析一下商品价格的差异
我：
  1. 评估复杂度：🔴 高（大数据量分析）
  2. 设计方案：
     - 步骤1: @zhou_data_bot 执行统计分析
     - 步骤2: @zhou_data_bot 导出异常数据
     - 步骤3: 我汇总汇报
  3. 分配任务 → 等待结果
  4. 汇总输出 ✅
```

---

## 📊 大数据查询处理经验 (2026-03-05)

### 问题场景
- **表**: `revenue_recognition_child`
- **数据量**: 522,709,877 条（5.2亿）
- **问题**: GROUP BY + COUNT(DISTINCT) 查询超时

### 失败尝试
1. ❌ 单次全表 GROUP BY → 超时
2. ❌ mysql.connector → DNS解析问题
3. ❌ 默认超时设置 → 连接hang住

### 成功方案 - 分批处理
```python
# 1. 获取ID范围
cursor.execute("SELECT MIN(goods_id), MAX(goods_id) FROM table WHERE ...")
min_id, max_id = cursor.fetchone()

# 2. 分批处理（每批1万条）
batch_size = 10000
for batch_start in range(min_id, max_id + 1, batch_size):
    batch_end = batch_start + batch_size - 1
    cursor.execute("""
        SELECT ... FROM table 
        WHERE goods_id BETWEEN %s AND %s
        GROUP BY ...
    """, (batch_start, batch_end))
    results.extend(cursor.fetchall())
```

### 关键要点
| 要点 | 说明 |
|------|------|
| **数据库连接** | 使用 PyMySQL，设置 connect/read/write_timeout |
| **批大小** | 1万条商品ID/批（平衡速度与内存） |
| **超时设置** | read_timeout=300秒（5分钟） |
| **结果合并** | 每批结果合并后统一排序导出 |

### Agent任务分配模板（大数据）
```javascript
sessions_spawn({
  agentId: "data_bot",
  label: "任务名-分批版",
  mode: "run",
  task: `
    1. 获取ID范围
    2. 分批处理（每批X条）
    3. 合并结果并导出
    4. 汇报统计信息
  `,
  timeoutSeconds: 1800  // 30分钟
})
```

---

### 项目管理原则更新

**5. 任务执行规范**（新增）
- 简单任务直接执行，复杂任务多智能体协作
- 先评估复杂度，再选择执行模式
- 专业任务分配给专业 Agent

**6. 大数据查询规范**（新增）
- 超过1亿条记录 → 必须分批处理
- GROUP BY大表 → 按主键范围分批
- 超时设置 → 至少300秒读超时
- 失败处理 → 自主设计分批方案，不依赖用户解决

---

*更新时间: 2026-03-05*
