<template>
  <view class="scan-container">
    <view class="scan-area">
      <view class="scan-tips">
        <text>请将二维码放入框内扫描</text>
      </view>
      <button class="scan-btn" @click="handleScan" :loading="scanning">
        {{ scanning ? '扫描中...' : '开始扫描' }}
      </button>
    </view>
    
    <view class="manual-input">
      <view class="input-title">或手动输入叶片ID</view>
      <input 
        class="input" 
        v-model="bladeIdInput" 
        type="number"
        placeholder="请输入叶片ID"
      />
      <button class="search-btn" @click="handleManualInput">
        {{ mode === 'process-input' ? '录入工序' : '查询' }}
      </button>
    </view>
  </view>
</template>

<script>
import storage from '@/utils/storage.js'
import { parseQRContent } from '@/utils/qrcode.js'
import { get } from '@/utils/request.js'

export default {
  data() {
    return {
      scanning: false,
      bladeIdInput: '',
      userInfo: {},
      mode: 'trace',  // trace: 追溯模式, process-input: 工序录入模式
      processCode: null  // 如果指定了工序编码，则直接进入该工序录入
    }
  },
  onLoad(options) {
    const userInfo = storage.getUserInfo()
    if (!userInfo) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    this.userInfo = userInfo
    this.mode = options.mode || 'trace'
    this.processCode = options.processCode || null
    
    // 设置导航栏标题
    this.setNavigationTitle()
    
    // 如果是工序录入模式
    if (this.mode === 'process-input') {
      // 如果是荧光检测，允许质检员和管理员
      if (this.processCode === 'FLUORESCENT_TEST') {
        if (userInfo.role !== 'QC' && userInfo.role !== 'ADMIN') {
          uni.showToast({
            title: '只有质检员可以进行荧光检测',
            icon: 'none'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
          return
        }
      } else {
        // 其他工序，只允许操作员和管理员
        if (userInfo.role !== 'OPERATOR' && userInfo.role !== 'ADMIN') {
          uni.showToast({
            title: '只有操作员可以录入工序',
            icon: 'none'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
          return
        }
      }
    }
  },
  onReady() {
    // 在页面渲染完成后再次设置标题，确保生效
    this.setNavigationTitle()
  },
  methods: {
    setNavigationTitle() {
      // 如果是工序录入模式
      if (this.mode === 'process-input') {
        // 如果是荧光检测，设置标题为"荧光检测"
        if (this.processCode === 'FLUORESCENT_TEST') {
          uni.setNavigationBarTitle({
            title: '荧光检测'
          })
        } else {
          // 其他工序录入，设置标题为"工序录入"
          uni.setNavigationBarTitle({
            title: '工序录入'
          })
        }
      } else {
        // 其他情况保持默认标题"扫码追溯"
        uni.setNavigationBarTitle({
          title: '扫码追溯'
        })
      }
    },
    handleScan() {
      this.scanning = true
      
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: (res) => {
          this.scanning = false
          console.log('扫码结果:', res.result)
          this.processQRCode(res.result)
        },
        fail: (err) => {
          this.scanning = false
          console.error('扫码失败:', err)
          uni.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          })
        }
      })
    },
    
    async processQRCode(qrContent) {
      try {
        console.log('扫码结果:', qrContent)
        
        // 解析二维码内容
        const { bladeId, processIds } = parseQRContent(qrContent)
        console.log('解析结果:', { bladeId, processIds })
        
        if (!bladeId) {
          throw new Error('无法获取叶片ID')
        }
        
        // 如果是工序录入模式
        if (this.mode === 'process-input') {
          // 跳转到工序录入页面
          let url = `/pages/process-input/process-input?bladeId=${bladeId}`
          if (this.processCode) {
            url += `&processCode=${this.processCode}`
          }
          uni.navigateTo({
            url: url
          })
          return
        }
        
        // 如果是质检员，检查叶片状态，决定跳转到哪里
        if (this.userInfo.role === 'QC' || this.userInfo.role === 'ADMIN') {
          try {
            const { get } = await import('@/utils/request.js')
            const res = await get(`/blade/${bladeId}`)
            
            if (res && res.data && res.data.status === 'READY_FOR_QC') {
              // 状态为待质检，直接跳转到质检录入页面
              uni.navigateTo({
                url: `/pages/qc-input/qc-input?bladeId=${bladeId}`
              })
              return
            }
          } catch (error) {
            console.error('获取叶片信息失败:', error)
            // 如果获取失败，继续跳转到追溯详情页
          }
        }
        
        // 跳转到追溯详情页（通过叶片ID查询数据库获取完整信息）
        uni.navigateTo({
          url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
        })
      } catch (error) {
        console.error('解析二维码失败:', error)
        uni.showModal({
          title: '二维码格式错误',
          content: error.message || '无法解析二维码，请检查格式是否正确。\n\n支持的格式：\n• B3（简单格式）\n• B3|P1:1,2:2（完整格式）',
          showCancel: false
        })
      }
    },
    
    async handleManualInput() {
      if (!this.bladeIdInput) {
        uni.showToast({
          title: '请输入叶片ID',
          icon: 'none'
        })
        return
      }
      
      const bladeId = parseInt(this.bladeIdInput)
      if (!bladeId) {
        uni.showToast({
          title: '请输入有效的叶片ID',
          icon: 'none'
        })
        return
      }
      
      // 如果是工序录入模式
      if (this.mode === 'process-input') {
        let url = `/pages/process-input/process-input?bladeId=${bladeId}`
        if (this.processCode) {
          url += `&processCode=${this.processCode}`
        }
        uni.navigateTo({
          url: url
        })
        return
      }
      
      // 如果是质检员，检查叶片状态
      if (this.userInfo.role === 'QC' || this.userInfo.role === 'ADMIN') {
        try {
          const res = await get(`/blade/${bladeId}`)
          
          if (res && res.data && res.data.status === 'READY_FOR_QC') {
            // 状态为待质检，直接跳转到质检录入页面
            uni.navigateTo({
              url: `/pages/qc-input/qc-input?bladeId=${bladeId}`
            })
            return
          }
        } catch (error) {
          console.error('获取叶片信息失败:', error)
          // 如果获取失败，继续跳转到追溯详情页
        }
      }
      
      uni.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
      })
    }
  }
}
</script>

<style scoped>
.scan-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 40rpx 30rpx;
}

.scan-area {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  margin-bottom: 40rpx;
}

.scan-tips {
  margin-bottom: 60rpx;
}

.scan-tips text {
  font-size: 28rpx;
  color: #666666;
}

.scan-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-btn::after {
  border: none;
}

.manual-input {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.input-title {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.search-btn {
  width: 100%;
  height: 88rpx;
  background: #FFB6C1;
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 32rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn::after {
  border: none;
}
</style>

