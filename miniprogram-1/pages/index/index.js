// pages/index/index.js
const { categoryApi, dishApi, getToken } = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    categories: [],
    dishes: [],
    currentCategory: 0,
    cart: {},
    totalCount: 0,
    totalPrice: 0,
    loading: false
  },

  onLoad() {
    this.checkLogin()
    this.loadCategories()
    this.loadCart()
  },

  onShow() {
    this.loadCart()
  },

  // 检查登录状态
  checkLogin() {
    const token = getToken()
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 加载分类
  loadCategories() {
    this.setData({ loading: true })
    
    categoryApi.getList(1)
      .then(res => {
        const categories = res.data || []
        this.setData({ categories })
        
        if (categories.length > 0) {
          this.loadDishes(categories[0].id)
        }
      })
      .catch(err => {
        console.error('加载分类失败', err)
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 加载菜品
  loadDishes(categoryId) {
    this.setData({ loading: true })
    
    dishApi.getList({ category_id: categoryId, status: 1 })
      .then(res => {
        this.setData({ 
          dishes: res.data.list || [],
          currentCategory: categoryId
        })
      })
      .catch(err => {
        console.error('加载菜品失败', err)
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 切换分类
  handleCategoryChange(e) {
    const categoryId = e.currentTarget.dataset.id
    this.loadDishes(categoryId)
  },

  // 加载购物车
  loadCart() {
    const cart = wx.getStorageSync('cart') || {}
    let totalCount = 0
    let totalPrice = 0
    
    Object.keys(cart).forEach(dishId => {
      const item = cart[dishId]
      totalCount += item.quantity
      totalPrice += item.price * item.quantity
    })
    
    this.setData({ 
      cart,
      totalCount,
      totalPrice: totalPrice.toFixed(2)
    })
  },

  // 添加到购物车
  handleAddToCart(e) {
    const dish = e.currentTarget.dataset.dish
    const cart = this.data.cart
    
    if (cart[dish.id]) {
      cart[dish.id].quantity++
    } else {
      cart[dish.id] = {
        id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1
      }
    }
    
    wx.setStorageSync('cart', cart)
    this.loadCart()
    
    wx.showToast({
      title: '已添加到购物车',
      icon: 'success',
      duration: 1000
    })
  },

  // 从购物车减少
  handleRemoveFromCart(e) {
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

  // 查看购物车
  handleViewCart() {
    if (this.data.totalCount === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/cart/cart'
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
  }
})
