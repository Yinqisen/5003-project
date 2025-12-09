// pages/admin/user-manage/user-manage.js
const { request } = require('../../../utils/request.js')

Page({
  data: {
    users: [],
    loading: false,
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  },

  onLoad() {
    this.loadUsers()
  },

  // 加载用户列表
  loadUsers(loadMore = false) {
    if (!loadMore) {
      this.setData({ loading: true })
    }

    const page = loadMore ? this.data.page + 1 : 1

    request('/admin/users', 'GET', { page, page_size: this.data.pageSize })
      .then(res => {
        const newUsers = res.data.list || []
        const users = loadMore ? [...this.data.users, ...newUsers] : newUsers

        this.setData({
          users,
          page,
          total: res.data.total || 0,
          hasMore: users.length < (res.data.total || 0)
        })
      })
      .catch(err => {
        console.error('加载用户列表失败', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUsers()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadUsers(true)
    }
  },

  // 查看用户详情
  handleViewUser(e) {
    const user = e.currentTarget.dataset.user
    
    const info = `用户名：${user.username}
昵称：${user.nickname || '未设置'}
手机号：${user.phone || '未绑定'}
注册时间：${user.created_at}`

    wx.showModal({
      title: '用户详情',
      content: info,
      showCancel: false
    })
  }
})

