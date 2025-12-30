<template>
  <view class="login-container">
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="app-name">叶片质量追溯系统</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <text class="label">工号/姓名</text>
        <input 
          class="input" 
          v-model="form.operatorName" 
          placeholder="请输入工号或姓名"
          maxlength="64"
        />
      </view>
      
      <view class="form-item">
        <text class="label">密码</text>
        <input 
          class="input" 
          v-model="form.password" 
          type="password"
          placeholder="请输入密码"
          maxlength="32"
        />
      </view>
      
      <button class="login-btn" @click="handleLogin" :loading="loading">
        登录
      </button>
    </view>
    
    <view class="tips">
      <text>提示：首次登录请使用微信授权</text>
    </view>
  </view>
</template>

<script>
import { post } from '@/utils/request.js'
import storage from '@/utils/storage.js'

export default {
  data() {
    return {
      form: {
        operatorName: '',
        password: ''
      },
      loading: false
    }
  },
  onLoad() {
    // 检查是否已登录
    const token = storage.getToken()
    const userInfo = storage.getUserInfo()
    if (token && userInfo) {
      this.redirectToHome(userInfo)
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.operatorName) {
        uni.showToast({
          title: '请输入工号或姓名',
          icon: 'none'
        })
        return
      }
      
      if (!this.form.password) {
        uni.showToast({
          title: '请输入密码（默认密码：123456）',
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      this.loading = true
      
      try {
        // 先尝试微信登录
        const loginRes = await uni.login({
          provider: 'weixin'
        })
        
        // 调用登录接口
        const res = await post('/auth/login', {
          code: loginRes.code,
          operatorName: this.form.operatorName,
          password: this.form.password
        })
        
        if (res.data) {
          // 保存token和用户信息
          storage.setToken(res.data.token)
          storage.setUserInfo(res.data.userInfo)
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            this.redirectToHome(res.data.userInfo)
          }, 500)
        }
      } catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败，请检查账号密码',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
      }
    },
    
    redirectToHome(userInfo) {
      // 根据角色跳转到不同页面
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 100rpx;
  animation: fadeInDown 0.8s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 30rpx;
}

.app-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
}

.login-form {
  width: 100%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.8s ease 0.2s both;
  position: relative;
  overflow: hidden;
}

.login-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #FFB6C1, #FFB6C1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 88rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  border: none;
  transition: all 0.3s ease;
}

.input:focus {
  background: #ffffff;
  border: none;
  box-shadow: none;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 40rpx;
  border: none;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.login-btn:active::before {
  width: 300rpx;
  height: 300rpx;
}

.login-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.4);
}

.login-btn::after {
  border: none;
}

.tips {
  margin-top: 40rpx;
  text-align: center;
}

.tips text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}
</style>

