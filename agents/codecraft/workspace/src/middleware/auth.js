const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

// JWT配置
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: '2h',  // 2小时过期
  refreshExpiresIn: '7d'  // 7天过期
};

/**
 * 生成访问Token
 * @param {Object} payload - Token载荷
 * @returns {string} JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn
  });
}

/**
 * 生成刷新Token
 * @param {Object} payload - Token载荷
 * @returns {string} Refresh Token
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.refreshExpiresIn }
  );
}

/**
 * 验证Token
 * @param {string} token - JWT Token
 * @returns {Object|null} 解码后的payload或null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.secret);
  } catch (error) {
    return null;
  }
}

/**
 * 将Token加入黑名单
 * @param {string} token - JWT Token
 * @param {number} expireTime - 过期时间（秒）
 */
async function blacklistToken(token, expireTime = 7200) {
  await redis.setex(`blacklist:${token}`, expireTime, '1');
}

/**
 * 检查Token是否在黑名单中
 * @param {string} token - JWT Token
 * @returns {Promise<boolean>}
 */
async function isTokenBlacklisted(token) {
  const result = await redis.get(`blacklist:${token}`);
  return result !== null;
}

/**
 * 刷新Token
 * @param {string} refreshToken - 刷新Token
 * @returns {Promise<Object|null>} 新的token对或null
 */
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret);
    
    // 检查是否是刷新Token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    // 检查刷新Token是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return null;
    }
    
    // 将旧的刷新Token加入黑名单
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await blacklistToken(refreshToken, ttl);
    }
    
    // 生成新的token对
    const { type, iat, exp, ...userInfo } = decoded;
    
    return {
      token: generateToken(userInfo),
      refreshToken: generateRefreshToken(userInfo)
    };
  } catch (error) {
    return null;
  }
}

/**
 * JWT认证中间件
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供Token'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: 'Token格式错误'
      });
    }
    
    // 检查Token是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        code: 401,
        message: 'Token已失效'
      });
    }
    
    // 验证Token
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'Token已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: 'Token无效'
      });
    }
    
    return res.status(401).json({
      code: 401,
      message: 'Token验证失败'
    });
  }
}

/**
 * 可选认证中间件 - 不强制要求认证，但会解析Token
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    // 检查Token是否在黑名单中
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }
    
    // 验证Token
    const decoded = jwt.verify(token, JWT_CONFIG.secret);
    req.user = decoded;
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  generateRefreshToken,
  verifyToken,
  refreshAccessToken,
  blacklistToken,
  isTokenBlacklisted,
  JWT_CONFIG
};
