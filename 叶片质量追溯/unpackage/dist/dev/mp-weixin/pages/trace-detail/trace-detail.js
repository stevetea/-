"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_storage = require("../../utils/storage.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  data() {
    return {
      bladeId: null,
      bladeInfo: {},
      processes: [],
      qcInfo: null,
      userInfo: {}
    };
  },
  computed: {
    // 根据角色过滤工序
    filteredProcesses() {
      if (this.userInfo.role === "QC" || this.userInfo.role === "ADMIN") {
        return this.processes;
      } else {
        return this.processes.filter((p) => this.canViewProcess(p));
      }
    }
  },
  onLoad(options) {
    this.bladeId = parseInt(options.bladeId);
    if (!this.bladeId) {
      common_vendor.index.showToast({
        title: "参数错误",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
      return;
    }
    const userInfo = utils_storage.storage.getUserInfo();
    if (!userInfo) {
      common_vendor.index.reLaunch({
        url: "/pages/login/login"
      });
      return;
    }
    this.userInfo = userInfo;
    this.loadTraceData();
  },
  methods: {
    async loadTraceData() {
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const res = await utils_request.get(`/blade/${this.bladeId}/trace`);
        if (res.data) {
          this.bladeInfo = res.data.blade || {};
          this.processes = res.data.processes || [];
          this.qcInfo = res.data.qc || null;
          this.processes.sort((a, b) => a.processOrder - b.processOrder);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/trace-detail/trace-detail.vue:186", "加载追溯数据失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 判断是否可以查看该工序详情
    canViewProcess(process) {
      if (this.userInfo.role === "QC" || this.userInfo.role === "ADMIN") {
        return true;
      }
      if (process.record && process.record.operator_id === this.userInfo.operator_id) {
        return true;
      }
      return false;
    },
    getProcessClass(process) {
      if (!process.record) {
        return "process-pending";
      }
      if (process.record.is_success) {
        return "process-success";
      }
      return "process-failed";
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
    formatDateTime(time) {
      if (!time)
        return "";
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
    getProcessParams(process) {
      if (!process.record)
        return {};
      const params = {};
      const record = process.record;
      Object.keys(record).forEach((key) => {
        if (![
          "id",
          "blade_id",
          "operator_id",
          "performed_at",
          "is_success",
          "fail_reason",
          "attempt_no",
          "remarks",
          "created_at",
          "operator_name"
        ].includes(key)) {
          if (record[key] !== null && record[key] !== void 0 && record[key] !== "") {
            params[key] = record[key];
          }
        }
      });
      return params;
    },
    formatParamName(key) {
      const nameMap = {
        "furnace_no": "炉号",
        "target_temp_c": "目标温度(°C)",
        "actual_temp_c": "实际温度(°C)",
        "press_no": "冲压机编号",
        "tonnage_t": "吨位(t)",
        "grinder_no": "打磨设备编号",
        "wheel_grit": "砂轮目数",
        "paint_batch_no": "陶瓷漆批次号",
        "coating_thickness_um": "涂层厚度(μm)",
        "machine_no": "设备编号",
        "equipment_no": "检测设备编号",
        "defect_count": "缺陷数量"
      };
      return nameMap[key] || key;
    },
    getDefectLevelText(level) {
      const levelMap = {
        "NONE": "无",
        "MINOR": "轻微",
        "MAJOR": "严重",
        "CRITICAL": "致命"
      };
      return levelMap[level] || level;
    },
    goToQCInput() {
      common_vendor.index.navigateTo({
        url: `/pages/qc-input/qc-input?bladeId=${this.bladeId}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.bladeInfo.blade_sn || "未知"),
    b: common_vendor.t($options.getStatusText($data.bladeInfo.status)),
    c: common_vendor.n($options.getStatusClass($data.bladeInfo.status)),
    d: common_vendor.t($data.bladeInfo.blade_id),
    e: $data.bladeInfo.created_at
  }, $data.bladeInfo.created_at ? {
    f: common_vendor.t($options.formatDateTime($data.bladeInfo.created_at))
  } : {}, {
    g: common_vendor.f($options.filteredProcesses, (process, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(process.processOrder),
        b: common_vendor.t(process.processName),
        c: process.record
      }, process.record ? {
        d: common_vendor.t(process.record.is_success ? "✓" : "✗")
      } : {}, {
        e: $options.canViewProcess(process)
      }, $options.canViewProcess(process) ? common_vendor.e({
        f: process.record
      }, process.record ? {
        g: common_vendor.t(process.record.operator_name || "未知")
      } : {}, {
        h: process.record && process.record.performed_at
      }, process.record && process.record.performed_at ? {
        i: common_vendor.t($options.formatDateTime(process.record.performed_at))
      } : {}, {
        j: process.record && process.record.attempt_no > 1
      }, process.record && process.record.attempt_no > 1 ? {
        k: common_vendor.t(process.record.attempt_no)
      } : {}, {
        l: process.record && !process.record.is_success
      }, process.record && !process.record.is_success ? {
        m: common_vendor.t(process.record.fail_reason)
      } : {}, {
        n: $data.userInfo.role === "QC" || $data.userInfo.role === "ADMIN"
      }, $data.userInfo.role === "QC" || $data.userInfo.role === "ADMIN" ? {
        o: common_vendor.f($options.getProcessParams(process), (value, key, i1) => {
          return {
            a: common_vendor.t($options.formatParamName(key)),
            b: common_vendor.t(value),
            c: key
          };
        })
      } : {}) : process.record && !$options.canViewProcess(process) ? {} : {}, {
        p: process.record && !$options.canViewProcess(process),
        q: index,
        r: common_vendor.n($options.getProcessClass(process))
      });
    }),
    h: $data.qcInfo
  }, $data.qcInfo ? common_vendor.e({
    i: common_vendor.t($data.qcInfo.result === "PASS" ? "通过" : "不通过"),
    j: common_vendor.n($data.qcInfo.result === "PASS" ? "pass" : "fail"),
    k: common_vendor.t($data.qcInfo.inspector_name || "未知"),
    l: $data.qcInfo.inspected_at
  }, $data.qcInfo.inspected_at ? {
    m: common_vendor.t($options.formatDateTime($data.qcInfo.inspected_at))
  } : {}, {
    n: $data.qcInfo.weight_g
  }, $data.qcInfo.weight_g ? {
    o: common_vendor.t($data.qcInfo.weight_g)
  } : {}, {
    p: $data.qcInfo.defect_level && $data.qcInfo.defect_level !== "NONE"
  }, $data.qcInfo.defect_level && $data.qcInfo.defect_level !== "NONE" ? {
    q: common_vendor.t($options.getDefectLevelText($data.qcInfo.defect_level))
  } : {}) : {}, {
    r: ($data.userInfo.role === "QC" || $data.userInfo.role === "ADMIN") && $data.bladeInfo.status === "READY_FOR_QC" && !$data.qcInfo
  }, ($data.userInfo.role === "QC" || $data.userInfo.role === "ADMIN") && $data.bladeInfo.status === "READY_FOR_QC" && !$data.qcInfo ? {
    s: common_vendor.o((...args) => $options.goToQCInput && $options.goToQCInput(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-54ded032"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/trace-detail/trace-detail.js.map
