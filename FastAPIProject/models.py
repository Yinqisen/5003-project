"""
数据模型
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# 用户相关
class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    password: str
    nickname: Optional[str] = None
    phone: Optional[str] = None


class User(BaseModel):
    id: Optional[int] = None
    username: str
    nickname: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# 管理员相关
class AdminLogin(BaseModel):
    username: str
    password: str


class Admin(BaseModel):
    id: Optional[int] = None
    username: str
    password: str
    real_name: Optional[str] = None


class AdminCreate(BaseModel):
    username: str
    password: str
    real_name: Optional[str] = None


# 分类相关
class Category(BaseModel):
    id: Optional[int] = None
    name: str
    sort_order: int = 0
    status: int = 1


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = None


# 菜品相关
class Dish(BaseModel):
    id: Optional[int] = None
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    status: int = 1
    sort_order: int = 0
    sales: int = 0


class DishCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    sort_order: int = 0


class DishUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[int] = None
    sort_order: Optional[int] = None


# 订单相关
class OrderItem(BaseModel):
    dish_id: int
    dish_name: str
    dish_price: float
    quantity: int


class OrderCreate(BaseModel):
    user_id: int
    items: List[OrderItem]
    remark: Optional[str] = None


class Order(BaseModel):
    id: Optional[int] = None
    order_no: str
    user_id: int
    total_price: float
    status: int
    remark: Optional[str] = None
    created_at: Optional[datetime] = None


class OrderDetail(BaseModel):
    id: int
    order_no: str
    user_id: int
    user_nickname: Optional[str] = None
    total_price: float
    status: int
    remark: Optional[str] = None
    items: List[dict]
    created_at: datetime


class OrderStatusUpdate(BaseModel):
    status: int


# 响应模型
class Response(BaseModel):
    code: int = 200
    message: str = "success"
    data: Optional[dict] = None

