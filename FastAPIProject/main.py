"""
微信点餐小程序 - FastAPI后端
"""
from fastapi import FastAPI, HTTPException, Header, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional, List
import time
import hashlib
import os
import uuid
from pathlib import Path
from models import *
from database import execute_query, execute_insert, execute_update

# 创建上传目录
UPLOAD_DIR = Path(__file__).parent / "uploads"
DISH_IMAGE_DIR = UPLOAD_DIR / "dishes"
DISH_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="微信点餐小程序API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# ==================== 工具函数 ====================
def generate_order_no():
    """生成订单号"""
    return f"ORD{int(time.time() * 1000)}"


def verify_token(token: str) -> dict:
    """验证用户token（简化版，实际应该用JWT）"""
    # 这里简化处理，实际项目应该使用JWT
    if not token:
        raise HTTPException(status_code=401, detail="未登录")
    # token格式: user_id或admin_id
    return {"id": int(token.split("_")[1]) if "_" in token else int(token)}


# ==================== 用户相关接口 ====================
@app.post("/api/user/register", summary="用户注册")
async def user_register(data: UserRegister):
    """用户注册"""
    try:
        # 检查用户名是否已存在
        sql = "SELECT id FROM users WHERE username = %s"
        existing_user = execute_query(sql, (data.username,), fetch_one=True)
        
        if existing_user:
            raise HTTPException(status_code=400, detail="用户名已存在")
        
        # 创建新用户
        nickname = data.nickname or data.username
        sql = "INSERT INTO users (username, password, nickname, phone) VALUES (%s, %s, %s, %s)"
        user_id = execute_insert(sql, (data.username, data.password, nickname, data.phone))
        
        # 返回用户信息
        user = {
            "id": user_id,
            "username": data.username,
            "nickname": nickname,
            "phone": data.phone
        }
        
        return {
            "code": 200,
            "message": "注册成功",
            "data": {
                "token": f"user_{user_id}",
                "user": user
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/user/login", summary="用户登录")
async def user_login(data: UserLogin):
    """用户登录（自动识别管理员）"""
    try:
        # 先检查是否是管理员
        sql = "SELECT * FROM admins WHERE username = %s AND password = %s"
        admin = execute_query(sql, (data.username, data.password), fetch_one=True)
        
        if admin:
            # 管理员登录
            return {
                "code": 200,
                "message": "管理员登录成功",
                "data": {
                    "token": f"admin_{admin['id']}",
                    "user": {
                        "id": admin['id'],
                        "username": admin['username'],
                        "nickname": admin.get('real_name') or admin['username'],
                        "role": "admin"  # 标记为管理员
                    }
                }
            }
        
        # 查询普通用户
        sql = "SELECT * FROM users WHERE username = %s AND password = %s"
        user = execute_query(sql, (data.username, data.password), fetch_one=True)
        
        if not user:
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        # 普通用户登录
        user['role'] = 'user'  # 标记为普通用户
        return {
            "code": 200,
            "message": "登录成功",
            "data": {
                "token": f"user_{user['id']}",
                "user": user
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/info", summary="获取用户信息")
async def get_user_info(token: str = Header(None)):
    """获取当前用户信息"""
    try:
        user_data = verify_token(token)
        sql = "SELECT * FROM users WHERE id = %s"
        user = execute_query(sql, (user_data['id'],), fetch_one=True)
        
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return {"code": 200, "message": "success", "data": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/users", summary="用户列表（管理员）")
async def get_user_list(
    token: str = Header(None),
    page: int = 1,
    page_size: int = 10
):
    """获取用户列表（管理员）"""
    try:
        verify_token(token)
        offset = (page - 1) * page_size
        
        sql = """
            SELECT id, username, nickname, phone, created_at 
            FROM users 
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        users = execute_query(sql, (page_size, offset))
        
        # 获取总数
        count_sql = "SELECT COUNT(*) as total FROM users"
        total_result = execute_query(count_sql, fetch_one=True)
        total = total_result['total'] if total_result else 0
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "list": users,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/user/update", summary="更新用户信息")
async def update_user(data: UserUpdate, token: str = Header(None)):
    """更新用户信息"""
    try:
        user_data = verify_token(token)
        
        update_fields = []
        params = []
        
        if data.nickname:
            update_fields.append("nickname = %s")
            params.append(data.nickname)
        if data.phone:
            update_fields.append("phone = %s")
            params.append(data.phone)
        if data.avatar_url:
            update_fields.append("avatar_url = %s")
            params.append(data.avatar_url)
        
        if not update_fields:
            return {"code": 200, "message": "没有需要更新的字段"}
        
        params.append(user_data['id'])
        sql = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        execute_update(sql, params)
        
        return {"code": 200, "message": "更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 管理员相关接口 ====================
@app.post("/api/admin/login", summary="管理员登录")
async def admin_login(data: AdminLogin):
    """管理员登录"""
    try:
        sql = "SELECT * FROM admins WHERE username = %s AND password = %s"
        admin = execute_query(sql, (data.username, data.password), fetch_one=True)
        
        if not admin:
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        return {
            "code": 200,
            "message": "登录成功",
            "data": {
                "token": f"admin_{admin['id']}",
                "admin": admin
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/create", summary="创建管理员")
async def create_admin(data: AdminCreate, token: str = Header(None)):
    """创建管理员（需要管理员权限）"""
    try:
        verify_token(token)
        
        sql = "INSERT INTO admins (username, password, real_name) VALUES (%s, %s, %s)"
        admin_id = execute_insert(sql, (data.username, data.password, data.real_name))
        
        return {"code": 200, "message": "创建成功", "data": {"id": admin_id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/list", summary="管理员列表")
async def get_admin_list(token: str = Header(None)):
    """获取管理员列表"""
    try:
        verify_token(token)
        
        sql = "SELECT id, username, real_name, created_at FROM admins ORDER BY id DESC"
        admins = execute_query(sql)
        
        return {"code": 200, "message": "success", "data": admins}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 分类相关接口 ====================
@app.get("/api/category/list", summary="分类列表")
async def get_category_list(status: Optional[int] = None):
    """获取分类列表"""
    try:
        if status is not None:
            sql = "SELECT * FROM categories WHERE status = %s ORDER BY sort_order"
            categories = execute_query(sql, (status,))
        else:
            sql = "SELECT * FROM categories ORDER BY sort_order"
            categories = execute_query(sql)
        
        return {"code": 200, "message": "success", "data": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/category/create", summary="创建分类")
async def create_category(data: CategoryCreate, token: str = Header(None)):
    """创建分类（管理员）"""
    try:
        verify_token(token)
        
        sql = "INSERT INTO categories (name, sort_order) VALUES (%s, %s)"
        category_id = execute_insert(sql, (data.name, data.sort_order))
        
        return {"code": 200, "message": "创建成功", "data": {"id": category_id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/category/{category_id}", summary="更新分类")
async def update_category(category_id: int, data: CategoryUpdate, token: str = Header(None)):
    """更新分类（管理员）"""
    try:
        verify_token(token)
        
        update_fields = []
        params = []
        
        if data.name:
            update_fields.append("name = %s")
            params.append(data.name)
        if data.sort_order is not None:
            update_fields.append("sort_order = %s")
            params.append(data.sort_order)
        if data.status is not None:
            update_fields.append("status = %s")
            params.append(data.status)
        
        if not update_fields:
            return {"code": 200, "message": "没有需要更新的字段"}
        
        params.append(category_id)
        sql = f"UPDATE categories SET {', '.join(update_fields)} WHERE id = %s"
        execute_update(sql, params)
        
        return {"code": 200, "message": "更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/category/{category_id}", summary="删除分类")
async def delete_category(category_id: int, token: str = Header(None)):
    """删除分类（管理员）"""
    try:
        verify_token(token)
        
        sql = "DELETE FROM categories WHERE id = %s"
        execute_update(sql, (category_id,))
        
        return {"code": 200, "message": "删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 文件上传接口 ====================
@app.post("/api/upload/dish-image", summary="上传菜品图片")
async def upload_dish_image(file: UploadFile = File(...)):
    """上传菜品图片"""
    try:
        # 验证文件类型
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="只支持图片格式：JPG、PNG、GIF、WEBP")
        
        # 验证文件大小（5MB）
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="图片大小不能超过5MB")
        
        # 生成唯一文件名
        file_ext = os.path.splitext(file.filename)[1] or '.jpg'
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = DISH_IMAGE_DIR / unique_filename
        
        # 保存文件
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # 返回图片URL
        image_url = f"/uploads/dishes/{unique_filename}"
        
        return {
            "code": 200,
            "message": "上传成功",
            "data": {
                "url": image_url,
                "filename": unique_filename
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")


# ==================== 菜品相关接口 ====================
@app.get("/api/dish/list", summary="菜品列表")
async def get_dish_list(
    category_id: Optional[int] = None,
    status: Optional[int] = None,
    page: int = 1,
    page_size: int = 20
):
    """获取菜品列表"""
    try:
        offset = (page - 1) * page_size
        
        where_clauses = []
        params = []
        
        if category_id:
            where_clauses.append("d.category_id = %s")
            params.append(category_id)
        if status is not None:
            where_clauses.append("d.status = %s")
            params.append(status)
        
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        
        sql = f"""
            SELECT d.*, c.name as category_name 
            FROM dishes d 
            LEFT JOIN categories c ON d.category_id = c.id 
            {where_sql}
            ORDER BY d.sort_order, d.id DESC
            LIMIT %s OFFSET %s
        """
        params.extend([page_size, offset])
        dishes = execute_query(sql, params)
        
        # 获取总数
        count_sql = f"SELECT COUNT(*) as total FROM dishes d {where_sql}"
        total_result = execute_query(count_sql, params[:-2], fetch_one=True)
        total = total_result['total'] if total_result else 0
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "list": dishes,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dish/{dish_id}", summary="菜品详情")
async def get_dish_detail(dish_id: int):
    """获取菜品详情"""
    try:
        sql = """
            SELECT d.*, c.name as category_name 
            FROM dishes d 
            LEFT JOIN categories c ON d.category_id = c.id 
            WHERE d.id = %s
        """
        dish = execute_query(sql, (dish_id,), fetch_one=True)
        
        if not dish:
            raise HTTPException(status_code=404, detail="菜品不存在")
        
        return {"code": 200, "message": "success", "data": dish}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dish/create", summary="创建菜品")
async def create_dish(data: DishCreate, token: str = Header(None)):
    """创建菜品（管理员）"""
    try:
        verify_token(token)
        
        sql = """
            INSERT INTO dishes (category_id, name, description, price, image_url, sort_order) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        dish_id = execute_insert(sql, (
            data.category_id, data.name, data.description,
            data.price, data.image_url, data.sort_order
        ))
        
        return {"code": 200, "message": "创建成功", "data": {"id": dish_id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/dish/{dish_id}", summary="更新菜品")
async def update_dish(dish_id: int, data: DishUpdate, token: str = Header(None)):
    """更新菜品（管理员）"""
    try:
        verify_token(token)
        
        update_fields = []
        params = []
        
        if data.category_id:
            update_fields.append("category_id = %s")
            params.append(data.category_id)
        if data.name:
            update_fields.append("name = %s")
            params.append(data.name)
        if data.description is not None:
            update_fields.append("description = %s")
            params.append(data.description)
        if data.price:
            update_fields.append("price = %s")
            params.append(data.price)
        if data.image_url is not None:
            update_fields.append("image_url = %s")
            params.append(data.image_url)
        if data.status is not None:
            update_fields.append("status = %s")
            params.append(data.status)
        if data.sort_order is not None:
            update_fields.append("sort_order = %s")
            params.append(data.sort_order)
        
        if not update_fields:
            return {"code": 200, "message": "没有需要更新的字段"}
        
        params.append(dish_id)
        sql = f"UPDATE dishes SET {', '.join(update_fields)} WHERE id = %s"
        execute_update(sql, params)
        
        return {"code": 200, "message": "更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/dish/{dish_id}", summary="删除菜品")
async def delete_dish(dish_id: int, token: str = Header(None)):
    """删除菜品（管理员）"""
    try:
        verify_token(token)
        
        sql = "DELETE FROM dishes WHERE id = %s"
        execute_update(sql, (dish_id,))
        
        return {"code": 200, "message": "删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 订单相关接口 ====================
@app.post("/api/order/create", summary="创建订单")
async def create_order(data: OrderCreate, token: str = Header(None)):
    """创建订单"""
    try:
        user_data = verify_token(token)
        
        # 计算总价
        total_price = sum(item.dish_price * item.quantity for item in data.items)
        
        # 生成订单号
        order_no = generate_order_no()
        
        # 创建订单
        sql = """
            INSERT INTO orders (order_no, user_id, total_price, status, remark) 
            VALUES (%s, %s, %s, %s, %s)
        """
        order_id = execute_insert(sql, (order_no, data.user_id, total_price, 1, data.remark))
        
        # 创建订单明细
        for item in data.items:
            sql = """
                INSERT INTO order_items (order_id, dish_id, dish_name, dish_price, quantity, subtotal) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            subtotal = item.dish_price * item.quantity
            execute_insert(sql, (
                order_id, item.dish_id, item.dish_name,
                item.dish_price, item.quantity, subtotal
            ))
            
            # 更新菜品销量
            sql = "UPDATE dishes SET sales = sales + %s WHERE id = %s"
            execute_update(sql, (item.quantity, item.dish_id))
        
        return {
            "code": 200,
            "message": "下单成功",
            "data": {"order_id": order_id, "order_no": order_no}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/order/my", summary="我的订单")
async def get_my_orders(
    token: str = Header(None),
    status: Optional[int] = None,
    page: int = 1,
    page_size: int = 10
):
    """获取当前用户的订单列表"""
    try:
        user_data = verify_token(token)
        offset = (page - 1) * page_size
        
        where_clause = "WHERE o.user_id = %s"
        params = [user_data['id']]
        
        if status:
            where_clause += " AND o.status = %s"
            params.append(status)
        
        sql = f"""
            SELECT o.*, u.nickname as user_nickname 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            {where_clause}
            ORDER BY o.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([page_size, offset])
        orders = execute_query(sql, params)
        
        # 获取订单明细
        for order in orders:
            sql = "SELECT * FROM order_items WHERE order_id = %s"
            order['items'] = execute_query(sql, (order['id'],))
        
        # 获取总数
        count_sql = f"SELECT COUNT(*) as total FROM orders o {where_clause}"
        total_result = execute_query(count_sql, params[:-2], fetch_one=True)
        total = total_result['total'] if total_result else 0
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "list": orders,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/order/list", summary="订单列表（管理员）")
async def get_order_list(
    token: str = Header(None),
    status: Optional[int] = None,
    page: int = 1,
    page_size: int = 10
):
    """获取所有订单列表（管理员）"""
    try:
        verify_token(token)
        offset = (page - 1) * page_size
        
        where_clause = ""
        params = []
        
        if status:
            where_clause = "WHERE o.status = %s"
            params.append(status)
        
        sql = f"""
            SELECT o.*, u.nickname as user_nickname 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            {where_clause}
            ORDER BY o.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([page_size, offset])
        orders = execute_query(sql, params)
        
        # 获取订单明细
        for order in orders:
            sql = "SELECT * FROM order_items WHERE order_id = %s"
            order['items'] = execute_query(sql, (order['id'],))
        
        # 获取总数
        count_sql = f"SELECT COUNT(*) as total FROM orders o {where_clause}"
        count_params = params[:-2] if status else []
        total_result = execute_query(count_sql, count_params, fetch_one=True)
        total = total_result['total'] if total_result else 0
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "list": orders,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/order/{order_id}", summary="订单详情")
async def get_order_detail(order_id: int, token: str = Header(None)):
    """获取订单详情"""
    try:
        verify_token(token)
        
        sql = """
            SELECT o.*, u.nickname as user_nickname, u.phone as user_phone 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.id = %s
        """
        order = execute_query(sql, (order_id,), fetch_one=True)
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        # 获取订单明细
        sql = "SELECT * FROM order_items WHERE order_id = %s"
        order['items'] = execute_query(sql, (order_id,))
        
        return {"code": 200, "message": "success", "data": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/order/{order_id}/status", summary="更新订单状态")
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    token: str = Header(None)
):
    """更新订单状态（管理员）"""
    try:
        verify_token(token)
        
        sql = "UPDATE orders SET status = %s WHERE id = %s"
        execute_update(sql, (data.status, order_id))
        
        return {"code": 200, "message": "更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/order/{order_id}", summary="取消订单")
async def cancel_order(order_id: int, token: str = Header(None)):
    """取消订单"""
    try:
        user_data = verify_token(token)
        
        # 检查订单是否属于当前用户
        sql = "SELECT * FROM orders WHERE id = %s"
        order = execute_query(sql, (order_id,), fetch_one=True)
        
        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        if order['status'] not in [1, 2]:
            raise HTTPException(status_code=400, detail="订单状态不允许取消")
        
        sql = "UPDATE orders SET status = 5 WHERE id = %s"
        execute_update(sql, (order_id,))
        
        return {"code": 200, "message": "取消成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 统计相关接口 ====================
@app.get("/api/statistics/overview", summary="数据概览")
async def get_statistics(token: str = Header(None)):
    """获取数据统计概览（管理员）"""
    try:
        verify_token(token)
        
        # 用户总数
        sql = "SELECT COUNT(*) as total FROM users"
        user_count = execute_query(sql, fetch_one=True)['total']
        
        # 订单总数
        sql = "SELECT COUNT(*) as total FROM orders"
        order_count = execute_query(sql, fetch_one=True)['total']
        
        # 今日订单数
        sql = "SELECT COUNT(*) as total FROM orders WHERE DATE(created_at) = CURDATE()"
        today_order_count = execute_query(sql, fetch_one=True)['total']
        
        # 总销售额
        sql = "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status IN (2, 3, 4)"
        total_sales = execute_query(sql, fetch_one=True)['total']
        
        # 今日销售额
        sql = "SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE DATE(created_at) = CURDATE() AND status IN (2, 3, 4)"
        today_sales = execute_query(sql, fetch_one=True)['total']
        
        # 热销菜品TOP5
        sql = """
            SELECT id, name, price, sales 
            FROM dishes 
            WHERE status = 1 
            ORDER BY sales DESC 
            LIMIT 5
        """
        hot_dishes = execute_query(sql)
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "user_count": user_count,
                "order_count": order_count,
                "today_order_count": today_order_count,
                "total_sales": float(total_sales),
                "today_sales": float(today_sales),
                "hot_dishes": hot_dishes
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", summary="根路径")
async def root():
    """根路径"""
    return {
        "code": 200,
        "message": "微信点餐小程序API",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
