"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/login.js";
  "./pages/index/index.js";
  "./pages/scan/scan.js";
  "./pages/trace-detail/trace-detail.js";
  "./pages/qc-input/qc-input.js";
  "./pages/blade-list/blade-list.js";
  "./pages/process-input/process-input.js";
  "./pages/blade-create/blade-create.js";
  "./pages/user-manage/user-manage.js";
  "./pages/statistics/statistics.js";
  "./pages/yolo-detect/yolo-detect.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:4", "App Launch");
    const token = common_vendor.index.getStorageSync("token");
    const userInfo = common_vendor.index.getStorageSync("userInfo");
    if (!token || !userInfo) {
      setTimeout(() => {
        common_vendor.index.reLaunch({
          url: "/pages/login/login"
        });
      }, 100);
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:20", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:23", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
