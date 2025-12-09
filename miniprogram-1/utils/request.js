// API请求封装
const BASE_URL = 'http://localhost:8000/api'

// 存储token的key
const TOKEN_KEY = 'user_token'

// 获取token
function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

// 设置token
function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

// 清除token
function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

// 请求封装
function request(url, method = 'GET', data = {}, needToken = true) {
  return new Promise((resolve, reject) => {
    const header = {
      'content-type': 'application/json'
    }
    
    // 添加token
    if (needToken) {
      const token = getToken()
      if (token) {
        header['token'] = token
      }
    }
    
    // 调试日志
    console.log('=== API Request ===')
    console.log('URL:', BASE_URL + url)
    console.log('Method:', method)
    console.log('Data:', data)
    console.log('Header:', header)
    
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        console.log('=== API Response ===')
        console.log('Status:', res.statusCode)
        console.log('Data:', res.data)
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          })
          clearToken()
          wx.redirectTo({
            url: '/pages/login/login'
          })
          reject(res)
        } else {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(res)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// 用户相关API
const userApi = {
  // 用户注册
  register(data) {
    return request('/user/register', 'POST', data, false)
  },
  // 用户登录
  login(data) {
    return request('/user/login', 'POST', data, false)
  },
  // 获取用户信息
  getUserInfo() {
    return request('/user/info', 'GET')
  },
  // 更新用户信息
  updateUser(data) {
    return request('/user/update', 'PUT', data)
  }
}

// 分类相关API
const categoryApi = {
  // 获取分类列表
  getList(status = 1) {
    return request('/category/list', 'GET', { status }, false)
  }
}

// 菜品相关API
const dishApi = {
  // 获取菜品列表
  getList(params = {}) {
    return request('/dish/list', 'GET', params, false)
  },
  // 获取菜品详情
  getDetail(dishId) {
    return request(`/dish/${dishId}`, 'GET', {}, false)
  },
  // 创建菜品
  createDish(data) {
    return request('/dish/create', 'POST', data)
  },
  // 更新菜品
  updateDish(dishId, data) {
    return request(`/dish/${dishId}`, 'PUT', data)
  },
  // 删除菜品
  deleteDish(dishId) {
    return request(`/dish/${dishId}`, 'DELETE')
  }
}

// 订单相关API
const orderApi = {
  // 创建订单
  create(data) {
    return request('/order/create', 'POST', data)
  },
  // 获取我的订单（用户）
  getMyOrders(params = {}) {
    return request('/order/my', 'GET', params)
  },
  // 获取所有订单（管理员）
  getAllOrders(params = {}) {
    return request('/order/list', 'GET', params)
  },
  // 获取订单详情
  getDetail(orderId) {
    return request(`/order/${orderId}`, 'GET')
  },
  // 取消订单
  cancel(orderId) {
    return request(`/order/${orderId}`, 'DELETE')
  },
  // 更新订单状态（管理员）
  updateStatus(orderId, status) {
    return request(`/order/${orderId}/status`, 'PUT', { status })
  }
}

module.exports = {
  request,
  getToken,
  setToken,
  clearToken,
  userApi,
  categoryApi,
  dishApi,
  orderApi
}

