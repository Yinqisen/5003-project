# WeChat food ordering mini-program - FastAPI backend
==========

A complete WeChat food ordering mini-program system, including a FastAPI backend and a WeChat mini-program frontend.

## project structure

```
FastAPIProject/
├── main.py              # Main application entry point
├── database.py          # Database connection configuration
├── models.py            # Data model definition
├── database.sql         # Database initialization SQL file
├── requirements.txt     # Python dependencies
└── README.md           # project documentation

miniprogram-1/
├── app.js              # The main entry point of the mini program
├── app.json            # Mini-program configuration
├── app.wxss            # Global styles
├── pages/              # Table of Contents
│   ├── login/         # entry page
│   ├── index/         # Home Page (Menu List)
│   ├── cart/          # shopping trolley
│   ├── order/         # Order list
│   ├── order-detail/  # Order Details
│   └── my/            # 
└── utils/
    ├── request.js     # API request encapsulation
    └── util.js        # Utility functions



## functional characteristics
### User End
- User Login (WeChat Authorization / Quick Login)
- Browse Dishes (by Category)
- Add to Cart
- Place Order
- Order Management (View, Cancel)
- Personal Center

### Management API
- Administrator Login
- Menu Management (Add, Delete, Update, Query)
- Category Management (Add, Delete, Update, Query)
- Order Management (View, Update Status)
- Data Statistics

##DBD(Database Design)

###Main table structure
- `users` 
- `admins` 
- `categories`
- `dishes` 
- `orders` 
- `order_items` 

## Quick Start

### 1.database configuration

Make sure MySQL is installed and then import the database:
```bash
# Log in to MySQL
mysql -u root -psun834214

#Import SQL file
source database.sql
```

Database configuration information:
- host：localhost
- COM port：3306
  user：root
- passport：sun834214
- database：order_system

### 2. Install backend dependencies

```bash
cd FastAPIProject
pip install -r requirements.txt
```

### 3. Start the backend service.

```bash
# development mode
python main.py

# Or use uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

 http://localhost:8000 

### 4. Configure WeChat Mini Program

1. Open the `miniprogram-1` directory using the WeChat Developer Tool.
2. Compile and preview the mini program

##API documentation

After starting the service, visit:http://localhost:8000/docs

### Main interfaces

#### User-related
- `POST /api/user/login` - users login
- `GET /api/user/info` - Obtain user information
- `PUT /api/user/update` - Update user information

#### Administrator-related
- `POST /api/admin/login` - Administrator Login
- `POST /api/admin/create` - Create an administrator
- `GET /api/admin/list` - List of administrators

#### Classification related
- `GET /api/category/list` -category listings
- `POST /api/category/create` - Create a category
- `PUT /api/category/{id}` - Update Categories
- `DELETE /api/category/{id}` -Delete category

#### Dish-related
- `GET /api/dish/list` - Menu of Dishes
- `GET /api/dish/{id}` - Dish Details
- `POST /api/dish/create` - Create a dish
- `PUT /api/dish/{id}` - Update dishes
- `DELETE /api/dish/{id}` -Delete dish

#### Order-related
- `POST /api/order/create` - create order
- `GET /api/order/my` - my order
- `GET /api/order/list` - Order List (Administrator)
- `GET /api/order/{id}` -Order Details
- `PUT /api/order/{id}/status` - Update order status
- `DELETE /api/order/{id}` -cancellation of order

#### statistical dependence
- `GET /api/statistics/overview` - Data Overview

## Default account

### Administrator account
- user：admin
- password：123456

- user：manager
- password：123456

### test data
has been pre-configured in the database：
- Five categories of dishes
- 15 sample dishes
- 2 administrator accounts
## Technology stack

### Back-end technology
- FastAPI - Modern Web frameworks
- PyMySQL - MySQLDatabase-driven
- Pydantic - data validation
- Uvicorn - ASGI server

### Front-end technology
- Native development of WeChat Mini Programs
- WXML + WXSS + JavaScript

## development specification

### security
- Plain text password storage (for demonstration only; use encryption in production environment)
- Simplified token processing (JWT is recommended in production environment)
- Mock processing for WeChat login (actual implementation requires integration with WeChat API)
### CORSconfiguration
The backend has been configured to allow all sources. Please adjust as needed in the production environment.

### database connection
Connection pool management is used to automatically handle the acquisition and release of connections.



## Functions to be optimized

- [ ] Password encryption storage
- [ ] JWT Token authentication
- [ ] Image upload function
- [ ] WeChat payment integration
- [ ] Redis caching
- [ ] Logging system
- [ ] Unit testing
- [ ] Docker deployment
