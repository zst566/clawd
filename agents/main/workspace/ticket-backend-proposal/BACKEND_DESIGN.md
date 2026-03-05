# 茂名文旅 - 票根优惠模块后端方案

**项目名称**: 茂名文旅票根优惠模块后端开发
**版本**: v1.0
**创建日期**: 2026-03-05
**评审状态**: 🟡 待评审

---

## 1. 项目概述

票根优惠模块是一个连接文旅消费者与本地商户的优惠核销平台。用户上传交通/娱乐票根（电影票、火车票、飞机票等），系统识别后可在合作商户享受折扣优惠。

**已完成功能**: 客户端H5前端（7个页面，使用模拟数据）
**当前阶段**: 后端API开发方案评审

---

## 2. 业务模块划分

| 模块 | 说明 | 核心功能 |
|------|------|----------|
| **票根管理** | 票根上传、识别、管理 | OCR识别、票根类型管理、有效期控制 |
| **商户管理** | 商户信息、员工、优惠规则 | 商户CRUD、员工角色、折扣规则配置 |
| **核销核心** | 核销码生成、验证、确认 | 限时核销码、扫码核销、撤销机制 |
| **数据统计** | 统计报表、数据分析 | 今日/本周/本月统计、趋势分析 |
| **内容管理** | Banner、资讯文章 | 轮播图管理、热点资讯 |

---

## 3. 完整API清单

### 3.1 客户端H5接口（游客端）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取票根类型 | GET | `/api/ticket/types` | 支持的票根类型列表 |
| 识别票根 | POST | `/api/ticket/recognize` | 上传图片，OCR+AI识别 |
| 获取商户分类 | GET | `/api/ticket/categories` | 商户分类列表 |
| 获取商户列表 | GET | `/api/ticket/merchants` | 支持筛选、搜索、分页 |
| 获取商户详情 | GET | `/api/ticket/merchant/:id` | 商户详细信息 |
| 生成核销码 | POST | `/api/ticket/verify-code` | 生成5分钟有效期的核销码 |
| 获取Banner | GET | `/api/ticket/banners` | 首页轮播图 |
| 获取热点资讯 | GET | `/api/ticket/news` | 本地热点文章 |
| 获取我的票根 | GET | `/api/ticket/my-tickets` | 当前用户的票根列表 |

### 3.2 商户端H5接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 商户登录 | POST | `/api/merchant/auth/login` | 店长/店员登录 |
| 获取工作台数据 | GET | `/api/merchant/dashboard` | 今日概览、快捷入口 |
| 核销码验证 | POST | `/api/merchant/verify/check` | 扫码/输入验证核销码 |
| 确认核销 | POST | `/api/merchant/verify/confirm` | 确认并完成核销 |
| 撤销核销 | POST | `/api/merchant/verify/revoke` | 10分钟内可撤销 |
| 核销记录列表 | GET | `/api/merchant/records` | 分页查询核销记录 |
| 核销记录详情 | GET | `/api/merchant/records/:id` | 单条记录详情 |
| 数据统计 | GET | `/api/merchant/statistics` | 今日/本周/本月数据 |

### 3.3 PC管理端接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 管理员登录 | POST | `/api/admin/auth/login` | 管理员登录 |
| 仪表盘数据 | GET | `/api/admin/dashboard` | 系统概览数据 |
| 商户CRUD | CRUD | `/api/admin/merchants` | 商户增删改查 |
| 员工管理 | CRUD | `/api/admin/merchants/:id/staff` | 员工增删改查 |
| 票根管理 | GET/PATCH | `/api/admin/tickets` | 票根列表、OCR审核 |
| 核销记录 | GET | `/api/admin/verifications` | 全平台核销记录 |
| 数据报表 | GET | `/api/admin/reports` | 多维度统计报表 |
| 系统配置 | GET/PUT | `/api/admin/config/*` | 优惠规则、Banner配置 |

---

## 4. 数据库设计（Prisma Schema）

### 4.1 核心实体关系图

```
User (1) ───< (N) Ticket (N) >─── (1) TicketType
                          │
                          │ (1:N)
                          ▼
                    Verification (N) >─── (1) Merchant
                          │                    │
                          │                    │ (1:N)
                          ▼                    ▼
                    Revocation          MerchantStaff
                          │                    │
                          └────── (N:1) ───────┘

Merchant (1) ───< (N) DiscountRule
             ───< (N) MerchantImage
```

### 4.2 完整Schema定义

```prisma
// ==================== 用户相关 ====================
model User {
  id          String   @id @default(uuid())
  openid      String   @unique
  phone       String?
  nickname    String?
  avatar      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tickets     Ticket[]
}

// ==================== 票根模块 ====================
model TicketType {
  id          String   @id @default(uuid())
  code        String   @unique // movie, train, flight...
  name        String
  icon        String
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  tickets     Ticket[]
}

model Ticket {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  typeId          String
  type            TicketType @relation(fields: [typeId], references: [id])
  name            String   // 票根名称
  imageUrl        String   // 票根图片URL
  ocrResult       Json?    // 原始OCR数据
  ocrStatus       String   @default("pending") // pending/success/failed/manual
  aiRecognized    Boolean  @default(false)
  status          String   @default("valid") // valid/used/expired
  validStart      DateTime?
  validEnd        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  verifications   Verification[]
  
  @@index([userId])
  @@index([status])
}

// ==================== 商户模块 ====================
model MerchantCategory {
  id          String   @id @default(uuid())
  code        String   @unique // catering, scenic...
  name        String
  icon        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  merchants   Merchant[]
}

model Merchant {
  id              String   @id @default(uuid())
  name            String
  logo            String?
  coverImage      String?
  description     String?
  address         String
  phone           String
  longitude       Float?
  latitude        Float?
  businessHours   String?
  categoryId      String
  category        MerchantCategory @relation(fields: [categoryId], references: [id])
  status          String   @default("active")
  isRecommended   Boolean  @default(false)
  rating          Float    @default(5.0)
  supportTicketTypes String[] // ["movie", "train"]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  staff           MerchantStaff[]
  discountRules   DiscountRule[]
  images          MerchantImage[]
  verifications   Verification[]
  
  @@index([categoryId])
  @@index([status])
}

model MerchantImage {
  id          String   @id @default(uuid())
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  imageUrl    String
  sortOrder   Int      @default(0)
}

model MerchantStaff {
  id          String   @id @default(uuid())
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  username    String   @unique
  password    String   // bcrypt
  role        String   @default("staff") // manager/staff
  name        String?
  phone       String?
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  verifications   Verification[]
  revocations     Revocation[]
}

// ==================== 优惠规则 ====================
model DiscountRule {
  id              String   @id @default(uuid())
  merchantId      String
  merchant        Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  type            String   // percentage/fixed/buy_one_get_one
  value           Float    // 折扣率或金额
  minAmount       Float?   // 最低消费
  maxDiscount     Float?   // 最高优惠
  title           String   // 展示标题
  description     String   // 详细说明
  applyTicketTypes String[] // 适用票根类型
  isActive        Boolean  @default(true)
}

// ==================== 核销模块 ====================
model VerificationCode {
  id              String   @id @default(uuid())
  code            String   @unique // 8位核销码
  qrCodeUrl       String?
  ticketId        String
  merchantId      String
  amount          Float
  discountAmount  Float
  actualPay       Float
  createdAt       DateTime @default(now())
  expireAt        DateTime // 5分钟后
  status          String   @default("pending") // pending/verified/expired
  verification    Verification?
}

model Verification {
  id              String   @id @default(uuid())
  codeId          String   @unique
  code            VerificationCode @relation(fields: [codeId], references: [id])
  ticketId        String
  ticket          Ticket   @relation(fields: [ticketId], references: [id])
  merchantId      String
  merchant        Merchant @relation(fields: [merchantId], references: [id])
  staffId         String
  staff           MerchantStaff @relation(fields: [staffId], references: [id])
  amount          Float
  discountAmount  Float
  actualPay       Float
  verifiedAt      DateTime @default(now())
  revocation      Revocation?
  
  @@index([merchantId, verifiedAt])
}

model Revocation {
  id              String   @id @default(uuid())
  verificationId  String   @unique
  verification    Verification @relation(fields: [verificationId], references: [id])
  staffId         String
  staff           MerchantStaff @relation(fields: [staffId], references: [id])
  reason          String?
  createdAt       DateTime @default(now())
}

// ==================== 内容管理 ====================
model Banner {
  id          String   @id @default(uuid())
  imageUrl    String
  title       String?
  link        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  position    String   @default("ticket_home")
  createdAt   DateTime @default(now())
}

model Article {
  id          String   @id @default(uuid())
  title       String
  coverImage  String?
  content     String?  @db.Text
  summary     String?
  category    String   @default("news")
  isHot       Boolean  @default(false)
  viewCount   Int      @default(0)
  isActive    Boolean  @default(true)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
}

// ==================== 管理员 ====================
model Admin {
  id          String   @id @default(uuid())
  username    String   @unique
  password    String
  name        String?
  role        String   @default("admin")
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
}
```

---

## 5. 关键业务逻辑

### 5.1 核销码生成
- 8位随机码（去除易混淆字符：0, O, 1, I, L）
- 有效期：5分钟
- 状态流转：pending → verified/expired

### 5.2 优惠计算
```javascript
// 百分比折扣
if (type === 'percentage') discount = amount * (1 - value);
// 固定金额
else if (type === 'fixed') discount = value;
// 买一送一
else if (type === 'buy_one_get_one') discount = amount / 2;

// 限制条件
discount = Math.min(discount, maxDiscount || Infinity);
discount = Math.min(discount, amount);
```

### 5.3 核销撤销限制
- 仅核销后10分钟内可撤销
- 需要记录撤销原因
- 撤销后票根状态恢复为valid

### 5.4 票根有效期
- 火车票/飞机票/高速票：通常7天内有效
- 电影票：当天有效
- 演出赛事：演出日期当天有效

---

## 6. 技术栈

- **框架**: Node.js + Express/Fastify
- **ORM**: Prisma
- **数据库**: MySQL 8.0
- **缓存**: Redis（核销码、会话）
- **文件存储**: 阿里云OSS
- **AI/OCR**: 待定（通义千问/百度OCR等）
- **认证**: JWT

---

## 7. 安全考虑

1. **API限流**: 敏感接口（登录、核销）限制请求频率
2. **核销码安全**: 8位随机码，5分钟过期，单次使用
3. **权限控制**: JWT Token + Role-Based Access Control
4. **数据校验**: 严格的输入验证和参数校验
5. **图片安全**: 上传文件类型、大小限制，OSS私有bucket

---

## 8. 项目结构

```
apps/backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/           # 配置文件
│   ├── routes/
│   │   ├── ticket/       # 客户端票根路由
│   │   ├── merchant/     # 商户端路由
│   │   └── admin/        # 管理端路由
│   ├── services/         # 业务逻辑
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   └── ai/               # AI/OCR相关
├── tests/                # 测试文件
└── docker-compose.yml
```

---

## 9. 开发计划

| 阶段 | 任务 | 工期 | 负责人 |
|------|------|------|--------|
| 1 | 数据库设计与迁移 | 2天 | 码匠 |
| 2 | 基础架构搭建 | 2天 | 码匠 |
| 3 | 客户端API开发 | 4天 | 码匠 |
| 4 | 商户端API开发 | 3天 | 码匠 |
| 5 | 管理端API开发 | 3天 | 码匠 |
| 6 | 测试与联调 | 2天 | 码匠 |
| **合计** | | **15个工作日** | |

---

**评审人员**:
- @zhou_data_bot - 数据库设计评审
- @guardian - 安全预审
- @inspector - 架构预审

**评审通过后分配给**: @zhou_codecraft_bot (码匠)

---

*文档版本: v1.0 | 最后更新: 2026-03-05*
