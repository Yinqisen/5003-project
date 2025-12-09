"""
数据库连接配置
"""
import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager

# 数据库配置
DB_CONFIG = {
    'host': '47.120.2.155',
    'port': 3306,
    'user': 'order_system',
    'password': 'twncLGdLaxAH6WZ5',
    'database': 'order_system',
    'charset': 'utf8mb4'
}


def get_connection():
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG, cursorclass=DictCursor)


@contextmanager
def get_db():
    """数据库连接上下文管理器"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def execute_query(sql, params=None, fetch_one=False):
    """执行查询"""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            if fetch_one:
                return cursor.fetchone()
            return cursor.fetchall()


def execute_update(sql, params=None):
    """执行更新操作"""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.rowcount


def execute_insert(sql, params=None):
    """执行插入操作，返回插入ID"""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.lastrowid


