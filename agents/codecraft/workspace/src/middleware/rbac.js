/**
 * RBAC权限控制中间件
 * 角色层级: user < merchant_staff < manager < admin
 */

// 角色层级定义
const ROLE_HIERARCHY = {
  user: 1,
  merchant_staff: 2,
  manager: 3,
  admin: 4
};

// 权限定义
const PERMISSIONS = {
  // 票根相关权限
  TICKET_CREATE: 'ticket:create',
  TICKET_READ: 'ticket:read',
  TICKET_UPDATE: 'ticket:update',
  TICKET_DELETE: 'ticket:delete',
  TICKET_VERIFY: 'ticket:verify',
  
  // 商户相关权限
  MERCHANT_READ: 'merchant:read',
  MERCHANT_MANAGE: 'merchant:manage',
  
  // 用户管理权限
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',
  
  // 系统管理权限
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs'
};

// 角色权限映射
const ROLE_PERMISSIONS = {
  user: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.MERCHANT_READ
  ],
  merchant_staff: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_VERIFY,
    PERMISSIONS.MERCHANT_READ
  ],
  manager: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_DELETE,
    PERMISSIONS.TICKET_VERIFY,
    PERMISSIONS.MERCHANT_READ,
    PERMISSIONS.MERCHANT_MANAGE,
    PERMISSIONS.USER_READ
  ],
  admin: Object.values(PERMISSIONS) // 管理员拥有所有权限
};

/**
 * 检查角色是否满足要求
 * @param {string} userRole - 用户角色
 * @param {string} requiredRole - 要求的最低角色
 * @returns {boolean}
 */
function hasRoleLevel(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * 检查用户是否拥有指定权限
 * @param {string} userRole - 用户角色
 * @param {string} permission - 权限标识
 * @returns {boolean}
 */
function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

/**
 * 检查用户是否拥有任一指定权限
 * @param {string} userRole - 用户角色
 * @param {string[]} permissions - 权限标识数组
 * @returns {boolean}
 */
function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * 检查用户是否拥有所有指定权限
 * @param {string} userRole - 用户角色
 * @param {string[]} permissions - 权限标识数组
 * @returns {boolean}
 */
function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * 角色检查中间件 - 要求用户拥有指定角色之一
 * @param {string[]} roles - 允许的角色数组
 * @returns {Function} Express中间件
 */
function requireRole(roles) {
  return (req, res, next) => {
    // 确保用户已认证
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    
    if (!userRole) {
      return res.status(403).json({
        code: 403,
        message: '用户角色信息缺失'
      });
    }
    
    // 检查用户角色是否在允许列表中
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }
    
    next();
  };
}

/**
 * 角色层级检查中间件 - 要求用户角色层级不低于指定角色
 * @param {string} minRole - 最低要求的角色
 * @returns {Function} Express中间件
 */
function requireRoleLevel(minRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    
    if (!userRole) {
      return res.status(403).json({
        code: 403,
        message: '用户角色信息缺失'
      });
    }
    
    if (!hasRoleLevel(userRole, minRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }
    
    next();
  };
}

/**
 * 权限检查中间件 - 要求用户拥有指定权限
 * @param {string} permission - 权限标识
 * @returns {Function} Express中间件
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }
    
    next();
  };
}

/**
 * 任一权限检查中间件 - 要求用户拥有任一指定权限
 * @param {string[]} permissions - 权限标识数组
 * @returns {Function} Express中间件
 */
function requireAnyPermission(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    
    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }
    
    next();
  };
}

/**
 * 所有权限检查中间件 - 要求用户拥有所有指定权限
 * @param {string[]} permissions - 权限标识数组
 * @returns {Function} Express中间件
 */
function requireAllPermissions(permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    
    if (!hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }
    
    next();
  };
}

/**
 * 资源所有者检查中间件 - 检查用户是否是资源所有者或拥有足够权限
 * @param {Function} getResourceOwnerId - 获取资源所有者ID的函数
 * @param {string} adminRole - 可以绕过检查的角色（默认为admin）
 * @returns {Function} Express中间件
 */
function requireOwnershipOrRole(getResourceOwnerId, adminRole = 'admin') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    const userId = req.user.id;
    
    // 管理员可以访问所有资源
    if (userRole === adminRole) {
      return next();
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== userId) {
        return res.status(403).json({
          code: 403,
          message: '无权访问此资源'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        code: 500,
        message: '资源验证失败'
      });
    }
  };
}

/**
 * 商户权限检查中间件 - 检查用户是否属于指定商户
 * @param {string} paramName - URL参数中商户ID的字段名
 * @returns {Function} Express中间件
 */
function requireMerchantAccess(paramName = 'merchantId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未登录'
      });
    }
    
    const userRole = req.user.role;
    const userMerchantId = req.user.merchantId;
    const targetMerchantId = req.params[paramName] || req.body[paramName];
    
    // 管理员可以访问所有商户
    if (userRole === 'admin') {
      return next();
    }
    
    // 检查用户是否属于目标商户
    if (userMerchantId !== targetMerchantId) {
      return res.status(403).json({
        code: 403,
        message: '无权访问此商户'
      });
    }
    
    next();
  };
}

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasRoleLevel,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requireRole,
  requireRoleLevel,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnershipOrRole,
  requireMerchantAccess
};
