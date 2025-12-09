// pages/admin/statistics/statistics.js
const { request } = require('../../../utils/request.js')

Page({
  data: {
    stats: null,
    loading: false,
    recentUsers: [],
    recentOrders: [],
    userPage: 1,
    orderPage: 1,
    userTotal: 0,
    orderTotal: 0,
    pageSize: 20
  },

  onLoad() {
    this.loadStatistics()
  },

  // 加载统计数据
  loadStatistics() {
    this.setData({ loading: true })
    
    // 调用统计接口
    request('/statistics/overview', 'GET')
      .then(res => {
        this.setData({
          stats: res.data
        })
        // 加载用户和订单列表
        this.loadRecentUsers()
        this.loadRecentOrders()
      })
      .catch(err => {
        console.error('加载统计数据失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 加载用户列表
  loadRecentUsers(loadMore = false) {
    const page = loadMore ? this.data.userPage + 1 : 1
    
    request('/admin/users', 'GET', { page, page_size: this.data.pageSize })
      .then(res => {
        const newUsers = res.data.list || []
        const users = loadMore ? [...this.data.recentUsers, ...newUsers] : newUsers
        
        this.setData({
          recentUsers: users,
          userPage: page,
          userTotal: res.data.total || 0
        })
      })
      .catch(err => {
        console.error('加载用户列表失败', err)
      })
  },

  // 加载订单列表（管理员 - 所有订单）
  loadRecentOrders(loadMore = false) {
    const page = loadMore ? this.data.orderPage + 1 : 1
    const { orderApi } = require('../../../utils/request.js')
    
    // 使用管理员接口获取所有用户的订单
    orderApi.getAllOrders({ page, page_size: this.data.pageSize })
      .then(res => {
        const newOrders = res.data.list || []
        const orders = loadMore ? [...this.data.recentOrders, ...newOrders] : newOrders
        
        this.setData({
          recentOrders: orders,
          orderPage: page,
          orderTotal: res.data.total || 0
        })
      })
      .catch(err => {
        console.error('加载订单列表失败', err)
      })
  },

  // 查看全部用户
  handleViewAllUsers() {
    wx.navigateTo({
      url: '/pages/admin/user-manage/user-manage'
    })
  },

  // 查看全部订单
  handleViewAllOrders() {
    wx.navigateTo({
      url: '/pages/admin/order-manage/order-manage'
    })
  },

  // 查看订单详情
  handleViewOrder(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 刷新数据
  handleRefresh() {
    this.loadStatistics()
  }
})

