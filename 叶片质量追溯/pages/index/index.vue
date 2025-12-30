<template>
  <view class="container">
    <!-- 用户信息栏 -->
    <view class="user-header">
      <view class="user-info">
        <text class="user-name">{{ userInfo.operator_name || '未登录' }}</text>
        <text class="user-role">{{ roleText }}</text>
      </view>
      <text class="logout-btn" @click="handleLogout">退出</text>
    </view>
    
    <!-- 功能区域 -->
    <view class="function-section">
      <!-- 操作员界面 -->
      <template v-if="userInfo.role === 'OPERATOR'">
        <view class="section-title">我的工作</view>
        <view class="function-grid">
          <view class="function-item primary" @click="scanQRCode">
            <view class="icon-wrapper">
              <text class="icon">🪟</text>
            </view>
            <text class="label">扫码追溯</text>
            <text class="desc">扫描二维码查看追溯信息</text>
          </view>
          <view class="function-item success" @click="goToProcessInput">
            <view class="icon-wrapper">
              <text class="icon">🪬</text>
            </view>
            <text class="label">工序录入</text>
            <text class="desc">录入工序工艺参数</text>
          </view>
        </view>
      </template>
      
      <!-- 质检员界面 -->
      <template v-if="userInfo.role === 'QC'">
        <view class="section-title">质检工作</view>
        <view class="function-grid">
          <view class="function-item primary" @click="scanQRCode">
            <view class="icon-wrapper">
              <text class="icon">🪟</text>
            </view>
            <text class="label">扫码追溯</text>
            <text class="desc">扫描二维码查看追溯信息</text>
          </view>
          <view class="function-item success" @click="goToFluorescentTest">
            <view class="icon-wrapper">
              <text class="icon">🧪</text>
            </view>
            <text class="label">荧光检测</text>
            <text class="desc">进行第11步荧光检测</text>
          </view>
          <view class="function-item warning" @click="goToQCInput">
            <view class="icon-wrapper">
              <text class="icon">✅</text>
            </view>
            <text class="label">质检录入</text>
            <text class="desc">填写最终质检报告</text>
          </view>
          <view class="function-item info" @click="goToBladeList">
            <view class="icon-wrapper">
              <text class="icon">📋</text>
            </view>
            <text class="label">待检列表</text>
            <text class="desc">查看待质检叶片</text>
          </view>
        </view>
      </template>
      
      <!-- 管理员界面 -->
      <template v-if="userInfo.role === 'ADMIN'">
        <view class="section-title">系统管理</view>
        <view class="function-grid">
          <view class="function-item primary" @click="scanQRCode">
            <view class="icon-wrapper">
              <text class="icon">🪟</text>
            </view>
            <text class="label">扫码追溯</text>
            <text class="desc">扫描二维码查看追溯信息</text>
          </view>
          <view class="function-item warning" @click="goToCreateBlade">
            <view class="icon-wrapper">
              <text class="icon">🚁</text>
            </view>
            <text class="label">创建叶片</text>
            <text class="desc">新增叶片并生成二维码</text>
          </view>
          <view class="function-item info" @click="goToUserManage">
            <view class="icon-wrapper">
              <text class="icon">👥</text>
            </view>
            <text class="label">人员管理</text>
            <text class="desc">管理系统用户</text>
          </view>
          <view class="function-item success" @click="goToStatistics">
            <view class="icon-wrapper">
              <text class="icon">🔢</text>
            </view>
            <text class="label">数据统计</text>
            <text class="desc">查看数据统计报表</text>
          </view>
          <view class="function-item warning" @click="goToYOLODetect">
            <view class="icon-wrapper">
              <text class="icon">🔭</text>
            </view>
            <text class="label">YOLO检测</text>
            <text class="desc">AI图像检测分析</text>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 最近记录 -->
    <view class="recent-section">
      <view class="section-title">最近记录</view>
      <view class="record-list" v-if="recentRecords.length > 0">
        <view 
          class="record-item" 
          v-for="(item, index) in recentRecords" 
          :key="index"
          @click="viewTrace(item.blade_id)"
        >
          <view class="record-info">
            <text class="blade-sn">{{ item.blade_sn }}</text>
            <text class="record-time">{{ formatTime(item.updated_at) }}</text>
          </view>
          <text class="status" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </text>
        </view>
      </view>
      <view class="empty-tip" v-else>
        <text>暂无记录</text>
      </view>
    </view>
  </view>
</template>

<script>
import storage from '@/utils/storage.js'
import { get } from '@/utils/request.js'
import { BLADE_STATUS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      userInfo: {},
      recentRecords: []
    }
  },
  computed: {
    roleText() {
      const roleMap = {
        'OPERATOR': '操作员',
        'QC': '质检员',
        'ADMIN': '管理员'
      }
      return roleMap[this.userInfo.role] || '未知'
    }
  },
  onLoad() {
    this.checkLogin()
  },
  onShow() {
    this.loadRecentRecords()
  },
  methods: {
    checkLogin() {
      const userInfo = storage.getUserInfo()
      if (!userInfo) {
        uni.reLaunch({
          url: '/pages/login/login'
        })
        return
      }
      this.userInfo = userInfo
    },
    
    async loadRecentRecords() {
      try {
        // 根据角色加载不同的记录
        const url = this.userInfo.role === 'OPERATOR' 
          ? '/blade/my-recent' 
          : '/blade/recent'
        
        const res = await get(url, {
          limit: 10
        }, {
          loading: false  // 不显示加载提示
        })
        
        if (res && res.data) {
          this.recentRecords = res.data.list || []
        }
      } catch (error) {
        console.error('加载最近记录失败:', error)
        // 不显示错误提示，避免干扰用户体验
        this.recentRecords = []
      }
    },
    
    scanQRCode() {
      uni.navigateTo({
        url: '/pages/scan/scan'
      })
    },
    
    goToProcessInput() {
      // 工序录入功能：先扫码选择叶片，再录入工序
      uni.navigateTo({
        url: '/pages/scan/scan?mode=process-input'
      })
    },
    
    goToFluorescentTest() {
      // 荧光检测：先扫码选择叶片，再录入第11步工序
      uni.navigateTo({
        url: '/pages/scan/scan?mode=process-input&processCode=FLUORESCENT_TEST'
      })
    },
    
    goToQCInput() {
      uni.navigateTo({
        url: '/pages/qc-input/qc-input'
      })
    },
    
    goToBladeList() {
      uni.navigateTo({
        url: '/pages/blade-list/blade-list'
      })
    },
    
    goToCreateBlade() {
      uni.navigateTo({
        url: '/pages/blade-create/blade-create'
      })
    },
    
    goToUserManage() {
      uni.navigateTo({
        url: '/pages/user-manage/user-manage'
      })
    },
    
    goToStatistics() {
      uni.navigateTo({
        url: '/pages/statistics/statistics'
      })
    },
    
    goToYOLODetect() {
      uni.navigateTo({
        url: '/pages/yolo-detect/yolo-detect'
      })
    },
    
    viewTrace(bladeId) {
      uni.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
      })
    },
    
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            storage.clearAll()
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        }
      })
    },
    
    getStatusText(status) {
      return BLADE_STATUS_MAP[status] || status
    },
    
    getStatusClass(status) {
      const classMap = {
        'NEW': 'status-new',
        'IN_PROCESS': 'status-processing',
        'BLOCKED': 'status-blocked',
        'READY_FOR_QC': 'status-ready',
        'COMPLETED': 'status-completed',
        'SCRAPPED': 'status-scrapped'
      }
      return classMap[status] || ''
    },
    
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`
      return `${Math.floor(minutes / 1440)}天前`
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFFFFF;
}

.user-header {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  padding: 60rpx 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.user-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300rpx;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.user-header::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.user-role {
  font-size: 24rpx;
  opacity: 0.9;
}

.logout-btn {
  font-size: 28rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 25rpx;
  backdrop-filter: blur(10rpx);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.logout-btn:active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.95);
}

.function-section {
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.function-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  align-items: center;
}

.function-item {
  width: 100%;
  max-width: 100%;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.function-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.function-item:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.function-item:active::before {
  transform: scaleX(1);
}

.function-item.primary .icon-wrapper {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
}

.function-item.success .icon-wrapper {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
}

.function-item.warning .icon-wrapper {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
}

.function-item.info .icon-wrapper {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
}

.icon-wrapper {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.15);
}

.function-item .icon {
  font-size: 50rpx;
}

.function-item .label {
  font-size: 30rpx;
  color: #333333;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.function-item .desc {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  line-height: 1.4;
}

.recent-section {
  padding: 30rpx;
}

.record-list {
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.record-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
}

.record-item::after {
  content: '';
  position: absolute;
  right: 30rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 8rpx solid #ccc;
  border-top: 6rpx solid transparent;
  border-bottom: 6rpx solid transparent;
  transition: all 0.3s ease;
}

.record-item:active {
  background: #f8f8f8;
  transform: translateX(-5rpx);
}

.record-item:active::after {
  right: 20rpx;
  border-left-color: #667eea;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.blade-sn {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999999;
}

.status {
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.status-new {
  background: #e3f2fd;
  color: #1976d2;
}

.status-processing {
  background: #fff3e0;
  color: #f57c00;
}

.status-blocked {
  background: #ffebee;
  color: #d32f2f;
}

.status-ready {
  background: #e8f5e9;
  color: #388e3c;
}

.status-completed {
  background: #e0f2f1;
  color: #00796b;
}

.status-scrapped {
  background: #fce4ec;
  color: #c2185b;
}

.empty-tip {
  text-align: center;
  padding: 60rpx;
  color: #999999;
  font-size: 28rpx;
}
</style>
