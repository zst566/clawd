/**
 * 核销码生成工具
 * 支持Redis码池生成和备用随机生成方案
 */

const crypto = require('crypto');

// 核销码配置
const CODE_CONFIG = {
  // 默认核销码长度
  length: 12,
  // 字符集（去除易混淆字符：0, O, 1, I, l）
  charset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  // Redis码池配置
  redisPoolKey: 'verify_code_pool',
  // 码池最低阈值，低于此值需要补充
  poolMinThreshold: 100,
  // 每次补充数量
  poolBatchSize: 500,
  // 码池过期时间（7天）
  poolExpireSeconds: 7 * 24 * 60 * 60
};

/**
 * 生成随机核销码
 * @param {number} length - 核销码长度
 * @returns {string} - 核销码
 */
function generateRandomCode(length = CODE_CONFIG.length) {
  const charset = CODE_CONFIG.charset;
  let code = '';
  
  // 使用crypto生成随机字节
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    // 使用随机字节对字符集长度取模，确保均匀分布
    const randomIndex = randomBytes[i] % charset.length;
    code += charset[randomIndex];
  }
  
  return code;
}

/**
 * 生成多个不重复的核销码
 * @param {number} count - 生成数量
 * @param {number} length - 核销码长度
 * @returns {string[]} - 核销码数组
 */
function generateUniqueCodes(count, length = CODE_CONFIG.length) {
  const codes = new Set();
  
  // 安全上限检查，防止无限循环
  const maxAttempts = count * 10;
  let attempts = 0;
  
  while (codes.size < count && attempts < maxAttempts) {
    codes.add(generateRandomCode(length));
    attempts++;
  }
  
  return Array.from(codes);
}

/**
 * 从Redis码池获取核销码（需要Redis客户端）
 * @param {Object} redisClient - Redis客户端实例
 * @param {number} count - 获取数量
 * @returns {Promise<string[]>} - 核销码数组
 */
async function getCodesFromPool(redisClient, count = 1) {
  if (!redisClient) {
    throw new Error('Redis client is required');
  }
  
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const code = await redisClient.spop(CODE_CONFIG.redisPoolKey);
    if (code) {
      codes.push(code);
    } else {
      // 码池为空，使用备用方案生成
      console.warn('[verifyCode] Redis pool empty, using fallback generation');
      codes.push(generateRandomCode());
    }
  }
  
  // 异步检查并补充码池
  checkAndRefillPool(redisClient).catch(err => {
    console.error('[verifyCode] Pool refill error:', err.message);
  });
  
  return codes;
}

/**
 * 检查并补充Redis码池
 * @param {Object} redisClient - Redis客户端实例
 */
async function checkAndRefillPool(redisClient) {
  if (!redisClient) return;
  
  try {
    const poolSize = await redisClient.scard(CODE_CONFIG.redisPoolKey);
    
    if (poolSize < CODE_CONFIG.poolMinThreshold) {
      console.log(`[verifyCode] Refilling code pool (current: ${poolSize})`);
      
      const newCodes = generateUniqueCodes(CODE_CONFIG.poolBatchSize);
      const pipeline = redisClient.pipeline();
      
      for (const code of newCodes) {
        pipeline.sadd(CODE_CONFIG.redisPoolKey, code);
      }
      
      // 设置过期时间
      pipeline.expire(CODE_CONFIG.redisPoolKey, CODE_CONFIG.poolExpireSeconds);
      
      await pipeline.exec();
      console.log(`[verifyCode] Added ${newCodes.length} codes to pool`);
    }
  } catch (error) {
    console.error('[verifyCode] Refill pool error:', error.message);
  }
}

/**
 * 手动补充码池（用于初始化或定时任务）
 * @param {Object} redisClient - Redis客户端实例
 * @param {number} count - 补充数量
 */
async function refillPool(redisClient, count = CODE_CONFIG.poolBatchSize) {
  if (!redisClient) {
    throw new Error('Redis client is required');
  }
  
  const newCodes = generateUniqueCodes(count);
  
  const pipeline = redisClient.pipeline();
  for (const code of newCodes) {
    pipeline.sadd(CODE_CONFIG.redisPoolKey, code);
  }
  pipeline.expire(CODE_CONFIG.redisPoolKey, CODE_CONFIG.poolExpireSeconds);
  
  await pipeline.exec();
  console.log(`[verifyCode] Manually added ${newCodes.length} codes to pool`);
  
  return newCodes.length;
}

/**
 * 验证核销码格式
 * @param {string} code - 核销码
 * @returns {boolean}
 */
function isValidCodeFormat(code) {
  if (!code || typeof code !== 'string') return false;
  
  // 检查长度
  if (code.length !== CODE_CONFIG.length) return false;
  
  // 检查字符集
  const charset = CODE_CONFIG.charset;
  for (const char of code) {
    if (!charset.includes(char)) return false;
  }
  
  return true;
}

/**
 * 格式化核销码（添加分隔符便于阅读）
 * @param {string} code - 原始核销码
 * @param {number} groupSize - 每组字符数
 * @param {string} separator - 分隔符
 * @returns {string}
 */
function formatCode(code, groupSize = 4, separator = '-') {
  if (!code) return '';
  
  const parts = [];
  for (let i = 0; i < code.length; i += groupSize) {
    parts.push(code.slice(i, i + groupSize));
  }
  
  return parts.join(separator);
}

/**
 * 获取核销码配置
 * @returns {Object}
 */
function getConfig() {
  return { ...CODE_CONFIG };
}

module.exports = {
  generateRandomCode,
  generateUniqueCodes,
  getCodesFromPool,
  checkAndRefillPool,
  refillPool,
  isValidCodeFormat,
  formatCode,
  getConfig
};
