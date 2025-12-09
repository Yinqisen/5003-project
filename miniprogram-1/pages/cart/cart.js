// pages/cart/cart.js
const { orderApi, getToken } = require('../../utils/request.js')

Page({
  data: {
    cart: {},
    cartList: [],
    totalPrice: 0,
    totalCount: 0,
    remark: '',
    submitting: false
  },

  onLoad() {
    this.loadCart()
  },

  onShow() {
    this.loadCart()
  },

  // 加载购物车
  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    const cartList = Object.values(cart)
    
    let totalPrice = 0
    let totalCount = 0
    
    cartList.forEach(item => {
      totalPrice += item.price * item.quantity
      totalCount += item.quantity
    })
    
    this.setData({
      cart,
      cartList,
      totalPrice: totalPrice.toFixed(2),
      totalCount
    })
  },

  // 增加数量
  handleAddQuantity(e) {
    const dishId = e.currentTarget.dataset.id
    const cart = this.data.cart
    
    if (cart[dishId]) {
      cart[dishId].quantity++
      wx.setStorageSync('cart', cart)
      this.loadCart()
    }
  },

  // 减少数量
  handleReduceQuantity(e) {
    const dishId = e.currentTarget.dataset.id
    const cart = this.data.cart
    
    if (cart[dishId]) {
      if (cart[dishId].quantity > 1) {
        cart[dishId].quantity--
      } else {
        delete cart[dishId]
      }
      
      wx.setStorageSync('cart', cart)
      this.loadCart()
    }
  },

  // 删除商品
  handleDeleteItem(e) {
    const dishId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          const cart = this.data.cart
          delete cart[dishId]
          wx.setStorageSync('cart', cart)
          this.loadCart()
        }
      }
    })
  },

  // 清空购物车
  handleClearCart() {
    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('cart')
          this.loadCart()
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  // 备注输入
  handleRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交订单
  handleSubmitOrder() {
    if (this.data.cartList.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }

    const token = getToken()
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '用户信息错误',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    // 构建订单数据
    const items = this.data.cartList.map(item => ({
      dish_id: item.id,
      dish_name: item.name,
      dish_price: item.price,
      quantity: item.quantity
    }))

    const orderData = {
      user_id: userInfo.id,
      items: items,
      remark: this.data.remark
    }

    // 提交订单
    orderApi.create(orderData)
      .then(res => {
        wx.showToast({
          title: '下单成功',
          icon: 'success'
        })

        // 清空购物车
        wx.removeStorageSync('cart')

        // 跳转到订单详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/order-detail/order-detail?id=${res.data.order_id}`
          })
        }, 1500)
      })
      .catch(err => {
        console.error('下单失败', err)
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  }
})

