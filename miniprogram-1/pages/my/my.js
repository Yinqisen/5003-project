// pages/my/my.js
const { userApi, clearToken } = require('../../utils/request.js')

Page({
  data: {
    userInfo: null,
    isAdmin: false,
    menuList: []
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      const isAdmin = userInfo.role === 'admin'
      
      // 根据角色设置菜单
      let menuList = []
      
      if (isAdmin) {
        // 管理员菜单
        menuList = [
          {
            icon: '●',
            name: '用户管理',
            path: '/pages/admin/user-manage/user-manage',
            admin: true
          },
          {
            icon: '●',
            name: '菜品管理',
            path: '/pages/admin/dish-manage/dish-manage',
            admin: true
          },
          {
            icon: '●',
            name: '订单管理',
            path: '/pages/admin/order-manage/order-manage',
            admin: true
          },
          {
            icon: '●',
            name: '数据统计',
            path: '/pages/admin/statistics/statistics',
            admin: true
          },
          {
            icon: '●',
            name: '设置',
            action: 'setting'
          }
        ]
      } else {
        // 普通用户菜单
        menuList = [
          {
            icon: '●',
            name: '我的订单',
            path: '/pages/order/order'
          },
          {
            icon: '●',
            name: '联系客服',
            action: 'contact'
          },
          {
            icon: '●',
            name: '设置',
            action: 'setting'
          }
        ]
      }
      
      this.setData({ 
        userInfo,
        isAdmin,
        menuList
      })
    }
  },

  // 点击菜单项
  handleMenuClick(e) {
    const item = e.currentTarget.dataset.item

    if (item.path) {
      // 判断是否是 tabBar 页面
      const tabBarPages = ['pages/index/index', 'pages/order/order', 'pages/my/my']
      const isTabBar = tabBarPages.some(page => item.path.includes(page))
      
      if (isTabBar) {
        wx.switchTab({
          url: item.path
        })
      } else {
        wx.navigateTo({
          url: item.path
        })
      }
    } else if (item.action === 'contact') {
      this.handleContact()
    } else if (item.action === 'setting') {
      this.handleSetting()
    }
  },

  // 联系客服
  handleContact() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-1234-5678\n工作时间：9:00-18:00',
      showCancel: false
    })
  },

  // 设置
  handleSetting() {
    wx.showActionSheet({
      itemList: ['退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.handleLogout()
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearToken()
          wx.removeStorageSync('userInfo')
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  },

})

