"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      statusOptions: [
        { value: "", label: "全部状态" },
        { value: "READY_FOR_QC", label: "待质检" },
        { value: "IN_PROCESS", label: "加工中" },
        { value: "BLOCKED", label: "阻塞" },
        { value: "COMPLETED", label: "完成" }
      ],
      statusIndex: 0,
      bladeList: [],
      loading: false
    };
  },
  onLoad() {
    this.loadBladeList();
  },
  onPullDownRefresh() {
    this.loadBladeList();
  },
  methods: {
    async loadBladeList() {
      this.loading = true;
      try {
        const status = this.statusOptions[this.statusIndex].value;
        const res = await utils_request.get("/blade/list", {
          status,
          limit: 50
        });
        if (res && res.data) {
          this.bladeList = res.data.list || [];
        } else {
          this.bladeList = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blade-list/blade-list.vue:88", "加载列表失败:", error);
        this.bladeList = [];
        if (error.code !== 404) {
          common_vendor.index.showToast({
            title: error.message || "加载失败",
            icon: "none"
          });
        }
      } finally {
        this.loading = false;
        common_vendor.index.stopPullDownRefresh();
      }
    },
    onStatusChange(e) {
      this.statusIndex = parseInt(e.detail.value);
      this.loadBladeList();
    },
    viewTrace(bladeId) {
      common_vendor.index.navigateTo({
        url: `/pages/trace-detail/trace-detail?bladeId=${bladeId}`
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
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      return `${month}-${day} ${hour}:${minute}`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.statusOptions[$data.statusIndex].label),
    b: $data.statusOptions,
    c: $data.statusIndex,
    d: common_vendor.o((...args) => $options.onStatusChange && $options.onStatusChange(...args)),
    e: common_vendor.f($data.bladeList, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.blade_sn),
        b: common_vendor.t($options.getStatusText(item.status)),
        c: common_vendor.n($options.getStatusClass(item.status)),
        d: common_vendor.t(item.blade_id),
        e: item.updated_at
      }, item.updated_at ? {
        f: common_vendor.t($options.formatTime(item.updated_at))
      } : {}, {
        g: index,
        h: common_vendor.o(($event) => $options.viewTrace(item.blade_id), index)
      });
    }),
    f: $data.bladeList.length === 0 && !$data.loading
  }, $data.bladeList.length === 0 && !$data.loading ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-756c5bf6"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/blade-list/blade-list.js.map
