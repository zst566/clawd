/**
 * 工具函数测试
 * 运行: node src/utils/test.js
 */

// 设置测试环境变量
process.env.ENCRYPTION_KEY = '01234567890123456789012345678901'; // 32字节密钥

const encryption = require('./encryption');
const verifyCode = require('./verifyCode');
const distance = require('./distance');
const response = require('./response');

// 测试计数
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`${msg} Expected true, got ${value}`);
  }
}

function assertNotNull(value, msg = '') {
  if (value === null || value === undefined) {
    throw new Error(`${msg} Expected non-null value`);
  }
}

console.log('=================================');
console.log('🧪 开始测试工具函数');
console.log('=================================\n');

// ====== encryption.js 测试 ======
console.log('\n📦 encryption.js 测试');
console.log('-------------------------------');

test('encrypt - 应该正确加密文本', () => {
  const encrypted = encryption.encrypt('13800138000');
  assertTrue(encrypted.startsWith('enc:'));
});

test('encrypt - 空值应该返回null', () => {
  assertEqual(encryption.encrypt(null), null);
  assertEqual(encryption.encrypt(''), null);
  assertEqual(encryption.encrypt(undefined), null);
});

test('encrypt - 已加密文本不应重复加密', () => {
  const encrypted = encryption.encrypt('test');
  const doubleEncrypted = encryption.encrypt(encrypted);
  assertEqual(encrypted, doubleEncrypted);
});

test('decrypt - 应该正确解密', () => {
  const original = '13800138000';
  const encrypted = encryption.encrypt(original);
  const decrypted = encryption.decrypt(encrypted);
  assertEqual(decrypted, original);
});

test('decrypt - 未加密文本应原样返回', () => {
  const plain = 'plaintext';
  assertEqual(encryption.decrypt(plain), plain);
});

test('encryptFields/decryptFields - 批量加解密', () => {
  const obj = { name: '张三', phone: '13800138000', openid: 'wx123456' };
  const encrypted = encryption.encryptFields(obj);
  assertTrue(encrypted.phone.startsWith('enc:'));
  assertTrue(encrypted.openid.startsWith('enc:'));
  assertEqual(encrypted.name, '张三');
  
  const decrypted = encryption.decryptFields(encrypted);
  assertEqual(decrypted.phone, '13800138000');
  assertEqual(decrypted.openid, 'wx123456');
});

test('generateKey - 应生成32字节密钥', () => {
  const key = encryption.generateKey();
  assertEqual(key.length, 64); // hex格式，32字节 = 64字符
});

// ====== verifyCode.js 测试 ======
console.log('\n📦 verifyCode.js 测试');
console.log('-------------------------------');

test('generateRandomCode - 默认长度12', () => {
  const code = verifyCode.generateRandomCode();
  assertEqual(code.length, 12);
});

test('generateRandomCode - 指定长度', () => {
  const code = verifyCode.generateRandomCode(8);
  assertEqual(code.length, 8);
});

test('generateRandomCode - 不含易混淆字符', () => {
  const code = verifyCode.generateRandomCode();
  const confusing = /[0O1Il]/;
  assertTrue(!confusing.test(code), 'Code should not contain 0, O, 1, I, l');
});

test('generateUniqueCodes - 生成不重复码', () => {
  const codes = verifyCode.generateUniqueCodes(100);
  const uniqueCodes = new Set(codes);
  assertEqual(uniqueCodes.size, 100);
});

test('isValidCodeFormat - 正确格式验证', () => {
  // 有效字符：A-Z(不含IO) + 2-9(不含01)
  assertTrue(verifyCode.isValidCodeFormat('ABCDEF234567'));
  assertTrue(!verifyCode.isValidCodeFormat('ABCDEFGHIJKL')); // 含I
  assertTrue(!verifyCode.isValidCodeFormat('ABCD0EF23456')); // 含0
  assertTrue(!verifyCode.isValidCodeFormat('SHORT')); // 长度不足
});

test('formatCode - 格式化', () => {
  const formatted = verifyCode.formatCode('ABCDEF123456', 4, '-');
  assertEqual(formatted, 'ABCD-EF12-3456');
});

test('getConfig - 获取配置', () => {
  const config = verifyCode.getConfig();
  assertEqual(config.length, 12);
  assertNotNull(config.charset);
});

// ====== distance.js 测试 ======
console.log('\n📦 distance.js 测试');
console.log('-------------------------------');

test('calculateDistance - 计算北京到上海距离', () => {
  // 北京天安门: 39.9042, 116.4074
  // 上海人民广场: 31.2304, 121.4737
  const distance_km = distance.calculateDistance(39.9042, 116.4074, 31.2304, 121.4737);
  assertTrue(distance_km > 1000 && distance_km < 1100, `Distance ${distance_km} should be around 1067km`);
});

test('calculateDistance - 单位转换', () => {
  const km = distance.calculateDistance(0, 0, 0, 1, 'km');
  const m = distance.calculateDistance(0, 0, 0, 1, 'm');
  // 浮点数精度容差
  assertTrue(Math.abs(m - km * 1000) < 10);
});

test('isValidCoordinate - 坐标验证', () => {
  assertTrue(distance.isValidCoordinate(39.9, 116.4));
  assertTrue(!distance.isValidCoordinate(91, 0)); // 纬度越界
  assertTrue(!distance.isValidCoordinate(0, 181)); // 经度越界
  assertTrue(!distance.isValidCoordinate(null, 0));
});

test('calculateDistances - 批量计算', () => {
  const points = [
    { lat: 31.2304, lon: 121.4737, name: '上海' },
    { lat: 39.9042, lon: 116.4074, name: '北京' },
  ];
  const results = distance.calculateDistances(39.9042, 116.4074, points);
  assertEqual(results.length, 2);
  assertTrue(results[0].distance > 0);
  assertEqual(results[1].distance, 0);
});

test('sortByDistance - 距离排序', () => {
  const points = [
    { name: 'C', distance: 100 },
    { name: 'A', distance: 10 },
    { name: 'B', distance: 50 },
  ];
  const sorted = distance.sortByDistance(points);
  assertEqual(sorted[0].name, 'A');
  assertEqual(sorted[2].name, 'C');
});

test('filterByRadius - 半径筛选', () => {
  const points = [
    { name: 'A', distance: 5 },
    { name: 'B', distance: 10 },
    { name: 'C', distance: 20 },
  ];
  const filtered = distance.filterByRadius(points, 10);
  assertEqual(filtered.length, 2);
});

test('buildMySQLDistanceSQL - 生成SQL', () => {
  const sql = distance.buildMySQLDistanceSQL(39.9, 116.4);
  assertTrue(sql.includes('AS distance'));
  assertTrue(sql.includes('6371')); // 地球半径
});

test('buildMySQLNearbyQuery - 生成附近查询', () => {
  const sql = distance.buildMySQLNearbyQuery(39.9, 116.4, 10, 'shops');
  assertTrue(sql.includes('SELECT'));
  assertTrue(sql.includes('FROM shops'));
  assertTrue(sql.includes('ORDER BY distance ASC'));
});

// ====== response.js 测试 ======
console.log('\n📦 response.js 测试');
console.log('-------------------------------');

test('success - 成功响应', () => {
  const res = response.success({ id: 1 }, '操作成功');
  assertEqual(res.code, 200);
  assertEqual(res.data.id, 1);
  assertEqual(res.message, '操作成功');
  assertEqual(res.success, true);
  assertNotNull(res.timestamp);
});

test('error - 错误响应', () => {
  const res = response.error('服务器错误', 500, { detail: 'xxx' });
  assertEqual(res.code, 500);
  assertEqual(res.data, null);
  assertEqual(res.details.detail, 'xxx');
  assertEqual(res.success, false);
});

test('page - 分页响应', () => {
  const list = [{ id: 1 }, { id: 2 }];
  const res = response.page(list, 100, 1, 20);
  assertEqual(res.code, 200);
  assertEqual(res.data.list.length, 2);
  assertEqual(res.data.pagination.total, 100);
  assertEqual(res.data.pagination.page, 1);
  assertEqual(res.data.pagination.totalPages, 5);
  assertEqual(res.data.pagination.hasNext, true);
  assertEqual(res.data.pagination.hasPrev, false);
});

test('created - 创建成功响应', () => {
  const res = response.created({ id: 1 });
  assertEqual(res.code, 201);
});

test('badRequest - 参数错误', () => {
  const res = response.badRequest('参数错误', { field: 'name' });
  assertEqual(res.code, 400);
});

test('notFound - 资源不存在', () => {
  const res = response.notFound('用户');
  assertEqual(res.code, 404);
  assertTrue(res.message.includes('用户'));
});

test('businessError - 业务错误', () => {
  const res = response.businessError(409002, '票根已使用');
  assertEqual(res.code, 409002);
  assertEqual(res.message, '票根已使用');
});

// 测试错误类
console.log('\n📦 errorHandler.js 测试');
console.log('-------------------------------');

const { BusinessError, ValidationError, NotFoundError, asyncHandler } = require('../middleware/errorHandler');

test('BusinessError - 业务错误类', () => {
  const err = new BusinessError('自定义错误', 400, 400001, { field: 'test' });
  assertEqual(err.message, '自定义错误');
  assertEqual(err.statusCode, 400);
  assertEqual(err.businessCode, 400001);
  assertEqual(err.isBusinessError, true);
});

test('ValidationError - 验证错误类', () => {
  const err = new ValidationError('参数错误', { name: '必填' });
  assertEqual(err.statusCode, 422);
  assertEqual(err.businessCode, 400001);
});

test('NotFoundError - 不存在错误类', () => {
  const err = new NotFoundError('票根');
  assertEqual(err.statusCode, 404);
  assertTrue(err.message.includes('票根'));
});

// 总结
console.log('\n=================================');
console.log('✅ 测试完成');
console.log('=================================');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);
console.log('=================================');

process.exit(failed > 0 ? 1 : 0);
