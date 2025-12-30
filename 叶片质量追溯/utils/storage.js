/**
 * 本地存储管理
 */

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export default {
  // 保存token
  setToken(token) {
    uni.setStorageSync(TOKEN_KEY, token)
  },
  
  // 获取token
  getToken() {
    return uni.getStorageSync(TOKEN_KEY)
  },
  
  // 移除token
  removeToken() {
    uni.removeStorageSync(TOKEN_KEY)
  },
  
  // 保存用户信息
  setUserInfo(userInfo) {
    uni.setStorageSync(USER_INFO_KEY, userInfo)
  },
  
  // 获取用户信息
  getUserInfo() {
    return uni.getStorageSync(USER_INFO_KEY)
  },
  
  // 移除用户信息
  removeUserInfo() {
    uni.removeStorageSync(USER_INFO_KEY)
  },
  
  // 清除所有存储
  clearAll() {
    this.removeToken()
    this.removeUserInfo()
  }
}

