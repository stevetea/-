<template>
  <view class="create-container">
    <view class="form-card">
      <view class="card-title">创建新叶片</view>
      
      <!-- 表单 -->
      <view class="form-section">
        <view class="input-group">
          <text class="input-label">叶片序列号 *</text>
          <input 
            class="input" 
            v-model="form.blade_sn" 
            placeholder="请输入叶片序列号，例如：BLADE-001"
            maxlength="50"
          />
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        创建叶片并生成二维码
      </button>
      
      <!-- 创建成功后的显示 -->
      <view v-if="createdBlade" class="success-section">
        <view class="success-title">✓ 创建成功</view>
        <view class="blade-info">
          <view class="info-item">
            <text class="label">叶片ID：</text>
            <text class="value">{{ createdBlade.blade_id }}</text>
          </view>
          <view class="info-item">
            <text class="label">叶片序列号：</text>
            <text class="value">{{ createdBlade.blade_sn }}</text>
          </view>
          <view class="info-item">
            <text class="label">状态：</text>
            <text class="value">{{ getStatusText(createdBlade.status) }}</text>
          </view>
        </view>
        
        <!-- 二维码显示 -->
        <view class="qr-section">
          <view class="qr-title">二维码（只存储叶片ID）</view>
          <view class="qr-content">{{ qrContent }}</view>
          <canvas 
            canvas-id="qrcode" 
            class="qrcode-canvas"
            :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
          ></canvas>
          <view class="qr-tip">用手机扫描此二维码可查看叶片追溯信息</view>
          <view class="qr-tip" style="margin-top: 10rpx; color: #999; font-size: 24rpx;">
            提示：二维码内容为 {{ qrContent }}，您也可以使用二维码生成工具生成
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button class="action-btn secondary" @click="createAnother">继续创建</button>
          <button class="action-btn primary" @click="viewTrace">查看详情</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { post } from '@/utils/request.js'
import storage from '@/utils/storage.js'
import { BLADE_STATUS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      form: {
        blade_sn: ''
      },
      submitting: false,
      createdBlade: null,
      qrContent: '',
      qrSize: 200,
      showQRText: false
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
  },
  methods: {
    async handleSubmit() {
      if (!this.form.blade_sn || !this.form.blade_sn.trim()) {
        uni.showToast({
          title: '请输入叶片序列号',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        const res = await post('/blade', {
          blade_sn: this.form.blade_sn.trim()
        })
        
        if (res && res.data) {
          this.createdBlade = res.data
          // 生成二维码内容（只存储叶片ID）
          this.qrContent = `B${res.data.blade_id}`
          
          // 生成二维码
          this.$nextTick(() => {
            this.generateQRCode()
          })
          
          uni.showToast({
            title: '创建成功',
            icon: 'success'
          })
        }
      } catch (error) {
        console.error('创建失败:', error)
        const errorMsg = error.message || error.data?.message || '创建失败，请重试'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.submitting = false
      }
    },
    
    generateQRCode() {
      // 使用在线API生成二维码图片
      this.$nextTick(() => {
        try {
          // 创建canvas上下文
          const ctx = uni.createCanvasContext('qrcode', this)
          
          // 使用在线API生成二维码
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.qrSize}x${this.qrSize}&data=${encodeURIComponent(this.qrContent)}`
          
          // 在canvas上绘制二维码图片
          uni.downloadFile({
            url: qrUrl,
            success: (res) => {
              if (res.statusCode === 200) {
                ctx.drawImage(res.tempFilePath, 0, 0, this.qrSize, this.qrSize)
                ctx.draw(false, () => {
                  console.log('二维码生成成功')
                  this.showQRText = false
                })
              } else {
                this.showQRText = true
              }
            },
            fail: () => {
              // 如果在线API失败，显示文本内容
              console.warn('在线二维码生成失败，显示文本内容')
              this.showQRText = true
            }
          })
        } catch (error) {
          console.error('二维码生成失败:', error)
          // 如果生成失败，至少显示文本内容
          this.showQRText = true
        }
      })
    },
    
    createAnother() {
      this.createdBlade = null
      this.qrContent = ''
      this.form.blade_sn = ''
    },
    
    viewTrace() {
      if (this.createdBlade && this.createdBlade.blade_id) {
        uni.navigateTo({
          url: `/pages/trace-detail/trace-detail?bladeId=${this.createdBlade.blade_id}`
        })
      }
    },
    
    getStatusText(status) {
      return BLADE_STATUS_MAP[status] || status
    }
  }
}
</script>

<style scoped>
.create-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.form-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.form-section {
  margin-bottom: 30rpx;
}

.input-group {
  margin-bottom: 25rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
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

.success-section {
  margin-top: 40rpx;
  padding-top: 40rpx;
  border-top: 2rpx solid #e0e0e0;
}

.success-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #4caf50;
  text-align: center;
  margin-bottom: 30rpx;
}

.blade-info {
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
  width: 180rpx;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.qr-section {
  text-align: center;
  margin-bottom: 30rpx;
}

.qr-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.qr-content {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 20rpx;
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.qrcode-canvas {
  margin: 20rpx auto;
  display: block;
}

.qr-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 20rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
}

.action-btn.secondary {
  background: #f5f5f5;
  color: #666;
}

.action-btn::after {
  border: none;
}
</style>

