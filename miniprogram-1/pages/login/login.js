// pages/login/login.js
const { userApi, setToken } = require('../../utils/request.js')

Page({
  data: {
    loading: false,
    isRegister: false,  // false=登录模式, true=注册模式
    username: '',
    password: '',
    nickname: '',
    phone: ''
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('user_token')
    if (token) {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  },

  // 输入处理
  handleUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  handlePasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  handleNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
  },

  handlePhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 切换登录/注册模式
  handleSwitchMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      password: '',  // 清空密码
    })
  },

  // 提交表单
  handleSubmit() {
    const { username, password, nickname, phone, isRegister } = this.data

    // 验证
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      })
      return
    }

    if (username.length < 3) {
      wx.showToast({
        title: '用户名至少3个字符',
        icon: 'none'
      })
      return
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码至少6位',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    if (isRegister) {
      // 注册
      userApi.register({ username, password, nickname, phone })
        .then(result => {
          // 保存token和用户信息
          setToken(result.data.token)
          wx.setStorageSync('userInfo', result.data.user)
          
          wx.showToast({
            title: '注册成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        })
        .catch(err => {
          console.error('注册失败', err)
        })
        .finally(() => {
          this.setData({ loading: false })
        })
    } else {
      // 登录
      userApi.login({ username, password })
        .then(result => {
          // 保存token和用户信息
          setToken(result.data.token)
          wx.setStorageSync('userInfo', result.data.user)
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        })
        .catch(err => {
          console.error('登录失败', err)
        })
        .finally(() => {
          this.setData({ loading: false })
        })
    }
  }
})

