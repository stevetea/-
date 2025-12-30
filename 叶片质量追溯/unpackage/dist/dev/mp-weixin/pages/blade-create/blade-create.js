"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      form: {
        blade_sn: ""
      },
      submitting: false,
      createdBlade: null,
      qrContent: "",
      qrSize: 200,
      showQRText: false
    };
  },
  onLoad() {
    const userInfo = utils_storage.storage.getUserInfo();
    if (!userInfo || userInfo.role !== "ADMIN") {
      common_vendor.index.showToast({
        title: "无权限访问",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
      return;
    }
  },
  methods: {
    async handleSubmit() {
      var _a;
      if (!this.form.blade_sn || !this.form.blade_sn.trim()) {
        common_vendor.index.showToast({
          title: "请输入叶片序列号",
          icon: "none"
        });
        return;
      }
      this.submitting = true;
      try {
        const res = await utils_request.post("/blade", {
          blade_sn: this.form.blade_sn.trim()
        });
        if (res && res.data) {
          this.createdBlade = res.data;
          this.qrContent = `B${res.data.blade_id}`;
          this.$nextTick(() => {
            this.generateQRCode();
          });
          common_vendor.index.showToast({
            title: "创建成功",
            icon: "success"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blade-create/blade-create.vue:132", "创建失败:", error);
        const errorMsg = error.message || ((_a = error.data) == null ? void 0 : _a.message) || "创建失败，请重试";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.submitting = false;
      }
    },
    generateQRCode() {
      this.$nextTick(() => {
        try {
          const ctx = common_vendor.index.createCanvasContext("qrcode", this);
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${this.qrSize}x${this.qrSize}&data=${encodeURIComponent(this.qrContent)}`;
          common_vendor.index.downloadFile({
            url: qrUrl,
            success: (res) => {
              if (res.statusCode === 200) {
                ctx.drawImage(res.tempFilePath, 0, 0, this.qrSize, this.qrSize);
                ctx.draw(false, () => {
                  common_vendor.index.__f__("log", "at pages/blade-create/blade-create.vue:161", "二维码生成成功");
                  this.showQRText = false;
                });
              } else {
                this.showQRText = true;
              }
            },
            fail: () => {
              common_vendor.index.__f__("warn", "at pages/blade-create/blade-create.vue:170", "在线二维码生成失败，显示文本内容");
              this.showQRText = true;
            }
          });
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/blade-create/blade-create.vue:175", "二维码生成失败:", error);
          this.showQRText = true;
        }
      });
    },
    createAnother() {
      this.createdBlade = null;
      this.qrContent = "";
      this.form.blade_sn = "";
    },
    viewTrace() {
      if (this.createdBlade && this.createdBlade.blade_id) {
        common_vendor.index.navigateTo({
          url: `/pages/trace-detail/trace-detail?bladeId=${this.createdBlade.blade_id}`
        });
      }
    },
    getStatusText(status) {
      return utils_config.BLADE_STATUS_MAP[status] || status;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.form.blade_sn,
    b: common_vendor.o(($event) => $data.form.blade_sn = $event.detail.value),
    c: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    d: $data.submitting,
    e: $data.createdBlade
  }, $data.createdBlade ? {
    f: common_vendor.t($data.createdBlade.blade_id),
    g: common_vendor.t($data.createdBlade.blade_sn),
    h: common_vendor.t($options.getStatusText($data.createdBlade.status)),
    i: common_vendor.t($data.qrContent),
    j: $data.qrSize + "px",
    k: $data.qrSize + "px",
    l: common_vendor.t($data.qrContent),
    m: common_vendor.o((...args) => $options.createAnother && $options.createAnother(...args)),
    n: common_vendor.o((...args) => $options.viewTrace && $options.viewTrace(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-45b81c1c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/blade-create/blade-create.js.map
