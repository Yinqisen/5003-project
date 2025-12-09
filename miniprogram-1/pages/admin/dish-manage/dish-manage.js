// pages/admin/dish-manage/dish-manage.js
const { dishApi, categoryApi } = require('../../../utils/request.js')

Page({
  data: {
    categories: [],
    dishes: [],
    currentCategory: 0,
    loading: false,
    showEditModal: false,
    editingDish: null,
    editForm: {
      name: '',
      price: '',
      description: '',
      category_id: 1,
      sort_order: 0,
      image_url: ''
    },
    uploadingImage: false
  },

  onLoad() {
    this.loadCategories()
  },

  // 加载分类
  loadCategories() {
    categoryApi.getList(1)
      .then(res => {
        const categories = [{ id: 0, name: '全部' }, ...res.data]
        this.setData({ categories })
        this.loadDishes()
      })
      .catch(err => {
        console.error('加载分类失败', err)
      })
  },

  // 加载菜品
  loadDishes() {
    this.setData({ loading: true })
    
    const params = {}
    if (this.data.currentCategory > 0) {
      params.category_id = this.data.currentCategory
    }
    
    dishApi.getList(params)
      .then(res => {
        this.setData({
          dishes: res.data.list || []
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
    this.setData({ currentCategory: categoryId })
    this.loadDishes()
  },

  // 添加菜品
  handleAddDish() {
    this.setData({
      showEditModal: true,
      editingDish: null,
      editForm: {
        name: '',
        price: '',
        description: '',
        category_id: this.data.currentCategory || 1,
        sort_order: 0,
        image_url: ''
      }
    })
  },

  // 编辑菜品
  handleEditDish(e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      showEditModal: true,
      editingDish: dish,
      editForm: {
        name: dish.name,
        price: dish.price.toString(),
        description: dish.description || '',
        category_id: dish.category_id,
        sort_order: dish.sort_order,
        image_url: dish.image_url || ''
      }
    })
  },

  // 关闭编辑弹窗
  handleCloseEdit() {
    this.setData({ showEditModal: false })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  },

  // 表单输入处理
  handleFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`editForm.${field}`]: e.detail.value
    })
  },

  // 分类选择
  handleCategorySelect(e) {
    const index = parseInt(e.detail.value)
    const categoryId = this.data.categories[index].id
    this.setData({
      'editForm.category_id': categoryId
    })
  },

  // 选择图片
  handleChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadImage(tempFilePath)
      }
    })
  },

  // 上传图片
  uploadImage(filePath) {
    const { getToken } = require('../../../utils/request.js')
    
    this.setData({ uploadingImage: true })
    wx.showLoading({ title: '上传中...' })
    
    wx.uploadFile({
      url: 'http://localhost:8000/api/upload/dish-image',
      filePath: filePath,
      name: 'file',
      header: {
        'token': getToken()
      },
      success: (res) => {
        console.log('=== 上传响应 ===')
        console.log('statusCode:', res.statusCode)
        console.log('data:', res.data)
        
        try {
          if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode}: 服务器错误`)
          }
          
          const data = JSON.parse(res.data)
          console.log('解析后的数据:', data)
          
          if (data.code === 200) {
            const imageUrl = `http://localhost:8000${data.data.url}`
            console.log('图片URL:', imageUrl)
            
            this.setData({
              'editForm.image_url': imageUrl
            })
            
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            })
          } else {
            throw new Error(data.detail || data.message || '上传失败')
          }
        } catch (err) {
          console.error('上传失败详情:', err)
          wx.showToast({
            title: err.message || '上传失败',
            icon: 'none',
            duration: 3000
          })
        }
      },
      fail: (err) => {
        console.error('上传请求失败:', err)
        wx.showToast({
          title: '网络错误，请检查后端是否启动',
          icon: 'none',
          duration: 3000
        })
      },
      complete: () => {
        this.setData({ uploadingImage: false })
        wx.hideLoading()
      }
    })
  },

  // 删除图片
  handleDeleteImage() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'editForm.image_url': ''
          })
        }
      }
    })
  },

  // 保存菜品
  handleSaveDish() {
    const { editForm, editingDish } = this.data
    
    // 验证
    if (!editForm.name || !editForm.name.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    if (!editForm.price || parseFloat(editForm.price) <= 0) {
      wx.showToast({ title: '请输入正确的价格', icon: 'none' })
      return
    }
    
    const data = {
      name: editForm.name.trim(),
      price: parseFloat(editForm.price),
      description: editForm.description.trim(),
      category_id: editForm.category_id,
      sort_order: parseInt(editForm.sort_order) || 0,
      image_url: editForm.image_url || null
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const apiCall = editingDish 
      ? dishApi.updateDish(editingDish.id, data)
      : dishApi.createDish(data)
    
    apiCall
      .then(() => {
        wx.showToast({
          title: editingDish ? '修改成功' : '添加成功',
          icon: 'success'
        })
        this.setData({ showEditModal: false })
        this.loadDishes()
      })
      .catch(err => {
        console.error('保存失败', err)
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  // 删除菜品
  handleDeleteDish(e) {
    const dish = e.currentTarget.dataset.dish
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${dish.name}"吗？此操作不可恢复！`,
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.deleteDish(dish.id)
        }
      }
    })
  },

  // 删除菜品
  deleteDish(dishId) {
    wx.showLoading({ title: '删除中...' })
    
    dishApi.deleteDish(dishId)
      .then(() => {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        this.loadDishes()
      })
      .catch(err => {
        console.error('删除失败', err)
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  // 切换上下架状态
  handleToggleStatus(e) {
    const dish = e.currentTarget.dataset.dish
    const newStatus = dish.status === 1 ? 0 : 1
    const statusText = newStatus === 1 ? '上架' : '下架'
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${statusText}"${dish.name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.updateDishStatus(dish.id, newStatus)
        }
      }
    })
  },

  // 更新菜品状态
  updateDishStatus(dishId, status) {
    wx.showLoading({ title: '处理中...' })
    
    dishApi.updateDish(dishId, { status })
      .then(() => {
        wx.showToast({
          title: status === 1 ? '已上架' : '已下架',
          icon: 'success'
        })
        this.loadDishes()
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

