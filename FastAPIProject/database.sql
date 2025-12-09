-- 微信点餐小程序数据库
-- 创建数据库
CREATE DATABASE IF NOT EXISTS order_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE order_system;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(50) NOT NULL COMMENT '密码',
    nickname VARCHAR(100) COMMENT '昵称',
    phone VARCHAR(20) COMMENT '手机号',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(50) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 菜品分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用 0禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品分类表';

-- 菜品表
CREATE TABLE IF NOT EXISTS dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    description TEXT COMMENT '菜品描述',
    price DECIMAL(10, 2) NOT NULL COMMENT '价格',
    image_url VARCHAR(255) COMMENT '图片URL',
    status TINYINT DEFAULT 1 COMMENT '状态：1上架 0下架',
    sort_order INT DEFAULT 0 COMMENT '排序',
    sales INT DEFAULT 0 COMMENT '销量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
    user_id INT NOT NULL COMMENT '用户ID',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价',
    status TINYINT DEFAULT 1 COMMENT '状态：1待支付 2已支付 3配送中 4已完成 5已取消',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_no (order_no),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL COMMENT '订单ID',
    dish_id INT NOT NULL COMMENT '菜品ID',
    dish_name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    dish_price DECIMAL(10, 2) NOT NULL COMMENT '菜品价格',
    quantity INT NOT NULL COMMENT '数量',
    subtotal DECIMAL(10, 2) NOT NULL COMMENT '小计',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (order_id),
    INDEX idx_dish (dish_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- 插入初始管理员数据
INSERT INTO admins (username, password, real_name) VALUES 
('admin', '123456', '系统管理员'),
('manager', '123456', '店长');

-- 插入初始分类数据
INSERT INTO categories (name, sort_order) VALUES 
('热菜', 1),
('凉菜', 2),
('主食', 3),
('汤类', 4),
('饮料', 5);

-- 插入初始菜品数据
INSERT INTO dishes (category_id, name, description, price, status, sort_order) VALUES 
(1, '宫保鸡丁', '经典川菜，鸡肉鲜嫩，花生酥脆', 38.00, 1, 1),
(1, '鱼香肉丝', '酸甜适中，色泽红亮', 32.00, 1, 2),
(1, '麻婆豆腐', '麻辣鲜香，豆腐嫩滑', 28.00, 1, 3),
(1, '红烧肉', '肥而不腻，入口即化', 48.00, 1, 4),
(2, '凉拌黄瓜', '清爽解腻，开胃小菜', 12.00, 1, 1),
(2, '拍黄瓜', '简单爽口，蒜香浓郁', 10.00, 1, 2),
(2, '凉拌木耳', '营养健康，口感爽脆', 15.00, 1, 3),
(3, '白米饭', '香软可口', 3.00, 1, 1),
(3, '蛋炒饭', '粒粒分明，蛋香四溢', 15.00, 1, 2),
(3, '炒面', '面条劲道，配菜丰富', 18.00, 1, 3),
(4, '西红柿蛋汤', '酸甜可口，营养丰富', 12.00, 1, 1),
(4, '紫菜蛋花汤', '清淡鲜美', 10.00, 1, 2),
(5, '可乐', '冰镇可乐', 5.00, 1, 1),
(5, '雪碧', '冰镇雪碧', 5.00, 1, 2),
(5, '橙汁', '鲜榨橙汁', 12.00, 1, 3);

