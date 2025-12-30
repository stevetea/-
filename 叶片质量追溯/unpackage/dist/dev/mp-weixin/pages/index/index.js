"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_storage = require("../../utils/storage.js");
const utils_request = require("../../utils/request.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {},
      recentRecords: []
    };
  },
  computed: {
    roleText() {
      const roleMap = {
        "OPERATOR": "操作员",
        "QC": "质检员",
        "ADMIN": "管理员"
      };
      return roleMap[this.userInfo.role] || "未知";
    }
  },
  onLoad() {
    this.checkLogin();
  },
  onShow() {
    this.loadRecentRecords();
  },
  methods: {
    checkLogin() {
      const userInfo = utils_storage.storage.getUserInfo();
      if (!userInfo) {
        common_vendor.index.reLaunch({
          url: "/pages/login/login"
        });
        return;
      }
      this.userInfo = userInfo;
    },
    async loadRecentRecords() {
      try {
        const url = this.userInfo.role === "OPERATOR" ? "/blade/my-recent" : "/blade/recent";
        const res = await utils_request.get(url, {
          limit: 10
        }, {
          loading: false
          // 不显示加载提示
        });
        if (res && res.data) {
          this.recentRecords = res.data.list || [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:196", "加载最近记录失败:", error);
        this.recentRecords = [];
      }
    },
    scanQRCode() {
      common_vendor.index.navigateTo({
        url: "/pages/scan/scan"
      });
    },
    goToProcessInput() {
      common_vendor.index.navigateTo({
        url: "/pages/scan/scan?mode=process-input"
      });
    },
    goToFluorescentTest() {
      common_vendor.index.navigateTo({
        url: "/pages/scan/scan?mode=process-input&processCode=FLUORESCENT_TEST"
      });
    },
    goToQCInput() {
      common_vendor.index.navigateTo({
        url: "/pages/qc-input/qc-input"
      });
    },
    goToBladeList() {
      common_vendor.index.navigateTo({
        url: "/pages/blade-list/blade-list"
      });
    },
    goToCreateBlade() {
      common_vendor.index.navigateTo({
        url: "/pages/blade-create/blade-create"
      });
    },
    goToUserManage() {
      common_vendor.index.navigateTo({
        url: "/pages/user-manage/user-manage"
      });
    },
    goToStatistics() {
      common_vendor.index.navigateTo({
        url: "/pages/statistics/statistics"
      });
    },
    goToYOLODetect() {
      common_vendor.index.navigateTo({
        url: "/pages/yolo-detect/yolo-detect"
      });
    },
    viewTrace(bladeId) {
      common_vendor.index.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
      });
    },
    handleLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            utils_storage.storage.clearAll();
            common_vendor.index.reLaunch({
              url: "/pages/login/login"
            });
          }
        }
      });
    },
    getStatusText(status) {
      return utils_config.BLADE_STATUS_MAP[status] || status;
    },
    getStatusClass(status) {
      const classMap = {
        "NEW": "status-new",
        "IN_PROCESS": "status-processing",
        "BLOCKED": "status-blocked",
        "READY_FOR_QC": "status-ready",
        "COMPLETED": "status-completed",
        "SCRAPPED": "status-scrapped"
      };
      return classMap[status] || "";
    },
    formatTime(time) {
      if (!time)
        return "";
      const date = new Date(time);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 6e4);
      if (minutes < 1)
        return "刚刚";
      if (minutes < 60)
        return `${minutes}分钟前`;
      if (minutes < 1440)
        return `${Math.floor(minutes / 60)}小时前`;
      return `${Math.floor(minutes / 1440)}天前`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.userInfo.operator_name || "未登录"),
    b: common_vendor.t($options.roleText),
    c: common_vendor.o((...args) => $options.handleLogout && $options.handleLogout(...args)),
    d: $data.userInfo.role === "OPERATOR"
  }, $data.userInfo.role === "OPERATOR" ? {
    e: common_vendor.o((...args) => $options.scanQRCode && $options.scanQRCode(...args)),
    f: common_vendor.o((...args) => $options.goToProcessInput && $options.goToProcessInput(...args))
  } : {}, {
    g: $data.userInfo.role === "QC"
  }, $data.userInfo.role === "QC" ? {
    h: common_vendor.o((...args) => $options.scanQRCode && $options.scanQRCode(...args)),
    i: common_vendor.o((...args) => $options.goToFluorescentTest && $options.goToFluorescentTest(...args)),
    j: common_vendor.o((...args) => $options.goToQCInput && $options.goToQCInput(...args)),
    k: common_vendor.o((...args) => $options.goToBladeList && $options.goToBladeList(...args))
  } : {}, {
    l: $data.userInfo.role === "ADMIN"
  }, $data.userInfo.role === "ADMIN" ? {
    m: common_vendor.o((...args) => $options.scanQRCode && $options.scanQRCode(...args)),
    n: common_vendor.o((...args) => $options.goToCreateBlade && $options.goToCreateBlade(...args)),
    o: common_vendor.o((...args) => $options.goToUserManage && $options.goToUserManage(...args)),
    p: common_vendor.o((...args) => $options.goToStatistics && $options.goToStatistics(...args)),
    q: common_vendor.o((...args) => $options.goToYOLODetect && $options.goToYOLODetect(...args))
  } : {}, {
    r: $data.recentRecords.length > 0
  }, $data.recentRecords.length > 0 ? {
    s: common_vendor.f($data.recentRecords, (item, index, i0) => {
      return {
        a: common_vendor.t(item.blade_sn),
        b: common_vendor.t($options.formatTime(item.updated_at)),
        c: common_vendor.t($options.getStatusText(item.status)),
        d: common_vendor.n($options.getStatusClass(item.status)),
        e: index,
        f: common_vendor.o(($event) => $options.viewTrace(item.blade_id), index)
      };
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
