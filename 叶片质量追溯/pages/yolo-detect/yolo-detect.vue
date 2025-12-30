<template>
  <view class="container">
    <view class="header">
      <text class="title">YOLO图像检测</text>
      <text class="subtitle">上传图片进行AI检测分析</text>
    </view>

    <!-- 模型信息 -->
    <view class="model-info-card" v-if="modelInfo">
      <view class="info-item">
        <text class="info-label">模型状态：</text>
        <text class="info-value" :class="modelInfo.exists ? 'success' : 'error'">
          {{ modelInfo.exists ? '已加载' : '未找到' }}
        </text>
      </view>
      <view class="info-item" v-if="modelInfo.exists">
        <text class="info-label">模型大小：</text>
        <text class="info-value">{{ modelInfo.sizeMB }} MB</text>
      </view>
    </view>

    <!-- 图片上传区域 -->
    <view class="upload-section">
      <view class="upload-area" @click="chooseImage" v-if="!selectedImage">
        <view class="upload-icon">📷</view>
        <text class="upload-text">点击选择图片</text>
        <text class="upload-hint">支持 jpg、png、bmp、gif 格式</text>
      </view>
      
      <view class="image-preview" v-else>
        <image :src="selectedImage" mode="aspectFit" class="preview-image" />
        <view class="image-actions">
          <button class="action-btn" @click="chooseImage">重新选择</button>
          <button class="action-btn primary" @click="startDetection" :disabled="detecting">
            {{ detecting ? '检测中...' : '开始检测' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 检测结果 -->
    <view class="result-section" v-if="detectionResult">
      <view class="result-header">
        <text class="result-title">检测结果</text>
        <text class="result-count">共检测到 {{ detectionResult.count }} 个目标</text>
      </view>

      <!-- 结果图片 -->
      <view class="result-image-wrapper" v-if="detectionResult.resultImage">
        <image :src="detectionResult.resultImage" mode="aspectFit" class="result-image" />
      </view>

      <!-- 检测详情列表 -->
      <view class="detection-list" v-if="detectionResult.detections && detectionResult.detections.length > 0">
        <view 
          class="detection-item" 
          v-for="(item, index) in detectionResult.detections" 
          :key="index"
        >
          <view class="detection-header">
            <text class="detection-class">{{ item.class }}</text>
            <text class="detection-confidence">{{ (item.confidence * 100).toFixed(1) }}%</text>
          </view>
          <view class="detection-bbox">
            <text class="bbox-text">
              位置: ({{ Math.round(item.bbox.x1) }}, {{ Math.round(item.bbox.y1) }}) - 
              ({{ Math.round(item.bbox.x2) }}, {{ Math.round(item.bbox.y2) }})
            </text>
          </view>
        </view>
      </view>

      <!-- 无检测结果 -->
      <view class="no-result" v-else>
        <text>未检测到任何目标</text>
      </view>
    </view>

    <!-- 错误提示 -->
    <view class="error-message" v-if="errorMessage">
      <text>{{ errorMessage }}</text>
    </view>
  </view>
</template>

<script>
import { post, get } from '@/utils/request.js'
import storage from '@/utils/storage.js'
import { API_BASE_URL } from '@/utils/config.js'

export default {
  data() {
    return {
      selectedImage: '',
      selectedImagePath: '',
      detecting: false,
      detectionResult: null,
      errorMessage: '',
      modelInfo: null
    }
  },
  onLoad() {
    this.checkPermission()
    this.loadModelInfo()
  },
  methods: {
    checkPermission() {
      const userInfo = storage.getUserInfo()
      if (!userInfo || userInfo.role !== 'ADMIN') {
        uni.showModal({
          title: '权限不足',
          content: '此功能仅限管理员使用',
          showCancel: false,
          success: () => {
            uni.navigateBack()
          }
        })
      }
    },

    async loadModelInfo() {
      try {
        const res = await get('/yolo/model-info')
        if (res && res.data) {
          this.modelInfo = res.data
        }
      } catch (error) {
        console.error('加载模型信息失败:', error)
      }
    },

    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.selectedImage = res.tempFilePaths[0]
          this.selectedImagePath = res.tempFilePaths[0]
          this.detectionResult = null
          this.errorMessage = ''
        },
        fail: (error) => {
          console.error('选择图片失败:', error)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },

    async startDetection() {
      if (!this.selectedImagePath) {
        uni.showToast({
          title: '请先选择图片',
          icon: 'none'
        })
        return
      }

      this.detecting = true
      this.errorMessage = ''
      this.detectionResult = null

      try {
        // 将图片转换为base64或直接上传文件
        // 由于uni-app的限制，我们需要使用uni.uploadFile
        const uploadTask = uni.uploadFile({
          url: this.getApiUrl('/yolo/detect'),
          filePath: this.selectedImagePath,
          name: 'image',
          header: {
            'Authorization': `Bearer ${storage.getToken()}`
          },
          success: (uploadRes) => {
            try {
              const result = JSON.parse(uploadRes.data)
              if (result.code === 200) {
                this.detectionResult = result.data
                uni.showToast({
                  title: '检测完成',
                  icon: 'success'
                })
              } else {
                this.errorMessage = result.message || '检测失败'
                uni.showToast({
                  title: result.message || '检测失败',
                  icon: 'none'
                })
              }
            } catch (error) {
              console.error('解析检测结果失败:', error)
              this.errorMessage = '解析检测结果失败'
              uni.showToast({
                title: '解析结果失败',
                icon: 'none'
              })
            }
          },
          fail: (error) => {
            console.error('上传图片失败:', error)
            this.errorMessage = '上传图片失败: ' + (error.errMsg || '未知错误')
            uni.showToast({
              title: '上传失败',
              icon: 'none'
            })
          },
          complete: () => {
            this.detecting = false
          }
        })

        // 可以监听上传进度
        uploadTask.onProgressUpdate((res) => {
          console.log('上传进度:', res.progress + '%')
        })

      } catch (error) {
        console.error('检测失败:', error)
        this.errorMessage = '检测失败: ' + error.message
        this.detecting = false
        uni.showToast({
          title: '检测失败',
          icon: 'none'
        })
      }
    },

    getApiUrl(path) {
      return API_BASE_URL + path
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.header {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  padding: 40rpx 30rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  color: #ffffff;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 26rpx;
  opacity: 0.9;
  display: block;
}

.model-info-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #666666;
  margin-right: 10rpx;
}

.info-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.info-value.success {
  color: #4caf50;
}

.info-value.error {
  color: #f44336;
}

.upload-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.upload-area {
  border: 2rpx dashed #cccccc;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
}

.upload-area:active {
  background: #f0f0f0;
  border-color: #667eea;
}

.upload-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 10rpx;
}

.upload-hint {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.image-preview {
  display: flex;
  flex-direction: column;
}

.preview-image {
  width: 100%;
  max-height: 600rpx;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  align-items: center;
}

.action-btn {
  width: 100%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: none;
  background: #f0f0f0;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.primary {
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
}

.action-btn[disabled] {
  opacity: 0.6;
}

.result-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.result-count {
  font-size: 26rpx;
  color: #667eea;
  font-weight: 600;
}

.result-image-wrapper {
  margin-bottom: 30rpx;
}

.result-image {
  width: 100%;
  max-height: 600rpx;
  border-radius: 20rpx;
}

.detection-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.detection-item {
  background: #f8f9fa;
  border-radius: 15rpx;
  padding: 20rpx;
  border-left: 4rpx solid #667eea;
}

.detection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.detection-class {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.detection-confidence {
  font-size: 28rpx;
  color: #667eea;
  font-weight: 600;
}

.detection-bbox {
  margin-top: 10rpx;
}

.bbox-text {
  font-size: 24rpx;
  color: #666666;
}

.no-result {
  text-align: center;
  padding: 60rpx;
  color: #999999;
  font-size: 28rpx;
}

.error-message {
  background: #ffebee;
  color: #f44336;
  padding: 20rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  margin-top: 20rpx;
}
</style>

