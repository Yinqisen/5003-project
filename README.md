# 微信点餐小程序 - FastAPI后端

一个完整的微信点餐小程序系统，包含FastAPI后端和微信小程序前端。

## 项目结构

```
FastAPIProject/
├── main.py              # 主应用入口
├── database.py          # 数据库连接配置
├── models.py            # 数据模型定义
├── database.sql         # 数据库初始化SQL文件
├── requirements.txt     # Python依赖
└── README.md           # 项目文档

miniprogram-1/
├── app.js              # 小程序主入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── pages/              # 页面目录
│   ├── login/         # 登录页
│   ├── index/         # 首页（菜品列表）
│   ├── cart/          # 购物车
│   ├── order/         # 订单列表
│   ├── order-detail/  # 订单详情
│   └── my/            # 我的
└── utils/
    ├── request.js     # API请求封装
    └── util.js        # 工具函数
```

## 功能特性

### 用户端
- 用户登录（微信授权/快速登录）
- 浏览菜品（按分类）
- 加入购物车
- 下单购买
- 订单管理（查看、取消）
- 个人中心

### 管理端API
- 管理员登录
- 菜品管理（增删改查）
- 分类管理（增删改查）
- 订单管理（查看、更新状态）
- 数据统计

## 数据库设计

### 主要表结构
- `users` - 用户表
- `admins` - 管理员表
- `categories` - 菜品分类表
- `dishes` - 菜品表
- `orders` - 订单表
- `order_items` - 订单明细表

## 快速开始

### 1. 数据库配置

确保已安装MySQL，然后导入数据库：

```bash
# 登录MySQL
mysql -u root -psun834214

# 导入SQL文件
source database.sql
```

数据库配置信息：
- 主机：localhost
- 端口：3306
- 用户：root
- 密码：sun834214
- 数据库：order_system

### 2. 安装后端依赖

```bash
cd FastAPIProject
pip install -r requirements.txt
```

### 3. 启动后端服务

```bash
# 开发模式
python main.py

# 或使用uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

服务将在 http://localhost:8000 启动

### 4. 配置微信小程序

1. 使用微信开发者工具打开 `miniprogram-1` 目录
2. 修改 `utils/request.js` 中的 `BASE_URL` 为你的后端地址
3. 编译并预览小程序

## API文档

启动服务后访问：http://localhost:8000/docs

### 主要接口

#### 用户相关
- `POST /api/user/login` - 用户登录
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/update` - 更新用户信息

#### 管理员相关
- `POST /api/admin/login` - 管理员登录
- `POST /api/admin/create` - 创建管理员
- `GET /api/admin/list` - 管理员列表

#### 分类相关
- `GET /api/category/list` - 分类列表
- `POST /api/category/create` - 创建分类
- `PUT /api/category/{id}` - 更新分类
- `DELETE /api/category/{id}` - 删除分类

#### 菜品相关
- `GET /api/dish/list` - 菜品列表
- `GET /api/dish/{id}` - 菜品详情
- `POST /api/dish/create` - 创建菜品
- `PUT /api/dish/{id}` - 更新菜品
- `DELETE /api/dish/{id}` - 删除菜品

#### 订单相关
- `POST /api/order/create` - 创建订单
- `GET /api/order/my` - 我的订单
- `GET /api/order/list` - 订单列表（管理员）
- `GET /api/order/{id}` - 订单详情
- `PUT /api/order/{id}/status` - 更新订单状态
- `DELETE /api/order/{id}` - 取消订单

#### 统计相关
- `GET /api/statistics/overview` - 数据概览

## 默认账号

### 管理员账号
- 用户名：admin
- 密码：123456

- 用户名：manager
- 密码：123456

### 测试数据
数据库中已预置：
- 5个菜品分类
- 15道示例菜品
- 2个管理员账号

## 技术栈

### 后端
- FastAPI - 现代Web框架
- PyMySQL - MySQL数据库驱动
- Pydantic - 数据验证
- Uvicorn - ASGI服务器

### 前端
- 微信小程序原生开发
- WXML + WXSS + JavaScript

## 开发说明

### 安全性
- 密码明文存储（仅用于演示，生产环境请使用加密）
- Token简化处理（生产环境建议使用JWT）
- 微信登录mock处理（实际需对接微信API）

### CORS配置
后端已配置允许所有来源，生产环境请根据需要调整。

### 数据库连接
使用连接池管理，自动处理连接的获取和释放。

## 注意事项

1. 本项目仅供学习参考使用
2. 密码采用明文存储，不适用于生产环境
3. 微信登录功能需要配置真实的AppID和AppSecret
4. 图片上传功能未实现，需自行添加
5. 支付功能未实现，需接入微信支付

## 待优化功能

- [ ] 密码加密存储
- [ ] JWT Token认证
- [ ] 图片上传功能
- [ ] 微信支付接入
- [ ] Redis缓存
- [ ] 日志系统
- [ ] 单元测试
- [ ] Docker部署

## 许可证

MIT License

## 联系方式

如有问题，欢迎提Issue。

