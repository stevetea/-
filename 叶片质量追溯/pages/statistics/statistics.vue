<template>
  <view class="statistics-container">
    <view class="page-title">数据统计</view>

    <!-- 叶片统计 -->
    <view class="stat-card">
      <view class="card-title">叶片统计</view>
      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.total || 0 }}</text>
          <text class="stat-label">总叶片数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.new_count || 0 }}</text>
          <text class="stat-label">新建</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.in_process_count || 0 }}</text>
          <text class="stat-label">加工中</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.blocked_count || 0 }}</text>
          <text class="stat-label">阻塞</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.ready_for_qc_count || 0 }}</text>
          <text class="stat-label">待质检</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.completed_count || 0 }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.blade?.scrapped_count || 0 }}</text>
          <text class="stat-label">报废</text>
        </view>
      </view>
    </view>

    <!-- 用户统计 -->
    <view class="stat-card">
      <view class="card-title">用户统计</view>
      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-value">{{ statistics.user?.total || 0 }}</text>
          <text class="stat-label">总用户数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.user?.operator_count || 0 }}</text>
          <text class="stat-label">操作员</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.user?.qc_count || 0 }}</text>
          <text class="stat-label">质检员</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.user?.admin_count || 0 }}</text>
          <text class="stat-label">管理员</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.user?.active_count || 0 }}</text>
          <text class="stat-label">启用中</text>
        </view>
      </view>
    </view>

    <!-- 工序统计 -->
    <view class="stat-card">
      <view class="card-title">工序统计（最近30天）</view>
      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-value">{{ statistics.process?.total_records || 0 }}</text>
          <text class="stat-label">总记录数</text>
        </view>
        <view class="stat-item success">
          <text class="stat-value">{{ statistics.process?.success_count || 0 }}</text>
          <text class="stat-label">成功</text>
        </view>
        <view class="stat-item danger">
          <text class="stat-value">{{ statistics.process?.fail_count || 0 }}</text>
          <text class="stat-label">失败</text>
        </view>
        <view class="stat-item" v-if="statistics.process?.total_records > 0">
          <text class="stat-value">
            {{ Math.round((statistics.process.success_count / statistics.process.total_records) * 100) }}%
          </text>
          <text class="stat-label">成功率</text>
        </view>
      </view>
    </view>

    <!-- 质检统计 -->
    <view class="stat-card">
      <view class="card-title">质检统计</view>
      <view class="stat-grid">
        <view class="stat-item">
          <text class="stat-value">{{ statistics.qc?.total || 0 }}</text>
          <text class="stat-label">总质检数</text>
        </view>
        <view class="stat-item success">
          <text class="stat-value">{{ statistics.qc?.pass_count || 0 }}</text>
          <text class="stat-label">通过</text>
        </view>
        <view class="stat-item danger">
          <text class="stat-value">{{ statistics.qc?.fail_count || 0 }}</text>
          <text class="stat-label">不通过</text>
        </view>
        <view class="stat-item" v-if="statistics.qc?.total > 0">
          <text class="stat-value">
            {{ Math.round((statistics.qc.pass_count / statistics.qc.total) * 100) }}%
          </text>
          <text class="stat-label">通过率</text>
        </view>
      </view>
    </view>

    <!-- 最近7天叶片创建趋势 -->
    <view class="stat-card" v-if="statistics.dailyBlade && statistics.dailyBlade.length > 0">
      <view class="card-title">最近7天叶片创建趋势</view>
      <view class="trend-list">
        <view 
          class="trend-item" 
          v-for="(item, index) in statistics.dailyBlade" 
          :key="index"
        >
          <view class="trend-date">{{ formatDate(item.date) }}</view>
          <view class="trend-bar-wrapper">
            <view 
              class="trend-bar" 
              :style="{ width: getBarWidth(item.count) + '%' }"
            ></view>
            <text class="trend-value">{{ item.count }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-tip" v-if="!loading && Object.keys(statistics).length === 0">
      <text>暂无数据</text>
    </view>
  </view>
</template>

<script>
import { get } from '@/utils/request.js'
import storage from '@/utils/storage.js'

export default {
  data() {
    return {
      statistics: {},
      loading: false,
      maxDailyCount: 0
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
    
    this.loadStatistics()
  },
  onPullDownRefresh() {
    this.loadStatistics()
  },
  methods: {
    async loadStatistics() {
      this.loading = true
      try {
        const res = await get('/statistics')
        if (res && res.data) {
          this.statistics = res.data
          
          // 计算最大日创建数，用于显示趋势图
          if (res.data.dailyBlade && res.data.dailyBlade.length > 0) {
            this.maxDailyCount = Math.max(...res.data.dailyBlade.map(item => item.count))
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },
    
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}-${day}`
    },
    
    getBarWidth(count) {
      if (!this.maxDailyCount || this.maxDailyCount === 0) return 0
      return Math.min((count / this.maxDailyCount) * 100, 100)
    }
  }
}
</script>

<style scoped>
.statistics-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  text-align: center;
}

.stat-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.stat-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.stat-item {
  flex: 1;
  min-width: calc(50% - 10rpx);
  text-align: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 15rpx;
}

.stat-item.success {
  background: #e8f5e9;
}

.stat-item.danger {
  background: #ffebee;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10rpx;
}

.stat-item.success .stat-value {
  color: #4caf50;
}

.stat-item.danger .stat-value {
  color: #f44336;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.trend-date {
  width: 120rpx;
  font-size: 24rpx;
  color: #666;
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15rpx;
  position: relative;
  height: 40rpx;
  background: #f5f5f5;
  border-radius: 20rpx;
  overflow: hidden;
}

.trend-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  transition: width 0.3s ease;
}

.trend-value {
  position: relative;
  z-index: 1;
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  margin-left: 10rpx;
}

.empty-tip {
  text-align: center;
  padding: 100rpx;
  color: #999;
  font-size: 28rpx;
}
</style>

