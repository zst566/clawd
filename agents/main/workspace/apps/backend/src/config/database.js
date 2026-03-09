/**
 * Prisma 客户端配置
 * 包含数据库连接和敏感数据加密中间件
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// 加密配置
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // 初始化向量长度

// 敏感字段列表
const SENSITIVE_FIELDS = ['phone', 'openid'];

/**
 * AES-256-CBC 加密
 * @param {string} text - 明文
 * @returns {string} - 加密后的文本 (格式: enc:iv:encrypted)
 */
function encrypt(text) {
  if (!text) return null;
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY 环境变量未设置');
  }
  
  // 如果已经是加密格式，直接返回
  if (typeof text === 'string' && text.startsWith('enc:')) {
    return text;
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
    iv
  );
  
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 存储格式: enc:iv:encrypted
  return `enc:${iv.toString('hex')}:${encrypted}`;
}

/**
 * AES-256-CBC 解密
 * @param {string} encryptedText - 加密文本 (格式: enc:iv:encrypted)
 * @returns {string} - 明文
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  // 如果不是加密格式，直接返回
  if (typeof encryptedText !== 'string' || !encryptedText.startsWith('enc:')) {
    return encryptedText;
  }
  
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY 环境变量未设置');
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      console.warn('Invalid encrypted format:', encryptedText);
      return encryptedText;
    }
    
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), 
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error.message);
    return encryptedText; // 解密失败返回原值
  }
}

/**
 * 递归解密对象中的敏感字段
 * @param {Object|Array} data - 数据对象或数组
 */
function decryptSensitiveFields(data) {
  if (!data) return data;
  
  // 处理数组
  if (Array.isArray(data)) {
    data.forEach(item => decryptSensitiveFields(item));
    return data;
  }
  
  // 处理对象
  if (typeof data === 'object') {
    for (const field of SENSITIVE_FIELDS) {
      if (data[field]) {
        data[field] = decrypt(data[field]);
      }
    }
    
    // 递归处理嵌套对象
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'object' && data[key] !== null) {
        decryptSensitiveFields(data[key]);
      }
    }
  }
  
  return data;
}

/**
 * 加密对象中的敏感字段
 * @param {Object} data - 数据对象
 */
function encryptSensitiveFields(data) {
  if (!data || typeof data !== 'object') return data;
  
  for (const field of SENSITIVE_FIELDS) {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = encrypt(data[field]);
    }
  }
  
  return data;
}

// Prisma 客户端配置选项
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ]
    : [
        { emit: 'stdout', level: 'error' },
      ],
};

// 创建 Prisma 客户端实例
const prisma = new PrismaClient(prismaOptions);

// 注册加密中间件
prisma.$use(async (params, next) => {
  // ===== 写入前加密敏感字段 =====
  if (['create', 'update', 'upsert'].includes(params.action)) {
    if (params.args?.data) {
      encryptSensitiveFields(params.args.data);
    }
    // 处理批量创建
    if (params.args?.data && Array.isArray(params.args.data)) {
      params.args.data.forEach(item => encryptSensitiveFields(item));
    }
  }
  
  // 执行原始查询
  const result = await next(params);
  
  // ===== 读取后解密敏感字段 =====
  if (result) {
    switch (params.action) {
      case 'findUnique':
      case 'findFirst':
      case 'findMany':
      case 'findRaw':
      case 'aggregateRaw':
        decryptSensitiveFields(result);
        break;
      case 'create':
      case 'update':
      case 'upsert':
        decryptSensitiveFields(result);
        break;
      case 'count':
      case 'aggregate':
        // 这些操作返回数字或聚合结果，不需要解密
        break;
      default:
        // 其他操作，尝试解密
        if (typeof result === 'object' && result !== null) {
          decryptSensitiveFields(result);
        }
    }
  }
  
  return result;
});

// 数据库连接测试
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 优雅关闭连接
async function disconnect() {
  await prisma.$disconnect();
  console.log('👋 数据库连接已关闭');
}

// 导出
module.exports = {
  prisma,
  encrypt,
  decrypt,
  testConnection,
  disconnect,
};
