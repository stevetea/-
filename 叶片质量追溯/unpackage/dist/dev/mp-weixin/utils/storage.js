"use strict";
const common_vendor = require("../common/vendor.js");
const TOKEN_KEY = "token";
const USER_INFO_KEY = "userInfo";
const storage = {
  // 保存token
  setToken(token) {
    common_vendor.index.setStorageSync(TOKEN_KEY, token);
  },
  // 获取token
  getToken() {
    return common_vendor.index.getStorageSync(TOKEN_KEY);
  },
  // 移除token
  removeToken() {
    common_vendor.index.removeStorageSync(TOKEN_KEY);
  },
  // 保存用户信息
  setUserInfo(userInfo) {
    common_vendor.index.setStorageSync(USER_INFO_KEY, userInfo);
  },
  // 获取用户信息
  getUserInfo() {
    return common_vendor.index.getStorageSync(USER_INFO_KEY);
  },
  // 移除用户信息
  removeUserInfo() {
    common_vendor.index.removeStorageSync(USER_INFO_KEY);
  },
  // 清除所有存储
  clearAll() {
    this.removeToken();
    this.removeUserInfo();
  }
};
exports.storage = storage;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/storage.js.map
