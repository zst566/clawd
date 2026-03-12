# api-quality-scan

> API 质量扫描工作流技能
> 
> 自动化扫描、分析、修复、评审 API 问题

## 功能概述

1. **检测项目结构** - 自动识别 apps/src/ 目录
2. **测试账号检查** - 检查/创建测试账号配置文件
3. **用户选择** - 列出可扫描目标供用户选择
4. **API 扫描** - 调用 api-map 技能扫描
5. **认证重测** - 使用测试账号获取 token 后重新测试 401 路径
6. **分析结果** - 解析扫描报告，提取问题
7. **智能修复** - 分配给 codecraft 修复
8. **代码评审** - 分配给 guardian 评审
9. **验证确认** - 重新扫描验证
10. **生成报告** - 汇总所有结果

## 参数

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| projectPath | ✅ | - | 项目根目录 |
| apiServer | ✅ | - | API 服务器地址 |
| targetApp | ❌ | - | 指定扫描目标（不指定则让用户选择） |
| fixThreshold | ❌ | 3 | 修复并行阈值 |
| reviewThreshold | ❌ | 2 | 评审并行阈值 |

## 工作流

```
┌─────────────────────────────────────────────────────────────┐
│  1. detect: 检测项目结构，列出可扫描目标                       │
├─────────────────────────────────────────────────────────────┤
│  2. check-accounts: 检查/创建测试账号配置文件                   │
├─────────────────────────────────────────────────────────────┤
│  3. select: 用户选择扫描目标                                 │
├─────────────────────────────────────────────────────────────┤
│  4. scan: 调用 api-map 技能扫描 API                         │
├─────────────────────────────────────────────────────────────┤
│  5. auth-retry: 使用测试账号 token 重测 401 路径             │
├─────────────────────────────────────────────────────────────┤
│  6. analyze: 分析扫描结果，提取问题                          │
├─────────────────────────────────────────────────────────────┤
│  7. fix: 分配给 codecraft 修复                              │
├─────────────────────────────────────────────────────────────┤
│  8. review: 分配给 guardian 评审                            │
├─────────────────────────────────────────────────────────────┤
│  9. verify: 重新扫描验证                                    │
├─────────────────────────────────────────────────────────────┤
│  10. report: 生成最终报告                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 2: 测试账号检查（重要）

### 检查测试账号文件

1. 查找测试账号配置文件：
   - `{projectPath}/test-accounts.env`
   - `{projectPath}/.test-accounts.env`

2. 如果文件不存在，提示用户创建：

```bash
# 创建测试账号文件模板
cat > {projectPath}/test-accounts.env << 'EOF'
# API 测试账号配置
# 用于 API 扫描时的登录认证

# PC 管理端
PC_ADMIN_USERNAME=admin
PC_ADMIN_PASSWORD=admin123

# 移动端 H5
MOBILE_PHONE=13800000000
MOBILE_CODE=123456

# 商户端 H5
MERCHANT_PHONE=13800000000
MERCHANT_CODE=123456
EOF
```

3. 读取并解析测试账号

### 获取认证 Token

根据目标端类型，使用对应账号登录获取 token：

**PC 管理端:**
```bash
curl -X POST "{apiServer}/api/pc/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"'$PC_ADMIN_USERNAME'","password":"'$PC_ADMIN_PASSWORD'"}'
```

**移动端 H5:**
```bash
curl -X POST "{apiServer}/api/mobile/auth/wechat-login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"'$MOBILE_PHONE'","code":"'$MOBILE_CODE'"}'
```

**商户端 H5:**
```bash
curl -X POST "{apiServer}/api/merchant/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"'$MERCHANT_PHONE'","code":"'$MERCHANT_CODE'"}'
```

### 使用 Token 重测 401 路径

获取 token 后，重新测试之前返回 401 的路径：

```bash
curl -H "Authorization: Bearer {token}" {apiServer}{path}
```

---

## Step 4: API 扫描

加载 api-map 技能执行扫描，参考 `~/.kimi/skills/api-map/SKILL.md`

---

## Step 5: 认证重测

扫描完成后，对返回 401 的路径执行：

1. 解析测试账号文件
2. 根据端类型获取 token
3. 使用 token 重测所有 401 路径
4. 更新结果：
   - 200 → 路径正常
   - 401 → 路径需要认证但存在
   - 404 → 真正缺失
   - 500 → 服务器错误

---

## Step 7: 分配修复

```javascript
sessions_spawn({
  agentId: 'codecraft',
  task: `修复以下 API 问题...`,
  runtime: 'acp'
})
```

### 修复优先级

| 优先级 | 问题类型 | 说明 |
|--------|----------|------|
| P0 | 500 错误 | 服务器崩溃，必须修复 |
| P1 | 404 缺失 | 路径不存在，必须修复 |
| P2 | 401 但确实需要 | 需要确认是否需要登录 |
| P3 | 401 但不需要认证 | 可能是中间件问题，可以修复 |

### 暂缓修复标记

某些功能在测试环境无法修复，需要标记：
- 微信支付（需要真实 openid）
- 微信回调（需要线上回调地址）
- 第三方 API（需要生产密钥）

---

## Step 10: 记录到日常日志（重要！）

每次扫描修复完成后，必须更新日常记录：

### 创建日常记录文件

路径: `{projectPath}/docs/api-map/DAILY_SCAN_LOG.md`

```markdown
# API 扫描日常记录

## 扫描日期: YYYY-MM-DD

### 扫描目标
- 项目: {projectName}
- 端: {targetApp}
- 服务器: {apiServer}

### 扫描结果汇总
| API 路径 | 状态 | 原因 | 修复状态 |
|---------|------|------|----------|
| /api/xxx | 200 | 正常 | - |
| /api/xxx | 404 | 后端路由缺失 | 已修复/待开发/暂缓 |
| /api/xxx | 500 | 代码错误 | 已修复/待开发 |

### 本次修复详情
1. **问题**: 描述
   - 文件: xxx
   - 修复: xxx
   - 状态: 已修复

### 对比上次扫描
- 新发现问题: X 个
- 已修复问题: X 个
- 回归问题: X 个

### 待办
- [ ] 问题描述
```

### 避免重复修复

**关键规则：**
1. 每次扫描前，先读取 `DAILY_SCAN_LOG.md`
2. 对比上次扫描结果，确认问题是否已修复
3. 只关注新问题或回归问题
4. 避免重复修复同样的问题

---

## 输出

- 扫描报告: `~/clawd/agents/main/workspace/docs/api-map/{target}-{date}.md`
- 最终报告: `~/clawd/agents/main/workspace/docs/api-map/report-{date}.md`
- 日常记录: `{projectPath}/docs/api-map/DAILY_SCAN_LOG.md`
