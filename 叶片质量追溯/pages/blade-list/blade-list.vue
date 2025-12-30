<template>
  <view class="list-container">
    <view class="filter-bar">
      <picker 
        mode="selector" 
        :range="statusOptions" 
        range-key="label"
        :value="statusIndex"
        @change="onStatusChange"
      >
        <view class="filter-item">
          <text>{{ statusOptions[statusIndex].label }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <view class="blade-list">
      <view 
        class="blade-item" 
        v-for="(item, index) in bladeList" 
        :key="index"
        @click="viewTrace(item.blade_id)"
      >
        <view class="item-header">
          <text class="blade-sn">{{ item.blade_sn }}</text>
          <text class="status" :class="getStatusClass(item.status)">
            {{ getStatusText(item.status) }}
          </text>
        </view>
        <view class="item-info">
          <text class="info-text">ID: {{ item.blade_id }}</text>
          <text class="info-text" v-if="item.updated_at">
            {{ formatTime(item.updated_at) }}
          </text>
        </view>
      </view>
    </view>
    
    <view class="empty-tip" v-if="bladeList.length === 0 && !loading">
      <text>暂无数据</text>
    </view>
  </view>
</template>

<script>
import { get } from '@/utils/request.js'
import { BLADE_STATUS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'READY_FOR_QC', label: '待质检' },
        { value: 'IN_PROCESS', label: '加工中' },
        { value: 'BLOCKED', label: '阻塞' },
        { value: 'COMPLETED', label: '完成' }
      ],
      statusIndex: 0,
      bladeList: [],
      loading: false
    }
  },
  onLoad() {
    this.loadBladeList()
  },
  onPullDownRefresh() {
    this.loadBladeList()
  },
  methods: {
    async loadBladeList() {
      this.loading = true
      
      try {
        const status = this.statusOptions[this.statusIndex].value
        const res = await get('/blade/list', {
          status: status,
          limit: 50
        })
        
        if (res && res.data) {
          this.bladeList = res.data.list || []
        } else {
          this.bladeList = []
        }
      } catch (error) {
        console.error('加载列表失败:', error)
        this.bladeList = []
        // 只在明确错误时提示
        if (error.code !== 404) {
          uni.showToast({
            title: error.message || '加载失败',
            icon: 'none'
          })
        }
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },
    
    onStatusChange(e) {
      this.statusIndex = parseInt(e.detail.value)
      this.loadBladeList()
    },
    
    viewTrace(bladeId) {
      uni.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
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
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${month}-${day} ${hour}:${minute}`
    }
  }
}
</script>

<style scoped>
.list-container {
  min-height: 100vh;
  background: #FFFFFF;
}

.filter-bar {
  background: #ffffff;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #333333;
}

.arrow {
  font-size: 20rpx;
  color: #999999;
}

.blade-list {
  padding: 0 20rpx;
}

.blade-item {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.blade-sn {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
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

.item-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999999;
}

.empty-tip {
  text-align: center;
  padding: 100rpx;
  color: #999999;
  font-size: 28rpx;
}
</style>

