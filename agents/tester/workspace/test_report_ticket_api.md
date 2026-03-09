# 票根模块 API 功能测试报告

**测试时间**: 2026-03-07 17:11  
**测试服务器**: http://192.168.31.188/api/mobile  
**代码位置**: `/Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台/apps/backend/src/routes/mobile/ticket.js`

---

## 📊 测试结果汇总

| 测试类别 | 测试数量 | 通过 | 失败 | 通过率 |
|---------|---------|------|------|-------|
| 公开接口 | 6 | 0 | 6 | 0% |
| 权限控制 | 3 | 3 | 0 | 100% |
| 边界情况 | 6 | 0 | 6 | 0% |
| **总计** | **15** | **3** | **12** | **20%** |

---

## ✅ 通过测试

| # | 接口 | 测试项 | 状态 |
|---|------|--------|------|
| 1 | `GET /ticket/my-tickets` | 无Token访问返回401 | ✅ |
| 2 | `POST /ticket/recognize` | 无Token访问返回401 | ✅ |
| 3 | `POST /ticket/verify-code` | 无Token访问返回401 | ✅ |

**说明**: 权限控制机制正常工作，所有需要登录的接口都能正确拦截未授权访问。

---

## ❌ 失败测试

### 🔴 关键问题：数据库表不存在

**问题描述**: Prisma 数据库模型已定义，但对应的数据库表未创建，导致所有依赖数据库查询的接口返回 500 错误。

**受影响接口**:
1. `GET /ticket/types` - 表 `TicketType` 不存在
2. `GET /ticket/categories` - 表 `MerchantCategory` 不存在
3. `GET /ticket/banners` - 表 `TicketBanner` 不存在
4. `GET /ticket/news` - 表 `TicketNews` 不存在
5. `GET /ticket/merchants` - 表 `Merchant` 不存在
6. `GET /ticket/merchant/:id` - 表 `Merchant` 不存在

**错误信息**:
```json
{
  "code": 500,
  "message": "表不存在",
  "data": null,
  "debug": {
    "name": "PrismaClientKnownRequestError",
    "stack": ["Invalid `prisma.xxx.findMany()` invocation"]
  }
}
```

---

## 🔧 需要修复项

### 1. 数据库迁移（优先级：高）

需要在服务器上执行 Prisma 数据库迁移：

```bash
# 进入后端项目目录
cd /Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台/apps/backend

# 方法一：使用 db push（适合开发环境）
npx prisma db push

# 方法二：使用 migrate dev（推荐）
npx prisma migrate dev --name init_ticket_module
```

**需要创建的表**:
- `TicketType` - 票根类型
- `Ticket` - 票根记录
- `MerchantCategory` - 商户分类
- `Merchant` - 商户
- `MerchantImage` - 商户图片
- `DiscountRule` - 优惠规则
- `MerchantStaff` - 商户员工
- `Verification` - 核销记录
- `Revocation` - 撤销核销记录
- `TicketBanner` - Banner配置
- `TicketNews` - 热点资讯
- `OcrTask` - OCR任务队列
- `VerifyCodePool` - 核销码池
- `TicketConfig` - 系统配置

### 2. 商户列表关键词搜索（优先级：中）

**问题**: 使用关键词搜索时返回 400

**接口**: `GET /ticket/merchants?keyword=美食`

### 3. 图片上传限制测试（优先级：中）

**待测试项**: 票根识别接口 `/ticket/recognize` 的 5MB 图片大小限制

**状态**: 无法测试，需要登录Token和数据库表

---

## 📝 代码审查备注

### 好的实践 ✅

1. **权限控制正确** - `authenticate` 中间件正确应用
2. **输入验证** - 必填参数检查完整
3. **错误处理** - 使用 `try/catch` 和 `next(error)`
4. **数据格式化** - 返回数据格式符合前端需求
5. **分页支持** - 商户列表和热点资讯支持分页

### 代码问题 ⚠️

1. **OCR处理模拟** - 当前使用模拟数据，生产环境需接入真实OCR服务
2. **图片存储** - 票根图片直接存储Base64，建议使用OSS存储
3. **商户距离计算** - `distance` 字段返回null，需要传入用户位置计算

---

## 🚀 后续步骤

### 立即执行
1. 在服务器上执行数据库迁移
2. 插入测试数据（票根类型、商户分类、Banner、资讯）
3. 重新运行测试脚本

### 测试数据建议
```sql
-- 票根类型
INSERT INTO TicketType (code, name, icon, description, sort_order) VALUES
('train', '火车票', 'train', '铁路出行票据', 1),
('plane', '飞机票', 'flight', '航空出行票据', 2),
('movie', '电影票', 'movie', '影院观影票据', 3);

-- 商户分类
INSERT INTO MerchantCategory (name, sort_order) VALUES
('餐饮美食', 1),
('酒店住宿', 2),
('休闲娱乐', 3);

-- Banner
INSERT INTO TicketBanner (title, subtitle, image, link, sort_order) VALUES
('新人专享', '首次核销立减20元', 'https://example.com/banner1.jpg', '/activity', 1);
```

---

## 📌 结论

| 项目 | 状态 |
|------|------|
| 接口可用性 | ❌ 无法验证（数据库问题） |
| 数据正确性 | ❌ 无法验证（数据库问题） |
| 权限控制 | ✅ 正常工作 |
| 边界情况 | ❌ 无法完全验证 |
| 图片上传限制 | ❌ 无法验证 |

### 是否可以进入前端联调阶段？

**当前状态**: ❌ **暂不建议**

**原因**:
1. 数据库表未创建，所有数据接口无法正常工作
2. 前端无法获取真实数据进行开发和调试
3. 部分接口依赖数据库数据才能测试边界情况

**建议**:
1. 优先执行数据库迁移
2. 补充测试数据
3. 重新测试验证通过后，再进行前端联调

---

*报告生成时间: 2026-03-07*  
*测试 Agent: Tester*
