"use strict";
const API_BASE_URL = "http://localhost:3000/api";
const PROCESS_MAP = {
  "ALLOY_PREHEAT": { name: "合金预热", order: 1 },
  "STAMP_FORM_COOL": { name: "冲压成型冷却", order: 2 },
  "EDGE_GRIND": { name: "打磨边缘", order: 3 },
  "CERAMIC_COAT_HEAT": { name: "涂陶瓷漆涂层加热", order: 4 },
  "SECOND_STAMP": { name: "二次冲压", order: 5 },
  "TRIM_EXCESS": { name: "切除多余金属", order: 6 },
  "DIE_CAST": { name: "压铸", order: 7 },
  "BROACH": { name: "拉床加工", order: 8 },
  "HYD_REMOVE_PROTECT": { name: "液压机去除保护层", order: 9 },
  "QR_ENGRAVE": { name: "雕刻二维码", order: 10 },
  "FLUORESCENT_TEST": { name: "荧光检测", order: 11 },
  "QC_INSPECTION": { name: "最终质检", order: 100 }
};
const BLADE_STATUS_MAP = {
  "NEW": "新建",
  "IN_PROCESS": "加工中",
  "BLOCKED": "阻塞",
  "READY_FOR_QC": "待质检",
  "COMPLETED": "完成",
  "SCRAPPED": "报废"
};
const USER_ROLE = {
  OPERATOR: "OPERATOR",
  QC: "QC",
  ADMIN: "ADMIN"
};
const config = {
  API_BASE_URL,
  PROCESS_MAP,
  BLADE_STATUS_MAP,
  USER_ROLE
};
exports.API_BASE_URL = API_BASE_URL;
exports.BLADE_STATUS_MAP = BLADE_STATUS_MAP;
exports.PROCESS_MAP = PROCESS_MAP;
exports.config = config;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/config.js.map
