/**
 * Redis 连接配置
 * 使用 ioredis - 支持连接池、集群、哨兵模式
 */

const Redis = require('ioredis');

// 从环境变量读取配置，提供默认值
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  
  // 连接池配置
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  
  // 重连策略
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] 第 ${times} 次重连，延迟 ${delay}ms`);
    return delay;
  },
  
  // 连接超时配置
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  // 心跳检测
  keepAlive: 30000,
  
  // 错误重连
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT'];
    const shouldReconnect = targetErrors.some(target => 
      err.message.includes(target)
    );
    if (shouldReconnect) {
      console.log('[Redis] 检测到可恢复错误，触发重连:', err.message);
      return true;
    }
    return false;
  },
  
  // 事件监听
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

// 创建 Redis 实例
const redis = new Redis(redisConfig);

// 连接事件监听
redis.on('connect', () => {
  console.log('[Redis] 连接成功');
});

redis.on('ready', () => {
  console.log('[Redis] 服务就绪，可以执行命令');
});

redis.on('error', (err) => {
  console.error('[Redis] 错误:', err.message);
});

redis.on('close', () => {
  console.log('[Redis] 连接关闭');
});

redis.on('reconnecting', (delay) => {
  console.log(`[Redis] 正在重连，${delay}ms 后尝试`);
});

redis.on('end', () => {
  console.log('[Redis] 连接已结束');
});

/**
 * 健康检查函数
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (err) {
    console.error('[Redis] 健康检查失败:', err.message);
    return false;
  }
}

/**
 * 优雅关闭连接
 */
async function gracefulShutdown() {
  console.log('[Redis] 正在关闭连接...');
  await redis.quit();
  console.log('[Redis] 连接已安全关闭');
}

module.exports = {
  redis,
  healthCheck,
  gracefulShutdown,
  redisConfig
};
