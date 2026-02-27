-- =====================================================
-- 信宜文旅V2 数据库设计
-- Database: xinyi_tourism
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS xinyi_tourism DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE xinyi_tourism;

-- =====================================================
-- 1. Banner表
-- =====================================================
DROP TABLE IF EXISTS banners;
CREATE TABLE banners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(100) COMMENT '标题',
    image_url VARCHAR(500) NOT NULL COMMENT '图片URL',
    link_type VARCHAR(20) COMMENT '链接类型: null/page/external',
    link_value VARCHAR(500) COMMENT '链接值',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下线, 1-上线',
    start_time DATETIME COMMENT '生效开始时间',
    end_time DATETIME COMMENT '生效结束时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_sort (status, sort),
    INDEX idx_time_range (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- 预置Banner数据
INSERT INTO banners (title, image_url, link_type, link_value, sort, status) VALUES
('首页Banner1', 'https://example.com/banner1.jpg', 'page', '/pages/home/index', 1, 1),
('首页Banner2', 'https://example.com/banner2.jpg', 'page', '/pages/attractions/list', 2, 1);

-- =====================================================
-- 2. 景点分类表
-- =====================================================
DROP TABLE IF EXISTS attraction_categories;
CREATE TABLE attraction_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    code VARCHAR(50) NOT NULL COMMENT '分类编码',
    icon VARCHAR(200) COMMENT '图标',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code),
    INDEX idx_sort (sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点分类表';

INSERT INTO attraction_categories (name, code, icon) VALUES
('历史文化', 'history', '🏛️'),
('自然风光', 'nature', '🏞️'),
('休闲康养', 'wellness', '🧘'),
('亲子研学', 'family', '👨‍👩‍👧');

-- =====================================================
-- 3. 景点表
-- =====================================================
DROP TABLE IF EXISTS attractions;
CREATE TABLE attractions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '景点名称',
    name_en VARCHAR(200) COMMENT '英文名称',
    level VARCHAR(20) COMMENT '景点级别: 5A/4A/3A/其他',
    category_id BIGINT COMMENT '分类ID',
    province VARCHAR(50) DEFAULT '广东省' COMMENT '省份',
    city VARCHAR(50) DEFAULT '茂名市' COMMENT '城市',
    district VARCHAR(50) DEFAULT '信宜市' COMMENT '区县',
    address VARCHAR(500) COMMENT '详细地址',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    cover_image VARCHAR(500) COMMENT '封面图',
    description TEXT COMMENT '景点介绍',
    tips TEXT COMMENT '游玩贴士',
    rating DECIMAL(2,1) DEFAULT 0.0 COMMENT '评分',
    review_count INT DEFAULT 0 COMMENT '评价数量',
    view_count BIGINT DEFAULT 0 COMMENT '浏览量',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_level (level),
    INDEX idx_status_sort (status, sort),
    INDEX idx_location (latitude, longitude),
    INDEX idx_rating (rating DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点表';

-- =====================================================
-- 4. 景点图片表
-- =====================================================
DROP TABLE IF EXISTS attraction_images;
CREATE TABLE attraction_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    attraction_id BIGINT NOT NULL COMMENT '景点ID',
    type VARCHAR(20) DEFAULT 'gallery' COMMENT '图片类型: cover/gallery/detail',
    url VARCHAR(500) NOT NULL COMMENT '图片URL',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attraction (attraction_id),
    INDEX idx_attraction_type (attraction_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点图片表';

-- =====================================================
-- 5. 景点开放时间表
-- =====================================================
DROP TABLE IF EXISTS attraction_hours;
CREATE TABLE attraction_hours (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    attraction_id BIGINT NOT NULL COMMENT '景点ID',
    day_of_week TINYINT NOT NULL COMMENT '星期: 1-7 (1=周一)',
    open_time TIME COMMENT '开始时间',
    close_time TIME COMMENT '结束时间',
    last_entry_time TIME COMMENT '最晚入场时间',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-休息, 1-营业',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_attraction_day (attraction_id, day_of_week),
    INDEX idx_attraction (attraction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点开放时间表';

-- =====================================================
-- 6. 民宿表
-- =====================================================
DROP TABLE IF EXISTS homestays;
CREATE TABLE homestays (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(200) NOT NULL COMMENT '民宿名称',
    province VARCHAR(50) DEFAULT '广东省' COMMENT '省份',
    city VARCHAR(50) DEFAULT '茂名市' COMMENT '城市',
    district VARCHAR(50) DEFAULT '信宜市' COMMENT '区县',
    address VARCHAR(500) COMMENT '详细地址',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    cover_image VARCHAR(500) COMMENT '封面图',
    description TEXT COMMENT '民宿介绍',
    facilities JSON COMMENT '设施标签: ["wifi", "parking", "breakfast"]',
    rating DECIMAL(2,1) DEFAULT 0.0 COMMENT '评分',
    review_count INT DEFAULT 0 COMMENT '评价数量',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_sort (status, sort),
    INDEX idx_location (latitude, longitude),
    INDEX idx_rating (rating DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民宿表';

-- =====================================================
-- 7. 民宿图片表
-- =====================================================
DROP TABLE IF EXISTS homestay_images;
CREATE TABLE homestay_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    homestay_id BIGINT NOT NULL COMMENT '民宿ID',
    type VARCHAR(20) DEFAULT 'gallery' COMMENT '图片类型',
    url VARCHAR(500) NOT NULL COMMENT '图片URL',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_homestay (homestay_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民宿图片表';

-- =====================================================
-- 8. 民宿房间表
-- =====================================================
DROP TABLE IF EXISTS homestay_rooms;
CREATE TABLE homestay_rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    homestay_id BIGINT NOT NULL COMMENT '民宿ID',
    name VARCHAR(100) NOT NULL COMMENT '房型名称',
    description TEXT COMMENT '房型描述',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    stock INT DEFAULT 0 COMMENT '库存',
    max_occupancy INT DEFAULT 2 COMMENT '最大入住人数',
    bed_type VARCHAR(50) COMMENT '床型',
    area INT COMMENT '面积(平方米)',
    images JSON COMMENT '房间图片JSON数组',
    facilities JSON COMMENT '设施标签',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_homestay (homestay_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民宿房间表';

-- =====================================================
-- 9. 民宿评价表
-- =====================================================
DROP TABLE IF EXISTS homestay_reviews;
CREATE TABLE homestay_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    homestay_id BIGINT NOT NULL COMMENT '民宿ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    order_id BIGINT COMMENT '关联订单ID',
    rating DECIMAL(2,1) NOT NULL COMMENT '评分(1-5)',
    content TEXT COMMENT '评价内容',
    images JSON COMMENT '评价图片JSON数组',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_homestay (homestay_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='民宿评价表';

-- =====================================================
-- 10. 拼车上车点表
-- =====================================================
DROP TABLE IF EXISTS carpool_locations;
CREATE TABLE carpool_locations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '上车点名称',
    type VARCHAR(20) DEFAULT 'other' COMMENT '类型: town/attraction/other',
    address VARCHAR(500) COMMENT '地址',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    description TEXT COMMENT '描述',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status_sort (status, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拼车上车点表';

INSERT INTO carpool_locations (name, type, address, longitude, latitude, sort) VALUES
('白石镇政府', 'town', '信宜市白石镇', 110.9541, 22.3232, 1),
('钱排镇中心', 'town', '信宜市钱排镇', 110.9428, 22.1725, 2),
('李花谷景区', 'attraction', '信宜市钱排镇李花谷', 110.9285, 22.1587, 3);

-- =====================================================
-- 11. 拼车目的地表
-- =====================================================
DROP TABLE IF EXISTS carpool_destinations;
CREATE TABLE carpool_destinations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(100) NOT NULL COMMENT '目的地名称',
    type VARCHAR(20) DEFAULT 'other' COMMENT '类型: station/attraction/other',
    address VARCHAR(500) COMMENT '地址',
    longitude DECIMAL(10,7) COMMENT '经度',
    latitude DECIMAL(10,7) COMMENT '纬度',
    description TEXT COMMENT '描述',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status_sort (status, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拼车目的地表';

INSERT INTO carpool_destinations (name, type, address, longitude, latitude, sort) VALUES
('茂名南站（高铁）', 'station', '茂名市茂南区', 110.9254, 21.6629, 1);

-- =====================================================
-- 12. 高铁班次表
-- =====================================================
DROP TABLE IF EXISTS train_schedules;
CREATE TABLE train_schedules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    train_no VARCHAR(20) NOT NULL COMMENT '班次号',
    departure_station VARCHAR(100) NOT NULL COMMENT '出发站',
    arrival_station VARCHAR(100) NOT NULL COMMENT '到达站',
    departure_time TIME NOT NULL COMMENT '发车时间',
    arrival_time TIME NOT NULL COMMENT '到达时间',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_train_no (train_no),
    INDEX idx_departure_time (departure_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='高铁班次表';

INSERT INTO train_schedules (train_no, departure_station, arrival_station, departure_time, arrival_time) VALUES
('D7124', '信宜', '茂名南', '10:00:00', '10:45:00'),
('D7126', '信宜', '茂名南', '11:00:00', '11:45:00');

-- =====================================================
-- 13. 车辆表
-- =====================================================
DROP TABLE IF EXISTS vehicles;
CREATE TABLE vehicles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    plate_number VARCHAR(20) NOT NULL COMMENT '车牌号',
    brand VARCHAR(50) COMMENT '品牌',
    model VARCHAR(50) COMMENT '型号',
    type VARCHAR(20) COMMENT '车型: 5座/7座/9座',
    capacity INT DEFAULT 0 COMMENT '载客量',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_plate (plate_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆表';

INSERT INTO vehicles (plate_number, brand, model, type, capacity) VALUES
('粤K·88888', '丰田', '埃尔法', '9座', 9),
('粤K·99999', '本田', '奥德赛', '7座', 7);

-- =====================================================
-- 14. 司机表
-- =====================================================
DROP TABLE IF EXISTS drivers;
CREATE TABLE drivers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    id_card VARCHAR(50) COMMENT '身份证号',
    license_no VARCHAR(50) COMMENT '驾驶证号',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-停用, 1-启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='司机表';

INSERT INTO drivers (name, phone) VALUES
('王师傅', '13800000000'),
('李师傅', '13800000001');

-- =====================================================
-- 15. 拼车订单表
-- =====================================================
DROP TABLE IF EXISTS carpool_orders;
CREATE TABLE carpool_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    location_id BIGINT COMMENT '上车点ID',
    destination_id BIGINT COMMENT '目的地ID',
    schedule_id BIGINT COMMENT '班次ID',
    train_date DATE COMMENT '高铁日期',
    departure_time DATETIME COMMENT '出发时间(计算得出)',
    passenger_count TINYINT DEFAULT 1 COMMENT '乘车人数',
    contact_name VARCHAR(50) NOT NULL COMMENT '联系人',
    contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-待匹配, 1-匹配中, 2-待支付, 3-已支付, 4-已完成, 5-已取消',
    total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '总价',
    price_per_person DECIMAL(10,2) DEFAULT 0.00 COMMENT '人均价格',
    vehicle_id BIGINT COMMENT '车辆ID',
    driver_id BIGINT COMMENT '司机ID',
    pickup_time DATETIME COMMENT '实际上车时间',
    estimated_arrival DATETIME COMMENT '预计到达时间',
    cancel_reason TEXT COMMENT '取消原因',
    remark TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_order_no (order_no),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_train_date (train_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拼车订单表';

-- =====================================================
-- 16. 支付记录表
-- =====================================================
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    order_no VARCHAR(50) NOT NULL COMMENT '订单号',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    payment_method VARCHAR(20) COMMENT '支付方式: wechat/alipay',
    transaction_no VARCHAR(100) COMMENT '交易流水号',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-待支付, 1-成功, 2-失败, 3-已退款',
    pay_time DATETIME COMMENT '支付时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_transaction_no (transaction_no),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- =====================================================
-- 17. 资讯文章表
-- =====================================================
DROP TABLE IF EXISTS articles;
CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    cover_image VARCHAR(500) COMMENT '封面图',
    category VARCHAR(20) DEFAULT 'news' COMMENT '分类: news/activity',
    summary TEXT COMMENT '摘要',
    content TEXT NOT NULL COMMENT '内容(HTML)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下线, 1-上线',
    view_count BIGINT DEFAULT 0 COMMENT '浏览量',
    sort INT DEFAULT 0 COMMENT '排序',
    published_at DATETIME COMMENT '发布时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_sort (status, sort),
    INDEX idx_published_at (published_at),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资讯文章表';

-- =====================================================
-- 18. 用户表
-- =====================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    openid VARCHAR(100) COMMENT '微信OpenID',
    phone VARCHAR(20) COMMENT '手机号',
    nickname VARCHAR(100) COMMENT '昵称',
    avatar VARCHAR(500) COMMENT '头像',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_openid (openid),
    UNIQUE KEY uk_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =====================================================
-- 19. 数据字典表
-- =====================================================
DROP TABLE IF EXISTS dicts;
CREATE TABLE dicts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    type VARCHAR(50) NOT NULL COMMENT '字典类型',
    code VARCHAR(50) NOT NULL COMMENT '字典编码',
    name VARCHAR(100) NOT NULL COMMENT '字典名称',
    value TEXT COMMENT '字典值(JSON)',
    sort INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_type_code (type, code),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据字典表';

INSERT INTO dicts (type, code, name, sort) VALUES
('attraction_level', '5A', '5A级景区', 1),
('attraction_level', '4A', '4A级景区', 2),
('attraction_level', '3A', '3A级景区', 3),
('attraction_level', 'other', '其他', 4),
('carpool_price_type', 'per_person', '按人头计费', 1),
('homestay_bed_type', '大床', '1.8米大床', 1),
('homestay_bed_type', '双床', '1.2米双床', 2),
('homestay_bed_type', '大+双', '大床+双床', 3);

-- =====================================================
-- 20. 系统配置表
-- =====================================================
DROP TABLE IF EXISTS system_configs;
CREATE TABLE system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    key VARCHAR(100) NOT NULL COMMENT '配置键',
    value TEXT COMMENT '配置值',
    description VARCHAR(200) COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_key (key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

INSERT INTO system_configs (key, value, description) VALUES
('carpool_base_price', '80', '拼车基础单价(元/人)'),
('carpool_cancel_hours', '6', '出发前可取消小时数'),
('min_passengers', '1', '最少乘车人数'),
('default_city', '信宜市', '默认城市');

-- =====================================================
-- 视图创建
-- =====================================================

-- 景点完整信息视图
CREATE VIEW v_attractions AS
SELECT 
    a.*,
    ac.name as category_name,
    GROUP_CONCAT(ai.url ORDER BY ai.sort) as images
FROM attractions a
LEFT JOIN attraction_categories ac ON a.category_id = ac.id
LEFT JOIN attraction_images ai ON a.id = ai.attraction_id AND ai.type = 'gallery'
GROUP BY a.id;

-- 民宿完整信息视图
CREATE VIEW v_homestays AS
SELECT 
    h.*,
    GROUP_CONCAT(hi.url ORDER BY hi.sort) as images,
    MIN(hr.price) as price_from
FROM homestays h
LEFT JOIN homestay_images hi ON h.id = hi.homestay_id
LEFT JOIN homestay_rooms hr ON h.id = hr.homestay_id AND hr.status = 1
GROUP BY h.id;

-- 订单完整信息视图
CREATE VIEW v_carpool_orders AS
SELECT 
    o.*,
    l.name as location_name,
    d.name as destination_name,
    t.train_no,
    t.departure_time as schedule_departure_time,
    v.model as vehicle_model,
    v.plate_number,
    dr.name as driver_name,
    dr.phone as driver_phone
FROM carpool_orders o
LEFT JOIN carpool_locations l ON o.location_id = l.id
LEFT JOIN carpool_destinations d ON o.destination_id = d.id
LEFT JOIN train_schedules t ON o.schedule_id = t.id
LEFT JOIN vehicles v ON o.vehicle_id = v.id
LEFT JOIN drivers dr ON o.driver_id = dr.id;

-- =====================================================
-- 存储过程
-- =====================================================

-- 生成订单号
DELIMITER //
CREATE PROCEDURE generate_order_no(INOUT order_no VARCHAR(50))
BEGIN
    DECLARE date_str VARCHAR(8);
    DECLARE seq INT DEFAULT 0;
    
    SET date_str = DATE_FORMAT(NOW(), '%Y%m%d');
    
    SELECT MAX(CAST(SUBSTRING(order_no, 9) AS UNSIGNED)) + 1 
    INTO seq
    FROM carpool_orders 
    WHERE LEFT(order_no, 8) = CONCAT('ORD', date_str);
    
    IF seq IS NULL OR seq = 0 THEN
        SET seq = 1;
    END IF;
    
    SET order_no = CONCAT('ORD', date_str, LPAD(seq, 5, '0'));
END //
DELIMITER ;

-- =====================================================
-- 触发器
-- =====================================================

-- 自动更新评价数量
DELIMITER //
CREATE TRIGGER tr_homestay_review ON homestay_reviews
FOR EACH ROW
BEGIN
    UPDATE homestays 
    SET_count
AFTER INSERT review_count = (
        SELECT COUNT(*) FROM homestay_reviews 
        WHERE homestay_id = NEW.homestay_id AND status = 1
    )
    WHERE id = NEW.homestay_id;
END //
DELIMITER ;

-- =====================================================
-- 初始化数据完成
-- =====================================================
