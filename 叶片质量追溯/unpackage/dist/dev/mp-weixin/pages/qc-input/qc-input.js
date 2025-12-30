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
      fluorescentTest: null,
      // 荧光检测记录
      readyBlades: [],
      loading: false,
      form: {
        result: "PASS",
        dimension_pass: 1,
        surface_pass: 1,
        weight_g: "",
        key_dimension_mm: "",
        defect_level: "NONE",
        ncr_no: "",
        remarks: ""
      },
      hasExistingQC: false,
      // 是否已有质检记录
      defectLevels: [
        { value: "NONE", label: "无" },
        { value: "MINOR", label: "轻微" },
        { value: "MAJOR", label: "严重" },
        { value: "CRITICAL", label: "致命" }
      ],
      defectLevelIndex: 0,
      submitting: false
    };
  },
  onLoad(options) {
    const userInfo = utils_storage.storage.getUserInfo();
    if (!userInfo || userInfo.role !== "QC" && userInfo.role !== "ADMIN") {
      common_vendor.index.showToast({
        title: "无权限访问",
        icon: "none"
      });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 1500);
      return;
    }
    if (options.bladeId) {
      this.bladeId = parseInt(options.bladeId);
      if (this.bladeId) {
        this.loadBladeInfo();
      }
    } else {
      this.loadReadyBlades();
    }
  },
  onShow() {
    if (!this.bladeId) {
      this.loadReadyBlades();
    }
  },
  methods: {
    // 加载所有工艺已完成的叶片列表
    async loadReadyBlades() {
      this.loading = true;
      try {
        const res = await utils_request.get("/blade/list", {
          limit: 200
        });
        if (!res || !res.data || !res.data.list) {
          this.readyBlades = [];
          return;
        }
        const allBlades = res.data.list;
        const readyBlades = [];
        common_vendor.index.__f__("log", "at pages/qc-input/qc-input.vue:284", `需要检查 ${allBlades.length} 个叶片，检查是否进行了荧光检测`);
        for (const blade of allBlades) {
          if (blade.status === "COMPLETED" || blade.status === "SCRAPPED") {
            continue;
          }
          try {
            const traceRes = await utils_request.get(`/blade/${blade.blade_id}/trace`);
            if (traceRes && traceRes.data && traceRes.data.processes) {
              const fluorescentProcess = traceRes.data.processes.find(
                (p) => p.processCode === "FLUORESCENT_TEST"
              );
              if (fluorescentProcess && fluorescentProcess.record && !traceRes.data.qc) {
                common_vendor.index.__f__("log", "at pages/qc-input/qc-input.vue:304", `叶片 ${blade.blade_id} (${blade.blade_sn}) 已进行荧光检测，可进行质检`);
                readyBlades.push(blade);
              } else {
                common_vendor.index.__f__("log", "at pages/qc-input/qc-input.vue:307", `叶片 ${blade.blade_id} (${blade.blade_sn}) 未进行荧光检测或已有质检: 有荧光检测=${!!(fluorescentProcess && fluorescentProcess.record)}, 已有质检=${!!traceRes.data.qc}`);
              }
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/qc-input/qc-input.vue:312", `检查叶片 ${blade.blade_id} 失败:`, error);
          }
        }
        common_vendor.index.__f__("log", "at pages/qc-input/qc-input.vue:316", `找到 ${readyBlades.length} 个可质检的叶片`);
        this.readyBlades = readyBlades;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/qc-input/qc-input.vue:319", "加载叶片列表失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
        this.readyBlades = [];
      } finally {
        this.loading = false;
      }
    },
    // 选择叶片
    selectBlade(bladeId) {
      this.bladeId = bladeId;
      this.loadBladeInfo();
    },
    // 返回列表
    goBackToList() {
      this.bladeId = null;
      this.bladeInfo = {};
      this.fluorescentTest = null;
      this.form = {
        result: "PASS",
        dimension_pass: 1,
        surface_pass: 1,
        weight_g: "",
        key_dimension_mm: "",
        defect_level: "NONE",
        ncr_no: "",
        remarks: ""
      };
      this.defectLevelIndex = 0;
      this.loadReadyBlades();
    },
    async loadBladeInfo() {
      var _a;
      try {
        const [bladeRes, traceRes] = await Promise.all([
          utils_request.get(`/blade/${this.bladeId}`),
          utils_request.get(`/blade/${this.bladeId}/trace`)
        ]);
        if (bladeRes.data) {
          this.bladeInfo = bladeRes.data;
          if (traceRes.data && traceRes.data.qc) {
            this.hasExistingQC = true;
            common_vendor.index.showModal({
              title: "提示",
              content: "该叶片已经进行过质检，不能重复质检",
              showCancel: false,
              success: () => {
                this.goBackToList();
              }
            });
            return;
          } else {
            this.hasExistingQC = false;
          }
          if (traceRes.data && traceRes.data.processes) {
            const fluorescentProcess = traceRes.data.processes.find(
              (p) => p.processCode === "FLUORESCENT_TEST"
            );
            if (fluorescentProcess && fluorescentProcess.record) {
              this.fluorescentTest = {
                is_success: fluorescentProcess.isSuccess,
                equipment_no: fluorescentProcess.record.equipment_no || "",
                defect_count: fluorescentProcess.record.defect_count !== null && fluorescentProcess.record.defect_count !== void 0 ? fluorescentProcess.record.defect_count : null,
                inspector_notes: fluorescentProcess.record.inspector_notes || "",
                fail_reason: fluorescentProcess.record.fail_reason || ""
              };
            } else {
              common_vendor.index.showModal({
                title: "提示",
                content: "该叶片尚未进行荧光检测，无法进行质检录入。请先完成荧光检测。",
                showCancel: false,
                success: () => {
                  this.goBackToList();
                }
              });
              return;
            }
          } else {
            common_vendor.index.showModal({
              title: "提示",
              content: "无法获取叶片追溯信息，请重试",
              showCancel: false,
              success: () => {
                this.goBackToList();
              }
            });
            return;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/qc-input/qc-input.vue:425", "加载叶片信息失败:", error);
        const errorMsg = error.message || ((_a = error.data) == null ? void 0 : _a.message) || "加载失败";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
        setTimeout(() => {
          this.goBackToList();
        }, 2e3);
      }
    },
    onDefectLevelChange(e) {
      this.defectLevelIndex = parseInt(e.detail.value);
      this.form.defect_level = this.defectLevels[this.defectLevelIndex].value;
    },
    validateForm() {
      if (!this.form.result) {
        common_vendor.index.showToast({
          title: "请选择质检结论",
          icon: "none"
        });
        return false;
      }
      if (this.form.dimension_pass === null || this.form.dimension_pass === void 0) {
        common_vendor.index.showToast({
          title: "请选择尺寸检查结果",
          icon: "none"
        });
        return false;
      }
      if (this.form.surface_pass === null || this.form.surface_pass === void 0) {
        common_vendor.index.showToast({
          title: "请选择外观/表面检查结果",
          icon: "none"
        });
        return false;
      }
      if (this.form.result === "FAIL") {
        if (this.form.defect_level === "NONE") {
          common_vendor.index.showToast({
            title: "不通过时必须选择缺陷等级",
            icon: "none"
          });
          return false;
        }
      }
      if (this.form.weight_g && isNaN(parseFloat(this.form.weight_g))) {
        common_vendor.index.showToast({
          title: "重量格式不正确",
          icon: "none"
        });
        return false;
      }
      if (this.form.key_dimension_mm && isNaN(parseFloat(this.form.key_dimension_mm))) {
        common_vendor.index.showToast({
          title: "关键尺寸格式不正确",
          icon: "none"
        });
        return false;
      }
      if (this.form.weight_g) {
        const weight = parseFloat(this.form.weight_g);
        if (weight <= 0 || weight > 1e4) {
          common_vendor.index.showToast({
            title: "重量应在0-10000g之间",
            icon: "none"
          });
          return false;
        }
      }
      if (this.form.key_dimension_mm) {
        const dimension = parseFloat(this.form.key_dimension_mm);
        if (dimension <= 0 || dimension > 1e3) {
          common_vendor.index.showToast({
            title: "关键尺寸应在0-1000mm之间",
            icon: "none"
          });
          return false;
        }
      }
      return true;
    },
    async handleSubmit() {
      var _a;
      if (this.hasExistingQC) {
        common_vendor.index.showToast({
          title: "该叶片已质检，不能重复提交",
          icon: "none"
        });
        return;
      }
      if (!this.validateForm()) {
        return;
      }
      this.submitting = true;
      try {
        const userInfo = utils_storage.storage.getUserInfo();
        const data = {
          blade_id: this.bladeId,
          inspector_id: userInfo.operator_id,
          result: this.form.result,
          dimension_pass: this.form.dimension_pass,
          surface_pass: this.form.surface_pass,
          weight_g: this.form.weight_g ? parseFloat(this.form.weight_g) : null,
          key_dimension_mm: this.form.key_dimension_mm ? parseFloat(this.form.key_dimension_mm) : null,
          defect_level: this.form.defect_level,
          ncr_no: this.form.ncr_no || null,
          remarks: this.form.remarks || null
        };
        const res = await utils_request.post("/qc", data);
        if (res && res.data) {
          const resultText = this.form.result === "PASS" ? "通过" : "不通过";
          const statusText = this.form.result === "PASS" ? "已完成" : "已报废";
          common_vendor.index.showModal({
            title: "提交成功",
            content: `质检结论：${resultText}
叶片状态已更新为：${statusText}`,
            showCancel: false,
            success: () => {
              this.goBackToList();
            }
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/qc-input/qc-input.vue:586", "提交失败:", error);
        const errorMsg = error.message || ((_a = error.data) == null ? void 0 : _a.message) || "提交失败，请重试";
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.submitting = false;
      }
    },
    getStatusText(status) {
      return utils_config.BLADE_STATUS_MAP[status] || status;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.bladeId
  }, !$data.bladeId ? common_vendor.e({
    b: $data.readyBlades.length > 0
  }, $data.readyBlades.length > 0 ? {
    c: common_vendor.f($data.readyBlades, (item, index, i0) => {
      return {
        a: common_vendor.t(item.blade_sn),
        b: common_vendor.t(item.blade_id),
        c: index,
        d: common_vendor.o(($event) => $options.selectBlade(item.blade_id), index)
      };
    })
  } : !$data.loading ? {} : {}, {
    d: !$data.loading,
    e: $data.loading
  }, $data.loading ? {} : {}) : common_vendor.e({
    f: common_vendor.o((...args) => $options.goBackToList && $options.goBackToList(...args)),
    g: common_vendor.t($data.bladeInfo.blade_sn || "未知"),
    h: common_vendor.t($data.bladeId),
    i: $data.bladeInfo.status
  }, $data.bladeInfo.status ? {
    j: common_vendor.t($options.getStatusText($data.bladeInfo.status))
  } : {}, {
    k: $data.fluorescentTest
  }, $data.fluorescentTest ? common_vendor.e({
    l: common_vendor.t($data.fluorescentTest.is_success ? "通过" : "不通过"),
    m: common_vendor.n($data.fluorescentTest.is_success ? "success" : "fail"),
    n: $data.fluorescentTest.equipment_no
  }, $data.fluorescentTest.equipment_no ? {
    o: common_vendor.t($data.fluorescentTest.equipment_no)
  } : {}, {
    p: $data.fluorescentTest.defect_count !== null && $data.fluorescentTest.defect_count !== void 0
  }, $data.fluorescentTest.defect_count !== null && $data.fluorescentTest.defect_count !== void 0 ? {
    q: common_vendor.t($data.fluorescentTest.defect_count)
  } : {}, {
    r: $data.fluorescentTest.inspector_notes
  }, $data.fluorescentTest.inspector_notes ? {
    s: common_vendor.t($data.fluorescentTest.inspector_notes)
  } : {}, {
    t: $data.fluorescentTest.fail_reason
  }, $data.fluorescentTest.fail_reason ? {
    v: common_vendor.t($data.fluorescentTest.fail_reason)
  } : {}) : {}, {
    w: $data.form.result === "PASS",
    x: common_vendor.o(($event) => $data.form.result = "PASS"),
    y: $data.form.result === "FAIL",
    z: common_vendor.o(($event) => $data.form.result = "FAIL"),
    A: $data.form.dimension_pass === 1,
    B: common_vendor.o(($event) => $data.form.dimension_pass = 1),
    C: $data.form.dimension_pass === 0,
    D: common_vendor.o(($event) => $data.form.dimension_pass = 0),
    E: $data.form.surface_pass === 1,
    F: common_vendor.o(($event) => $data.form.surface_pass = 1),
    G: $data.form.surface_pass === 0,
    H: common_vendor.o(($event) => $data.form.surface_pass = 0),
    I: $data.form.weight_g,
    J: common_vendor.o(($event) => $data.form.weight_g = $event.detail.value),
    K: $data.form.key_dimension_mm,
    L: common_vendor.o(($event) => $data.form.key_dimension_mm = $event.detail.value),
    M: $data.form.result === "FAIL"
  }, $data.form.result === "FAIL" ? {
    N: common_vendor.t($data.defectLevels[$data.defectLevelIndex].label),
    O: $data.defectLevels,
    P: $data.defectLevelIndex,
    Q: common_vendor.o((...args) => $options.onDefectLevelChange && $options.onDefectLevelChange(...args))
  } : {}, {
    R: $data.form.result === "FAIL"
  }, $data.form.result === "FAIL" ? {
    S: $data.form.ncr_no,
    T: common_vendor.o(($event) => $data.form.ncr_no = $event.detail.value)
  } : {}, {
    U: $data.form.remarks,
    V: common_vendor.o(($event) => $data.form.remarks = $event.detail.value),
    W: common_vendor.t($data.hasExistingQC ? "已质检，无法提交" : "提交质检报告"),
    X: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    Y: $data.submitting,
    Z: $data.hasExistingQC,
    aa: $data.hasExistingQC
  }, $data.hasExistingQC ? {} : {}));
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e35e2a88"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/qc-input/qc-input.js.map
