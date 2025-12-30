<template>
  <view class="blade-add-container">
    <view class="form-card">
      <view class="card-title">新增叶片</view>
      
      <!-- 叶片序列号输入 -->
      <view class="form-section">
        <view class="section-title">叶片序列号 *</view>
        <input 
          class="input" 
          v-model="form.blade_sn" 
          placeholder="请输入叶片序列号"
          maxlength="50"
        />
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        创建叶片
      </button>
      
      <!-- 创建成功后的二维码显示 -->
      <view class="qr-section" v-if="createdBlade">
        <view class="success-tip">
          <text class="success-icon">✓</text>
          <text class="success-text">叶片创建成功！</text>
        </view>
        
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
            <text class="label">二维码内容：</text>
            <text class="value qr-content">{{ qrContent }}</text>
          </view>
        </view>
        
        <view class="qr-code-wrapper">
          <canvas 
            canvas-id="qrcode" 
            class="qrcode-canvas"
            :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
          ></canvas>
        </view>
        
        <view class="qr-tip">
          <text>请保存或打印此二维码，用于叶片追溯</text>
        </view>
        
        <view class="action-buttons">
          <button class="action-btn secondary" @click="createAnother">
            继续创建
          </button>
          <button class="action-btn primary" @click="saveQRCode">
            保存二维码
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { post } from '@/utils/request.js'
import storage from '@/utils/storage.js'
// 使用uQRCode生成二维码
import uQRCode from '@/utils/uqrcode.js'

export default {
  data() {
    return {
      form: {
        blade_sn: ''
      },
      submitting: false,
      createdBlade: null,
      qrContent: '',
      qrSize: 300
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
      if (!this.form.blade_sn || this.form.blade_sn.trim() === '') {
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
          // 生成二维码内容（只存叶片ID）
          this.qrContent = `B${res.data.blade_id}`
          
          // 延迟生成二维码，确保canvas已渲染
          this.$nextTick(() => {
            setTimeout(() => {
              this.generateQRCode()
            }, 100)
          })
          
          uni.showToast({
            title: '创建成功',
            icon: 'success'
          })
        }
      } catch (error) {
        console.error('创建叶片失败:', error)
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
      // 使用uQRCode生成二维码
      uQRCode.make({
        canvasId: 'qrcode',
        componentInstance: this,
        text: this.qrContent,
        size: this.qrSize,
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        fileType: 'png',
        errorCorrectLevel: uQRCode.errorCorrectLevel.H
      }).then(() => {
        console.log('二维码生成成功')
      }).catch(err => {
        console.error('二维码生成失败:', err)
        uni.showToast({
          title: '二维码生成失败',
          icon: 'none'
        })
      })
    },
    
    createAnother() {
      this.createdBlade = null
      this.qrContent = ''
      this.form.blade_sn = ''
    },
    
    async saveQRCode() {
      try {
        // 将canvas转换为图片
        const ctx = uni.createCanvasContext('qrcode', this)
        const res = await new Promise((resolve, reject) => {
          uni.canvasToTempFilePath({
            canvasId: 'qrcode',
            success: resolve,
            fail: reject
          }, this)
        })
        
        if (res.tempFilePath) {
          // 保存到相册
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.showToast({
                title: '保存成功',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('保存失败:', err)
              uni.showToast({
                title: '保存失败',
                icon: 'none'
              })
            }
          })
        }
      } catch (error) {
        console.error('保存二维码失败:', error)
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.blade-add-container {
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

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
  font-weight: 500;
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

/* 二维码区域样式 */
.qr-section {
  margin-top: 40rpx;
  padding-top: 40rpx;
  border-top: 2rpx solid #e0e0e0;
}

.success-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  gap: 15rpx;
}

.success-icon {
  width: 60rpx;
  height: 60rpx;
  background: #4caf50;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
}

.success-text {
  font-size: 32rpx;
  color: #4caf50;
  font-weight: bold;
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
  width: 200rpx;
}

.info-item .value {
  color: #333;
  font-weight: 500;
  flex: 1;
}

.qr-content {
  font-family: 'Courier New', monospace;
  font-size: 32rpx;
  color: #667eea;
  font-weight: bold;
}

.qr-code-wrapper {
  display: flex;
  justify-content: center;
  margin: 30rpx 0;
  padding: 30rpx;
  background: #ffffff;
  border-radius: 15rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.qrcode-canvas {
  display: block;
}

.qr-tip {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  margin-bottom: 30rpx;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
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

