# mall-vue 测试计划 - 2026年V1版本

**测试范围**: mall-vue 组件拆分后的功能验证  
**测试分支**: `release/v1-2026`  
**测试日期**: 2026-03-03  

---

## 🎯 测试目标

1. 验证组件拆分后功能完整性
2. 验证安全修复是否生效
3. 验证质量优化是否正确
4. 确保无回归问题

---

## 📋 测试用例

### 一、组件拆分功能测试

#### 1. merchant/Home 组件
- [ ] 商户首页正常加载
- [ ] StatisticCards 统计显示正确
- [ ] QuickActions 快捷操作可点击
- [ ] RecentOrders 订单列表显示
- [ ] OrderChart 图表渲染正常
- [ ] MerchantInfo 信息展示完整

#### 2. customer/ProductDetail 组件
- [ ] 商品详情页正常加载
- [ ] ProductGallery 图片轮播工作
- [ ] ProductInfo 信息展示正确
- [ ] PriceSection 价格显示准确
- [ ] VariantSelector 规格选择正常
- [ ] PromotionTags 促销标签显示
- [ ] ActionButtons 操作按钮可用

#### 3. merchant/OrderDetail 组件
- [ ] 订单详情页正常加载
- [ ] OrderInfo 订单信息完整
- [ ] OrderTimeline 时间线正确
- [ ] CustomerInfo 客户信息显示
- [ ] ProductList 商品列表正确
- [ ] PaymentInfo 支付信息准确
- [ ] ActionButtons 操作功能正常

#### 4. customer/PromotionDetail 组件
- [ ] 促销详情页正常加载
- [ ] PromotionHeader 头部显示
- [ ] VariantList 规格列表正常
- [ ] PriceCalculator 价格计算正确
- [ ] ActivityRules 活动规则显示
- [ ] ActionButtons 购买按钮可用

---

### 二、安全修复验证测试

#### 1. API日志安全
- [ ] 浏览器控制台无敏感信息泄露
- [ ] Authorization header 显示为 [REDACTED]

#### 2. Token存储安全
- [ ] Token 存储在 sessionStorage
- [ ] 关闭标签页后需要重新登录
- [ ] 刷新页面后 Token 仍然有效

#### 3. URL参数安全
- [ ] 登录后 URL 中的 token 参数被清除
- [ ] 浏览器历史记录无敏感参数

#### 4. 密码强度验证
- [ ] 弱密码（123456）被拒绝
- [ ] 密码需包含大小写+数字+特殊字符
- [ ] 8位以下密码被拒绝

#### 5. 头像上传安全
- [ ] 非图片文件被拒绝
- [ ] 伪造MIME类型文件被拒绝
- [ ] 超过5MB文件被拒绝

---

### 三、质量优化验证测试

#### 1. Props类型定义
- [ ] 组件Props类型正确
- [ ] TypeScript编译无错误
- [ ] IDE智能提示正常

#### 2. 工具函数
- [ ] formatPrice 格式化正确
- [ ] formatDateTime 格式化正确
- [ ] 组件内无重复函数定义

#### 3. Console清理
- [ ] 生产环境无console.log输出
- [ ] 错误日志正常显示

---

### 四、回归测试

#### 1. 核心业务流程
- [ ] 登录流程正常
- [ ] 商品浏览正常
- [ ] 下单流程正常
- [ ] 支付流程正常
- [ ] 订单管理正常

#### 2. 边界条件
- [ ] 空数据状态显示
- [ ] 加载状态显示
- [ ] 错误状态处理
- [ ] 网络异常处理

---

## 🔧 测试环境

```bash
# 启动开发环境
cd /Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall
./dev-env.sh start

# 访问地址
- 移动端H5: http://localhost:18080
- PC管理端: http://localhost:1314/pc-admin/
```

---

## 📊 测试通过标准

- 功能测试: 100% 通过
- 安全测试: 100% 通过
- 回归测试: 无阻塞性问题
- TypeScript: 无编译错误
- ESLint: 无严重错误

---

## 🐛 Bug记录模板

| BugID | 描述 | 严重程度 | 复现步骤 | 截图 | 负责人 |
|-------|------|----------|----------|------|--------|
| | | | | | |

