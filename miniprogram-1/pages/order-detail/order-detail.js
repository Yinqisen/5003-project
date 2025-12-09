// pages/order-detail/order-detail.js
const { orderApi } = require('../../utils/request.js')

Page({
  data: {
    orderId: null,
    order: null,
    loading: false,
    isAdmin: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id })
      this.loadOrderDetail()
    }
    
    // 检查是否是管理员
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.role === 'admin') {
      this.setData({ isAdmin: true })
    }
  },

  // 加载订单详情
  loadOrderDetail() {
    this.setData({ loading: true })

    orderApi.getDetail(this.data.orderId)
      .then(res => {
        this.setData({ order: res.data })
      })
      .catch(err => {
        console.error('加载订单详情失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 取消订单
  handleCancelOrder() {
    wx.showModal({
      title: '提示',
      content: '确定要取消订单吗？',
      success: (res) => {
        if (res.confirm) {
          orderApi.cancel(this.data.orderId)
            .then(() => {
              wx.showToast({
                title: '已取消',
                icon: 'success'
              })

              // 刷新订单详情
              setTimeout(() => {
                this.loadOrderDetail()
              }, 1500)
            })
            .catch(err => {
              console.error('取消订单失败', err)
            })
        }
      }
    })
  },

  // 联系商家
  handleContactMerchant() {
    wx.showModal({
      title: '联系商家',
      content: '电话：400-1234-5678',
      showCancel: false
    })
  },

  // 立即支付
  handlePay() {
    wx.showModal({
      title: '支付',
      content: `确认支付 ¥${this.data.order.total_price} 吗？`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          this.processPayment()
        }
      }
    })
  },

  // 处理支付
  processPayment() {
    wx.showLoading({ title: '支付中...' })

    // 模拟支付，实际项目需要调用后端支付接口
    // 这里直接更新订单状态为已支付
    const { orderApi } = require('../../utils/request.js')
    
    orderApi.updateStatus(this.data.orderId, 2)
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        })

        // 刷新订单详情
        setTimeout(() => {
          this.loadOrderDetail()
        }, 1500)
      })
      .catch(err => {
        wx.hideLoading()
        console.error('支付失败', err)
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        })
      })
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
  },

  // 管理员更新订单状态
  handleUpdateStatus() {
    const { order } = this.data
    
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
        title: '该订单无法修改',
        icon: 'none'
      })
      return
    }
    
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const newStatus = statusMap[res.tapIndex]
        if (newStatus) {
          this.updateOrderStatus(newStatus)
        }
      }
    })
  },

  // 更新订单状态
  updateOrderStatus(status) {
    const { orderApi } = require('../../utils/request.js')
    
    wx.showLoading({ title: '处理中...' })
    
    orderApi.updateStatus(this.data.orderId, status)
      .then(() => {
        const statusText = status === 2 ? '已支付' : status === 3 ? '配送中' : '已完成'
        wx.showToast({
          title: `已更新为${statusText}`,
          icon: 'success'
        })
        // 刷新订单详情
        setTimeout(() => {
          this.loadOrderDetail()
        }, 1500)
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
  }
})

