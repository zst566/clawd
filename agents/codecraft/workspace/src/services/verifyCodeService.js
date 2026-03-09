/**
 * 核销码服务
 * 管理核销码生成、验证和核销流程
 */

const { PrismaClient } = require('@prisma/client');
const redis = require('../config/redis');

const prisma = new PrismaClient();

/**
 * Redis键前缀
 */
const REDIS_KEY_PREFIX = {
  CODE_POOL: 'verify:code:pool:',       // 码池
  CODE_TICKET: 'verify:code:ticket:',   // 码与票根映射
  VERIFY_LIMIT: 'verify:limit:',        // 核销频率限制
};

/**
 * 核销码状态
 */
const VerifyCodeStatus = {
  PENDING: 'pending',   // 待使用
  USED: 'used',         // 已使用
  EXPIRED: 'expired',   // 已过期
};

/**
 * 配置
 */
const CONFIG = {
  CODE_EXPIRE_MINUTES: 5,           // 核销码有效期（分钟）
  CODE_LENGTH: 8,                   // 核销码长度
  CODE_POOL_SIZE: 1000,             // 码池大小
  MAX_CODES_PER_TICKET: 5,          // 每张票根最大生成核销码次数
  DAILY_GENERATE_LIMIT: 20,         // 每日生成限制
};

/**
 * 优惠金额计算规则
 * @param {Object} ticket - 票根对象
 * @returns {number} - 优惠金额（元）
 */
function calculateDiscount(ticket) {
  if (!ticket || !ticket.type) {
    return 0;
  }

  // 根据票根类型计算优惠金额
  const discountRules = {
    'scenic': 20,      // 景区门票优惠20元
    'hotel': 50,       // 酒店优惠50元
    'restaurant': 15,  // 餐饮优惠15元
    'transport': 10,   // 交通优惠10元
    'entertainment': 25, // 娱乐优惠25元
  };

  // 获取票根类型代码
  const typeCode = ticket.type.code;
  const baseDiscount = discountRules[typeCode] || 10; // 默认10元

  // AI识别的票根额外优惠
  const aiBonus = ticket.aiRecognized ? 5 : 0;

  return baseDiscount + aiBonus;
}

/**
 * 生成随机核销码
 * @returns {string} - 8位核销码
 */
function generateVerifyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  let code = '';
  for (let i = 0; i < CONFIG.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 生成唯一的核销码（检查冲突）
 * @returns {Promise<string>}
 */
async function generateUniqueCode() {
  let code;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    code = generateVerifyCode();
    // 检查数据库中是否已存在
    const existing = await prisma.verifyRecord.findUnique({
      where: { verifyCode: code },
    });
    // 检查Redis中是否已存在
    const redisExists = await redis.exists(`${REDIS_KEY_PREFIX.CODE_TICKET}${code}`);
    
    exists = !!existing || redisExists;
    attempts++;
  }

  if (exists) {
    throw new Error('无法生成唯一核销码，请重试');
  }

  return code;
}

/**
 * 检查票根是否可以生成核销码
 * @param {string} ticketId - 票根ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 检查结果
 */
async function canGenerateCode(ticketId, userId) {
  // 1. 检查票根是否存在且属于当前用户
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
    include: { type: true },
  });

  if (!ticket) {
    return { canGenerate: false, reason: '票根不存在' };
  }

  // 2. 检查票根状态
  if (ticket.status === 'used') {
    return { canGenerate: false, reason: '票根已使用' };
  }

  if (ticket.status === 'expired') {
    return { canGenerate: false, reason: '票根已过期' };
  }

  // 3. 检查有效期
  if (ticket.validEnd && new Date(ticket.validEnd) < new Date()) {
    return { canGenerate: false, reason: '票根已过期' };
  }

  // 4. 检查该票根已有的核销码数量
  const existingCodesCount = await prisma.verifyRecord.count({
    where: { ticketId },
  });

  if (existingCodesCount >= CONFIG.MAX_CODES_PER_TICKET) {
    return { 
      canGenerate: false, 
      reason: `该票根已达到最大核销码生成次数限制（${CONFIG.MAX_CODES_PER_TICKET}次）`,
    };
  }

  // 5. 检查每日生成限制
  const today = new Date().toISOString().split('T')[0];
  const dailyLimitKey = `${REDIS_KEY_PREFIX.VERIFY_LIMIT}${userId}:${today}`;
  const dailyCount = await redis.get(dailyLimitKey);

  if (dailyCount && parseInt(dailyCount) >= CONFIG.DAILY_GENERATE_LIMIT) {
    return { 
      canGenerate: false, 
      reason: `今日核销码生成次数已达上限（${CONFIG.DAILY_GENERATE_LIMIT}次）`,
    };
  }

  return { 
    canGenerate: true, 
    ticket,
    existingCodesCount,
  };
}

/**
 * 生成核销码
 * @param {string} ticketId - 票根ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} - 生成的核销码信息
 */
async function generateVerifyCode(ticketId, userId) {
  // 检查是否可以生成
  const check = await canGenerateCode(ticketId, userId);
  
  if (!check.canGenerate) {
    throw new Error(check.reason);
  }

  const { ticket } = check;

  // 生成唯一核销码
  const verifyCode = await generateUniqueCode();

  // 计算优惠金额
  const discountAmount = calculateDiscount(ticket);

  // 计算过期时间
  const expireAt = new Date();
  expireAt.setMinutes(expireAt.getMinutes() + CONFIG.CODE_EXPIRE_MINUTES);

  // 创建核销记录
  const verifyRecord = await prisma.verifyRecord.create({
    data: {
      ticketId,
      verifyCode,
      discountAmount,
      status: VerifyCodeStatus.PENDING,
      expireAt,
    },
  });

  // 存储到Redis用于快速验证
  const redisKey = `${REDIS_KEY_PREFIX.CODE_TICKET}${verifyCode}`;
  await redis.setex(
    redisKey,
    CONFIG.CODE_EXPIRE_MINUTES * 60,
    JSON.stringify({
      ticketId,
      userId,
      discountAmount,
      expireAt: expireAt.toISOString(),
    })
  );

  // 更新每日生成计数
  const today = new Date().toISOString().split('T')[0];
  const dailyLimitKey = `${REDIS_KEY_PREFIX.VERIFY_LIMIT}${userId}:${today}`;
  await redis.incr(dailyLimitKey);
  // 设置过期时间为当天剩余时间
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const ttlSeconds = Math.ceil((tomorrow - now) / 1000);
  await redis.expire(dailyLimitKey, ttlSeconds);

  return {
    verifyCode,
    discountAmount,
    expireAt,
    ticketName: ticket.name,
    ticketType: ticket.type?.name,
  };
}

/**
 * 验证核销码（商家端调用）
 * @param {string} verifyCode - 核销码
 * @returns {Promise<Object>} - 验证结果
 */
async function validateVerifyCode(verifyCode) {
  // 1. 先检查Redis
  const redisKey = `${REDIS_KEY_PREFIX.CODE_TICKET}${verifyCode}`;
  const redisData = await redis.get(redisKey);

  if (redisData) {
    const data = JSON.parse(redisData);
    
    // 检查是否过期
    if (new Date(data.expireAt) < new Date()) {
      return { valid: false, reason: '核销码已过期' };
    }

    return {
      valid: true,
      ticketId: data.ticketId,
      userId: data.userId,
      discountAmount: data.discountAmount,
      source: 'redis',
    };
  }

  // 2. Redis中没有，检查数据库
  const record = await prisma.verifyRecord.findUnique({
    where: { verifyCode },
    include: {
      ticket: {
        include: {
          type: true,
          user: {
            select: {
              id: true,
              nickname: true,
              phoneLast4: true,
            },
          },
        },
      },
    },
  });

  if (!record) {
    return { valid: false, reason: '核销码不存在' };
  }

  // 检查状态
  if (record.status === VerifyCodeStatus.USED) {
    return { valid: false, reason: '核销码已使用' };
  }

  if (record.status === VerifyCodeStatus.EXPIRED) {
    return { valid: false, reason: '核销码已过期' };
  }

  // 检查过期时间
  if (new Date(record.expireAt) < new Date()) {
    // 更新状态为过期
    await prisma.verifyRecord.update({
      where: { id: record.id },
      data: { status: VerifyCodeStatus.EXPIRED },
    });
    return { valid: false, reason: '核销码已过期' };
  }

  return {
    valid: true,
    ticketId: record.ticketId,
    userId: record.ticket.userId,
    discountAmount: record.discountAmount,
    ticketName: record.ticket.name,
    ticketType: record.ticket.type?.name,
    userNickname: record.ticket.user?.nickname,
    userPhone: record.ticket.user?.phoneLast4,
    source: 'database',
  };
}

/**
 * 核销票根（商家确认核销）
 * @param {string} verifyCode - 核销码
 * @param {string} merchantId - 商家ID（可选，用于记录）
 * @returns {Promise<Object>} - 核销结果
 */
async function useVerifyCode(verifyCode, merchantId = null) {
  // 先验证
  const validation = await validateVerifyCode(verifyCode);
  
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // 更新核销记录
  const record = await prisma.verifyRecord.update({
    where: { verifyCode },
    data: {
      status: VerifyCodeStatus.USED,
      usedAt: new Date(),
    },
  });

  // 更新票根状态
  await prisma.ticket.update({
    where: { id: validation.ticketId },
    data: { status: 'used' },
  });

  // 删除Redis中的记录
  await redis.del(`${REDIS_KEY_PREFIX.CODE_TICKET}${verifyCode}`);

  return {
    success: true,
    verifyCode,
    discountAmount: record.discountAmount,
    usedAt: record.usedAt,
  };
}

/**
 * 获取票根的核销码列表
 * @param {string} ticketId - 票根ID
 * @param {string} userId - 用户ID
 * @returns {Promise<Array>} - 核销码列表
 */
async function getTicketVerifyCodes(ticketId, userId) {
  // 验证票根归属
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) {
    throw new Error('票根不存在');
  }

  const records = await prisma.verifyRecord.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      verifyCode: true,
      discountAmount: true,
      status: true,
      expireAt: true,
      usedAt: true,
      createdAt: true,
    },
  });

  return records.map(record => ({
    ...record,
    isExpired: record.status === 'expired' || 
               (record.status === 'pending' && new Date(record.expireAt) < new Date()),
  }));
}

/**
 * 清理过期的核销码（定时任务调用）
 * @returns {Promise<number>} - 清理数量
 */
async function cleanupExpiredCodes() {
  const expiredRecords = await prisma.verifyRecord.findMany({
    where: {
      status: VerifyCodeStatus.PENDING,
      expireAt: { lt: new Date() },
    },
    select: { id: true, verifyCode: true },
  });

  if (expiredRecords.length === 0) {
    return 0;
  }

  // 批量更新状态
  await prisma.verifyRecord.updateMany({
    where: {
      id: { in: expiredRecords.map(r => r.id) },
    },
    data: { status: VerifyCodeStatus.EXPIRED },
  });

  // 删除Redis中的记录
  for (const record of expiredRecords) {
    await redis.del(`${REDIS_KEY_PREFIX.CODE_TICKET}${record.verifyCode}`);
  }

  return expiredRecords.length;
}

module.exports = {
  // 核心方法
  generateVerifyCode,
  validateVerifyCode,
  useVerifyCode,
  getTicketVerifyCodes,
  canGenerateCode,
  calculateDiscount,
  cleanupExpiredCodes,

  // 常量
  VerifyCodeStatus,
  CONFIG,
  REDIS_KEY_PREFIX,
};
