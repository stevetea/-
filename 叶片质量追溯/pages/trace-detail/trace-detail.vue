<template>
  <view class="trace-container">
    <!-- 叶片基本信息 -->
    <view class="blade-info-card">
      <view class="card-header">
        <text class="blade-sn">{{ bladeInfo.blade_sn || '未知' }}</text>
        <text class="status" :class="getStatusClass(bladeInfo.status)">
          {{ getStatusText(bladeInfo.status) }}
        </text>
      </view>
      <view class="info-row">
        <text class="label">叶片ID：</text>
        <text class="value">{{ bladeInfo.blade_id }}</text>
      </view>
      <view class="info-row" v-if="bladeInfo.created_at">
        <text class="label">创建时间：</text>
        <text class="value">{{ formatDateTime(bladeInfo.created_at) }}</text>
      </view>
    </view>
    
    <!-- 工艺流程进度 -->
    <view class="process-section">
      <view class="section-title">工艺流程</view>
      <view class="process-list">
        <view 
          class="process-item" 
          v-for="(process, index) in filteredProcesses" 
          :key="index"
          :class="getProcessClass(process)"
        >
          <view class="process-header">
            <view class="process-number">{{ process.processOrder }}</view>
            <text class="process-name">{{ process.processName }}</text>
            <text class="process-status" v-if="process.record">
              {{ process.record.is_success ? '✓' : '✗' }}
            </text>
          </view>
          
          <!-- 操作员只能看到自己操作的工序详情 -->
          <view 
            class="process-details" 
            v-if="canViewProcess(process)"
          >
            <view class="detail-row" v-if="process.record">
              <text class="detail-label">操作员：</text>
              <text class="detail-value">{{ process.record.operator_name || '未知' }}</text>
            </view>
            <view class="detail-row" v-if="process.record && process.record.performed_at">
              <text class="detail-label">执行时间：</text>
              <text class="detail-value">{{ formatDateTime(process.record.performed_at) }}</text>
            </view>
            <view class="detail-row" v-if="process.record && process.record.attempt_no > 1">
              <text class="detail-label">尝试次数：</text>
              <text class="detail-value">第{{ process.record.attempt_no }}次</text>
            </view>
            <view class="detail-row" v-if="process.record && !process.record.is_success">
              <text class="detail-label">失败原因：</text>
              <text class="detail-value error">{{ process.record.fail_reason }}</text>
            </view>
            
            <!-- 工艺参数（根据角色显示） -->
            <view class="process-params" v-if="userInfo.role === 'QC' || userInfo.role === 'ADMIN'">
              <view 
                class="param-item" 
                v-for="(value, key) in getProcessParams(process)" 
                :key="key"
              >
                <text class="param-label">{{ formatParamName(key) }}：</text>
                <text class="param-value">{{ value }}</text>
              </view>
            </view>
          </view>
          
          <!-- 操作员看不到其他操作员的工序详情 -->
          <view class="process-locked" v-else-if="process.record && !canViewProcess(process)">
            <text class="locked-text">该工序由其他操作员操作，无权限查看详情</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 质检信息 -->
    <view class="qc-section" v-if="qcInfo">
      <view class="section-title">最终质检</view>
      <view class="qc-card">
        <view class="qc-row">
          <text class="qc-label">质检结论：</text>
          <text class="qc-value" :class="qcInfo.result === 'PASS' ? 'pass' : 'fail'">
            {{ qcInfo.result === 'PASS' ? '通过' : '不通过' }}
          </text>
        </view>
        <view class="qc-row">
          <text class="qc-label">质检员：</text>
          <text class="qc-value">{{ qcInfo.inspector_name || '未知' }}</text>
        </view>
        <view class="qc-row" v-if="qcInfo.inspected_at">
          <text class="qc-label">质检时间：</text>
          <text class="qc-value">{{ formatDateTime(qcInfo.inspected_at) }}</text>
        </view>
        <view class="qc-row" v-if="qcInfo.weight_g">
          <text class="qc-label">重量：</text>
          <text class="qc-value">{{ qcInfo.weight_g }}g</text>
        </view>
        <view class="qc-row" v-if="qcInfo.defect_level && qcInfo.defect_level !== 'NONE'">
          <text class="qc-label">缺陷等级：</text>
          <text class="qc-value">{{ getDefectLevelText(qcInfo.defect_level) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 质检员可以填写质检报告 -->
    <view class="action-section" v-if="(userInfo.role === 'QC' || userInfo.role === 'ADMIN') && bladeInfo.status === 'READY_FOR_QC' && !qcInfo">
      <button class="qc-btn" @click="goToQCInput">填写质检报告</button>
    </view>
  </view>
</template>

<script>
import { get } from '@/utils/request.js'
import storage from '@/utils/storage.js'
import { BLADE_STATUS_MAP, PROCESS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      bladeId: null,
      bladeInfo: {},
      processes: [],
      qcInfo: null,
      userInfo: {}
    }
  },
  computed: {
    // 根据角色过滤工序
    filteredProcesses() {
      if (this.userInfo.role === 'QC' || this.userInfo.role === 'ADMIN') {
        // 质检员和管理员可以看到所有工序
        return this.processes
      } else {
        // 操作员只能看到自己操作的工序
        return this.processes.filter(p => this.canViewProcess(p))
      }
    }
  },
  onLoad(options) {
    this.bladeId = parseInt(options.bladeId)
    if (!this.bladeId) {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    const userInfo = storage.getUserInfo()
    if (!userInfo) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    this.userInfo = userInfo
    
    this.loadTraceData()
  },
  methods: {
    async loadTraceData() {
      uni.showLoading({ title: '加载中...' })
      
      try {
        // 获取完整追溯信息
        const res = await get(`/blade/${this.bladeId}/trace`)
        
        if (res.data) {
          this.bladeInfo = res.data.blade || {}
          this.processes = res.data.processes || []
          this.qcInfo = res.data.qc || null
          
          // 按工序顺序排序
          this.processes.sort((a, b) => a.processOrder - b.processOrder)
        }
      } catch (error) {
        console.error('加载追溯数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 判断是否可以查看该工序详情
    canViewProcess(process) {
      // 质检员和管理员可以查看所有
      if (this.userInfo.role === 'QC' || this.userInfo.role === 'ADMIN') {
        return true
      }
      
      // 操作员只能查看自己操作的工序
      if (process.record && process.record.operator_id === this.userInfo.operator_id) {
        return true
      }
      
      // 没有记录或不是自己操作的，不能查看
      return false
    },
    
    getProcessClass(process) {
      if (!process.record) {
        return 'process-pending'
      }
      if (process.record.is_success) {
        return 'process-success'
      }
      return 'process-failed'
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
    
    formatDateTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },
    
    getProcessParams(process) {
      if (!process.record) return {}
      
      const params = {}
      const record = process.record
      
      // 根据工序类型提取参数（这里简化处理，实际应该根据processCode动态提取）
      Object.keys(record).forEach(key => {
        if (!['id', 'blade_id', 'operator_id', 'performed_at', 'is_success', 
              'fail_reason', 'attempt_no', 'remarks', 'created_at', 'operator_name'].includes(key)) {
          if (record[key] !== null && record[key] !== undefined && record[key] !== '') {
            params[key] = record[key]
          }
        }
      })
      
      return params
    },
    
    formatParamName(key) {
      // 简单的字段名格式化
      const nameMap = {
        'furnace_no': '炉号',
        'target_temp_c': '目标温度(°C)',
        'actual_temp_c': '实际温度(°C)',
        'press_no': '冲压机编号',
        'tonnage_t': '吨位(t)',
        'grinder_no': '打磨设备编号',
        'wheel_grit': '砂轮目数',
        'paint_batch_no': '陶瓷漆批次号',
        'coating_thickness_um': '涂层厚度(μm)',
        'machine_no': '设备编号',
        'equipment_no': '检测设备编号',
        'defect_count': '缺陷数量'
      }
      return nameMap[key] || key
    },
    
    getDefectLevelText(level) {
      const levelMap = {
        'NONE': '无',
        'MINOR': '轻微',
        'MAJOR': '严重',
        'CRITICAL': '致命'
      }
      return levelMap[level] || level
    },
    
    goToQCInput() {
      uni.navigateTo({
        url: `/pages/qc-input/qc-input?bladeId=${this.bladeId}`
      })
    }
  }
}
</script>

<style scoped>
.trace-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.blade-info-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.blade-sn {
  font-size: 36rpx;
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

.info-row {
  display: flex;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}

.info-row .label {
  color: #666666;
  margin-right: 10rpx;
}

.info-row .value {
  color: #333333;
}

.process-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.process-item {
  border: 2rpx solid #e0e0e0;
  border-radius: 15rpx;
  padding: 25rpx;
  background: #fafafa;
}

.process-item.process-success {
  border-color: #4caf50;
  background: #f1f8e9;
}

.process-item.process-failed {
  border-color: #f44336;
  background: #ffebee;
}

.process-item.process-pending {
  border-color: #9e9e9e;
  background: #f5f5f5;
  opacity: 0.6;
}

.process-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.process-number {
  width: 50rpx;
  height: 50rpx;
  background: #667eea;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.process-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
}

.process-status {
  font-size: 36rpx;
  color: #4caf50;
}

.process-item.process-failed .process-status {
  color: #f44336;
}

.process-details {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e0e0e0;
}

.detail-row {
  display: flex;
  margin-bottom: 10rpx;
  font-size: 26rpx;
}

.detail-label {
  color: #666666;
  margin-right: 10rpx;
  min-width: 140rpx;
}

.detail-value {
  color: #333333;
  flex: 1;
}

.detail-value.error {
  color: #f44336;
}

.process-params {
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx dashed #e0e0e0;
}

.param-item {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 24rpx;
}

.param-label {
  color: #999999;
  margin-right: 10rpx;
  min-width: 200rpx;
}

.param-value {
  color: #666666;
  flex: 1;
}

.process-locked {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #fff3e0;
  border-radius: 10rpx;
  text-align: center;
}

.locked-text {
  font-size: 24rpx;
  color: #f57c00;
}

.qc-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.qc-card {
  background: #f5f5f5;
  border-radius: 15rpx;
  padding: 25rpx;
}

.qc-row {
  display: flex;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}

.qc-row:last-child {
  margin-bottom: 0;
}

.qc-label {
  color: #666666;
  margin-right: 10rpx;
  min-width: 140rpx;
}

.qc-value {
  color: #333333;
  flex: 1;
}

.qc-value.pass {
  color: #4caf50;
  font-weight: bold;
}

.qc-value.fail {
  color: #f44336;
  font-weight: bold;
}

.action-section {
  padding: 20rpx;
}

.qc-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.qc-btn::after {
  border: none;
}
</style>

