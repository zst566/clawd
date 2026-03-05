const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

// 限流配置
const RATE_LIMIT_CONFIG = {
  // 登录接口：每小时5次
  login: {
    windowMs: 60 * 60 * 1000, // 1小时
    max: 5,
    message: {
      code: 429,
      message: '登录次数过多，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // 核销接口：每分钟60次
  verify: {
    windowMs: 60 * 1000, // 1分钟
    max: 60,
    message: {
      code: 429,
      message: '核销请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // 普通接口：每分钟100次
  general: {
    windowMs: 60 * 1000, // 1分钟
    max: 100,
    message: {
      code: 429,
      message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // 严格限流：每分钟10次（用于敏感操作）
  strict: {
    windowMs: 60 * 1000, // 1分钟
    max: 10,
    message: {
      code: 429,
      message: '操作过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
  }
};

/**
 * 创建Redis存储的限流中间件
 * @param {Object} config - 限流配置
 * @param {Function} keyGenerator - 自定义key生成函数
 * @returns {Function} Express中间件
 */
function createRateLimiter(config, keyGenerator = null) {
  const options = {
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:'
    }),
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
    handler: (req, res, next, options) => {
      res.status(429).json(options.message);
    },
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    requestWasSuccessful: (req, res) => res.statusCode < 400,
    skip: (req) => {
      // 可以在这里添加跳过限流的逻辑，比如内部IP白名单
      return false;
    }
  };
  
  // 自定义key生成器（默认使用IP）
  if (keyGenerator) {
    options.keyGenerator = keyGenerator;
  } else {
    options.keyGenerator = (req) => {
      // 优先使用用户ID，如果没有则使用IP
      const userId = req.user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `user:${userId}` : `ip:${ip}`;
    };
  }
  
  return rateLimit(options);
}

/**
 * 登录限流中间件
 * 每小时5次，基于IP地址
 */
const loginRateLimit = createRateLimiter(
  RATE_LIMIT_CONFIG.login,
  (req) => {
    // 登录接口使用IP+用户名作为key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const username = req.body.username || req.body.phone || 'unknown';
    return `login:${ip}:${username}`;
  }
);

/**
 * 核销限流中间件
 * 每分钟60次，基于用户ID或IP
 */
const verifyRateLimit = createRateLimiter(
  RATE_LIMIT_CONFIG.verify,
  (req) => {
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = userId ? `verify:user:${userId}` : `verify:ip:${ip}`;
    return key;
  }
);

/**
 * 普通接口限流中间件
 * 每分钟100次，基于用户ID或IP
 */
const generalRateLimit = createRateLimiter(RATE_LIMIT_CONFIG.general);

/**
 * 严格限流中间件
 * 每分钟10次，用于敏感操作
 */
const strictRateLimit = createRateLimiter(RATE_LIMIT_CONFIG.strict);

/**
 * 自定义限流中间件工厂
 * @param {Object} customConfig - 自定义配置
 * @param {Function} customKeyGenerator - 自定义key生成器
 * @returns {Function} Express中间件
 */
function createCustomRateLimit(customConfig, customKeyGenerator = null) {
  const config = {
    ...RATE_LIMIT_CONFIG.general,
    ...customConfig
  };
  return createRateLimiter(config, customKeyGenerator);
}

/**
 * 基于角色的限流中间件
 * 不同角色有不同的限流策略
 */
function roleBasedRateLimit(roleLimits = {}) {
  const defaultLimits = {
    user: RATE_LIMIT_CONFIG.general,
    merchant_staff: RATE_LIMIT_CONFIG.general,
    manager: { ...RATE_LIMIT_CONFIG.general, max: 200 },
    admin: { ...RATE_LIMIT_CONFIG.general, max: 500 }
  };
  
  const limits = { ...defaultLimits, ...roleLimits };
  
  return (req, res, next) => {
    const role = req.user?.role || 'user';
    const config = limits[role] || limits.user;
    
    const limiter = createRateLimiter(config);
    return limiter(req, res, next);
  };
}

/**
 * 获取限流状态
 * @param {string} key - 限流key
 * @returns {Promise<Object>} 限流状态信息
 */
async function getRateLimitStatus(key) {
  try {
    const keys = await redis.keys(`rl:${key}*`);
    const status = {
      total: keys.length,
      keys: []
    };
    
    for (const k of keys) {
      const ttl = await redis.ttl(k);
      status.keys.push({
        key: k,
        ttl: ttl
      });
    }
    
    return status;
  } catch (error) {
    console.error('获取限流状态失败:', error);
    return { total: 0, keys: [] };
  }
}

/**
 * 清除限流记录
 * @param {string} key - 限流key
 */
async function clearRateLimit(key) {
  try {
    const keys = await redis.keys(`rl:${key}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('清除限流记录失败:', error);
  }
}

module.exports = {
  RATE_LIMIT_CONFIG,
  createRateLimiter,
  loginRateLimit,
  verifyRateLimit,
  generalRateLimit,
  strictRateLimit,
  createCustomRateLimit,
  roleBasedRateLimit,
  getRateLimitStatus,
  clearRateLimit
};
