<template>
  <view class="user-manage-container">
    <view class="header">
      <view class="header-title">人员管理</view>
      <button class="add-btn" @click="showAddModal">+ 添加用户</button>
    </view>

    <!-- 用户列表 -->
    <view class="user-list">
      <view 
        class="user-item" 
        v-for="(user, index) in userList" 
        :key="index"
      >
        <view class="user-info">
          <view class="user-name">{{ user.operator_name }}</view>
          <view class="user-meta">
            <text class="role-badge" :class="getRoleClass(user.role)">
              {{ getRoleText(user.role) }}
            </text>
            <text class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
              {{ user.is_active ? '启用' : '停用' }}
            </text>
          </view>
        </view>
        <view class="user-actions">
          <text class="action-btn" @click="editUser(user)">编辑</text>
          <text 
            class="action-btn danger" 
            @click="toggleUserStatus(user)"
            v-if="user.is_active"
          >
            停用
          </text>
          <text 
            class="action-btn" 
            @click="toggleUserStatus(user)"
            v-else
          >
            启用
          </text>
        </view>
      </view>
    </view>

    <view class="empty-tip" v-if="userList.length === 0 && !loading">
      <text>暂无用户</text>
    </view>

    <!-- 添加/编辑用户弹窗 -->
    <view class="modal" v-if="showModal" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingUser ? '编辑用户' : '添加用户' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">工号/姓名 *</text>
            <input 
              class="form-input" 
              v-model="form.operator_name" 
              placeholder="请输入工号或姓名"
              maxlength="50"
            />
          </view>
          <view class="form-item">
            <text class="form-label">角色 *</text>
            <picker 
              mode="selector" 
              :range="roleOptions" 
              range-key="label"
              :value="roleIndex"
              @change="onRoleChange"
            >
              <view class="form-picker">
                {{ roleOptions[roleIndex].label }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">密码{{ editingUser ? '（留空不修改）' : '（留空默认123456）' }}</text>
            <input 
              class="form-input" 
              v-model="form.password" 
              type="password"
              :placeholder="editingUser ? '留空则不修改密码' : '留空则使用默认密码123456'"
              maxlength="50"
            />
          </view>
          <view class="form-item" v-if="editingUser">
            <text class="form-label">状态</text>
            <view class="switch-group">
              <text 
                class="switch-item" 
                :class="{ active: form.is_active }"
                @click="form.is_active = true"
              >
                启用
              </text>
              <text 
                class="switch-item" 
                :class="{ active: !form.is_active }"
                @click="form.is_active = false"
              >
                停用
              </text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeModal">取消</button>
          <button class="modal-btn confirm" @click="handleSubmit" :loading="submitting">
            确定
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { get, post, put, del as deleteUser } from '@/utils/request.js'
import storage from '@/utils/storage.js'

export default {
  data() {
    return {
      userList: [],
      loading: false,
      showModal: false,
      editingUser: null,
      submitting: false,
      form: {
        operator_name: '',
        role: 'OPERATOR',
        password: '',
        is_active: 1
      },
      roleOptions: [
        { value: 'OPERATOR', label: '操作员' },
        { value: 'QC', label: '质检员' },
        { value: 'ADMIN', label: '管理员' }
      ],
      roleIndex: 0
    }
  },
  onLoad() {
    // 检查权限
    const userInfo = storage.getUserInfo()
    if (!userInfo || userInfo.role !== 'ADMIN') {
      uni.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    this.loadUserList()
  },
  methods: {
    async loadUserList() {
      this.loading = true
      try {
        const res = await get('/user/list')
        if (res && res.data) {
          this.userList = res.data.list || []
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    showAddModal() {
      this.editingUser = null
      this.form = {
        operator_name: '',
        role: 'OPERATOR',
        password: '',
        is_active: 1
      }
      this.roleIndex = 0
      this.showModal = true
    },
    
    editUser(user) {
      this.editingUser = user
      this.form = {
        operator_name: user.operator_name,
        role: user.role,
        password: '',
        is_active: user.is_active
      }
      this.roleIndex = this.roleOptions.findIndex(r => r.value === user.role)
      if (this.roleIndex === -1) this.roleIndex = 0
      this.showModal = true
    },
    
    closeModal() {
      this.showModal = false
      this.editingUser = null
    },
    
    onRoleChange(e) {
      this.roleIndex = parseInt(e.detail.value)
      this.form.role = this.roleOptions[this.roleIndex].value
    },
    
    async handleSubmit() {
      if (!this.form.operator_name || !this.form.operator_name.trim()) {
        uni.showToast({
          title: '请输入工号或姓名',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      try {
        if (this.editingUser) {
          // 更新用户
          await put(`/user/${this.editingUser.operator_id}`, this.form)
          uni.showToast({
            title: '更新成功',
            icon: 'success'
          })
        } else {
          // 创建用户
          await post('/user', this.form)
          uni.showToast({
            title: '创建成功',
            icon: 'success'
          })
        }
        
        this.closeModal()
        this.loadUserList()
      } catch (error) {
        console.error('操作失败:', error)
        const errorMsg = error.message || error.data?.message || '操作失败'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.submitting = false
      }
    },
    
    async toggleUserStatus(user) {
      uni.showModal({
        title: '确认',
        content: `确定要${user.is_active ? '停用' : '启用'}该用户吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await put(`/user/${user.operator_id}`, {
                is_active: user.is_active ? 0 : 1
              })
              uni.showToast({
                title: '操作成功',
                icon: 'success'
              })
              this.loadUserList()
            } catch (error) {
              console.error('操作失败:', error)
              uni.showToast({
                title: '操作失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    getRoleText(role) {
      const roleMap = {
        'OPERATOR': '操作员',
        'QC': '质检员',
        'ADMIN': '管理员'
      }
      return roleMap[role] || role
    },
    
    getRoleClass(role) {
      const classMap = {
        'OPERATOR': 'role-operator',
        'QC': 'role-qc',
        'ADMIN': 'role-admin'
      }
      return classMap[role] || ''
    }
  }
}
</script>

<style scoped>
.user-manage-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.add-btn {
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 20rpx;
  font-size: 26rpx;
  border: none;
}

.add-btn::after {
  border: none;
}

.user-list {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.user-meta {
  display: flex;
  gap: 15rpx;
}

.role-badge {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.role-operator {
  background: #e3f2fd;
  color: #1976d2;
}

.role-qc {
  background: #fff3e0;
  color: #f57c00;
}

.role-admin {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-badge {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.status-badge.active {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.inactive {
  background: #ffebee;
  color: #d32f2f;
}

.user-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  padding: 8rpx 16rpx;
  color: #667eea;
  font-size: 26rpx;
  border: 1rpx solid #667eea;
  border-radius: 8rpx;
}

.action-btn.danger {
  color: #f44336;
  border-color: #f44336;
}

.empty-tip {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-picker {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.switch-group {
  display: flex;
  gap: 20rpx;
}

.switch-item {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #666;
}

.switch-item.active {
  background: #667eea;
  color: #ffffff;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
}

.modal-btn::after {
  border: none;
}
</style>

