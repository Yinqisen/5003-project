// pages/order/order.js
const { orderApi, getToken } = require('../../utils/request.js')

Page({
  data: {
    orders: [],
    loading: false,
    page: 1,
    hasMore: true,
    statusList: [
      { value: 0, label: '全部' },
      { value: 1, label: '待支付' },
      { value: 2, label: '已支付' },
      { value: 3, label: '配送中' },
      { value: 4, label: '已完成' },
      { value: 5, label: '已取消' }
    ],
    currentStatus: 0
  },

  onLoad() {
    this.checkLogin()
    this.loadOrders()
  },

  onShow() {
    // 刷新订单列表
    this.setData({ 
      orders: [],
      page: 1,
      hasMore: true
    })
    this.loadOrders()
  },

  // 检查登录
  checkLogin() {
    const token = getToken()
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 加载订单列表
  loadOrders() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    const params = {
      page: this.data.page,
      page_size: 10
    }

    if (this.data.currentStatus !== 0) {
      params.status = this.data.currentStatus
    }

    orderApi.getMyOrders(params)
      .then(res => {
        const orders = this.data.orders.concat(res.data.list || [])
        const hasMore = orders.length < res.data.total

        this.setData({
          orders,
          hasMore,
          page: this.data.page + 1
        })
      })
      .catch(err => {
        console.error('加载订单失败', err)
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 切换订单状态
  handleStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      orders: [],
      page: 1,
      hasMore: true
    })
    this.loadOrders()
  },

  // 查看订单详情
  handleViewDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 取消订单
  handleCancelOrder(e) {
    const orderId = e.currentTarget.dataset.id

    wx.showModal({
      title: '提示',
      content: '确定要取消订单吗？',
      success: (res) => {
        if (res.confirm) {
          orderApi.cancel(orderId)
            .then(() => {
              wx.showToast({
                title: '已取消',
                icon: 'success'
              })

              // 刷新列表
              this.setData({ 
                orders: [],
                page: 1,
                hasMore: true
              })
              this.loadOrders()
            })
            .catch(err => {
              console.error('取消订单失败', err)
            })
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      orders: [],
      page: 1,
      hasMore: true
    })
    this.loadOrders()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadOrders()
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      1: '待支付',
      2: '已支付',
      3: '配送中',
      4: '已完成',
      5: '已取消'
    }
    return statusMap[status] || '未知'
  }
})

