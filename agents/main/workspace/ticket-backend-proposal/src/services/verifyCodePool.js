/**
 * 核销码池服务
 * 使用 Redis Set 预生成和管理核销码，解决高并发下的码碰撞问题
 */

const crypto = require('crypto');
const { redis } = require('../config/redis');

// 常量配置
const CODE_POOL_KEY = 'verify_code:pool:available';
const CODE_USED_KEY = 'verify_code:pool:used';
const CODE_POOL_SIZE = 1000; // 池容量
const CODE_LENGTH = 8; // 核销码长度
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符: 0,O,1,I

/**
 * 生成单个随机核销码
 * @returns {string} 8位核销码
 */
function generateSingleCode() {
  const code = Array.from({ length: CODE_LENGTH }, () =>
    CODE_CHARS[crypto.randomInt(0, CODE_CHARS.length)]
  ).join('');
  return code;
}

/**
 * 预生成核销码池
 * 生成指定数量的不重复核销码并存入 Redis Set
 * @param {number} count - 生成数量，默认 1000
 * @returns {Promise<number>} 实际生成的码数量
 */
async function generateCodePool(count = CODE_POOL_SIZE) {
  const codes = new Set();
  
  // 生成不重复的码
  while (codes.size < count) {
    codes.add(generateSingleCode());
  }
  
  const codeArray = Array.from(codes);
  
  // 批量存入 Redis Set
  if (codeArray.length > 0) {
    await redis.sadd(CODE_POOL_KEY, ...codeArray);
  }
  
  console.log(`[VerifyCodePool] 成功生成 ${codeArray.length} 个核销码到池中`);
  return codeArray.length;
}

/**
 * 从池中获取一个可用的核销码
 * 如果池空了，自动补充
 * @returns {Promise<string|null>} 核销码或null
 */
async function getAvailableCode() {
  // 从 Set 中弹出一个码
  const code = await redis.spop(CODE_POOL_KEY);
  
  if (!code) {
    console.log('[VerifyCodePool] 码池已空，正在补充...');
    // 池空了，立即补充
    await generateCodePool(CODE_POOL_SIZE);
    // 再次尝试获取
    return redis.spop(CODE_POOL_KEY);
  }
  
  // 记录已使用的码（用于统计和追踪）
  await redis.sadd(CODE_USED_KEY, code);
  
  return code;
}

/**
 * 回收核销码
 * 将已使用或过期的码回收至池中重新使用
 * @param {string} code - 要回收的核销码
 * @returns {Promise<boolean>} 是否成功回收
 */
async function recycleCode(code) {
  if (!code || code.length !== CODE_LENGTH) {
    console.warn('[VerifyCodePool] 回收失败：无效的核销码格式');
    return false;
  }
  
  // 检查码是否在已使用集合中
  const isUsed = await redis.sismember(CODE_USED_KEY, code);
  if (!isUsed) {
    console.warn(`[VerifyCodePool] 回收失败：码 ${code} 不在已使用集合中`);
    return false;
  }
  
  // 从已使用集合移除
  await redis.srem(CODE_USED_KEY, code);
  
  // 加回可用池
  await redis.sadd(CODE_POOL_KEY, code);
  
  console.log(`[VerifyCodePool] 成功回收核销码: ${code}`);
  return true;
}

/**
 * 批量回收核销码
 * @param {string[]} codes - 要回收的核销码数组
 * @returns {Promise<number>} 成功回收的数量
 */
async function recycleCodes(codes) {
  if (!Array.isArray(codes) || codes.length === 0) {
    return 0;
  }
  
  // 过滤有效的码
  const validCodes = codes.filter(code => code && code.length === CODE_LENGTH);
  
  if (validCodes.length === 0) {
    return 0;
  }
  
  // 从已使用集合移除
  await redis.srem(CODE_USED_KEY, ...validCodes);
  
  // 加回可用池
  const added = await redis.sadd(CODE_POOL_KEY, ...validCodes);
  
  console.log(`[VerifyCodePool] 批量回收 ${added} 个核销码`);
  return added;
}

/**
 * 获取码池当前状态
 * @returns {Promise<object>} 池状态信息
 */
async function getPoolStatus() {
  const [availableCount, usedCount] = await Promise.all([
    redis.scard(CODE_POOL_KEY),
    redis.scard(CODE_USED_KEY)
  ]);
  
  return {
    available: availableCount,
    used: usedCount,
    total: availableCount + usedCount,
    capacity: CODE_POOL_SIZE,
    usageRate: ((usedCount / (availableCount + usedCount || 1)) * 100).toFixed(2) + '%',
    isHealthy: availableCount > CODE_POOL_SIZE * 0.1 // 可用码少于10%视为不健康
  };
}

/**
 * 检查码是否可用（未被使用）
 * @param {string} code - 核销码
 * @returns {Promise<boolean>} 是否可用
 */
async function isCodeAvailable(code) {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }
  
  const isInPool = await redis.sismember(CODE_POOL_KEY, code);
  return isInPool === 1;
}

/**
 * 检查码是否已被使用
 * @param {string} code - 核销码
 * @returns {Promise<boolean>} 是否已使用
 */
async function isCodeUsed(code) {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }
  
  const isUsed = await redis.sismember(CODE_USED_KEY, code);
  return isUsed === 1;
}

/**
 * 定时补充码池
 * 检查可用码数量，低于阈值时自动补充
 * @param {number} threshold - 补充阈值，默认 100
 * @returns {Promise<number>} 补充的码数量
 */
async function replenishIfNeeded(threshold = 100) {
  const availableCount = await redis.scard(CODE_POOL_KEY);
  
  if (availableCount < threshold) {
    const needCount = CODE_POOL_SIZE - availableCount;
    console.log(`[VerifyCodePool] 可用码数量(${availableCount})低于阈值(${threshold})，补充 ${needCount} 个`);
    return generateCodePool(needCount);
  }
  
  return 0;
}

/**
 * 清理过期数据（可选）
 * 清理已使用集合中过期的记录
 * @returns {Promise<number>} 清理的数量
 */
async function cleanup() {
  // 注意：Redis Set 不支持按时间过期单个元素
  // 如果需要按时间清理，需要使用 Redis 的 Sorted Set
  // 这里仅作为占位，实际实现可能需要结合业务逻辑
  console.log('[VerifyCodePool] 清理任务执行（当前版本无需清理）');
  return 0;
}

/**
 * 清空码池（危险操作，仅用于测试或重置）
 * @returns {Promise<void>}
 */
async function clearPool() {
  await redis.del(CODE_POOL_KEY, CODE_USED_KEY);
  console.log('[VerifyCodePool] 码池已清空');
}

/**
 * 获取随机码但不从池中移除（用于测试）
 * @returns {Promise<string|null>}
 */
async function peekRandomCode() {
  const codes = await redis.srandmember(CODE_POOL_KEY, 1);
  return codes && codes[0] ? codes[0] : null;
}

module.exports = {
  // 核心功能
  generateCodePool,
  getAvailableCode,
  recycleCode,
  recycleCodes,
  
  // 查询功能
  getPoolStatus,
  isCodeAvailable,
  isCodeUsed,
  peekRandomCode,
  
  // 维护功能
  replenishIfNeeded,
  cleanup,
  clearPool,
  
  // 常量
  CODE_POOL_SIZE,
  CODE_LENGTH,
  CODE_CHARS,
  CODE_POOL_KEY,
  CODE_USED_KEY
};
