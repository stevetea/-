/**
 * 网络请求封装
 */

import config from './config.js'
import { USE_MOCK, mockRequest } from './mock.js'

/**
 * 请求封装
 */
function request(options) {
  // 如果启用 Mock 模式，直接返回 Mock 数据
  if (USE_MOCK) {
    return mockRequest(options)
  }
  
  return new Promise((resolve, reject) => {
    // 获取token
    const token = uni.getStorageSync('token')
    
    // 显示加载提示
    if (options.loading !== false) {
      uni.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      })
    }
    
    uni.request({
      url: config.API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      success: (res) => {
        uni.hideLoading()
        
        // 处理不同的HTTP状态码
        if (res.statusCode === 200) {
          if (res.data && (res.data.code === 200 || res.data.success)) {
            resolve(res.data)
          } else if (res.data && res.data.code === 401) {
            // token过期，跳转登录
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.reLaunch({
              url: '/pages/login/login'
            })
            reject(res.data)
          } else {
            const errorMsg = res.data?.message || '请求失败'
            console.error('请求失败:', res.data)
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(res.data || res)
          }
        } else if (res.statusCode === 401) {
          // 未授权
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.reLaunch({
            url: '/pages/login/login'
          })
          reject(res.data)
        } else if (res.statusCode === 404) {
          // 接口不存在
          console.error('接口不存在:', options.url)
          uni.showToast({
            title: '接口不存在，请检查后端服务',
            icon: 'none',
            duration: 2000
          })
          reject(res)
        } else {
          uni.hideLoading()
          const errorMsg = res.data?.message || `网络错误 (${res.statusCode})`
          console.error('请求错误:', res)
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          reject(res)
        }
      },
      fail: (err) => {
        uni.hideLoading()
        console.error('网络请求失败:', err)
        
        let errorMsg = '网络请求失败'
        if (err.errMsg) {
          if (err.errMsg.includes('url not in domain list')) {
            errorMsg = '域名未配置，请在微信开发者工具中关闭域名校验'
          } else if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查网络连接'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '无法连接到服务器，请确认后端服务是否运行'
          }
        }
        
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
        reject(err)
      }
    })
  })
}

/**
 * GET请求
 */
export function get(url, data, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST请求
 */
export function post(url, data, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT请求
 */
export function put(url, data, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE请求
 */
export function del(url, data, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

export default {
  request,
  get,
  post,
  put,
  delete: del
}

