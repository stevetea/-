"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      form: {
        operatorName: "",
        password: ""
      },
      loading: false
    };
  },
  onLoad() {
    const token = utils_storage.storage.getToken();
    const userInfo = utils_storage.storage.getUserInfo();
    if (token && userInfo) {
      this.redirectToHome(userInfo);
    }
  },
  methods: {
    async handleLogin() {
      if (!this.form.operatorName) {
        common_vendor.index.showToast({
          title: "请输入工号或姓名",
          icon: "none"
        });
        return;
      }
      if (!this.form.password) {
        common_vendor.index.showToast({
          title: "请输入密码（默认密码：123456）",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      this.loading = true;
      try {
        const loginRes = await common_vendor.index.login({
          provider: "weixin"
        });
        const res = await utils_request.post("/auth/login", {
          code: loginRes.code,
          operatorName: this.form.operatorName,
          password: this.form.password
        });
        if (res.data) {
          utils_storage.storage.setToken(res.data.token);
          utils_storage.storage.setUserInfo(res.data.userInfo);
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            this.redirectToHome(res.data.userInfo);
          }, 500);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:113", "登录失败:", error);
        common_vendor.index.showToast({
          title: error.message || "登录失败，请检查账号密码",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.loading = false;
      }
    },
    redirectToHome(userInfo) {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_assets._imports_0,
    b: $data.form.operatorName,
    c: common_vendor.o(($event) => $data.form.operatorName = $event.detail.value),
    d: $data.form.password,
    e: common_vendor.o(($event) => $data.form.password = $event.detail.value),
    f: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    g: $data.loading
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
