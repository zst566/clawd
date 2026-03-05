# 茂名文旅 - 票根优惠模块后端方案（修订版）

**项目名称**: 茂名文旅票根优惠模块后端开发  
**版本**: v1.1（评审后修订版）  
**创建日期**: 2026-03-05  
**评审状态**: ✅ 已评审并修订  

---

## 1. 项目概述

票根优惠模块是一个连接文旅消费者与本地商户的优惠核销平台。用户上传交通/娱乐票根（电影票、火车票、飞机票等），系统识别后可在合作商户享受折扣优惠。

**已完成功能**: 客户端H5前端（7个页面，使用模拟数据）  
**当前阶段**: 后端API开发（方案已评审修订）

---

## 2. 评审修订记录

### 2.1 高优先级问题修复清单

| # | 原问题 | 修复方案 | 状态 |
|---|--------|----------|------|
| 1 | 手机号/openid明文存储 | 添加应用层AES加密 | ✅ 已修复 |
| 2 | 核销码算法未明确 | 明确使用 `crypto.randomInt` | ✅ 已修复 |
| 3 | 撤销核销权限不足 | 增加权限验证逻辑 | ✅ 已修复 |
| 4 | API版本控制缺失 | 添加 `/api/v1/` 前缀 | ✅ 已修复 |
| 5 | 距离计算未详述 | 添加 MySQL 距离计算方案 | ✅ 已修复 |
| 6 | OCR异步处理缺失 | 添加任务队列+轮询方案 | ✅ 已修复 |
| 7 | 核销码高并发碰撞 | 添加 Redis 预生成码池方案 | ✅ 已修复 |
| 8 | 撤销时间限制漏洞 | 添加后端时间+并发控制 | ✅ 已修复 |

---

## 3. 完整API清单（v1版本）

### 3.1 客户端H5接口（游客端）

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取票根类型 | GET | `/api/v1/ticket/types` | 支持的票根类型列表 |
| 识别票根 | POST | `/api/v1/ticket/recognize` | 提交识别任务 |
| 查询识别结果 | GET | `/api/v1/ticket/recognize/:taskId` | 轮询识别结果 |
| 获取商户分类 | GET | `/api/v1/ticket/categories` | 商户分类列表 |
| 获取商户列表 | GET | `/api/v1/ticket/merchants` | 支持筛选、搜索、分页、距离排序 |
| 获取商户详情 | GET | `/api/v1/ticket/merchant/:id` | 商户详细信息 |
| 生成核销码 | POST | `/api/v1/ticket/verify-code` | 生成5分钟有效期的核销码 |
| 获取Banner | GET | `/api/v1/ticket/banners` | 首页轮播图 |
| 获取热点资讯 | GET | `/api/v1/ticket/news` | 本地热点文章 |
| 获取我的票根 | GET | `/api/v1/ticket/my-tickets` | 当前用户的票根列表 |

### 3.2 商户端H5接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 商户登录 | POST | `/api/v1/merchant/auth/login` | 店长/店员登录 |
| 获取工作台数据 | GET | `/api/v1/merchant/dashboard` | 今日概览、快捷入口 |
| 核销码验证 | POST | `/api/v1/merchant/verify/check` | 扫码/输入验证核销码 |
| 确认核销 | POST | `/api/v1/merchant/verify/confirm` | 确认并完成核销 |
| 撤销核销 | POST | `/api/v1/merchant/verify/revoke` | 10分钟内可撤销（权限验证） |
| 核销记录列表 | GET | `/api/v1/merchant/records` | 分页查询核销记录 |
| 核销记录详情 | GET | `/api/v1/merchant/records/:id` | 单条记录详情 |
| 数据统计 | GET | `/api/v1/merchant/statistics` | 今日/本周/本月数据 |

### 3.3 PC管理端接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 管理员登录 | POST | `/api/v1/admin/auth/login` | 管理员登录 |
| 仪表盘数据 | GET | `/api/v1/admin/dashboard` | 系统概览数据 |
| 商户CRUD | CRUD | `/api/v1/admin/merchants` | 商户增删改查 |
| 员工管理 | CRUD | `/api/v1/admin/merchants/:id/staff` | 员工增删改查 |
| 票根管理 | GET/PATCH | `/api/v1/admin/tickets` | 票根列表、OCR审核 |
| 核销记录 | GET | `/api/v1/admin/verifications` | 全平台核销记录 |
| 数据报表 | GET | `/api/v1/admin/reports` | 多维度统计报表 |
| 系统配置 | GET/PUT | `/api/v1/admin/config/*` | 优惠规则、Banner配置 |

---

## 4. 数据库设计（Prisma Schema - 修订版）

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

### 4.2 完整Schema定义（已修复敏感数据存储）

```prisma
// ==================== 加密工具配置 ====================
// 敏感字段使用应用层AES加密存储
// 加密密钥通过环境变量注入: ENCRYPTION_KEY

// ==================== 用户相关 ====================
model User {
  id          String   @id @default(uuid())
  openid      String   @unique // AES加密存储
  phone       String?  // AES加密存储，格式: "enc:xxx"
  phoneLast4  String?  // 明文存储最后4位，用于显示
  nickname    String?
  avatar      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tickets     Ticket[]
  
  @@index([openid])
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
  ocrStatus       String   @default("pending") // pending/processing/success/failed/manual
  ocrTaskId       String?  // OCR任务ID，用于异步查询
  aiRecognized    Boolean  @default(false)
  status          String   @default("valid") // valid/used/expired
  validStart      DateTime?
  validEnd        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  verifications   Verification[]
  
  @@index([userId, status])
  @@index([typeId, status])
  @@index([validEnd])  // 过期清理索引
  @@index([ocrTaskId]) // 异步查询索引
}

// ==================== OCR任务队列 ====================
model OcrTask {
  id          String   @id @default(uuid())
  ticketId    String?  // 关联的票根ID
  imageUrl    String   // 图片URL
  status      String   @default("pending") // pending/processing/success/failed
  result      Json?    // OCR识别结果
  error       String?  // 错误信息
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status, createdAt])
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
  phone           String   // 商户联系电话（公开）
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
  
  @@index([categoryId, status])
  @@index([isRecommended, status])
  @@index([latitude, longitude]) // 地理位置索引（需手动添加空间索引）
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
  password    String   // bcrypt加密，cost=12
  role        String   @default("staff") // manager(店长)/staff(店员)
  name        String?
  phone       String?  // 员工手机号（AES加密）
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  verifications   Verification[]
  revocations     Revocation[]
  
  @@index([merchantId, isActive])
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

// ==================== 核销码池（高并发方案） ====================
model VerificationCodePool {
  id          String   @id @default(uuid())
  code        String   @unique // 预生成的8位核销码
  status      String   @default("available") // available/used/expired
  createdAt   DateTime @default(now())
  
  @@index([status])
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
  
  @@index([code, status])     // 核销验证高频查询
  @@index([expireAt])         // 过期清理
  @@index([ticketId])         // 票根关联查询
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
  @@index([staffId, verifiedAt])
}

model Revocation {
  id              String   @id @default(uuid())
  verificationId  String   @unique
  verification    Verification @relation(fields: [verificationId], references: [id])
  staffId         String   // 执行撤销的员工
  staff           MerchantStaff @relation(fields: [staffId], references: [id])
  reason          String?
  createdAt       DateTime @default(now()) // 使用后端服务器时间
  
  @@index([staffId])
  @@index([createdAt])
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
  updatedAt   DateTime @updatedAt
}

// ==================== 管理员 ====================
model Admin {
  id          String   @id @default(uuid())
  username    String   @unique
  password    String   // bcrypt加密，cost=12
  name        String?
  role        String   @default("admin") // admin/super_admin
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
}
```

### 4.3 数据库索引优化说明

```sql
-- 手动添加MySQL空间索引（Prisma原生不支持）
ALTER TABLE Merchant ADD SPATIAL INDEX idx_location (latitude, longitude);

-- 距离查询示例（Haversine公式）
SELECT *, 
  (6371 * acos(
    cos(radians(?)) * cos(radians(latitude)) * 
    cos(radians(longitude) - radians(?)) + 
    sin(radians(?)) * sin(radians(latitude))
  )) AS distance 
FROM Merchant 
WHERE categoryId = ?
ORDER BY distance ASC
LIMIT 20 OFFSET 0;
```

---

## 5. 关键业务逻辑（修订版）

### 5.1 核销码生成（高并发安全方案）

```javascript
const crypto = require('crypto');
const redis = require('../config/redis');

/**
 * 方案1: Redis INCR + 格式化（推荐）
 * 优点：严格递增，无碰撞
 * 缺点：格式不是纯随机
 */
async function generateVerifyCodeV1() {
  const seq = await redis.incr('verify_code:sequence');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${timestamp}${seq.toString(36).toUpperCase().padStart(4, '0')}`;
  // 示例: L8N3P9F2001A
}

/**
 * 方案2: 预生成码池
 * 优点：纯随机，性能高
 * 缺点：需要维护码池
 */
async function generateVerifyCodeV2() {
  // 从Redis Set中弹出一个可用码
  const code = await redis.spop('verify_code:pool:available');
  if (!code) {
    throw new Error('核销码池已空，请联系管理员');
  }
  return code;
}

/**
 * 方案3: 加密安全随机数（兜底方案）
 * 优点：实现简单
 * 缺点：有极低碰撞概率
 */
function generateVerifyCodeV3() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  const code = [];
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code.push(chars[randomIndex]);
  }
  return code.join('');
}

// 预生成码池（每小时补充）
async function replenishCodePool() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes = new Set();
  
  while (codes.size < 1000) {
    const code = [];
    for (let i = 0; i < 8; i++) {
      code.push(chars[crypto.randomInt(0, chars.length)]);
    }
    codes.add(code.join(''));
  }
  
  await redis.sadd('verify_code:pool:available', ...codes);
}
```

### 5.2 优惠计算

```javascript
function calculateDiscount(amount, rule) {
  let discount = 0;
  
  switch(rule.type) {
    case 'percentage':
      discount = amount * (1 - rule.value);
      break;
    case 'fixed':
      discount = rule.value;
      break;
    case 'buy_one_get_one':
      discount = amount / 2;
      break;
  }
  
  // 应用限制条件
  if (rule.maxDiscount) {
    discount = Math.min(discount, rule.maxDiscount);
  }
  discount = Math.min(discount, amount); // 不能超过消费金额
  
  return {
    discountAmount: Math.round(discount * 100) / 100,
    actualPay: Math.round((amount - discount) * 100) / 100
  };
}
```

### 5.3 撤销核销（权限验证增强版）

```javascript
async function revokeVerification(revocationData, staff) {
  const { verificationId, reason } = revocationData;
  
  // 1. 查询核销记录
  const verification = await prisma.verification.findUnique({
    where: { id: verificationId },
    include: { revocation: true }
  });
  
  if (!verification) {
    throw new Error('核销记录不存在');
  }
  
  // 2. 检查是否已被撤销
  if (verification.revocation) {
    throw new Error('该核销记录已被撤销');
  }
  
  // 3. 权限验证：必须是同商户员工
  if (verification.merchantId !== staff.merchantId) {
    throw new Error('无权限撤销此核销记录');
  }
  
  // 4. 时间限制：使用后端服务器时间，10分钟内
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (verification.verifiedAt < tenMinutesAgo) {
    throw new Error('已超过10分钟撤销时限');
  }
  
  // 5. 并发控制：使用数据库事务
  await prisma.$transaction(async (tx) => {
    // 创建撤销记录
    await tx.revocation.create({
      data: {
        verificationId,
        staffId: staff.id,
        reason
      }
    });
    
    // 更新核销码状态（如需要）
    await tx.verificationCode.update({
      where: { id: verification.codeId },
      data: { status: 'revoked' }
    });
    
    // 恢复票根状态
    await tx.ticket.update({
      where: { id: verification.ticketId },
      data: { status: 'valid' }
    });
  });
  
  return { success: true };
}
```

### 5.4 OCR异步识别流程

```javascript
// 步骤1: 提交识别任务
async function submitRecognizeTask(imageBase64, type) {
  const taskId = generateTaskId();
  
  // 创建OCR任务
  await prisma.ocrTask.create({
    data: {
      id: taskId,
      imageUrl: await uploadToOSS(imageBase64),
      status: 'pending'
    }
  });
  
  // 发送异步任务到队列
  await taskQueue.add('ocr_recognize', {
    taskId,
    imageUrl,
    type
  });
  
  return { taskId, status: 'pending' };
}

// 步骤2: 轮询查询结果
async function getRecognizeResult(taskId) {
  const task = await prisma.ocrTask.findUnique({
    where: { id: taskId }
  });
  
  if (!task) {
    throw new Error('任务不存在');
  }
  
  if (task.status === 'success') {
    return {
      status: 'success',
      data: task.result
    };
  }
  
  if (task.status === 'failed') {
    return {
      status: 'failed',
      error: task.error
    };
  }
  
  return { status: 'processing' };
}

// 步骤3: 后台Worker处理
async function processOcrTask(task) {
  try {
    // 调用OCR服务
    const ocrResult = await ocrService.recognize(task.imageUrl);
    
    // 调用AI辅助识别
    const aiResult = await aiService.classify(ocrResult);
    
    // 更新任务结果
    await prisma.ocrTask.update({
      where: { id: task.id },
      data: {
        status: 'success',
        result: {
          type: aiResult.type,
          name: ocrResult.name,
          date: ocrResult.date,
          confidence: aiResult.confidence
        }
      }
    });
  } catch (error) {
    await prisma.ocrTask.update({
      where: { id: task.id },
      data: {
        status: 'failed',
        error: error.message
      }
    });
  }
}
```

---

## 6. 敏感数据加密方案

### 6.1 AES加密工具

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32字节
const IV_LENGTH = 16; // 初始化向量长度

function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 存储格式: iv:encrypted
  return `enc:${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.startsWith('enc:')) {
    return encryptedText; // 明文直接返回
  }
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Prisma 中间件自动加密/解密
prisma.$use(async (params, next) => {
  const sensitiveFields = ['phone', 'openid'];
  
  // 写入前加密
  if (params.action === 'create' || params.action === 'update') {
    for (const field of sensitiveFields) {
      if (params.args.data[field]) {
        params.args.data[field] = encrypt(params.args.data[field]);
      }
    }
  }
  
  const result = await next(params);
  
  // 读取后解密
  if (result && params.action.startsWith('find')) {
    const decryptResult = (item) => {
      for (const field of sensitiveFields) {
        if (item[field]) {
          item[field] = decrypt(item[field]);
        }
      }
      return item;
    };
    
    if (Array.isArray(result)) {
      result.forEach(decryptResult);
    } else {
      decryptResult(result);
    }
  }
  
  return result;
});
```

---

## 7. 技术栈

- **框架**: Node.js + Express/Fastify
- **ORM**: Prisma
- **数据库**: MySQL 8.0（空间索引支持地理位置查询）
- **缓存**: Redis（核销码池、会话、限流）
- **任务队列**: Bull/Agenda（OCR异步任务）
- **文件存储**: 阿里云OSS
- **AI/OCR**: 通义千问/百度OCR（待定）
- **认证**: JWT + bcrypt
- **加密**: AES-256-CBC（敏感数据）

---

## 8. 安全加固清单

| # | 安全措施 | 实现方式 | 状态 |
|---|----------|----------|------|
| 1 | 手机号加密 | AES-256-CBC | ✅ |
| 2 | openid加密 | AES-256-CBC | ✅ |
| 3 | 密码加密 | bcrypt cost=12 | ✅ |
| 4 | 核销码生成 | crypto.randomInt | ✅ |
| 5 | API限流 | express-rate-limit + Redis | ⏳ |
| 6 | JWT安全 | 2小时过期，HttpOnly Cookie | ⏳ |
| 7 | 敏感接口签名 | HMAC-SHA256 | ⏳ |
| 8 | 文件上传限制 | 5MB，jpg/png/webp | ⏳ |
| 9 | SQL注入防护 | Prisma参数化查询 | ✅ |
| 10 | XSS防护 | 输入校验，输出转义 | ⏳ |

---

## 9. 项目结构

```
apps/backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js   # Prisma客户端
│   │   ├── redis.js      # Redis连接
│   │   └── encryption.js # AES加密工具
│   ├── routes/
│   │   ├── v1/           # API v1版本
│   │   │   ├── ticket/   # 客户端票根路由
│   │   │   ├── merchant/ # 商户端路由
│   │   │   └── admin/    # 管理端路由
│   ├── services/         # 业务逻辑
│   │   ├── ocrService.js
│   │   ├── verifyCodeService.js
│   │   └── discountService.js
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中间件
│   │   ├── auth.js       # JWT认证
│   │   ├── rateLimit.js  # 限流
│   │   └── errorHandler.js
│   ├── utils/            # 工具函数
│   ├── workers/          # 后台任务
│   │   └── ocrWorker.js  # OCR处理Worker
│   └── ai/               # AI/OCR相关
├── tests/                # 测试文件
└── docker-compose.yml
```

---

## 10. 开发计划

| 阶段 | 任务 | 工期 | 依赖 |
|------|------|------|------|
| 1 | 数据库设计与迁移 | 2天 | - |
| 2 | 基础架构搭建（加密、限流、错误处理） | 2天 | 阶段1 |
| 3 | 客户端API开发（含OCR异步） | 4天 | 阶段2 |
| 4 | 商户端API开发 | 3天 | 阶段3 |
| 5 | 管理端API开发 | 3天 | 阶段4 |
| 6 | 测试与联调 | 2天 | 阶段5 |
| **合计** | | **16个工作日** | |

---

## 11. 评审记录

| 评审人 | 角色 | 评分 | 结论 |
|--------|------|------|------|
| @zhou_data_bot | 数据库评审 | 8/10 | ✅ 通过（索引需优化） |
| @guardian | 安全预审 | 有条件 | ✅ 修复后通过 |
| @inspector | 架构预审 | 有条件 | ✅ 修复后通过 |

**修订内容**:
- ✅ 添加敏感数据AES加密
- ✅ 明确核销码生成算法
- ✅ 增加撤销权限验证
- ✅ API添加v1版本控制
- ✅ 添加MySQL距离计算方案
- ✅ OCR异步处理方案
- ✅ 高并发核销码方案
- ✅ 撤销时间并发控制

---

**分配给**: @zhou_codecraft_bot (码匠)  
**建议启动时间**: 用户确认后立即启动

---

*文档版本: v1.1（评审修订版）*  
*最后更新: 2026-03-05*
