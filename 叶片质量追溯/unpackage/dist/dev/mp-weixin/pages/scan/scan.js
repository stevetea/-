"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const utils_qrcode = require("../../utils/qrcode.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      scanning: false,
      bladeIdInput: "",
      userInfo: {},
      mode: "trace",
      // trace: 追溯模式, process-input: 工序录入模式
      processCode: null
      // 如果指定了工序编码，则直接进入该工序录入
    };
  },
  onLoad(options) {
    const userInfo = utils_storage.storage.getUserInfo();
    if (!userInfo) {
      common_vendor.index.reLaunch({
        url: "/pages/login/login"
      });
      return;
    }
    this.userInfo = userInfo;
    this.mode = options.mode || "trace";
    this.processCode = options.processCode || null;
    this.setNavigationTitle();
    if (this.mode === "process-input") {
      if (this.processCode === "FLUORESCENT_TEST") {
        if (userInfo.role !== "QC" && userInfo.role !== "ADMIN") {
          common_vendor.index.showToast({
            title: "只有质检员可以进行荧光检测",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
          return;
        }
      } else {
        if (userInfo.role !== "OPERATOR" && userInfo.role !== "ADMIN") {
          common_vendor.index.showToast({
            title: "只有操作员可以录入工序",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
          return;
        }
      }
    }
  },
  onReady() {
    this.setNavigationTitle();
  },
  methods: {
    setNavigationTitle() {
      if (this.mode === "process-input") {
        if (this.processCode === "FLUORESCENT_TEST") {
          common_vendor.index.setNavigationBarTitle({
            title: "荧光检测"
          });
        } else {
          common_vendor.index.setNavigationBarTitle({
            title: "工序录入"
          });
        }
      } else {
        common_vendor.index.setNavigationBarTitle({
          title: "扫码追溯"
        });
      }
    },
    handleScan() {
      this.scanning = true;
      common_vendor.index.scanCode({
        onlyFromCamera: true,
        scanType: ["qrCode"],
        success: (res) => {
          this.scanning = false;
          common_vendor.index.__f__("log", "at pages/scan/scan.vue:120", "扫码结果:", res.result);
          this.processQRCode(res.result);
        },
        fail: (err) => {
          this.scanning = false;
          common_vendor.index.__f__("error", "at pages/scan/scan.vue:125", "扫码失败:", err);
          common_vendor.index.showToast({
            title: "扫码失败，请重试",
            icon: "none"
          });
        }
      });
    },
    async processQRCode(qrContent) {
      try {
        common_vendor.index.__f__("log", "at pages/scan/scan.vue:136", "扫码结果:", qrContent);
        const { bladeId, processIds } = utils_qrcode.parseQRContent(qrContent);
        common_vendor.index.__f__("log", "at pages/scan/scan.vue:140", "解析结果:", { bladeId, processIds });
        if (!bladeId) {
          throw new Error("无法获取叶片ID");
        }
        if (this.mode === "process-input") {
          let url = `/pages/process-input/process-input?bladeId=${bladeId}`;
          if (this.processCode) {
            url += `&processCode=${this.processCode}`;
          }
          common_vendor.index.navigateTo({
            url
          });
          return;
        }
        if (this.userInfo.role === "QC" || this.userInfo.role === "ADMIN") {
          try {
            const { get } = await "../../utils/request.js";
            const res = await get(`/blade/${bladeId}`);
            if (res && res.data && res.data.status === "READY_FOR_QC") {
              common_vendor.index.navigateTo({
                url: `/pages/qc-input/qc-input?bladeId=${bladeId}`
              });
              return;
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/scan/scan.vue:173", "获取叶片信息失败:", error);
          }
        }
        common_vendor.index.navigateTo({
          url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/scan/scan.vue:183", "解析二维码失败:", error);
        common_vendor.index.showModal({
          title: "二维码格式错误",
          content: error.message || "无法解析二维码，请检查格式是否正确。\n\n支持的格式：\n• B3（简单格式）\n• B3|P1:1,2:2（完整格式）",
          showCancel: false
        });
      }
    },
    async handleManualInput() {
      if (!this.bladeIdInput) {
        common_vendor.index.showToast({
          title: "请输入叶片ID",
          icon: "none"
        });
        return;
      }
      const bladeId = parseInt(this.bladeIdInput);
      if (!bladeId) {
        common_vendor.index.showToast({
          title: "请输入有效的叶片ID",
          icon: "none"
        });
        return;
      }
      if (this.mode === "process-input") {
        let url = `/pages/process-input/process-input?bladeId=${bladeId}`;
        if (this.processCode) {
          url += `&processCode=${this.processCode}`;
        }
        common_vendor.index.navigateTo({
          url
        });
        return;
      }
      if (this.userInfo.role === "QC" || this.userInfo.role === "ADMIN") {
        try {
          const res = await utils_request.get(`/blade/${bladeId}`);
          if (res && res.data && res.data.status === "READY_FOR_QC") {
            common_vendor.index.navigateTo({
              url: `/pages/qc-input/qc-input?bladeId=${bladeId}`
            });
            return;
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/scan/scan.vue:235", "获取叶片信息失败:", error);
        }
      }
      common_vendor.index.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($data.scanning ? "扫描中..." : "开始扫描"),
    b: common_vendor.o((...args) => $options.handleScan && $options.handleScan(...args)),
    c: $data.scanning,
    d: $data.bladeIdInput,
    e: common_vendor.o(($event) => $data.bladeIdInput = $event.detail.value),
    f: common_vendor.t($data.mode === "process-input" ? "录入工序" : "查询"),
    g: common_vendor.o((...args) => $options.handleManualInput && $options.handleManualInput(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-344f468c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/scan/scan.js.map
