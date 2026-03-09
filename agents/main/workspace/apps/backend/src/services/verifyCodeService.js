/**
 * 核销码服务
 * 处理核销码生成、验证、过期等业务逻辑
 */

const { prisma } = require('../config/database');
const redis = require('../config/redis');

// Redis键前缀
const REDIS_KEY_PREFIX = 'verify:code:';
const REDIS_POOL_KEY = 'verify:code:pool';
const CODE_EXPIRE_SECONDS = 300; // 5分钟有效期

/**
 * 核销码池管理
 * 从预生成的码池中获取可用码
 */
const verifyCodePool = {
  /**
   * 从Redis码池获取一个可用码
   * @returns {Promise<string|null>} 核销码
   */
  async getAvailableCode() {
    try {
      // 从Redis集合中弹出一个可用码
      const code = await redis.spop(REDIS_POOL_KEY);
      
      if (code) {
        return code;
      }
      
      // 如果Redis码池为空，从数据库获取
      const poolCode = await prisma.verificationCodePool.findFirst({
        where: { status: 'available' }
      });
      
      if (poolCode) {
        // 更新状态为已使用
        await prisma.verificationCodePool.update({
          where: { id: poolCode.id },
          data: { status: 'used' }
        });
        return poolCode.code;
      }
      
      // 如果都没有，生成临时码（兜底方案）
      return generateTempCode();
    } catch (error) {
      console.error('获取核销码失败:', error);
      // 兜底：生成临时码
      return generateTempCode();
    }
  },

  /**
   * 批量添加核销码到Redis码池
   * @param {string[]} codes - 核销码数组
   * @returns {Promise<number>} 添加成功的数量
   */
  async addCodesToPool(codes) {
    if (!codes || codes.length === 0) return 0;
    return await redis.sadd(REDIS_POOL_KEY, ...codes);
  },

  /**
   * 获取码池剩余数量
   * @returns {Promise<number>}
   */
  async getPoolSize() {
    return await redis.scard(REDIS_POOL_KEY);
  }
};

/**
 * 生成临时核销码（兜底方案）
 * @returns {string} 8位核销码
 */
function generateTempCode() {
  // 生成8位数字+字母的随机码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 计算优惠金额
 * @param {number} amount - 消费金额
 * @param {Object} discountRule - 优惠规则
 * @returns {Object} { discountAmount, actualPay }
 */
function calculateDiscount(amount, discountRule) {
  if (!discountRule || !discountRule.isActive) {
    return {
      discountAmount: 0,
      actualPay: amount
    };
  }

  let discountAmount = 0;
  const { type, value, minAmount, maxDiscount } = discountRule;

  // 检查最低消费限制
  if (minAmount && amount < minAmount) {
    return {
      discountAmount: 0,
      actualPay: amount
    };
  }

  switch (type) {
    case 'percentage':
      // 百分比折扣，如 0.8 表示8折
      discountAmount = amount * (1 - value);
      break;
    case 'fixed':
      // 固定金额减免
      discountAmount = value;
      break;
    case 'buy_one_get_one':
      // 买一送一（这里简化处理为固定折扣50%）
      discountAmount = amount * 0.5;
      break;
    default:
      discountAmount = 0;
  }

  // 检查最高优惠限制
  if (maxDiscount && discountAmount > maxDiscount) {
    discountAmount = maxDiscount;
  }

  // 确保优惠金额不超过消费金额
  if (discountAmount > amount) {
    discountAmount = amount;
  }

  return {
    discountAmount: Math.round(discountAmount * 100) / 100,
    actualPay: Math.round((amount - discountAmount) * 100) / 100
  };
}

/**
 * 生成核销码
 * @param {Object} params
 * @param {string} params.merchantId - 商户ID
 * @param {string} params.ticketId - 票根ID
 * @param {number} params.amount - 消费金额
 * @param {Object} params.discountRule - 优惠规则
 * @returns {Promise<Object>} 核销码记录
 */
async function generateVerifyCode({ merchantId, ticketId, amount, discountRule }) {
  // 1. 从码池获取一个可用码
  const code = await verifyCodePool.getAvailableCode();

  // 2. 计算优惠金额
  const { discountAmount, actualPay } = calculateDiscount(amount, discountRule);

  // 3. 创建核销码记录
  const expireAt = new Date(Date.now() + CODE_EXPIRE_SECONDS * 1000);
  
  const verifyCode = await prisma.verificationCode.create({
    data: {
      code,
      ticketId,
      merchantId,
      amount: parseFloat(amount),
      discountAmount,
      actualPay,
      expireAt,
      status: 'pending'
    }
  });

  // 4. 存储到Redis，设置5分钟过期
  const redisKey = `${REDIS_KEY_PREFIX}${code}`;
  await redis.setex(redisKey, CODE_EXPIRE_SECONDS, JSON.stringify({
    id: verifyCode.id,
    merchantId,
    ticketId,
    amount,
    discountAmount,
    actualPay,
    expireAt: expireAt.toISOString()
  }));

  return verifyCode;
}

/**
 * 验证核销码
 * @param {string} code - 核销码
 * @param {string} merchantId - 商户ID（用于校验）
 * @returns {Promise<Object|null>} 核销码信息
 */
async function validateVerifyCode(code, merchantId) {
  // 1. 先查Redis缓存
  const redisKey = `${REDIS_KEY_PREFIX}${code}`;
  const cached = await redis.get(redisKey);
  
  if (cached) {
    const data = JSON.parse(cached);
    // 校验商户
    if (data.merchantId !== merchantId) {
      return { valid: false, message: '核销码不属于当前商户' };
    }
    return { valid: true, data };
  }

  // 2. 查数据库
  const verifyCode = await prisma.verificationCode.findUnique({
    where: { code },
    include: {
      ticket: true
    }
  });

  if (!verifyCode) {
    return { valid: false, message: '核销码不存在' };
  }

  // 3. 校验状态
  if (verifyCode.status === 'verified') {
    return { valid: false, message: '核销码已被使用' };
  }

  if (verifyCode.status === 'expired' || new Date() > new Date(verifyCode.expireAt)) {
    return { valid: false, message: '核销码已过期' };
  }

  // 4. 校验商户
  if (verifyCode.merchantId !== merchantId) {
    return { valid: false, message: '核销码不属于当前商户' };
  }

  return { valid: true, data: verifyCode };
}

/**
 * 核销码核销
 * @param {string} codeId - 核销码ID
 * @param {string} staffId - 员工ID
 * @returns {Promise<Object>} 核销记录
 */
async function verifyCode(codeId, staffId) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. 更新核销码状态
    const updatedCode = await tx.verificationCode.update({
      where: { id: codeId },
      data: { status: 'verified' }
    });

    // 2. 创建核销记录
    const verification = await tx.verification.create({
      data: {
        codeId: codeId,
        ticketId: updatedCode.ticketId,
        merchantId: updatedCode.merchantId,
        staffId: staffId,
        amount: updatedCode.amount,
        discountAmount: updatedCode.discountAmount,
        actualPay: updatedCode.actualPay
      }
    });

    // 3. 更新票根状态为已使用
    await tx.ticket.update({
      where: { id: updatedCode.ticketId },
      data: { status: 'used' }
    });

    return verification;
  });

  return result;
}

/**
 * 清理过期核销码
 * 将数据库中已过期的核销码状态更新为expired
 * @returns {Promise<number>} 更新的记录数
 */
async function cleanExpiredCodes() {
  const now = new Date();
  
  const result = await prisma.verificationCode.updateMany({
    where: {
      status: 'pending',
      expireAt: {
        lt: now
      }
    },
    data: {
      status: 'expired'
    }
  });

  return result.count;
}

/**
 * 生成二维码URL
 * @param {string} code - 核销码
 * @returns {string} 二维码图片URL
 */
function generateQRCodeUrl(code) {
  // 使用Google Charts API生成二维码（生产环境可替换为本地生成）
  const baseUrl = process.env.QR_CODE_BASE_URL || 'https://api.qrserver.com/v1/create-qr-code/';
  const verifyUrl = `${process.env.APP_BASE_URL || ''}/verify/${code}`;
  return `${baseUrl}?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
}

module.exports = {
  verifyCodePool,
  generateVerifyCode,
  validateVerifyCode,
  verifyCode,
  cleanExpiredCodes,
  calculateDiscount,
  generateQRCodeUrl,
  generateTempCode,
  CODE_EXPIRE_SECONDS
};
