<template>
  <view class="qc-input-container">
    <!-- 如果没有选择叶片，显示待质检叶片列表 -->
    <view v-if="!bladeId" class="blade-list-card">
      <view class="card-title">选择待质检叶片</view>
      <view class="list-header">
        <text class="list-tip">请选择所有工艺已完成的叶片进行质检</text>
      </view>
      <view class="blade-list" v-if="readyBlades.length > 0">
        <view 
          class="blade-item" 
          v-for="(item, index) in readyBlades" 
          :key="index"
          @click="selectBlade(item.blade_id)"
        >
          <view class="blade-item-info">
            <text class="blade-sn">{{ item.blade_sn }}</text>
            <text class="blade-id">ID: {{ item.blade_id }}</text>
          </view>
          <text class="select-arrow">→</text>
        </view>
      </view>
      <view class="empty-tip" v-else-if="!loading">
        <text>暂无待质检的叶片</text>
      </view>
      <view class="loading-tip" v-if="loading">
        <text>加载中...</text>
      </view>
    </view>
    
    <!-- 如果已选择叶片，显示质检录入表单 -->
    <view v-else class="form-card">
      <view class="card-title">最终质检报告</view>
      
      <!-- 返回按钮 -->
      <view class="back-btn" @click="goBackToList">
        <text>← 返回选择</text>
      </view>
      
      <!-- 叶片信息 -->
      <view class="blade-info">
        <view class="info-item">
          <text class="label">叶片序列号：</text>
          <text class="value">{{ bladeInfo.blade_sn || '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="label">叶片ID：</text>
          <text class="value">{{ bladeId }}</text>
        </view>
        <view class="info-item" v-if="bladeInfo.status">
          <text class="label">当前状态：</text>
          <text class="value">{{ getStatusText(bladeInfo.status) }}</text>
        </view>
        <!-- 荧光检测结果 -->
        <view class="info-item fluorescent-result" v-if="fluorescentTest">
          <text class="label">荧光检测结果：</text>
          <view class="fluorescent-detail">
            <text class="value" :class="fluorescentTest.is_success ? 'success' : 'fail'">
              {{ fluorescentTest.is_success ? '通过' : '不通过' }}
            </text>
            <text class="detail-text" v-if="fluorescentTest.equipment_no">
              设备：{{ fluorescentTest.equipment_no }}
            </text>
            <text class="detail-text" v-if="fluorescentTest.defect_count !== null && fluorescentTest.defect_count !== undefined">
              缺陷数量：{{ fluorescentTest.defect_count }}
            </text>
            <text class="detail-text" v-if="fluorescentTest.inspector_notes">
              检查说明：{{ fluorescentTest.inspector_notes }}
            </text>
            <text class="detail-text" v-if="fluorescentTest.fail_reason">
              失败原因：{{ fluorescentTest.fail_reason }}
            </text>
          </view>
        </view>
      </view>
      
      <!-- 质检结果 -->
      <view class="form-section">
        <view class="section-title">质检结论 *</view>
        <view class="radio-group">
          <label class="radio-item" @click="form.result = 'PASS'">
            <radio :checked="form.result === 'PASS'" color="#667eea" />
            <text>通过</text>
          </label>
          <label class="radio-item" @click="form.result = 'FAIL'">
            <radio :checked="form.result === 'FAIL'" color="#667eea" />
            <text>不通过</text>
          </label>
        </view>
      </view>
      
      <!-- 尺寸检查 -->
      <view class="form-section">
        <view class="section-title">尺寸检查 *</view>
        <view class="radio-group">
          <label class="radio-item" @click="form.dimension_pass = 1">
            <radio :checked="form.dimension_pass === 1" color="#667eea" />
            <text>合格</text>
          </label>
          <label class="radio-item" @click="form.dimension_pass = 0">
            <radio :checked="form.dimension_pass === 0" color="#667eea" />
            <text>不合格</text>
          </label>
        </view>
      </view>
      
      <!-- 外观检查 -->
      <view class="form-section">
        <view class="section-title">外观/表面检查 *</view>
        <view class="radio-group">
          <label class="radio-item" @click="form.surface_pass = 1">
            <radio :checked="form.surface_pass === 1" color="#667eea" />
            <text>合格</text>
          </label>
          <label class="radio-item" @click="form.surface_pass = 0">
            <radio :checked="form.surface_pass === 0" color="#667eea" />
            <text>不合格</text>
          </label>
        </view>
      </view>
      
      <!-- 测量数据 -->
      <view class="form-section">
        <view class="section-title">测量数据</view>
        <view class="input-group">
          <text class="input-label">重量(g)</text>
          <input 
            class="input" 
            v-model="form.weight_g" 
            type="digit"
            placeholder="请输入重量"
          />
        </view>
        <view class="input-group">
          <text class="input-label">关键尺寸(mm)</text>
          <input 
            class="input" 
            v-model="form.key_dimension_mm" 
            type="digit"
            placeholder="请输入关键尺寸"
          />
        </view>
      </view>
      
      <!-- 缺陷等级（不通过时必填） -->
      <view class="form-section" v-if="form.result === 'FAIL'">
        <view class="section-title">缺陷等级 *</view>
        <picker 
          mode="selector" 
          :range="defectLevels" 
          range-key="label"
          :value="defectLevelIndex"
          @change="onDefectLevelChange"
        >
          <view class="picker">
            {{ defectLevels[defectLevelIndex].label }}
          </view>
        </picker>
      </view>
      
      <!-- 不合格单号（不通过时） -->
      <view class="form-section" v-if="form.result === 'FAIL'">
        <view class="section-title">不合格单号</view>
        <input 
          class="input" 
          v-model="form.ncr_no" 
          placeholder="请输入不合格单号"
          maxlength="40"
        />
      </view>
      
      <!-- 备注 -->
      <view class="form-section">
        <view class="section-title">备注</view>
        <textarea 
          class="textarea" 
          v-model="form.remarks" 
          placeholder="请输入备注信息"
          maxlength="255"
        />
      </view>
      
      <!-- 提交按钮 -->
      <button 
        class="submit-btn" 
        @click="handleSubmit" 
        :loading="submitting"
        :disabled="hasExistingQC"
      >
        {{ hasExistingQC ? '已质检，无法提交' : '提交质检报告' }}
      </button>
      
      <!-- 已质检提示 -->
      <view class="warning-tip" v-if="hasExistingQC">
        <text>⚠️ 该叶片已经进行过质检，不能重复提交</text>
      </view>
    </view>
  </view>
</template>

<script>
import { get, post } from '@/utils/request.js'
import storage from '@/utils/storage.js'
import { PROCESS_MAP, BLADE_STATUS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      bladeId: null,
      bladeInfo: {},
      fluorescentTest: null,  // 荧光检测记录
      readyBlades: [],
      loading: false,
      form: {
        result: 'PASS',
        dimension_pass: 1,
        surface_pass: 1,
        weight_g: '',
        key_dimension_mm: '',
        defect_level: 'NONE',
        ncr_no: '',
        remarks: ''
      },
      hasExistingQC: false,  // 是否已有质检记录
      defectLevels: [
        { value: 'NONE', label: '无' },
        { value: 'MINOR', label: '轻微' },
        { value: 'MAJOR', label: '严重' },
        { value: 'CRITICAL', label: '致命' }
      ],
      defectLevelIndex: 0,
      submitting: false
    }
  },
  onLoad(options) {
    // 检查权限
    const userInfo = storage.getUserInfo()
    if (!userInfo || (userInfo.role !== 'QC' && userInfo.role !== 'ADMIN')) {
      uni.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 如果传入了bladeId，直接加载叶片信息
    if (options.bladeId) {
      this.bladeId = parseInt(options.bladeId)
      if (this.bladeId) {
        this.loadBladeInfo()
      }
    } else {
      // 如果没有传入bladeId，加载待质检叶片列表
      this.loadReadyBlades()
    }
  },
  onShow() {
    // 如果从其他页面返回且没有选择叶片，重新加载列表
    if (!this.bladeId) {
      this.loadReadyBlades()
    }
  },
  methods: {
    // 加载所有工艺已完成的叶片列表
    async loadReadyBlades() {
      this.loading = true
      try {
        // 获取所有叶片（排除已完成和报废的）
        const res = await get('/blade/list', {
          limit: 200
        })
        
        if (!res || !res.data || !res.data.list) {
          this.readyBlades = []
          return
        }
        
        const allBlades = res.data.list
        const readyBlades = []
        
        console.log(`需要检查 ${allBlades.length} 个叶片，检查是否进行了荧光检测`)
        
        // 检查每个叶片是否进行了荧光检测（无论成功失败）
        for (const blade of allBlades) {
          // 跳过已完成和报废的叶片
          if (blade.status === 'COMPLETED' || blade.status === 'SCRAPPED') {
            continue
          }
          
          try {
            // 获取该叶片的追溯信息
            const traceRes = await get(`/blade/${blade.blade_id}/trace`)
            if (traceRes && traceRes.data && traceRes.data.processes) {
              // 检查是否进行了荧光检测（无论成功失败）
              const fluorescentProcess = traceRes.data.processes.find(
                p => p.processCode === 'FLUORESCENT_TEST'
              )
              
              // 如果进行了荧光检测，且还没有质检记录，则加入列表
              if (fluorescentProcess && fluorescentProcess.record && !traceRes.data.qc) {
                console.log(`叶片 ${blade.blade_id} (${blade.blade_sn}) 已进行荧光检测，可进行质检`)
                readyBlades.push(blade)
              } else {
                console.log(`叶片 ${blade.blade_id} (${blade.blade_sn}) 未进行荧光检测或已有质检: 有荧光检测=${!!(fluorescentProcess && fluorescentProcess.record)}, 已有质检=${!!traceRes.data.qc}`)
              }
            }
          } catch (error) {
            // 如果获取追溯信息失败，跳过该叶片
            console.error(`检查叶片 ${blade.blade_id} 失败:`, error)
          }
        }
        
        console.log(`找到 ${readyBlades.length} 个可质检的叶片`)
        this.readyBlades = readyBlades
      } catch (error) {
        console.error('加载叶片列表失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.readyBlades = []
      } finally {
        this.loading = false
      }
    },
    
    // 选择叶片
    selectBlade(bladeId) {
      this.bladeId = bladeId
      this.loadBladeInfo()
    },
    
    // 返回列表
    goBackToList() {
      this.bladeId = null
      this.bladeInfo = {}
      this.fluorescentTest = null
      // 重置表单
      this.form = {
        result: 'PASS',
        dimension_pass: 1,
        surface_pass: 1,
        weight_g: '',
        key_dimension_mm: '',
        defect_level: 'NONE',
        ncr_no: '',
        remarks: ''
      }
      this.defectLevelIndex = 0
      this.loadReadyBlades()
    },
    
    async loadBladeInfo() {
      try {
        // 同时获取叶片信息和追溯信息，检查是否已完成所有工序
        const [bladeRes, traceRes] = await Promise.all([
          get(`/blade/${this.bladeId}`),
          get(`/blade/${this.bladeId}/trace`)
        ])
        
        if (bladeRes.data) {
          this.bladeInfo = bladeRes.data
          
          // 检查是否已经质检过
          if (traceRes.data && traceRes.data.qc) {
            this.hasExistingQC = true
            uni.showModal({
              title: '提示',
              content: '该叶片已经进行过质检，不能重复质检',
              showCancel: false,
              success: () => {
                this.goBackToList()
              }
            })
            return
          } else {
            this.hasExistingQC = false
          }
          
          // 检查是否进行了荧光检测（无论成功失败）
          if (traceRes.data && traceRes.data.processes) {
            const fluorescentProcess = traceRes.data.processes.find(
              p => p.processCode === 'FLUORESCENT_TEST'
            )
            
            if (fluorescentProcess && fluorescentProcess.record) {
              // 提取荧光检测记录信息
              this.fluorescentTest = {
                is_success: fluorescentProcess.isSuccess,
                equipment_no: fluorescentProcess.record.equipment_no || '',
                defect_count: fluorescentProcess.record.defect_count !== null && fluorescentProcess.record.defect_count !== undefined 
                  ? fluorescentProcess.record.defect_count : null,
                inspector_notes: fluorescentProcess.record.inspector_notes || '',
                fail_reason: fluorescentProcess.record.fail_reason || ''
              }
            } else {
              // 如果没有荧光检测记录，提示用户
              uni.showModal({
                title: '提示',
                content: '该叶片尚未进行荧光检测，无法进行质检录入。请先完成荧光检测。',
                showCancel: false,
                success: () => {
                  this.goBackToList()
                }
              })
              return
            }
          } else {
            // 如果没有追溯信息，提示用户
            uni.showModal({
              title: '提示',
              content: '无法获取叶片追溯信息，请重试',
              showCancel: false,
              success: () => {
                this.goBackToList()
              }
            })
            return
          }
        }
      } catch (error) {
        console.error('加载叶片信息失败:', error)
        const errorMsg = error.message || error.data?.message || '加载失败'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        // 延迟返回列表
        setTimeout(() => {
          this.goBackToList()
        }, 2000)
      }
    },
    
    onDefectLevelChange(e) {
      this.defectLevelIndex = parseInt(e.detail.value)
      this.form.defect_level = this.defectLevels[this.defectLevelIndex].value
    },
    
    validateForm() {
      // 验证质检结论
      if (!this.form.result) {
        uni.showToast({
          title: '请选择质检结论',
          icon: 'none'
        })
        return false
      }
      
      // 验证尺寸检查
      if (this.form.dimension_pass === null || this.form.dimension_pass === undefined) {
        uni.showToast({
          title: '请选择尺寸检查结果',
          icon: 'none'
        })
        return false
      }
      
      // 验证外观检查
      if (this.form.surface_pass === null || this.form.surface_pass === undefined) {
        uni.showToast({
          title: '请选择外观/表面检查结果',
          icon: 'none'
        })
        return false
      }
      
      // 不通过时的验证
      if (this.form.result === 'FAIL') {
        // 必须选择缺陷等级
        if (this.form.defect_level === 'NONE') {
          uni.showToast({
            title: '不通过时必须选择缺陷等级',
            icon: 'none'
          })
          return false
        }
        
        // 建议填写不合格单号（可选但推荐）
        // if (!this.form.ncr_no || !this.form.ncr_no.trim()) {
        //   uni.showToast({
        //     title: '不通过时建议填写不合格单号',
        //     icon: 'none'
        //   })
        //   return false
        // }
      }
      
      // 验证数字格式
      if (this.form.weight_g && isNaN(parseFloat(this.form.weight_g))) {
        uni.showToast({
          title: '重量格式不正确',
          icon: 'none'
        })
        return false
      }
      
      if (this.form.key_dimension_mm && isNaN(parseFloat(this.form.key_dimension_mm))) {
        uni.showToast({
          title: '关键尺寸格式不正确',
          icon: 'none'
        })
        return false
      }
      
      // 验证数值范围（可选）
      if (this.form.weight_g) {
        const weight = parseFloat(this.form.weight_g)
        if (weight <= 0 || weight > 10000) {
          uni.showToast({
            title: '重量应在0-10000g之间',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.form.key_dimension_mm) {
        const dimension = parseFloat(this.form.key_dimension_mm)
        if (dimension <= 0 || dimension > 1000) {
          uni.showToast({
            title: '关键尺寸应在0-1000mm之间',
            icon: 'none'
          })
          return false
        }
      }
      
      return true
    },
    
    async handleSubmit() {
      // 检查是否已质检
      if (this.hasExistingQC) {
        uni.showToast({
          title: '该叶片已质检，不能重复提交',
          icon: 'none'
        })
        return
      }
      
      if (!this.validateForm()) {
        return
      }
      
      this.submitting = true
      
      try {
        const userInfo = storage.getUserInfo()
        
        const data = {
          blade_id: this.bladeId,
          inspector_id: userInfo.operator_id,
          result: this.form.result,
          dimension_pass: this.form.dimension_pass,
          surface_pass: this.form.surface_pass,
          weight_g: this.form.weight_g ? parseFloat(this.form.weight_g) : null,
          key_dimension_mm: this.form.key_dimension_mm ? parseFloat(this.form.key_dimension_mm) : null,
          defect_level: this.form.defect_level,
          ncr_no: this.form.ncr_no || null,
          remarks: this.form.remarks || null
        }
        
        const res = await post('/qc', data)
        
        if (res && res.data) {
          // 根据质检结果显示不同的提示
          const resultText = this.form.result === 'PASS' ? '通过' : '不通过'
          const statusText = this.form.result === 'PASS' ? '已完成' : '已报废'
          
          uni.showModal({
            title: '提交成功',
            content: `质检结论：${resultText}\n叶片状态已更新为：${statusText}`,
            showCancel: false,
            success: () => {
              // 返回列表，让质检员可以继续选择其他叶片
              this.goBackToList()
            }
          })
        }
      } catch (error) {
        console.error('提交失败:', error)
        const errorMsg = error.message || error.data?.message || '提交失败，请重试'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.submitting = false
      }
    },
    
    getStatusText(status) {
      return BLADE_STATUS_MAP[status] || status
    }
  }
}
</script>

<style scoped>
.qc-input-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.form-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  text-align: center;
}

.blade-info {
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  margin-bottom: 10rpx;
  font-size: 28rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666666;
  margin-right: 10rpx;
}

.info-item .value {
  color: #333333;
  font-weight: 500;
}

.fluorescent-result {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid #e5e5e5;
}

.fluorescent-detail {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 10rpx;
}

.fluorescent-detail .value {
  font-size: 30rpx;
  font-weight: bold;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  width: fit-content;
}

.fluorescent-detail .value.success {
  background: #d4edda;
  color: #155724;
}

.fluorescent-detail .value.fail {
  background: #f8d7da;
  color: #721c24;
}

.fluorescent-detail .detail-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.6;
}

.form-section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 20rpx;
}

.radio-group {
  display: flex;
  gap: 40rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333333;
}

.radio-item text {
  margin-left: 10rpx;
}

.input-group {
  margin-bottom: 20rpx;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333333;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn::after {
  border: none;
}

/* 叶片列表样式 */
.blade-list-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  min-height: calc(100vh - 40rpx);
}

.list-header {
  margin-bottom: 30rpx;
}

.list-tip {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
}

.blade-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.blade-item {
  background: #f8f9fa;
  border-radius: 15rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.blade-item:active {
  background: #e9ecef;
  transform: scale(0.98);
}

.blade-item-info {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.blade-sn {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.blade-id {
  font-size: 24rpx;
  color: #999999;
}

.select-arrow {
  font-size: 36rpx;
  color: #667eea;
}

.empty-tip {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.loading-tip {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.back-btn {
  margin-bottom: 20rpx;
  padding: 15rpx 0;
  color: #667eea;
  font-size: 28rpx;
  text-align: left;
}

.warning-tip {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #fff3cd;
  border-radius: 10rpx;
  text-align: center;
  font-size: 26rpx;
  color: #856404;
}

.submit-btn[disabled] {
  background: #cccccc !important;
  color: #999999 !important;
  opacity: 0.6;
}
</style>

