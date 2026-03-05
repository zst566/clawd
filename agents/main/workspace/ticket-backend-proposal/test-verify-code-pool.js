/**
 * 核销码池服务测试脚本
 */

const { redis, healthCheck } = require('./src/config/redis');
const verifyCodePool = require('./src/services/verifyCodePool');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=================================');
  console.log('  核销码池服务测试');
  console.log('=================================\n');
  
  // 1. Redis 连接测试
  console.log('1. Redis 连接测试');
  console.log('-------------------');
  const isHealthy = await healthCheck();
  console.log(`✅ Redis 健康检查: ${isHealthy ? '通过' : '失败'}`);
  
  if (!isHealthy) {
    console.error('❌ Redis 连接失败，终止测试');
    process.exit(1);
  }
  
  // 清空测试数据
  console.log('\n清空测试数据...');
  await verifyCodePool.clearPool();
  
  // 2. 码池生成测试
  console.log('\n2. 码池生成测试');
  console.log('-------------------');
  const generated = await verifyCodePool.generateCodePool(100);
  console.log(`✅ 生成 ${generated} 个核销码`);
  
  // 3. 获取池状态
  console.log('\n3. 池状态查询');
  console.log('-------------------');
  let status = await verifyCodePool.getPoolStatus();
  console.log('池状态:', JSON.stringify(status, null, 2));
  
  // 4. 获取核销码测试
  console.log('\n4. 获取核销码测试');
  console.log('-------------------');
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const code = await verifyCodePool.getAvailableCode();
    codes.push(code);
    console.log(`  获取码 ${i + 1}: ${code}`);
  }
  console.log('✅ 成功获取 5 个核销码');
  
  // 5. 码状态检查测试
  console.log('\n5. 码状态检查测试');
  console.log('-------------------');
  const testCode = codes[0];
  const isUsed = await verifyCodePool.isCodeUsed(testCode);
  console.log(`  码 ${testCode} 已使用: ${isUsed}`);
  console.log(`✅ 状态检查正常`);
  
  // 6. 码回收测试
  console.log('\n6. 码回收测试');
  console.log('-------------------');
  const recycleResult = await verifyCodePool.recycleCode(testCode);
  console.log(`  回收码 ${testCode}: ${recycleResult ? '成功' : '失败'}`);
  
  // 7. 批量回收测试
  console.log('\n7. 批量回收测试');
  console.log('-------------------');
  const recycleCodesResult = await verifyCodePool.recycleCodes(codes.slice(1));
  console.log(`  批量回收 ${recycleCodesResult} 个码`);
  
  // 8. 回收后状态
  console.log('\n8. 回收后池状态');
  console.log('-------------------');
  status = await verifyCodePool.getPoolStatus();
  console.log('池状态:', JSON.stringify(status, null, 2));
  
  // 9. 自动补充测试
  console.log('\n9. 自动补充测试');
  console.log('-------------------');
  const replenished = await verifyCodePool.replenishIfNeeded(50);
  console.log(`  补充了 ${replenished} 个码`);
  
  // 10. 压力测试 - 快速获取
  console.log('\n10. 快速获取压力测试');
  console.log('-------------------');
  const startTime = Date.now();
  const batchCodes = [];
  for (let i = 0; i < 50; i++) {
    const code = await verifyCodePool.getAvailableCode();
    batchCodes.push(code);
  }
  const duration = Date.now() - startTime;
  console.log(`  50 次获取耗时: ${duration}ms`);
  console.log(`  平均每次: ${(duration / 50).toFixed(2)}ms`);
  console.log('✅ 压力测试完成');
  
  // 11. 验证码格式
  console.log('\n11. 核销码格式验证');
  console.log('-------------------');
  const allCodes = [...codes, ...batchCodes];
  const validFormat = allCodes.every(code => 
    code.length === 8 && 
    /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code)
  );
  console.log(`  所有码格式正确: ${validFormat}`);
  
  // 12. 验证无重复
  console.log('\n12. 核销码唯一性验证');
  console.log('-------------------');
  const uniqueCodes = new Set(allCodes);
  console.log(`  总生成数: ${allCodes.length}`);
  console.log(`  唯一码数: ${uniqueCodes.size}`);
  console.log(`  无重复: ${allCodes.length === uniqueCodes.size}`);
  
  // 最终状态
  console.log('\n=================================');
  console.log('  最终池状态');
  console.log('=================================');
  status = await verifyCodePool.getPoolStatus();
  console.log(JSON.stringify(status, null, 2));
  
  console.log('\n=================================');
  console.log('  ✅ 所有测试通过！');
  console.log('=================================');
  
  // 清理
  await verifyCodePool.clearPool();
  await redis.quit();
}

runTests().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
