# 票根优惠模块后端方案 - 架构预审报告

**项目**: 茂名文旅票根优惠模块后端开发  
**评审人**: Inspector 🧪  
**评审日期**: 2026-03-05

---

## 📋 评审概览

| 评审项 | 状态 | 备注 |
|--------|------|------|
| 整体架构设计 | ✅ 良好 | Express/Fastify + Prisma 组合合理 |
| API设计规范 | ⚠️ 需改进 | 缺少版本控制 |
| 模块划分 | ✅ 良好 | 职责清晰 |
| 错误处理 | ⚠️ 需补充 | 文档未详述 |
| 性能优化 | ✅ 基本达标 | 需关注细节 |
| 可维护性 | ✅ 良好 | 结构清晰 |

---

## ✅ 架构亮点

### 1. 技术栈选择合理
- **Express/Fastify + Prisma**: 轻量级框架 + ORM，适合中小型项目
- **Redis 缓存**: 用于核销码和会话，性能有保障
- **JWT 认证**: 标准化的认证方案

### 2. 模块划分清晰
```
routes/
├── ticket/     # 客户端票根
├── merchant/   # 商户端
└── admin/      # 管理端
```
按业务域划分，职责明确。

### 3. 数据库设计规范
- Prisma Schema 结构完整
- 索引设计合理（userId, status, categoryId 等）
- 关系定义正确（1:N, N:N）

---

## ⚠️ 需要改进的问题

### 🔴 高优先级

#### 1. API 版本控制缺失

**问题**: 所有接口使用 `/api/` 前缀，无版本控制

**建议**:
```javascript
// 推荐: URL 版本控制
GET /api/v1/ticket/types
GET /api/v1/merchant/verify/check

// 或使用 Header 版本控制
Accept: application/vnd.app.v1+json
```

**影响**: 未来 API 升级会导致兼容性问题

---

#### 2. 距离计算实现未详述

**需求**: 商户列表按距离排序

**当前方案**: 有 `longitude`/`latitude` 字段

**缺失**: 
- 后端距离计算公式未说明
- 分页时如何处理距离排序

**建议**:
```sql
-- MySQL 方式: 使用 ST_Distance_Sphere 计算距离
SELECT *, 
  (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
   cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
   sin(radians(latitude)))) AS distance 
FROM Merchant 
WHERE categoryId = ?
ORDER BY distance ASC
LIMIT 20 OFFSET 0;
```

---

#### 3. OCR+AI 异步处理方案

**问题**: OCR 识别是异步的，但 API 设计为同步响应

**当前设计**:
```javascript
POST /api/ticket/recognize
// 返回识别结果（同步）
```

**问题**: OCR/AI 识别耗时可能较长（2-10秒）

**建议**:
```javascript
// 方案1: 异步队列
POST /api/ticket/recognize
Response: { code: 202, data: { taskId: "xxx" }, message: "识别中" }

GET /api/ticket/recognize/:taskId
Response: { code: 200, data: { status, result } }

// 方案2: WebSocket 推送
// 识别完成后主动推送结果
```

---

#### 4. 核销码高并发唯一性

**需求**: 高并发下保证 8 位核销码不重复

**当前设计**:
```javascript
// 8位随机码（去除易混淆字符）
code = randomString(8)
```

**问题**: 随机码有碰撞风险，高并发时可能冲突

**建议**:
```javascript
// 方案1: Redis INCR + 格式化
const code = `VC${Date.now().toString(36).toUpperCase()}${counter.incr('verify_code_seq')}`
// 结果: VC1ABCDEF12

// 方案2: 预生成码池
// 预生成 10000 个码，使用 Redis Set 管理

// 方案3: 数据库唯一约束 + 重试
try {
  code = await prisma.verificationCode.create({ data: { code, ... } })
} catch (e) {
  if (e.code === 'P2002') {
    // 冲突，重试生成
    return generateCode()
  }
}
```

---

### 🟡 中优先级

#### 5. 响应数据格式统一性

**文档声明**: `{ code, data, message }`

**建议**: 标准化响应格式
```typescript
interface ApiResponse<T> {
  code: number      // 200=成功, 400=参数错误, 401=未授权, 500=服务器错误
  data: T          // 业务数据
  message: string  // 提示信息
  timestamp?: number // 时间戳
}
```

---

#### 6. 分页参数设计

**当前设计**: `page`, `pageSize` 或 `limit`, `offset`

**建议**: 统一使用 cursor 或 offset 分页
```typescript
// 方案1: Offset 分页（简单）
GET /api/ticket/merchants?page=1&pageSize=20

// 方案2: Cursor 分页（高效，推荐）
GET /api/ticket/merchants?cursor=xxx&limit=20
// 返回: { data: [], nextCursor: "yyy", hasMore: true }
```

---

#### 7. 错误处理和日志

**缺失**: 文档未详述错误处理策略

**建议**:
```javascript
// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ code: 400, message: '参数验证失败' })
  }
  
  if (err.name === 'PrismaError') {
    return res.status(500).json({ code: 500, message: '数据库错误' })
  }
  
  res.status(500).json({ code: 500, message: '服务器内部错误' })
})
```

---

#### 8. N+1 查询风险

**位置**: 商户列表查询

**问题**: 
```javascript
// 可能产生 N+1 查询
const merchants = await prisma.merchant.findMany()
merchants.forEach(m => {
  const rules = await prisma.discountRule.findMany({ where: { merchantId: m.id } })
})
```

**建议**: 使用 Prisma `include` 预加载
```javascript
const merchants = await prisma.merchant.findMany({
  include: {
    discountRules: true,
    category: true,
    images: true
  }
})
```

---

### 🟢 低优先级

#### 9. 缺少 API 文档工具

**建议**: 使用 Swagger/OpenAPI 或 tsoa 生成文档

#### 10. 缺少 Rate Limiting 配置细节

**提及**: "API限流: 敏感接口限制请求频率"

**建议**: 明确限流配置
```javascript
// 示例: express-rate-limit
app.use('/api/merchant/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5 // 最多5次
}))
```

---

## 📊 API 清单核对

| 端点 | 接口数 | 是否完整 | 备注 |
|------|--------|----------|------|
| 客户端H5 | 9 | ✅ | 满足需求 |
| 商户端H5 | 10 | ✅ | 满足需求 |
| PC管理端 | 10 | ✅ | 满足需求 |
| **总计** | **29** | ✅ | |

---

## 🎯 优化建议汇总

### 立即处理
1. ✅ 添加 API 版本控制 (v1)
2. ✅ 实现距离计算（MySQL ST_Distance_Sphere）
3. ✅ OCR 异步处理（任务队列/WebSocket）
4. ✅ 核销码高并发方案（Redis INCR 或预生成码池）

### 后续优化
5. 统一响应格式
6. 标准化分页参数
7. 添加全局错误处理
8. 解决 N+1 查询问题
9. 添加 Rate Limiting
10. 生成 API 文档

---

## ✅ 评审结论

| 评审项 | 状态 |
|--------|------|
| 整体架构 | ✅ 通过 |
| API 设计 | ⚠️ 需改进 |
| 性能优化 | ⚠️ 需改进 |
| 安全考虑 | ✅ 基本达标 |
| 可维护性 | ✅ 良好 |

**综合评估**: ⚠️ **有条件通过** ✅

**建议**: 修复上述 4 个高优先级问题后，可进入开发阶段

---

*评审人: Inspector 🧪*  
*日期: 2026-03-05*
