/**
 * 核销码池服务
 * 使用Redis Set实现码池，带有分布式锁保护
 */

const redis = require('../config/redis');

const CODE_POOL_KEY = 'verify_code:pool';
const LOCK_KEY = 'verify_code:pool:lock';
const LOCK_TIMEOUT = 10;
const CODE_POOL_SIZE = 1000;
const CODE_LENGTH = 8;

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符

/**
 * 生成随机核销码
 * @returns {string} - 8位核销码
 */
function generateCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 批量生成核销码并存入Redis
 * @param {number} count - 生成数量
 */
async function generateCodePool(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateCode());
  }
  
  if (codes.length > 0) {
    await redis.sadd(CODE_POOL_KEY, ...codes);
  }
}

/**
 * 获取可用核销码（带分布式锁保护）
 * 防止高并发下码池补充的竞态条件
 * @returns {Promise<string|null>} - 核销码或null
 */
async function getAvailableCode() {
  // 1. 先尝试从码池取码
  let code = await redis.spop(CODE_POOL_KEY);
  
  if (!code) {
    // 2. 码池为空，尝试获取分布式锁
    const lock = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TIMEOUT, 'NX');
    
    if (lock === 'OK') {
      // 3. 获取锁成功，再次检查并补充码池
      try {
        code = await redis.spop(CODE_POOL_KEY);
        if (!code) {
          // 4. 确实为空，补充码池
          await generateCodePool(CODE_POOL_SIZE);
          code = await redis.spop(CODE_POOL_KEY);
        }
      } finally {
        // 5. 无论成功与否都释放锁
        await redis.del(LOCK_KEY);
      }
    } else {
      // 6. 获取锁失败，等待后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      return getAvailableCode();
    }
  }
  
  return code;
}

/**
 * 获取码池当前数量
 * @returns {Promise<number>}
 */
async function getPoolSize() {
  return await redis.scard(CODE_POOL_KEY);
}

/**
 * 补充码池（外部定时任务调用）
 * 同样使用分布式锁保护
 * @param {number} targetSize - 目标数量
 */
async function refillPool(targetSize = CODE_POOL_SIZE) {
  const currentSize = await getPoolSize();
  const needCount = targetSize - currentSize;
  
  if (needCount <= 0) {
    return 0;
  }
  
  // 尝试获取锁
  const lock = await redis.set(LOCK_KEY, '1', 'EX', LOCK_TIMEOUT, 'NX');
  
  if (lock !== 'OK') {
    // 未获取到锁，跳过本次补充
    return 0;
  }
  
  try {
    // 双重检查
    const doubleCheckSize = await getPoolSize();
    const actualNeed = targetSize - doubleCheckSize;
    
    if (actualNeed > 0) {
      await generateCodePool(actualNeed);
      return actualNeed;
    }
    return 0;
  } finally {
    await redis.del(LOCK_KEY);
  }
}

module.exports = {
  getAvailableCode,
  getPoolSize,
  refillPool,
  generateCodePool,
  CODE_POOL_KEY,
  LOCK_KEY,
  CODE_POOL_SIZE,
};
