/**
 * AES加密工具
 * 用于敏感字段（phone、openid）的加密/解密
 */

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

/**
 * 检查加密配置是否有效
 * @returns {boolean}
 */
function isEncryptionEnabled() {
  return ENCRYPTION_KEY && ENCRYPTION_KEY.length === 32;
}

/**
 * AES加密
 * @param {string} text - 待加密的文本
 * @returns {string|null} - 加密后的字符串 (格式: enc:iv:encrypted)
 */
function encrypt(text) {
  if (!text) return null;
  
  // 如果已经是加密格式，直接返回
  if (typeof text === 'string' && text.startsWith('enc:')) {
    return text;
  }
  
  if (!isEncryptionEnabled()) {
    console.warn('[encryption] ENCRYPTION_KEY not set or invalid, returning plain text');
    return text;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `enc:${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[encryption] Encrypt error:', error.message);
    return null;
  }
}

/**
 * AES解密
 * @param {string} encryptedText - 加密后的字符串 (格式: enc:iv:encrypted)
 * @returns {string|null} - 解密后的原始文本
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  // 如果不是加密格式，直接返回
  if (typeof encryptedText !== 'string' || !encryptedText.startsWith('enc:')) {
    return encryptedText;
  }
  
  if (!isEncryptionEnabled()) {
    console.warn('[encryption] ENCRYPTION_KEY not set, cannot decrypt');
    return null;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      console.error('[encryption] Invalid encrypted format');
      return null;
    }
    
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY), 
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[encryption] Decrypt error:', error.message);
    return null;
  }
}

/**
 * 批量加密对象中的敏感字段
 * @param {Object} obj - 待处理的对象
 * @param {string[]} fields - 需要加密的字段名数组
 * @returns {Object} - 处理后的对象
 */
function encryptFields(obj, fields = ['phone', 'openid']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * 批量解密对象中的敏感字段
 * @param {Object} obj - 待处理的对象
 * @param {string[]} fields - 需要解密的字段名数组
 * @returns {Object} - 处理后的对象
 */
function decryptFields(obj, fields = ['phone', 'openid']) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * 生成32字节的加密密钥
 * @returns {string} - 十六进制格式的密钥
 */
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  isEncryptionEnabled,
  generateKey
};
