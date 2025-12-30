"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("../common/vendor.js");
const utils_config = require("./config.js");
function request(options) {
  return new Promise((resolve, reject) => {
    const token = common_vendor.index.getStorageSync("token");
    if (options.loading !== false) {
      common_vendor.index.showLoading({
        title: options.loadingText || "加载中...",
        mask: true
      });
    }
    common_vendor.index.request({
      url: utils_config.config.API_BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        ...options.header
      },
      success: (res) => {
        var _a, _b;
        common_vendor.index.hideLoading();
        if (res.statusCode === 200) {
          if (res.data && (res.data.code === 200 || res.data.success)) {
            resolve(res.data);
          } else if (res.data && res.data.code === 401) {
            common_vendor.index.removeStorageSync("token");
            common_vendor.index.removeStorageSync("userInfo");
            common_vendor.index.reLaunch({
              url: "/pages/login/login"
            });
            reject(res.data);
          } else {
            const errorMsg = ((_a = res.data) == null ? void 0 : _a.message) || "请求失败";
            common_vendor.index.__f__("error", "at utils/request.js:55", "请求失败:", res.data);
            common_vendor.index.showToast({
              title: errorMsg,
              icon: "none",
              duration: 2e3
            });
            reject(res.data || res);
          }
        } else if (res.statusCode === 401) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("userInfo");
          common_vendor.index.reLaunch({
            url: "/pages/login/login"
          });
          reject(res.data);
        } else if (res.statusCode === 404) {
          common_vendor.index.__f__("error", "at utils/request.js:73", "接口不存在:", options.url);
          common_vendor.index.showToast({
            title: "接口不存在，请检查后端服务",
            icon: "none",
            duration: 2e3
          });
          reject(res);
        } else {
          common_vendor.index.hideLoading();
          const errorMsg = ((_b = res.data) == null ? void 0 : _b.message) || `网络错误 (${res.statusCode})`;
          common_vendor.index.__f__("error", "at utils/request.js:83", "请求错误:", res);
          common_vendor.index.showToast({
            title: errorMsg,
            icon: "none",
            duration: 2e3
          });
          reject(res);
        }
      },
      fail: (err) => {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at utils/request.js:94", "网络请求失败:", err);
        let errorMsg = "网络请求失败";
        if (err.errMsg) {
          if (err.errMsg.includes("url not in domain list")) {
            errorMsg = "域名未配置，请在微信开发者工具中关闭域名校验";
          } else if (err.errMsg.includes("timeout")) {
            errorMsg = "请求超时，请检查网络连接";
          } else if (err.errMsg.includes("fail")) {
            errorMsg = "无法连接到服务器，请确认后端服务是否运行";
          }
        }
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 3e3
        });
        reject(err);
      }
    });
  });
}
function get(url, data, options = {}) {
  return request({
    url,
    method: "GET",
    data,
    ...options
  });
}
function post(url, data, options = {}) {
  return request({
    url,
    method: "POST",
    data,
    ...options
  });
}
function put(url, data, options = {}) {
  return request({
    url,
    method: "PUT",
    data,
    ...options
  });
}
exports.get = get;
exports.post = post;
exports.put = put;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
