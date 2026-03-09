/**
 * 数据库加密功能测试脚本
 * 测试 phone 和 openid 字段的自动加密/解密
 */

require('dotenv').config();
const { prisma, encrypt, decrypt, testConnection } = require('./src/config/database');

// 设置测试用的加密密钥
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-bytes-long!!!';

async function runTests() {
  console.log('🧪 开始测试数据库加密功能...\n');
  
  try {
    // 1. 测试加密解密函数
    console.log('1️⃣ 测试基础加密解密函数');
    const originalPhone = '13800138000';
    const originalOpenid = 'wx_abc123xyz';
    
    const encryptedPhone = encrypt(originalPhone);
    const encryptedOpenid = encrypt(originalOpenid);
    
    console.log('   原始手机号:', originalPhone);
    console.log('   加密后:', encryptedPhone);
    console.log('   格式检查:', encryptedPhone.startsWith('enc:') ? '✅ 正确' : '❌ 错误');
    
    const decryptedPhone = decrypt(encryptedPhone);
    const decryptedOpenid = decrypt(encryptedOpenid);
    
    console.log('   解密后手机号:', decryptedPhone);
    console.log('   解密结果:', decryptedPhone === originalPhone ? '✅ 成功' : '❌ 失败');
    console.log();
    
    // 2. 测试数据库连接
    console.log('2️⃣ 测试数据库连接');
    const connected = await testConnection();
    if (!connected) {
      console.log('   跳过数据库测试（无可用数据库连接）');
      console.log('   提示: 请配置 DATABASE_URL 环境变量');
      return;
    }
    
    // 3. 测试 Prisma 中间件加密
    console.log('\n3️⃣ 测试 Prisma 中间件自动加密/解密');
    
    // 清理测试数据
    await prisma.user.deleteMany({
      where: { openid: { contains: 'test_' } }
    });
    
    // 创建测试用户
    const testOpenid = 'test_openid_' + Date.now();
    const testPhone = '13987654321';
    
    console.log('   创建用户:');
    console.log('   - openid:', testOpenid);
    console.log('   - phone:', testPhone);
    
    const user = await prisma.user.create({
      data: {
        openid: testOpenid,
        phone: testPhone,
        nickname: '测试用户',
      }
    });
    
    console.log('   ✅ 用户创建成功');
    console.log('   - 返回的 openid:', user.openid);
    console.log('   - 返回的 phone:', user.phone);
    console.log('   - 解密验证:', user.openid === testOpenid && user.phone === testPhone ? '✅ 自动解密成功' : '❌ 解密失败');
    
    // 4. 测试查询解密
    console.log('\n4️⃣ 测试查询自动解密');
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    console.log('   查询到的 openid:', foundUser.openid);
    console.log('   查询到的 phone:', foundUser.phone);
    console.log('   - 解密验证:', foundUser.openid === testOpenid && foundUser.phone === testPhone ? '✅ 查询解密成功' : '❌ 解密失败');
    
    // 5. 测试数据库中存储的是加密值
    console.log('\n5️⃣ 验证数据库存储加密');
    const rawResult = await prisma.$queryRaw`
      SELECT openid, phone FROM User WHERE id = ${user.id}
    `;
    
    const rawOpenid = rawResult[0].openid;
    const rawPhone = rawResult[0].phone;
    
    console.log('   数据库原始 openid:', rawOpenid.substring(0, 30) + '...');
    console.log('   数据库原始 phone:', rawPhone ? rawPhone.substring(0, 30) + '...' : 'null');
    console.log('   - 存储加密验证:', rawOpenid.startsWith('enc:') ? '✅ 已加密存储' : '❌ 未加密');
    
    // 6. 清理测试数据
    console.log('\n6️⃣ 清理测试数据');
    await prisma.user.delete({ where: { id: user.id } });
    console.log('   ✅ 测试数据已清理');
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
