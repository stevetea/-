/**
 * Mock 数据 - 用于前端测试
 * 当后端未就绪时，可以使用此文件进行测试
 */

// Mock 开关（在 request.js 中使用）
export const USE_MOCK = false  // 改为 false 使用真实接口

// Mock 用户数据
export const mockUsers = {
  operator: {
    operator_id: 1,
    operator_name: '张园英',
    role: 'OPERATOR',
    is_active: 1
  },
  qc: {
    operator_id: 4,
    operator_name: '金秋天',
    role: 'QC',
    is_active: 1
  },
  admin: {
    operator_id: 5,
    operator_name: '直井怜',
    role: 'ADMIN',
    is_active: 1
  }
}

// Mock 叶片数据
export const mockBlade = {
  blade_id: 1,
  blade_sn: 'SN-20251227-0001',
  status: 'IN_PROCESS',
  created_at: '2024-12-27 10:00:00',
  updated_at: '2024-12-27 15:30:00'
}

// Mock 工序数据
export const mockProcesses = [
  {
    processCode: 'ALLOY_PREHEAT',
    processName: '合金预热',
    processOrder: 1,
    record: {
      id: 1,
      blade_id: 1,
      operator_id: 1,
      operator_name: '张园英',
      performed_at: '2024-12-27 10:30:00',
      furnace_no: 'F-03',
      atmosphere: 'N2',
      target_temp_c: 380.0,
      actual_temp_c: 379.5,
      ramp_rate_c_per_min: 6.50,
      hold_time_min: 25,
      actual_hold_time_min: 25,
      is_success: 1,
      attempt_no: 1,
      fail_reason: null,
      remarks: '预热正常'
    },
    isSuccess: true
  },
  {
    processCode: 'STAMP_FORM_COOL',
    processName: '冲压成型冷却',
    processOrder: 2,
    record: {
      id: 2,
      blade_id: 1,
      operator_id: 2,
      operator_name: '李瑞',
      performed_at: '2024-12-27 11:00:00',
      press_no: 'P-01',
      die_no: 'D-100',
      tonnage_t: 80.00,
      stroke_mm: 120.00,
      speed_mm_s: 35.00,
      hold_time_s: 3,
      cooling_method: 'AIR',
      cooling_time_min: 12,
      coolant_temp_c: null,
      is_success: 1,
      attempt_no: 1,
      fail_reason: null,
      remarks: '成型良好'
    },
    isSuccess: true
  },
  {
    processCode: 'EDGE_GRIND',
    processName: '打磨边缘',
    processOrder: 3,
    record: {
      id: 3,
      blade_id: 1,
      operator_id: 1,  // 当前操作员操作的
      operator_name: '张园英',
      performed_at: '2024-12-27 11:30:00',
      grinder_no: 'G-01',
      wheel_grit: 120,
      spindle_rpm: 3200,
      feed_mm_s: 2.50,
      edge_radius_mm: 0.800,
      material_removal_mm: 0.120,
      coolant_used: 1,
      coolant_type: '水基冷却液',
      is_success: 1,
      attempt_no: 1,
      fail_reason: null,
      remarks: '边缘平整'
    },
    isSuccess: true
  },
  {
    processCode: 'CERAMIC_COAT_HEAT',
    processName: '涂陶瓷漆涂层加热',
    processOrder: 4,
    record: null,  // 未完成
    isSuccess: false
  }
]

// Mock 质检数据
export const mockQC = null  // 未质检

// Mock 状态数据
export const mockState = {
  blade_id: 1,
  current_success_order: 3,
  last_process_code: 'EDGE_GRIND',
  is_blocked: 0,
  blocked_order: null,
  blocked_code: null,
  blocked_reason: null,
  updated_at: '2024-12-27 11:30:00'
}

// Mock 最近记录
export const mockRecentRecords = [
  {
    blade_id: 1,
    blade_sn: 'SN-20251227-0001',
    status: 'IN_PROCESS',
    updated_at: '2024-12-27 15:30:00'
  },
  {
    blade_id: 2,
    blade_sn: 'SN-20251227-0002',
    status: 'READY_FOR_QC',
    updated_at: '2024-12-27 14:00:00'
  }
]

/**
 * Mock 请求处理
 */
export function mockRequest(options) {
  return new Promise((resolve) => {
    // 模拟网络延迟
    setTimeout(() => {
      let response = {}
      
      // 登录接口
      if (options.url === '/auth/login') {
        const { operatorName } = options.data || {}
        let userInfo = mockUsers.operator
        
        // 根据输入选择不同角色（测试用）
        if (operatorName.includes('质检') || operatorName.includes('QC')) {
          userInfo = mockUsers.qc
        } else if (operatorName.includes('管理') || operatorName.includes('ADMIN')) {
          userInfo = mockUsers.admin
        }
        
        response = {
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock_token_' + Date.now(),
            userInfo: userInfo
          }
        }
      }
      // 获取追溯信息
      else if (options.url.match(/^\/blade\/(\d+)\/trace$/)) {
        response = {
          code: 200,
          data: {
            blade: mockBlade,
            processes: mockProcesses,
            qc: mockQC,
            state: mockState
          }
        }
      }
      // 获取叶片信息
      else if (options.url.match(/^\/blade\/(\d+)$/)) {
        response = {
          code: 200,
          data: mockBlade
        }
      }
      // 获取最近记录（操作员）
      else if (options.url === '/blade/my-recent') {
        response = {
          code: 200,
          data: {
            list: mockRecentRecords.filter(r => r.blade_id === 1)  // 只返回操作员操作的
          }
        }
      }
      // 获取最近记录（所有）
      else if (options.url === '/blade/recent') {
        response = {
          code: 200,
          data: {
            list: mockRecentRecords
          }
        }
      }
      // 获取叶片列表
      else if (options.url === '/blade/list') {
        response = {
          code: 200,
          data: {
            list: mockRecentRecords,
            total: mockRecentRecords.length
          }
        }
      }
      // 提交质检
      else if (options.url === '/qc') {
        response = {
          code: 200,
          message: '提交成功',
          data: {
            id: 1
          }
        }
      }
      // 默认响应
      else {
        response = {
          code: 200,
          message: 'Mock 响应',
          data: {}
        }
      }
      
      resolve(response)
    }, 500)  // 模拟 500ms 延迟
  })
}

export default {
  USE_MOCK,
  mockUsers,
  mockBlade,
  mockProcesses,
  mockQC,
  mockState,
  mockRecentRecords,
  mockRequest
}

