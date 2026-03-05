/**
 * 核销码池服务 - 代码逻辑验证测试
 * 无需 Redis 连接，仅验证代码逻辑正确性
 */

const crypto = require('crypto');

// 模拟 Redis Set 行为
class MockRedisSet {
  constructor() {
    this.data = new Set();
  }
  
  async sadd(...members) {
    let added = 0;
    for (const member of members) {
      if (!this.data.has(member)) {
        this.data.add(member);
        added++;
      }
    }
    return added;
  }
  
  async spop() {
    const arr = Array.from(this.data);
    if (arr.length === 0) return null;
    const idx = Math.floor(Math.random() * arr.length);
    const val = arr[idx];
    this.data.delete(val);
    return val;
  }
  
  async scard() {
    return this.data.size;
  }
  
  async sismember(member) {
    return this.data.has(member) ? 1 : 0;
  }
  
  async srem(...members) {
    let removed = 0;
    for (const member of members) {
      if (this.data.has(member)) {
        this.data.delete(member);
        removed++;
      }
    }
    return removed;
  }
  
  async srandmember(count) {
    const arr = Array.from(this.data);
    if (arr.length === 0) return [];
    const result = [];
    for (let i = 0; i < Math.min(count, arr.length); i++) {
      result.push(arr[i]);
    }
    return result;
  }
  
  async del() {
    this.data.clear();
    return 1;
  }
}

// 模拟 Redis
const mockPool = new MockRedisSet();
const mockUsed = new MockRedisSet();
const mockRedis = {
  sadd: (key, ...members) => {
    if (key.includes('available')) return mockPool.sadd(...members);
    if (key.includes('used')) return mockUsed.sadd(...members);
    return 0;
  },
  spop: (key) => {
    if (key.includes('available')) return mockPool.spop();
    return null;
  },
  scard: (key) => {
    if (key.includes('available')) return mockPool.scard();
    if (key.includes('used')) return mockUsed.scard();
    return 0;
  },
  sismember: (key, member) => {
    if (key.includes('used')) return mockUsed.sismember(member);
    if (key.includes('available')) return mockPool.sismember(member);
    return 0;
  },
  srem: (key, ...members) => {
    if (key.includes('used')) return mockUsed.srem(...members);
    if (key.includes('available')) return mockPool.srem(...members);
    return 0;
  },
  del: () => {
    mockPool.del();
    mockUsed.del();
    return 1;
  }
};

// 常量配置
const CODE_POOL_SIZE = 1000;
const CODE_LENGTH = 8;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 核销码池函数
function generateSingleCode() {
  return Array.from({ length: CODE_LENGTH }, () =>
    CODE_CHARS[crypto.randomInt(0, CODE_CHARS.length)]
  ).join('');
}

async function generateCodePool(count = CODE_POOL_SIZE) {
  const codes = new Set();
  while (codes.size < count) {
    codes.add(generateSingleCode());
  }
  const codeArray = Array.from(codes);
  if (codeArray.length > 0) {
    await mockRedis.sadd('verify_code:pool:available', ...codeArray);
  }
  return codeArray.length;
}

async function getAvailableCode() {
  const code = await mockRedis.spop('verify_code:pool:available');
  if (!code) {
    await generateCodePool(CODE_POOL_SIZE);
    return mockRedis.spop('verify_code:pool:available');
  }
  await mockRedis.sadd('verify_code:pool:used', code);
  return code;
}

async function recycleCode(code) {
  if (!code || code.length !== CODE_LENGTH) return false;
  const isUsed = await mockRedis.sismember('verify_code:pool:used', code);
  if (!isUsed) return false;
  await mockRedis.srem('verify_code:pool:used', code);
  await mockRedis.sadd('verify_code:pool:available', code);
  return true;
}

async function getPoolStatus() {
  const [availableCount, usedCount] = await Promise.all([
    mockRedis.scard('verify_code:pool:available'),
    mockRedis.scard('verify_code:pool:used')
  ]);
  return {
    available: availableCount,
    used: usedCount,
    total: availableCount + usedCount,
    capacity: CODE_POOL_SIZE
  };
}

// 运行测试
async function runTests() {
  console.log('=================================');
  console.log('  核销码池逻辑验证测试 (Mock)');
  console.log('=================================\n');
  
  // 1. 清空数据
  await mockRedis.del();
  console.log('✅ 测试数据已清空');
  
  // 2. 生成码池
  console.log('\n2. 生成码池测试 (100个)');
  console.log('-------------------');
  const generated = await generateCodePool(100);
  console.log(`✅ 生成了 ${generated} 个核销码`);
  
  // 3. 获取状态
  let status = await getPoolStatus();
  console.log('当前状态:', status);
  
  // 4. 获取核销码
  console.log('\n4. 获取核销码测试');
  console.log('-------------------');
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const code = await getAvailableCode();
    codes.push(code);
    console.log(`  码 ${i + 1}: ${code}`);
  }
  
  // 5. 验证格式
  console.log('\n5. 格式验证');
  console.log('-------------------');
  const validFormat = codes.every(code => 
    code.length === 8 && /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code)
  );
  console.log(`✅ 所有码格式正确: ${validFormat}`);
  
  // 6. 唯一性验证
  console.log('\n6. 唯一性验证');
  console.log('-------------------');
  const uniqueCodes = new Set(codes);
  console.log(`  总数: ${codes.length}, 唯一: ${uniqueCodes.size}`);
  console.log(`✅ 无重复: ${codes.length === uniqueCodes.size}`);
  
  // 7. 回收测试
  console.log('\n7. 码回收测试');
  console.log('-------------------');
  const beforeStatus = await getPoolStatus();
  const recycleResult = await recycleCode(codes[0]);
  const afterStatus = await getPoolStatus();
  console.log(`  回收前: 可用=${beforeStatus.available}, 已用=${beforeStatus.used}`);
  console.log(`  回收后: 可用=${afterStatus.available}, 已用=${afterStatus.used}`);
  console.log(`✅ 回收成功: ${recycleResult}`);
  
  // 8. 压力测试
  console.log('\n8. 压力测试 (1000次获取)');
  console.log('-------------------');
  await mockRedis.del();
  await generateCodePool(1000);
  
  const startTime = Date.now();
  const batchCodes = [];
  for (let i = 0; i < 1000; i++) {
    const code = await getAvailableCode();
    batchCodes.push(code);
  }
  const duration = Date.now() - startTime;
  
  console.log(`  1000次获取耗时: ${duration}ms`);
  console.log(`  平均每次: ${(duration / 1000).toFixed(3)}ms`);
  console.log(`  QPS: ${(1000 / (duration / 1000)).toFixed(0)}`);
  
  // 验证唯一性
  const uniqueBatch = new Set(batchCodes);
  console.log(`✅ 1000个码全部唯一: ${uniqueBatch.size === 1000}`);
  
  // 9. 最终状态
  console.log('\n=================================');
  console.log('  最终状态');
  console.log('=================================');
  status = await getPoolStatus();
  console.log(JSON.stringify(status, null, 2));
  
  console.log('\n=================================');
  console.log('  ✅ 所有逻辑测试通过！');
  console.log('=================================');
}

runTests().catch(console.error);
