/**
 * 加密工具模块
 * 用于敏感数据的加密/解密处理
 */

const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

/**
 * 检查加密是否已启用
 * @returns {boolean}
 */
function isEncryptionEnabled() {
  return !!ENCRYPTION_KEY && ENCRYPTION_KEY.length >= 32;
}

/**
 * 加密文本
 * @param {string} text - 要加密的明文
 * @returns {string} - 加密后的密文（base64格式）
 * @throws {Error} - 未配置密钥时抛出错误
 */
function encrypt(text) {
  if (!isEncryptionEnabled()) {
    throw new Error('ENCRYPTION_KEY is required for production');
  }
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // 返回 iv + authTag + encrypted 的组合
  return iv.toString('base64') + ':' + authTag.toString('base64') + ':' + encrypted;
}

/**
 * 解密密文
 * @param {string} encryptedData - 加密后的密文（base64格式）
 * @returns {string} - 解密后的明文
 * @throws {Error} - 未配置密钥或解密失败时抛出错误
 */
function decrypt(encryptedData) {
  if (!isEncryptionEnabled()) {
    throw new Error('ENCRYPTION_KEY is required for production');
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];
  
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 安全哈希（用于敏感数据单向哈希）
 * @param {string} text - 要哈希的文本
 * @returns {string} - 哈希值
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * 生成随机密钥
 * @returns {string} - 32字节随机密钥（base64）
 */
function generateKey() {
  return crypto.randomBytes(32).toString('base64');
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateKey,
  isEncryptionEnabled,
};
