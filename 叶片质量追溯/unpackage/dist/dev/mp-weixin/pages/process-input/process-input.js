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
      processCode: null,
      // 工序编码
      processIndex: 0,
      currentProcess: null,
      availableProcesses: [],
      pageTitle: "工序录入",
      // 页面标题
      form: {
        is_success: 1,
        fail_reason: "",
        remarks: "",
        // 工序特定参数
        furnace_no: "",
        target_temp_c: "",
        hold_time_min: "",
        press_no: "",
        die_no: "",
        tonnage_t: "",
        cooling_method: "AIR",
        cooling_time_min: "",
        grinder_no: "",
        wheel_grit: "",
        feed_mm_s: "",
        // 涂陶瓷漆涂层加热参数
        paint_batch_no: "",
        coating_thickness_um: "",
        oven_no: "",
        bake_temp_c: "",
        bake_time_min: "",
        // 二次冲压参数（复用 press_no, die_no, tonnage_t）
        stroke_mm: "",
        speed_mm_s: "",
        lubrication_type: "",
        lubrication_amount_ml: "",
        // 压铸参数
        machine_no: "",
        alloy_batch_no: "",
        melt_temp_c: "",
        mold_temp_c: "",
        injection_pressure_mpa: "",
        fill_time_ms: "",
        hold_pressure_mpa: "",
        hold_time_ms: "",
        cooling_time_s: "",
        shot_weight_g: "",
        // 拉床加工参数（复用 machine_no）
        broach_tool_no: "",
        broach_speed_mm_s: "",
        feed_mm_per_stroke: "",
        cutting_oil_type: "",
        pass_count: "1",
        target_dimension_mm: "",
        measured_dimension_mm: "",
        // 液压机去除保护层参数（复用 press_no）
        pressure_mpa: "",
        hold_time_s: "",
        method: "PRESS",
        solvent_type: "",
        solvent_temp_c: "",
        rinse_required: 1,
        // 雕刻二维码参数
        laser_machine_no: "",
        qr_format: "BLADE_ID",
        laser_power_w: "",
        scan_speed_mm_s: "",
        focal_length_mm: "",
        mark_depth_um: "",
        // 荧光检测参数
        equipment_no: "",
        penetrant_batch_no: "",
        dwell_time_min: "",
        developer_type: "",
        developer_time_min: "",
        uv_intensity_uw_cm2: "",
        defect_count: "0",
        max_defect_length_mm: "",
        inspector_notes: ""
      },
      coolMethods: ["AIR", "FORCED_AIR", "WATER", "OIL"],
      coolMethodIndex: 0,
      hydMethods: ["PRESS", "PRESS_PLUS_SOLVENT"],
      hydMethodIndex: 0,
      hydMethodMap: { "PRESS": 0, "PRESS_PLUS_SOLVENT": 1 },
      rinseOptions: ["是", "否"],
      rinseIndex: 0,
      qrFormats: ["BLADE_ID", "BLADE_SN", "CUSTOM"],
      qrFormatIndex: 0,
      qrFormatMap: { "BLADE_ID": 0, "BLADE_SN": 1, "CUSTOM": 2 },
      submitting: false
    };
  },
  onLoad(options) {
    this.bladeId = parseInt(options.bladeId);
    this.processCode = options.processCode || null;
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
          title: "无权限访问",
          icon: "none"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
    }
    let processCodes = Object.keys(utils_config.PROCESS_MAP).filter((code) => code !== "QC_INSPECTION");
    if (userInfo.role === "OPERATOR") {
      processCodes = processCodes.filter((code) => code !== "FLUORESCENT_TEST");
    }
    this.availableProcesses = processCodes.map((code) => ({
      code,
      name: utils_config.PROCESS_MAP[code].name,
      order: utils_config.PROCESS_MAP[code].order
    })).sort((a, b) => a.order - b.order);
    if (this.processCode) {
      const process = this.availableProcesses.find((p) => p.code === this.processCode);
      if (process) {
        this.currentProcess = process;
        this.processIndex = this.availableProcesses.indexOf(process);
      }
    }
    this.loadBladeInfo();
    this.loadAvailableProcesses();
    this.setNavigationTitle();
  },
  onReady() {
    this.setNavigationTitle();
  },
  methods: {
    setNavigationTitle() {
      if (this.processCode === "FLUORESCENT_TEST") {
        this.pageTitle = "荧光检测";
        common_vendor.index.setNavigationBarTitle({
          title: "荧光检测"
        });
      } else {
        this.pageTitle = "工序录入";
        common_vendor.index.setNavigationBarTitle({
          title: "工序录入"
        });
      }
    },
    async loadBladeInfo() {
      try {
        const res = await utils_request.get(`/blade/${this.bladeId}`);
        if (res && res.data) {
          this.bladeInfo = res.data;
          const userInfo = utils_storage.storage.getUserInfo();
          if (res.data.status === "READY_FOR_QC") {
            if (userInfo.role !== "QC" && userInfo.role !== "ADMIN") {
              common_vendor.index.showModal({
                title: "权限不足",
                content: "该叶片已完成所有工序，只有质检员可以进行操作",
                showCancel: false,
                success: () => {
                  common_vendor.index.navigateBack();
                }
              });
              return;
            }
          }
          if (res.data.status === "COMPLETED" || res.data.status === "SCRAPPED") {
            common_vendor.index.showModal({
              title: "提示",
              content: `该叶片状态为${res.data.status === "COMPLETED" ? "已完成" : "已报废"}，无法继续录入工序`,
              showCancel: false,
              success: () => {
                common_vendor.index.navigateBack();
              }
            });
            return;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/process-input/process-input.vue:620", "加载叶片信息失败:", error);
      }
    },
    async loadAvailableProcesses() {
      var _a;
      try {
        const res = await utils_request.get(`/blade/${this.bladeId}/trace`);
        if (res && res.data) {
          const processes = res.data.processes || [];
          const userInfo = utils_storage.storage.getUserInfo();
          let processCodes = Object.keys(utils_config.PROCESS_MAP).filter((code) => code !== "QC_INSPECTION");
          if (userInfo && userInfo.role === "OPERATOR") {
            processCodes = processCodes.filter((code) => code !== "FLUORESCENT_TEST");
          }
          this.availableProcesses = processCodes.map((code) => ({
            code,
            name: utils_config.PROCESS_MAP[code].name,
            order: utils_config.PROCESS_MAP[code].order
          })).sort((a, b) => a.order - b.order);
          if (this.processCode) {
            const process = this.availableProcesses.find((p) => p.code === this.processCode);
            if (process) {
              if (process.code === "FLUORESCENT_TEST") {
                const fluorescentRecord = processes.find((p) => p.processCode === "FLUORESCENT_TEST");
                if (fluorescentRecord && fluorescentRecord.record) {
                  common_vendor.index.showModal({
                    title: "提示",
                    content: "该叶片已经进行过荧光检测，不能重复检测",
                    showCancel: false,
                    success: () => {
                      common_vendor.index.navigateBack();
                    }
                  });
                  return;
                }
                const first10ProcessCodes = [
                  "ALLOY_PREHEAT",
                  "STAMP_FORM_COOL",
                  "EDGE_GRIND",
                  "CERAMIC_COAT_HEAT",
                  "SECOND_STAMP",
                  "TRIM_EXCESS",
                  "DIE_CAST",
                  "BROACH",
                  "HYD_REMOVE_PROTECT",
                  "QR_ENGRAVE"
                ];
                let allFirst10Completed = true;
                const missingProcesses = [];
                for (const code of first10ProcessCodes) {
                  const processRecord = processes.find((p) => p.processCode === code);
                  if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
                    allFirst10Completed = false;
                    const processName = ((_a = utils_config.PROCESS_MAP[code]) == null ? void 0 : _a.name) || code;
                    missingProcesses.push(processName);
                  }
                }
                if (!allFirst10Completed) {
                  common_vendor.index.showModal({
                    title: "提示",
                    content: `前10个工序尚未全部完成，无法进行荧光检测。
未完成的工序：${missingProcesses.join("、")}`,
                    showCancel: false,
                    success: () => {
                      common_vendor.index.navigateBack();
                    }
                  });
                  return;
                }
              }
              this.currentProcess = process;
              this.processIndex = this.availableProcesses.indexOf(process);
            }
          } else {
            const nextProcess = this.findNextProcess(processes);
            if (nextProcess) {
              this.processCode = nextProcess.code;
              this.currentProcess = nextProcess;
              this.processIndex = this.availableProcesses.indexOf(nextProcess);
            }
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/process-input/process-input.vue:714", "加载工序信息失败:", error);
        this.availableProcesses = Object.keys(utils_config.PROCESS_MAP).filter((code) => code !== "QC_INSPECTION").map((code) => ({
          code,
          name: utils_config.PROCESS_MAP[code].name,
          order: utils_config.PROCESS_MAP[code].order
        })).sort((a, b) => a.order - b.order);
      }
    },
    findNextProcess(processes) {
      for (const process of this.availableProcesses) {
        const processRecord = processes.find((p) => p.processCode === process.code);
        if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
          return process;
        }
      }
      return null;
    },
    async onProcessChange(e) {
      var _a;
      this.processIndex = parseInt(e.detail.value);
      this.currentProcess = this.availableProcesses[this.processIndex];
      this.processCode = this.currentProcess.code;
      if (this.processCode === "FLUORESCENT_TEST") {
        try {
          const traceRes = await utils_request.get(`/blade/${this.bladeId}/trace`);
          if (traceRes && traceRes.data && traceRes.data.processes) {
            const processes = traceRes.data.processes;
            const fluorescentRecord = processes.find((p) => p.processCode === "FLUORESCENT_TEST");
            if (fluorescentRecord && fluorescentRecord.record) {
              common_vendor.index.showModal({
                title: "提示",
                content: "该叶片已经进行过荧光检测，不能重复检测",
                showCancel: false,
                success: () => {
                  this.processIndex = 0;
                  this.currentProcess = this.availableProcesses[0];
                  this.processCode = this.currentProcess.code;
                }
              });
              return;
            }
            const first10ProcessCodes = [
              "ALLOY_PREHEAT",
              "STAMP_FORM_COOL",
              "EDGE_GRIND",
              "CERAMIC_COAT_HEAT",
              "SECOND_STAMP",
              "TRIM_EXCESS",
              "DIE_CAST",
              "BROACH",
              "HYD_REMOVE_PROTECT",
              "QR_ENGRAVE"
            ];
            let allFirst10Completed = true;
            const missingProcesses = [];
            for (const code of first10ProcessCodes) {
              const processRecord = processes.find((p) => p.processCode === code);
              if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
                allFirst10Completed = false;
                const processName = ((_a = utils_config.PROCESS_MAP[code]) == null ? void 0 : _a.name) || code;
                missingProcesses.push(processName);
              }
            }
            if (!allFirst10Completed) {
              common_vendor.index.showModal({
                title: "提示",
                content: `前10个工序尚未全部完成，无法进行荧光检测。
未完成的工序：${missingProcesses.join("、")}`,
                showCancel: false,
                success: () => {
                  this.processIndex = 0;
                  this.currentProcess = this.availableProcesses[0];
                  this.processCode = this.currentProcess.code;
                }
              });
              return;
            }
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/process-input/process-input.vue:801", "检查工序完成情况失败:", error);
        }
      }
    },
    onCoolMethodChange(e) {
      this.coolMethodIndex = parseInt(e.detail.value);
      this.form.cooling_method = this.coolMethods[this.coolMethodIndex];
    },
    onHydMethodChange(e) {
      this.hydMethodIndex = parseInt(e.detail.value);
      this.form.method = this.hydMethods[this.hydMethodIndex];
    },
    onRinseChange(e) {
      this.rinseIndex = parseInt(e.detail.value);
      this.form.rinse_required = this.rinseIndex === 0 ? 1 : 0;
    },
    onQrFormatChange(e) {
      this.qrFormatIndex = parseInt(e.detail.value);
      this.form.qr_format = this.qrFormats[this.qrFormatIndex];
    },
    validateForm() {
      if (!this.processCode) {
        common_vendor.index.showToast({
          title: "请选择工序",
          icon: "none"
        });
        return false;
      }
      if (this.form.is_success === 0 && !this.form.fail_reason) {
        common_vendor.index.showToast({
          title: "失败时必须填写失败原因",
          icon: "none"
        });
        return false;
      }
      if (this.processCode === "ALLOY_PREHEAT") {
        if (!this.form.furnace_no || !this.form.target_temp_c || !this.form.hold_time_min) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "STAMP_FORM_COOL") {
        if (!this.form.press_no || !this.form.die_no || !this.form.tonnage_t || !this.form.cooling_time_min) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "EDGE_GRIND") {
        if (!this.form.grinder_no || !this.form.wheel_grit) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "CERAMIC_COAT_HEAT") {
        if (!this.form.paint_batch_no || !this.form.coating_thickness_um || !this.form.oven_no || !this.form.bake_temp_c || !this.form.bake_time_min) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "SECOND_STAMP") {
        if (!this.form.press_no || !this.form.die_no || !this.form.tonnage_t) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "DIE_CAST") {
        if (!this.form.machine_no || !this.form.alloy_batch_no || !this.form.melt_temp_c || !this.form.injection_pressure_mpa) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "BROACH") {
        if (!this.form.machine_no || !this.form.broach_tool_no) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "HYD_REMOVE_PROTECT") {
        if (!this.form.press_no || !this.form.pressure_mpa || !this.form.hold_time_s) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "QR_ENGRAVE") {
        if (!this.form.laser_machine_no) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      if (this.processCode === "FLUORESCENT_TEST") {
        if (!this.form.equipment_no || !this.form.dwell_time_min) {
          common_vendor.index.showToast({
            title: "请填写完整的工艺参数",
            icon: "none"
          });
          return false;
        }
      }
      return true;
    },
    async handleSubmit() {
      var _a;
      if (!this.validateForm()) {
        return;
      }
      this.submitting = true;
      try {
        const userInfo = utils_storage.storage.getUserInfo();
        const data = {
          blade_id: this.bladeId,
          operator_id: userInfo.operator_id,
          process_code: this.processCode,
          is_success: this.form.is_success,
          fail_reason: this.form.fail_reason || null,
          remarks: this.form.remarks || null,
          // 工序特定参数
          ...this.getProcessParams()
        };
        const res = await utils_request.post("/process", data);
        if (res && res.data) {
          common_vendor.index.showToast({
            title: "提交成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/process-input/process-input.vue:986", "提交失败:", error);
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
    getProcessParams() {
      const params = {};
      if (this.processCode === "ALLOY_PREHEAT") {
        params.furnace_no = this.form.furnace_no;
        params.target_temp_c = parseFloat(this.form.target_temp_c);
        params.hold_time_min = parseInt(this.form.hold_time_min);
      } else if (this.processCode === "STAMP_FORM_COOL") {
        params.press_no = this.form.press_no;
        params.die_no = this.form.die_no;
        params.tonnage_t = parseFloat(this.form.tonnage_t);
        params.cooling_method = this.form.cooling_method;
        params.cooling_time_min = parseInt(this.form.cooling_time_min);
      } else if (this.processCode === "EDGE_GRIND") {
        params.grinder_no = this.form.grinder_no;
        params.wheel_grit = parseInt(this.form.wheel_grit);
        if (this.form.feed_mm_s) {
          params.feed_mm_s = parseFloat(this.form.feed_mm_s);
        }
      } else if (this.processCode === "CERAMIC_COAT_HEAT") {
        params.paint_batch_no = this.form.paint_batch_no;
        params.coating_thickness_um = parseFloat(this.form.coating_thickness_um);
        params.oven_no = this.form.oven_no;
        params.bake_temp_c = parseFloat(this.form.bake_temp_c);
        params.bake_time_min = parseInt(this.form.bake_time_min);
      } else if (this.processCode === "SECOND_STAMP") {
        params.press_no = this.form.press_no;
        params.die_no = this.form.die_no;
        params.tonnage_t = parseFloat(this.form.tonnage_t);
        if (this.form.stroke_mm) {
          params.stroke_mm = parseFloat(this.form.stroke_mm);
        }
        if (this.form.speed_mm_s) {
          params.speed_mm_s = parseFloat(this.form.speed_mm_s);
        }
        if (this.form.lubrication_type) {
          params.lubrication_type = this.form.lubrication_type;
        }
        if (this.form.lubrication_amount_ml) {
          params.lubrication_amount_ml = parseFloat(this.form.lubrication_amount_ml);
        }
      } else if (this.processCode === "DIE_CAST") {
        params.machine_no = this.form.machine_no;
        params.alloy_batch_no = this.form.alloy_batch_no;
        params.melt_temp_c = parseFloat(this.form.melt_temp_c);
        if (this.form.mold_temp_c) {
          params.mold_temp_c = parseFloat(this.form.mold_temp_c);
        }
        params.injection_pressure_mpa = parseFloat(this.form.injection_pressure_mpa);
        if (this.form.fill_time_ms) {
          params.fill_time_ms = parseInt(this.form.fill_time_ms);
        }
        if (this.form.hold_pressure_mpa) {
          params.hold_pressure_mpa = parseFloat(this.form.hold_pressure_mpa);
        }
        if (this.form.hold_time_ms) {
          params.hold_time_ms = parseInt(this.form.hold_time_ms);
        }
        if (this.form.cooling_time_s) {
          params.cooling_time_s = parseInt(this.form.cooling_time_s);
        }
        if (this.form.shot_weight_g) {
          params.shot_weight_g = parseFloat(this.form.shot_weight_g);
        }
      } else if (this.processCode === "BROACH") {
        params.machine_no = this.form.machine_no;
        params.broach_tool_no = this.form.broach_tool_no;
        if (this.form.broach_speed_mm_s) {
          params.broach_speed_mm_s = parseFloat(this.form.broach_speed_mm_s);
        }
        if (this.form.feed_mm_per_stroke) {
          params.feed_mm_per_stroke = parseFloat(this.form.feed_mm_per_stroke);
        }
        if (this.form.cutting_oil_type) {
          params.cutting_oil_type = this.form.cutting_oil_type;
        }
        if (this.form.pass_count) {
          params.pass_count = parseInt(this.form.pass_count);
        }
        if (this.form.target_dimension_mm) {
          params.target_dimension_mm = parseFloat(this.form.target_dimension_mm);
        }
        if (this.form.measured_dimension_mm) {
          params.measured_dimension_mm = parseFloat(this.form.measured_dimension_mm);
        }
      } else if (this.processCode === "HYD_REMOVE_PROTECT") {
        params.press_no = this.form.press_no;
        params.pressure_mpa = parseFloat(this.form.pressure_mpa);
        params.hold_time_s = parseInt(this.form.hold_time_s);
        params.method = this.form.method;
        if (this.form.solvent_type) {
          params.solvent_type = this.form.solvent_type;
        }
        if (this.form.solvent_temp_c) {
          params.solvent_temp_c = parseFloat(this.form.solvent_temp_c);
        }
        params.rinse_required = this.rinseIndex === 0 ? 1 : 0;
      } else if (this.processCode === "QR_ENGRAVE") {
        params.laser_machine_no = this.form.laser_machine_no;
        params.qr_format = this.form.qr_format;
        if (this.form.laser_power_w) {
          params.laser_power_w = parseFloat(this.form.laser_power_w);
        }
        if (this.form.scan_speed_mm_s) {
          params.scan_speed_mm_s = parseFloat(this.form.scan_speed_mm_s);
        }
        if (this.form.focal_length_mm) {
          params.focal_length_mm = parseFloat(this.form.focal_length_mm);
        }
        if (this.form.mark_depth_um) {
          params.mark_depth_um = parseFloat(this.form.mark_depth_um);
        }
      } else if (this.processCode === "FLUORESCENT_TEST") {
        params.equipment_no = this.form.equipment_no;
        params.dwell_time_min = parseInt(this.form.dwell_time_min);
        if (this.form.penetrant_batch_no) {
          params.penetrant_batch_no = this.form.penetrant_batch_no;
        }
        if (this.form.developer_type) {
          params.developer_type = this.form.developer_type;
        }
        if (this.form.developer_time_min) {
          params.developer_time_min = parseInt(this.form.developer_time_min);
        }
        if (this.form.uv_intensity_uw_cm2) {
          params.uv_intensity_uw_cm2 = parseFloat(this.form.uv_intensity_uw_cm2);
        }
        if (this.form.defect_count) {
          params.defect_count = parseInt(this.form.defect_count);
        }
        if (this.form.max_defect_length_mm) {
          params.max_defect_length_mm = parseFloat(this.form.max_defect_length_mm);
        }
        if (this.form.inspector_notes) {
          params.inspector_notes = this.form.inspector_notes;
        }
      }
      return params;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b;
  return common_vendor.e({
    a: common_vendor.t($data.pageTitle),
    b: common_vendor.t($data.bladeInfo.blade_sn || "未知"),
    c: common_vendor.t($data.bladeId),
    d: $data.currentProcess
  }, $data.currentProcess ? {
    e: common_vendor.t($data.currentProcess.name)
  } : {}, {
    f: !$data.processCode
  }, !$data.processCode ? {
    g: common_vendor.t(((_a = $data.availableProcesses[$data.processIndex]) == null ? void 0 : _a.name) || "请选择工序"),
    h: $data.availableProcesses,
    i: $data.processIndex,
    j: common_vendor.o((...args) => $options.onProcessChange && $options.onProcessChange(...args))
  } : {}, {
    k: $data.processCode
  }, $data.processCode ? common_vendor.e({
    l: common_vendor.t((_b = $data.currentProcess) == null ? void 0 : _b.name),
    m: $data.form.is_success === 1,
    n: common_vendor.o(($event) => $data.form.is_success = 1),
    o: $data.form.is_success === 0,
    p: common_vendor.o(($event) => $data.form.is_success = 0),
    q: $data.form.is_success === 0
  }, $data.form.is_success === 0 ? {
    r: $data.form.fail_reason,
    s: common_vendor.o(($event) => $data.form.fail_reason = $event.detail.value)
  } : {}, {
    t: $data.form.remarks,
    v: common_vendor.o(($event) => $data.form.remarks = $event.detail.value),
    w: $data.processCode === "ALLOY_PREHEAT"
  }, $data.processCode === "ALLOY_PREHEAT" ? {
    x: $data.form.furnace_no,
    y: common_vendor.o(($event) => $data.form.furnace_no = $event.detail.value),
    z: $data.form.target_temp_c,
    A: common_vendor.o(($event) => $data.form.target_temp_c = $event.detail.value),
    B: $data.form.hold_time_min,
    C: common_vendor.o(($event) => $data.form.hold_time_min = $event.detail.value)
  } : {}, {
    D: $data.processCode === "STAMP_FORM_COOL"
  }, $data.processCode === "STAMP_FORM_COOL" ? {
    E: $data.form.press_no,
    F: common_vendor.o(($event) => $data.form.press_no = $event.detail.value),
    G: $data.form.die_no,
    H: common_vendor.o(($event) => $data.form.die_no = $event.detail.value),
    I: $data.form.tonnage_t,
    J: common_vendor.o(($event) => $data.form.tonnage_t = $event.detail.value),
    K: common_vendor.t($data.coolMethods[$data.coolMethodIndex]),
    L: $data.coolMethods,
    M: $data.coolMethodIndex,
    N: common_vendor.o((...args) => $options.onCoolMethodChange && $options.onCoolMethodChange(...args)),
    O: $data.form.cooling_time_min,
    P: common_vendor.o(($event) => $data.form.cooling_time_min = $event.detail.value)
  } : {}, {
    Q: $data.processCode === "EDGE_GRIND"
  }, $data.processCode === "EDGE_GRIND" ? {
    R: $data.form.grinder_no,
    S: common_vendor.o(($event) => $data.form.grinder_no = $event.detail.value),
    T: $data.form.wheel_grit,
    U: common_vendor.o(($event) => $data.form.wheel_grit = $event.detail.value),
    V: $data.form.feed_mm_s,
    W: common_vendor.o(($event) => $data.form.feed_mm_s = $event.detail.value)
  } : {}, {
    X: $data.processCode === "CERAMIC_COAT_HEAT"
  }, $data.processCode === "CERAMIC_COAT_HEAT" ? {
    Y: $data.form.paint_batch_no,
    Z: common_vendor.o(($event) => $data.form.paint_batch_no = $event.detail.value),
    aa: $data.form.coating_thickness_um,
    ab: common_vendor.o(($event) => $data.form.coating_thickness_um = $event.detail.value),
    ac: $data.form.oven_no,
    ad: common_vendor.o(($event) => $data.form.oven_no = $event.detail.value),
    ae: $data.form.bake_temp_c,
    af: common_vendor.o(($event) => $data.form.bake_temp_c = $event.detail.value),
    ag: $data.form.bake_time_min,
    ah: common_vendor.o(($event) => $data.form.bake_time_min = $event.detail.value)
  } : {}, {
    ai: $data.processCode === "SECOND_STAMP"
  }, $data.processCode === "SECOND_STAMP" ? {
    aj: $data.form.press_no,
    ak: common_vendor.o(($event) => $data.form.press_no = $event.detail.value),
    al: $data.form.die_no,
    am: common_vendor.o(($event) => $data.form.die_no = $event.detail.value),
    an: $data.form.tonnage_t,
    ao: common_vendor.o(($event) => $data.form.tonnage_t = $event.detail.value),
    ap: $data.form.stroke_mm,
    aq: common_vendor.o(($event) => $data.form.stroke_mm = $event.detail.value),
    ar: $data.form.speed_mm_s,
    as: common_vendor.o(($event) => $data.form.speed_mm_s = $event.detail.value),
    at: $data.form.lubrication_type,
    av: common_vendor.o(($event) => $data.form.lubrication_type = $event.detail.value),
    aw: $data.form.lubrication_amount_ml,
    ax: common_vendor.o(($event) => $data.form.lubrication_amount_ml = $event.detail.value)
  } : {}, {
    ay: $data.processCode === "DIE_CAST"
  }, $data.processCode === "DIE_CAST" ? {
    az: $data.form.machine_no,
    aA: common_vendor.o(($event) => $data.form.machine_no = $event.detail.value),
    aB: $data.form.alloy_batch_no,
    aC: common_vendor.o(($event) => $data.form.alloy_batch_no = $event.detail.value),
    aD: $data.form.melt_temp_c,
    aE: common_vendor.o(($event) => $data.form.melt_temp_c = $event.detail.value),
    aF: $data.form.mold_temp_c,
    aG: common_vendor.o(($event) => $data.form.mold_temp_c = $event.detail.value),
    aH: $data.form.injection_pressure_mpa,
    aI: common_vendor.o(($event) => $data.form.injection_pressure_mpa = $event.detail.value),
    aJ: $data.form.fill_time_ms,
    aK: common_vendor.o(($event) => $data.form.fill_time_ms = $event.detail.value),
    aL: $data.form.hold_pressure_mpa,
    aM: common_vendor.o(($event) => $data.form.hold_pressure_mpa = $event.detail.value),
    aN: $data.form.hold_time_ms,
    aO: common_vendor.o(($event) => $data.form.hold_time_ms = $event.detail.value),
    aP: $data.form.cooling_time_s,
    aQ: common_vendor.o(($event) => $data.form.cooling_time_s = $event.detail.value),
    aR: $data.form.shot_weight_g,
    aS: common_vendor.o(($event) => $data.form.shot_weight_g = $event.detail.value)
  } : {}, {
    aT: $data.processCode === "BROACH"
  }, $data.processCode === "BROACH" ? {
    aU: $data.form.machine_no,
    aV: common_vendor.o(($event) => $data.form.machine_no = $event.detail.value),
    aW: $data.form.broach_tool_no,
    aX: common_vendor.o(($event) => $data.form.broach_tool_no = $event.detail.value),
    aY: $data.form.broach_speed_mm_s,
    aZ: common_vendor.o(($event) => $data.form.broach_speed_mm_s = $event.detail.value),
    ba: $data.form.feed_mm_per_stroke,
    bb: common_vendor.o(($event) => $data.form.feed_mm_per_stroke = $event.detail.value),
    bc: $data.form.cutting_oil_type,
    bd: common_vendor.o(($event) => $data.form.cutting_oil_type = $event.detail.value),
    be: $data.form.pass_count,
    bf: common_vendor.o(($event) => $data.form.pass_count = $event.detail.value),
    bg: $data.form.target_dimension_mm,
    bh: common_vendor.o(($event) => $data.form.target_dimension_mm = $event.detail.value),
    bi: $data.form.measured_dimension_mm,
    bj: common_vendor.o(($event) => $data.form.measured_dimension_mm = $event.detail.value)
  } : {}, {
    bk: $data.processCode === "HYD_REMOVE_PROTECT"
  }, $data.processCode === "HYD_REMOVE_PROTECT" ? {
    bl: $data.form.press_no,
    bm: common_vendor.o(($event) => $data.form.press_no = $event.detail.value),
    bn: $data.form.pressure_mpa,
    bo: common_vendor.o(($event) => $data.form.pressure_mpa = $event.detail.value),
    bp: $data.form.hold_time_s,
    bq: common_vendor.o(($event) => $data.form.hold_time_s = $event.detail.value),
    br: common_vendor.t($data.hydMethods[$data.hydMethodIndex]),
    bs: $data.hydMethods,
    bt: $data.hydMethodIndex,
    bv: common_vendor.o((...args) => $options.onHydMethodChange && $options.onHydMethodChange(...args)),
    bw: $data.form.solvent_type,
    bx: common_vendor.o(($event) => $data.form.solvent_type = $event.detail.value),
    by: $data.form.solvent_temp_c,
    bz: common_vendor.o(($event) => $data.form.solvent_temp_c = $event.detail.value),
    bA: common_vendor.t($data.rinseOptions[$data.rinseIndex]),
    bB: $data.rinseOptions,
    bC: $data.rinseIndex,
    bD: common_vendor.o((...args) => $options.onRinseChange && $options.onRinseChange(...args))
  } : {}, {
    bE: $data.processCode === "QR_ENGRAVE"
  }, $data.processCode === "QR_ENGRAVE" ? {
    bF: $data.form.laser_machine_no,
    bG: common_vendor.o(($event) => $data.form.laser_machine_no = $event.detail.value),
    bH: common_vendor.t($data.qrFormats[$data.qrFormatIndex]),
    bI: $data.qrFormats,
    bJ: $data.qrFormatIndex,
    bK: common_vendor.o((...args) => $options.onQrFormatChange && $options.onQrFormatChange(...args)),
    bL: $data.form.laser_power_w,
    bM: common_vendor.o(($event) => $data.form.laser_power_w = $event.detail.value),
    bN: $data.form.scan_speed_mm_s,
    bO: common_vendor.o(($event) => $data.form.scan_speed_mm_s = $event.detail.value),
    bP: $data.form.focal_length_mm,
    bQ: common_vendor.o(($event) => $data.form.focal_length_mm = $event.detail.value),
    bR: $data.form.mark_depth_um,
    bS: common_vendor.o(($event) => $data.form.mark_depth_um = $event.detail.value)
  } : {}, {
    bT: $data.processCode === "FLUORESCENT_TEST"
  }, $data.processCode === "FLUORESCENT_TEST" ? {
    bU: $data.form.equipment_no,
    bV: common_vendor.o(($event) => $data.form.equipment_no = $event.detail.value),
    bW: $data.form.dwell_time_min,
    bX: common_vendor.o(($event) => $data.form.dwell_time_min = $event.detail.value),
    bY: $data.form.penetrant_batch_no,
    bZ: common_vendor.o(($event) => $data.form.penetrant_batch_no = $event.detail.value),
    ca: $data.form.developer_type,
    cb: common_vendor.o(($event) => $data.form.developer_type = $event.detail.value),
    cc: $data.form.developer_time_min,
    cd: common_vendor.o(($event) => $data.form.developer_time_min = $event.detail.value),
    ce: $data.form.uv_intensity_uw_cm2,
    cf: common_vendor.o(($event) => $data.form.uv_intensity_uw_cm2 = $event.detail.value),
    cg: $data.form.defect_count,
    ch: common_vendor.o(($event) => $data.form.defect_count = $event.detail.value),
    ci: $data.form.max_defect_length_mm,
    cj: common_vendor.o(($event) => $data.form.max_defect_length_mm = $event.detail.value),
    ck: $data.form.inspector_notes,
    cl: common_vendor.o(($event) => $data.form.inspector_notes = $event.detail.value)
  } : {}) : {}, {
    cm: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args)),
    cn: $data.submitting
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e26183e5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/process-input/process-input.js.map
