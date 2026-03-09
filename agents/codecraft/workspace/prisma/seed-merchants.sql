-- 商户模块测试数据
-- 执行前请确保已运行 prisma migrate

-- ==================== 商户分类 ====================
INSERT INTO `MerchantCategory` (`id`, `name`, `icon`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cat_001', '餐饮美食', '🍽️', 1, true, NOW(), NOW()),
('cat_002', '酒店住宿', '🏨', 2, true, NOW(), NOW()),
('cat_003', '景点门票', '🎫', 3, true, NOW(), NOW()),
('cat_004', '休闲娱乐', '🎭', 4, true, NOW(), NOW()),
('cat_005', '购物商场', '🛍️', 5, true, NOW(), NOW()),
('cat_006', '交通出行', '🚗', 6, false, NOW(), NOW());  -- 禁用状态测试

-- ==================== 商户 ====================
-- 茂名市几个商户（使用真实坐标）
INSERT INTO `Merchant` (`id`, `categoryId`, `name`, `logo`, `description`, `address`, `phone`, `longitude`, `latitude`, `businessHours`, `rating`, `isActive`, `createdAt`, `updatedAt`) VALUES
-- 餐饮类
('mer_001', 'cat_001', '茂名海鲜大排档', 'https://example.com/logo1.jpg', '新鲜海鲜，现点现做，茂名本地特色', '茂名市茂南区人民南路88号', '0668-1234567', 110.9256, 21.6608, '10:00-22:00', 4.8, true, NOW(), NOW()),
('mer_002', 'cat_001', '阿婆牛杂', 'https://example.com/logo2.jpg', '三十年老店，地道茂名风味', '茂名市茂南区油城四路12号', '0668-2345678', 110.9289, 21.6645, '07:00-21:00', 4.9, true, NOW(), NOW()),
('mer_003', 'cat_001', '高州烧鹅店', 'https://example.com/logo3.jpg', '皮脆肉嫩，茂名一绝', '茂名市高州市中山路45号', '0668-3456789', 110.8567, 21.9203, '09:00-20:00', 4.6, true, NOW(), NOW()),

-- 酒店类
('mer_004', 'cat_002', '茂名国际大酒店', 'https://example.com/logo4.jpg', '五星级豪华酒店，市中心黄金地段', '茂名市茂南区油城六路38号', '0668-4567890', 110.9234, 21.6623, '24小时', 4.7, true, NOW(), NOW()),
('mer_005', 'cat_002', '浪漫海岸度假酒店', 'https://example.com/logo5.jpg', '海边度假首选，无敌海景房', '茂名市电白区博贺镇浪漫海岸', '0668-5678901', 111.1234, 21.5123, '24小时', 4.5, true, NOW(), NOW()),

-- 景点类
('mer_006', 'cat_003', '放鸡岛海洋公园', 'https://example.com/logo6.jpg', '茂名第一海岛，潜水圣地', '茂名市电白区放鸡岛', '0668-6789012', 111.2345, 21.4567, '08:00-18:00', 4.6, true, NOW(), NOW()),
('mer_007', 'cat_003', '中国第一滩', 'https://example.com/logo7.jpg', '天然海滨浴场，茂名标志性景点', '茂名市电白区南海街道', '0668-7890123', 111.0890, 21.5234, '全天开放', 4.4, true, NOW(), NOW()),

-- 休闲娱乐类
('mer_008', 'cat_004', '茂名KTV欢唱城', 'https://example.com/logo8.jpg', '高端KTV，聚会首选', '茂名市茂南区文明中路66号', '0668-8901234', 110.9345, 21.6589, '13:00-02:00', 4.3, true, NOW(), NOW()),
('mer_009', 'cat_004', '御水温泉度假村', 'https://example.com/logo9.jpg', '天然温泉，养生休闲', '茂名市电白区麻岗镇', '0668-9012345', 111.0567, 21.5890, '10:00-23:00', 4.7, true, NOW(), NOW()),

-- 测试：无坐标的商户（用于测试距离排序容错）
('mer_010', 'cat_001', '无名小店', NULL, '暂无位置信息', '茂名市某处', NULL, NULL, NULL, '09:00-21:00', 3.5, true, NOW(), NOW()),
-- 测试：已下架商户
('mer_011', 'cat_001', '已关闭餐厅', NULL, '测试下架商户', '茂名市', NULL, 110.9256, 21.6608, NULL, 0.0, false, NOW(), NOW());

-- ==================== 优惠规则 ====================
INSERT INTO `DiscountRule` (`id`, `merchantId`, `title`, `description`, `discountType`, `discountValue`, `minAmount`, `maxDiscount`, `validStart`, `validEnd`, `isActive`, `createdAt`, `updatedAt`) VALUES
-- 茂名海鲜大排档优惠
('dis_001', 'mer_001', '海鲜8折优惠', '凭票根享受海鲜类菜品8折优惠', 'percentage', 8.0, 100.0, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),
('dis_002', 'mer_001', '满200减50', '消费满200元立减50元', 'fixed', 50.0, 200.0, 50.0, '2024-01-01', '2024-12-31', true, NOW(), NOW()),
('dis_003', 'mer_001', '特价生蚝', '特色生蚝每只仅需5元', 'special', 5.0, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),
-- 已过期的优惠
('dis_004', 'mer_001', '春节特惠', '春节期间全场7折', 'percentage', 7.0, NULL, NULL, '2024-02-01', '2024-02-29', true, NOW(), NOW()),

-- 阿婆牛杂优惠
('dis_005', 'mer_002', '牛杂9折', '凭票根享牛杂9折优惠', 'percentage', 9.0, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),

-- 国际大酒店优惠
('dis_006', 'mer_004', '住房8.5折', '凭票根预订客房享8.5折优惠', 'percentage', 8.5, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),
('dis_007', 'mer_004', '自助晚餐特价', '原价168元，凭票根仅需128元', 'special', 128.0, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),

-- 放鸡岛优惠
('dis_008', 'mer_006', '门票8折', '凭票根购买门票享8折优惠', 'percentage', 8.0, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW()),
('dis_009', 'mer_006', '潜水项目减100', '潜水项目立减100元', 'fixed', 100.0, NULL, 100.0, '2024-01-01', '2024-12-31', true, NOW(), NOW()),

-- 御水温泉优惠
('dis_010', 'mer_009', '温泉门票7折', '凭票根享温泉门票7折优惠', 'percentage', 7.0, NULL, NULL, '2024-01-01', '2024-12-31', true, NOW(), NOW());
