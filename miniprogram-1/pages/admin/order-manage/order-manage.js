// pages/admin/order-manage/order-manage.js
const { orderApi } = require('../../../utils/request.js')

Page({
  data: {
    orders: [],
    statusList: [
      { value: 0, label: '全部' },
      { value: 1, label: '待支付' },
      { value: 2, label: '已支付' },
      { value: 3, label: '配送中' },
      { value: 4, label: '已完成' },
      { value: 5, label: '已取消' }
    ],
    currentStatus: 0,
    loading: false
  },

  onLoad() {
    this.loadOrders()
  },

  // 加载订单
  loadOrders() {
    this.setData({ loading: true })
    
    const params = {}
    if (this.data.currentStatus > 0) {
      params.status = this.data.currentStatus
    }
    
    // 使用管理员订单列表接口 - 获取所有用户的订单
    orderApi.getAllOrders(params)
      .then(res => {
        this.setData({
          orders: res.data.list || []
        })
      })
      .catch(err => {
        console.error('加载订单失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 切换状态
  handleStatusChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ currentStatus: status })
    this.loadOrders()
  },

  // 查看订单详情
  handleViewDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 处理订单（更新状态）
  handleProcessOrder(e) {
    const order = e.currentTarget.dataset.order
    
    const actions = []
    const statusMap = {}
    
    if (order.status === 1) {
      actions.push('标记已支付')
      statusMap[0] = 2
    }
    if (order.status === 2) {
      actions.push('开始配送')
      statusMap[actions.length - 1] = 3
    }
    if (order.status === 3) {
      actions.push('标记完成')
      statusMap[actions.length - 1] = 4
    }
    
    if (actions.length === 0) {
      wx.showToast({
        title: '该订单无法处理',
        icon: 'none'
      })
      return
    }
    
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const newStatus = statusMap[res.tapIndex]
        if (newStatus) {
          this.updateOrderStatus(order.id, newStatus)
        }
      }
    })
  },

  // 更新订单状态
  updateOrderStatus(orderId, status) {
    wx.showLoading({ title: '处理中...' })
    
    orderApi.updateStatus(orderId, status)
      .then(() => {
        const statusText = status === 2 ? '已支付' : status === 3 ? '配送中' : '已完成'
        wx.showToast({
          title: `已标记为${statusText}`,
          icon: 'success'
        })
        this.loadOrders()
      })
      .catch(err => {
        console.error('更新失败', err)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  // 获取状态文本
  getStatusText(status) {
    const item = this.data.statusList.find(s => s.value === status)
    return item ? item.label : '未知状态'
  }
})

