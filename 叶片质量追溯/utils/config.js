/**
 * 系统配置文件
 */

// API基础地址（请根据实际情况修改）
// 开发环境使用本地后端，生产环境修改为实际域名
// 注意：微信小程序需要在开发者工具中关闭域名校验，或配置合法域名
export const API_BASE_URL = 'http://localhost:3000/api'

// 工序定义映射
export const PROCESS_MAP = {
  'ALLOY_PREHEAT': { name: '合金预热', order: 1 },
  'STAMP_FORM_COOL': { name: '冲压成型冷却', order: 2 },
  'EDGE_GRIND': { name: '打磨边缘', order: 3 },
  'CERAMIC_COAT_HEAT': { name: '涂陶瓷漆涂层加热', order: 4 },
  'SECOND_STAMP': { name: '二次冲压', order: 5 },
  'TRIM_EXCESS': { name: '切除多余金属', order: 6 },
  'DIE_CAST': { name: '压铸', order: 7 },
  'BROACH': { name: '拉床加工', order: 8 },
  'HYD_REMOVE_PROTECT': { name: '液压机去除保护层', order: 9 },
  'QR_ENGRAVE': { name: '雕刻二维码', order: 10 },
  'FLUORESCENT_TEST': { name: '荧光检测', order: 11 },
  'QC_INSPECTION': { name: '最终质检', order: 100 }
}

// 叶片状态映射
export const BLADE_STATUS_MAP = {
  'NEW': '新建',
  'IN_PROCESS': '加工中',
  'BLOCKED': '阻塞',
  'READY_FOR_QC': '待质检',
  'COMPLETED': '完成',
  'SCRAPPED': '报废'
}

// 用户角色
export const USER_ROLE = {
  OPERATOR: 'OPERATOR',
  QC: 'QC',
  ADMIN: 'ADMIN'
}

export default {
  API_BASE_URL,
  PROCESS_MAP,
  BLADE_STATUS_MAP,
  USER_ROLE
}

