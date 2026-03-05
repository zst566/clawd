/**
 * 中间件使用示例
 * 展示如何在路由中使用认证、RBAC和限流中间件
 */

const express = require('express');
const router = express.Router();

// 导入中间件
const { 
  authMiddleware, 
  optionalAuthMiddleware,
  generateToken, 
  generateRefreshToken,
  refreshAccessToken 
} = require('./middleware/auth');

const { 
  requireRole, 
  requirePermission, 
  requireAnyPermission,
  requireMerchantAccess,
  PERMISSIONS 
} = require('./middleware/rbac');

const { 
  loginRateLimit, 
  verifyRateLimit, 
  generalRateLimit,
  strictRateLimit 
} = require('./middleware/rateLimit');

// ==================== 认证相关路由 ====================

// 登录接口 - 严格限流
router.post('/auth/login', loginRateLimit, async (req, res) => {
  // 登录逻辑...
  const user = { id: 1, role: 'user', merchantId: 'm123' };
  
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  res.json({
    code: 200,
    data: {
      token,
      refreshToken,
      expiresIn: 7200 // 2小时
    }
  });
});

// 刷新Token
router.post('/auth/refresh', generalRateLimit, async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await refreshAccessToken(refreshToken);
  
  if (!tokens) {
    return res.status(401).json({ code: 401, message: '刷新Token无效' });
  }
  
  res.json({
    code: 200,
    data: tokens
  });
});

// ==================== 票根相关路由 ====================

// 创建票根 - 需要登录 + 创建权限
router.post('/tickets', 
  authMiddleware,
  requirePermission(PERMISSIONS.TICKET_CREATE),
  generalRateLimit,
  (req, res) => {
    res.json({ code: 200, message: '票根创建成功' });
  }
);

// 核销票根 - 需要登录 + 核销权限 + 核销限流
router.post('/tickets/:code/verify',
  authMiddleware,
  requirePermission(PERMISSIONS.TICKET_VERIFY),
  verifyRateLimit,
  (req, res) => {
    res.json({ code: 200, message: '票根核销成功' });
  }
);

// 获取票根详情 - 可选认证
router.get('/tickets/:id',
  optionalAuthMiddleware,
  generalRateLimit,
  (req, res) => {
    // 如果有认证，req.user会有值
    const userInfo = req.user ? `用户 ${req.user.id}` : '游客';
    res.json({ code: 200, message: `${userInfo} 访问票根详情` });
  }
);

// ==================== 商户相关路由 ====================

// 获取商户信息 - 需要登录 + 商户访问权限
router.get('/merchants/:merchantId',
  authMiddleware,
  requireMerchantAccess('merchantId'),
  generalRateLimit,
  (req, res) => {
    res.json({ code: 200, data: { id: req.params.merchantId } });
  }
);

// 管理商户 - 需要manager或admin角色
router.put('/merchants/:merchantId',
  authMiddleware,
  requireRole(['manager', 'admin']),
  generalRateLimit,
  (req, res) => {
    res.json({ code: 200, message: '商户更新成功' });
  }
);

// ==================== 用户管理路由 ====================

// 获取用户列表 - 需要manager或admin
router.get('/users',
  authMiddleware,
  requireRole(['manager', 'admin']),
  generalRateLimit,
  (req, res) => {
    res.json({ code: 200, data: [] });
  }
);

// 删除用户 - 严格限流 + 需要admin角色
router.delete('/users/:id',
  authMiddleware,
  requireRole(['admin']),
  strictRateLimit,
  (req, res) => {
    res.json({ code: 200, message: '用户删除成功' });
  }
);

// ==================== 系统管理路由 ====================

// 系统配置 - 仅admin + 任一系统权限
router.get('/system/config',
  authMiddleware,
  requireRole(['admin']),
  requireAnyPermission([PERMISSIONS.SYSTEM_CONFIG, PERMISSIONS.SYSTEM_LOGS]),
  generalRateLimit,
  (req, res) => {
    res.json({ code: 200, data: {} });
  }
);

module.exports = router;
