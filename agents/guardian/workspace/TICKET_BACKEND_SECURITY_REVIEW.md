# 🔒 票根优惠模块后端方案 - 安全预审报告

**项目**: 茂名文旅票根优惠模块后端开发  
**版本**: v1.0  
**评审日期**: 2026-03-05  
**审查人**: Guardian 🛡️  
**状态**: 🟡 需要补充安全措施

---

## 📋 评审摘要

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| API安全设计 | 🟡 70/100 | 基础安全，需增强 |
| 认证授权机制 | 🟢 85/100 | JWT + RBAC 架构良好 |
| 核销码安全 | 🟢 80/100 | 8位随机码良好，需验证算法 |
| 敏感数据保护 | 🔴 50/100 | **严重不足** |
| 常见攻击防护 | 🟡 75/100 | 需补充具体实现 |
| 文件上传安全 | 🟢 80/100 | OSS方案合理 |

---

## 🔴 严重风险（必须修复）

### 1. 敏感数据明文存储

**问题**: 用户隐私数据存储不安全

| 字段 | 风险 | 建议 |
|------|------|------|
| `User.openid` | 🔴 微信openid明文存储 | 需加密存储或脱敏 |
| `User.phone` | 🔴 手机号明文 | **必须加密存储** |
| `MerchantStaff.password` | 🟡 使用bcrypt良好 | 但需增加盐值 |
| `Admin.password` | 🟡 使用bcrypt良好 | 需确认bcrypt配置 |

**修复建议**:
```javascript
// 手机号加密存储示例
model User {
  phone       String   // 加密后的手机号
  phoneLast4  String   // 仅存储最后4位用于显示
}

// 或使用应用层加密
const encryptedPhone = encrypt(phone, ENCRYPTION_KEY);
```

### 2. 核销码随机性不足

**问题**: 文档提到"8位随机码（去除易混淆字符）"，但未说明生成算法

**风险**: 如果使用 `Math.random()` 或可预测算法，可能被暴力破解

**修复建议**:
```javascript
// ✅ 使用加密安全的随机数生成
const crypto = require('crypto');
function generateVerifyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  const code = [];
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code.push(chars[randomIndex]);
  }
  return code.join('');
}
```

### 3. 撤销核销时间限制漏洞

**问题**: 10分钟限制存在绕过风险

| 风险点 | 描述 |
|--------|------|
| 时钟偏移 | 商户服务器时间可能与后端不一致 |
| 并发问题 | 同一核销码可能被多次撤销 |
| 权限绕过 | 店员可撤销其他店员/店长的核销记录 |

**修复建议**:
```javascript
// 撤销核销验证
async function revokeVerification(revocationData) {
  const verification = await prisma.verification.findUnique({
    where: { id: revocationData.verificationId }
  });

  // 1. 检查时间限制（使用后端服务器时间）
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  if (verification.verifiedAt < tenMinutesAgo) {
    throw new Error('已超过10分钟撤销时限');
  }

  // 2. 检查权限（同商户）
  if (verification.merchantId !== staff.merchantId) {
    throw new Error('无权限撤销此核销记录');
  }

  // 3. 检查是否已被撤销
  const existingRevocation = await prisma.revocation.findUnique({
    where: { verificationId: verification.id }
  });
  if (existingRevocation) {
    throw new Error('该核销记录已被撤销');
  }
}
```

---

## 🟡 中等风险（建议修复）

### 4. API 限流不足

**问题**: 文档提到"敏感接口限制请求频率"，但未详细设计

**需补充**:
- 登录接口：每IP每小时不超过10次
- 核销接口：每商户每分钟不超过60次
- 验证码生成：每用户每分钟不超过5次

**修复建议**:
```javascript
// 使用 Redis 实现限流
const rateLimiter = new RateLimiter({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  max: 60, // 60次
  windowMs: 60 * 1000 // 每分钟
});
```

### 5. 缺少 API 签名机制

**问题**: 仅使用 JWT Token，敏感接口无额外签名验证

**建议**: 对高敏感操作（核销、撤销）增加 API 签名
```javascript
// 示例签名验证
function verifyApiSignature(req) {
  const { signature, timestamp, nonce } = req.headers;
  const signString = `${timestamp}${nonce}${API_SECRET}`;
  const expectedSignature = crypto.createHash('sha256').update(signString).digest('hex');
  return signature === expectedSignature;
}
```

### 6. 文件上传安全

**已良好**:
- 使用阿里云OSS私有bucket ✅
- 文件类型限制 ✅

**需补充**:
```javascript
// 必须的文件上传验证
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('不支持的文件类型');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件大小不能超过5MB');
  }
  // 检查文件扩展名（防止绕过）
  const ext = path.extname(file.originalname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    throw new Error('不支持的文件扩展名');
  }
}
```

---

## 🟢 良好实践（已确认）

### 7. JWT + RBAC 认证架构

**评估**: 架构设计良好 ✅

| 组件 | 状态 | 说明 |
|------|------|------|
| JWT Token | ✅ | 正确使用 |
| Token 过期 | ✅ | 建议设置2小时 |
| 角色分离 | ✅ | User/Merchant/Admin |
| 权限控制 | ✅ | RBAC 思路正确 |

### 8. 核销码有效期设计

**评估**: 5分钟有效期设计合理 ✅

**优点**:
- 8位随机码空间：32^8 ≈ 34万亿
- 5分钟有效期防止重放攻击
- 单次使用限制

---

## 📝 安全检查清单

| # | 检查项 | 状态 | 风险等级 |
|---|--------|------|---------|
| 1 | 手机号加密存储 | ❌ 未实现 | 🔴 高 |
| 2 | openid 脱敏处理 | ❌ 未实现 | 🔴 高 |
| 3 | 核销码随机算法 | ⚠️ 未说明 | 🟡 中 |
| 4 | 撤销权限验证 | ⚠️ 需增强 | 🟡 中 |
| 5 | API 限流实现 | ⚠️ 需补充 | 🟡 中 |
| 6 | 登录频率限制 | ⚠️ 需补充 | 🟡 中 |
| 7 | 文件上传验证 | ⚠️ 需补充 | 🟡 中 |
| 8 | JWT 安全配置 | ✅ 已设计 | 🟢 低 |
| 9 | RBAC 权限控制 | ✅ 已设计 | 🟢 低 |
| 10 | OSS 私有bucket | ✅ 已设计 | 🟢 低 |

---

## 🎯 修复优先级

### 必须修复（上线前）

1. 🔴 **手机号加密存储** - 用户隐私合规
2. 🔴 **openid 脱敏处理** - 微信数据合规
3. 🟡 **核销码随机算法** - 防止暴力破解
4. 🟡 **撤销权限验证** - 业务漏洞

### 建议修复（上线后迭代）

5. 🟡 **API 限流实现**
6. 🟡 **文件上传增强验证**
7. 🟡 **API 签名机制**

---

## 📋 结论

### 🟡 需要补充安全措施

**原因**:
1. 敏感数据（手机号、openid）未加密存储
2. 核销码生成算法未明确
3. 撤销权限验证需加强

**建议**:
1. 补充手机号/openid 加密方案
2. 明确核销码生成算法（使用 crypto.randomInt）
3. 加强撤销核销的权限验证
4. 实现 API 限流中间件

**评审通过条件**: 修复以上3个🔴高风险问题后通过

---

*审查人: Guardian 🛡️*  
*评审时间: 2026-03-05*
