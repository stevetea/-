<template>
  <view class="process-input-container">
    <view class="form-card">
      <view class="card-title">{{ pageTitle }}</view>
      
      <!-- 叶片信息 -->
      <view class="blade-info">
        <view class="info-item">
          <text class="label">叶片序列号：</text>
          <text class="value">{{ bladeInfo.blade_sn || '未知' }}</text>
        </view>
        <view class="info-item">
          <text class="label">叶片ID：</text>
          <text class="value">{{ bladeId }}</text>
        </view>
        <view class="info-item" v-if="currentProcess">
          <text class="label">当前工序：</text>
          <text class="value">{{ currentProcess.name }}</text>
        </view>
      </view>
      
      <!-- 工序选择（如果未指定） -->
      <view class="form-section" v-if="!processCode">
        <view class="section-title">选择工序 *</view>
        <picker 
          mode="selector" 
          :range="availableProcesses" 
          range-key="name"
          :value="processIndex"
          @change="onProcessChange"
        >
          <view class="picker">
            {{ availableProcesses[processIndex]?.name || '请选择工序' }}
          </view>
        </picker>
      </view>
      
      <!-- 工序参数表单（根据工序类型动态显示） -->
      <view class="form-section" v-if="processCode">
        <view class="section-title">{{ currentProcess?.name }} - 工艺参数</view>
        
        <!-- 通用字段 -->
        <view class="input-group">
          <text class="input-label">是否成功 *</text>
          <view class="radio-group">
            <label class="radio-item" @click="form.is_success = 1">
              <radio :checked="form.is_success === 1" color="#667eea" />
              <text>成功</text>
            </label>
            <label class="radio-item" @click="form.is_success = 0">
              <radio :checked="form.is_success === 0" color="#667eea" />
              <text>失败</text>
            </label>
          </view>
        </view>
        
        <!-- 失败原因（失败时必填） -->
        <view class="input-group" v-if="form.is_success === 0">
          <text class="input-label">失败原因 *</text>
          <textarea 
            class="textarea" 
            v-model="form.fail_reason" 
            placeholder="请输入失败原因"
            maxlength="255"
          />
        </view>
        
        <!-- 备注 -->
        <view class="input-group">
          <text class="input-label">备注</text>
          <textarea 
            class="textarea" 
            v-model="form.remarks" 
            placeholder="请输入备注信息"
            maxlength="255"
          />
        </view>
        
        <!-- 动态工序参数字段（根据工序类型） -->
        <template v-if="processCode === 'ALLOY_PREHEAT'">
          <view class="input-group">
            <text class="input-label">炉号/设备编号 *</text>
            <input class="input" v-model="form.furnace_no" placeholder="例如: FURN-001" />
          </view>
          <view class="input-group">
            <text class="input-label">目标温度(°C) *</text>
            <input class="input" v-model="form.target_temp_c" type="digit" placeholder="例如: 850.0" />
          </view>
          <view class="input-group">
            <text class="input-label">保温时间(min) *</text>
            <input class="input" v-model="form.hold_time_min" type="number" placeholder="例如: 120" />
          </view>
        </template>
        
        <template v-if="processCode === 'STAMP_FORM_COOL'">
          <view class="input-group">
            <text class="input-label">冲压机编号 *</text>
            <input class="input" v-model="form.press_no" placeholder="例如: PRESS-001" />
          </view>
          <view class="input-group">
            <text class="input-label">模具编号 *</text>
            <input class="input" v-model="form.die_no" placeholder="例如: DIE-A01" />
          </view>
          <view class="input-group">
            <text class="input-label">吨位(t) *</text>
            <input class="input" v-model="form.tonnage_t" type="digit" placeholder="例如: 500.00" />
          </view>
          <view class="input-group">
            <text class="input-label">冷却方式 *</text>
            <picker mode="selector" :range="coolMethods" :value="coolMethodIndex" @change="onCoolMethodChange">
              <view class="picker">{{ coolMethods[coolMethodIndex] }}</view>
            </picker>
          </view>
          <view class="input-group">
            <text class="input-label">冷却时间(min) *</text>
            <input class="input" v-model="form.cooling_time_min" type="number" placeholder="例如: 60" />
          </view>
        </template>
        
        <template v-if="processCode === 'EDGE_GRIND'">
          <view class="input-group">
            <text class="input-label">打磨设备编号 *</text>
            <input class="input" v-model="form.grinder_no" placeholder="例如: GRIND-001" />
          </view>
          <view class="input-group">
            <text class="input-label">砂轮目数/粒度 *</text>
            <input class="input" v-model="form.wheel_grit" type="number" placeholder="例如: 120" />
          </view>
          <view class="input-group">
            <text class="input-label">进给速度(mm/s)</text>
            <input class="input" v-model="form.feed_mm_s" type="digit" placeholder="例如: 50.0" />
          </view>
        </template>
        
        <template v-if="processCode === 'CERAMIC_COAT_HEAT'">
          <view class="input-group">
            <text class="input-label">陶瓷漆批次号 *</text>
            <input class="input" v-model="form.paint_batch_no" placeholder="例如: BATCH-20251228-001" />
          </view>
          <view class="input-group">
            <text class="input-label">涂层厚度(μm) *</text>
            <input class="input" v-model="form.coating_thickness_um" type="digit" placeholder="例如: 150.0" />
          </view>
          <view class="input-group">
            <text class="input-label">烘箱/固化炉编号 *</text>
            <input class="input" v-model="form.oven_no" placeholder="例如: OVEN-001" />
          </view>
          <view class="input-group">
            <text class="input-label">固化温度(°C) *</text>
            <input class="input" v-model="form.bake_temp_c" type="digit" placeholder="例如: 1200.0" />
          </view>
          <view class="input-group">
            <text class="input-label">固化时间(min) *</text>
            <input class="input" v-model="form.bake_time_min" type="number" placeholder="例如: 180" />
          </view>
        </template>
        
        <template v-if="processCode === 'SECOND_STAMP'">
          <view class="input-group">
            <text class="input-label">冲压机编号 *</text>
            <input class="input" v-model="form.press_no" placeholder="例如: PRESS-002" />
          </view>
          <view class="input-group">
            <text class="input-label">模具编号 *</text>
            <input class="input" v-model="form.die_no" placeholder="例如: DIE-B01" />
          </view>
          <view class="input-group">
            <text class="input-label">吨位(t) *</text>
            <input class="input" v-model="form.tonnage_t" type="digit" placeholder="例如: 60.00" />
          </view>
          <view class="input-group">
            <text class="input-label">行程(mm)</text>
            <input class="input" v-model="form.stroke_mm" type="digit" placeholder="例如: 80.00" />
          </view>
          <view class="input-group">
            <text class="input-label">速度(mm/s)</text>
            <input class="input" v-model="form.speed_mm_s" type="digit" placeholder="例如: 28.00" />
          </view>
          <view class="input-group">
            <text class="input-label">润滑剂类型</text>
            <input class="input" v-model="form.lubrication_type" placeholder="例如: OIL-A" />
          </view>
          <view class="input-group">
            <text class="input-label">润滑剂用量(ml)</text>
            <input class="input" v-model="form.lubrication_amount_ml" type="digit" placeholder="例如: 8.0" />
          </view>
        </template>
        
        <template v-if="processCode === 'DIE_CAST'">
          <view class="input-group">
            <text class="input-label">压铸机编号 *</text>
            <input class="input" v-model="form.machine_no" placeholder="例如: CAST-001" />
          </view>
          <view class="input-group">
            <text class="input-label">合金批次号 *</text>
            <input class="input" v-model="form.alloy_batch_no" placeholder="例如: ALLOY-20251228-001" />
          </view>
          <view class="input-group">
            <text class="input-label">熔炼温度(°C) *</text>
            <input class="input" v-model="form.melt_temp_c" type="digit" placeholder="例如: 750.0" />
          </view>
          <view class="input-group">
            <text class="input-label">模温(°C)</text>
            <input class="input" v-model="form.mold_temp_c" type="digit" placeholder="例如: 200.0" />
          </view>
          <view class="input-group">
            <text class="input-label">注射压力(MPa) *</text>
            <input class="input" v-model="form.injection_pressure_mpa" type="digit" placeholder="例如: 80.00" />
          </view>
          <view class="input-group">
            <text class="input-label">充型时间(ms)</text>
            <input class="input" v-model="form.fill_time_ms" type="number" placeholder="例如: 150" />
          </view>
          <view class="input-group">
            <text class="input-label">保压压力(MPa)</text>
            <input class="input" v-model="form.hold_pressure_mpa" type="digit" placeholder="例如: 60.00" />
          </view>
          <view class="input-group">
            <text class="input-label">保压时间(ms)</text>
            <input class="input" v-model="form.hold_time_ms" type="number" placeholder="例如: 5000" />
          </view>
          <view class="input-group">
            <text class="input-label">冷却时间(s)</text>
            <input class="input" v-model="form.cooling_time_s" type="number" placeholder="例如: 30" />
          </view>
          <view class="input-group">
            <text class="input-label">单次射出重量(g)</text>
            <input class="input" v-model="form.shot_weight_g" type="digit" placeholder="例如: 500.00" />
          </view>
        </template>
        
        <template v-if="processCode === 'BROACH'">
          <view class="input-group">
            <text class="input-label">拉床设备编号 *</text>
            <input class="input" v-model="form.machine_no" placeholder="例如: BROACH-001" />
          </view>
          <view class="input-group">
            <text class="input-label">拉刀编号 *</text>
            <input class="input" v-model="form.broach_tool_no" placeholder="例如: TOOL-D01" />
          </view>
          <view class="input-group">
            <text class="input-label">拉削速度(mm/s)</text>
            <input class="input" v-model="form.broach_speed_mm_s" type="digit" placeholder="例如: 50.0" />
          </view>
          <view class="input-group">
            <text class="input-label">每行程进给(mm/行程)</text>
            <input class="input" v-model="form.feed_mm_per_stroke" type="digit" placeholder="例如: 0.5" />
          </view>
          <view class="input-group">
            <text class="input-label">切削油类型</text>
            <input class="input" v-model="form.cutting_oil_type" placeholder="例如: OIL-B" />
          </view>
          <view class="input-group">
            <text class="input-label">走刀次数</text>
            <input class="input" v-model="form.pass_count" type="number" placeholder="例如: 2" />
          </view>
          <view class="input-group">
            <text class="input-label">目标尺寸(mm)</text>
            <input class="input" v-model="form.target_dimension_mm" type="digit" placeholder="例如: 100.0000" />
          </view>
          <view class="input-group">
            <text class="input-label">实测尺寸(mm)</text>
            <input class="input" v-model="form.measured_dimension_mm" type="digit" placeholder="例如: 99.9500" />
          </view>
        </template>
        
        <template v-if="processCode === 'HYD_REMOVE_PROTECT'">
          <view class="input-group">
            <text class="input-label">液压机编号 *</text>
            <input class="input" v-model="form.press_no" placeholder="例如: HYD-001" />
          </view>
          <view class="input-group">
            <text class="input-label">压力(MPa) *</text>
            <input class="input" v-model="form.pressure_mpa" type="digit" placeholder="例如: 10.00" />
          </view>
          <view class="input-group">
            <text class="input-label">保压时间(s) *</text>
            <input class="input" v-model="form.hold_time_s" type="number" placeholder="例如: 30" />
          </view>
          <view class="input-group">
            <text class="input-label">方式</text>
            <picker mode="selector" :range="hydMethods" :value="hydMethodIndex" @change="onHydMethodChange">
              <view class="picker">{{ hydMethods[hydMethodIndex] }}</view>
            </picker>
          </view>
          <view class="input-group">
            <text class="input-label">溶剂类型</text>
            <input class="input" v-model="form.solvent_type" placeholder="例如: SOLVENT-A" />
          </view>
          <view class="input-group">
            <text class="input-label">溶剂温度(°C)</text>
            <input class="input" v-model="form.solvent_temp_c" type="digit" placeholder="例如: 60.0" />
          </view>
          <view class="input-group">
            <text class="input-label">是否需要清洗</text>
            <picker mode="selector" :range="rinseOptions" :value="rinseIndex" @change="onRinseChange">
              <view class="picker">{{ rinseOptions[rinseIndex] }}</view>
            </picker>
          </view>
        </template>
        
        <template v-if="processCode === 'QR_ENGRAVE'">
          <view class="input-group">
            <text class="input-label">激光设备编号 *</text>
            <input class="input" v-model="form.laser_machine_no" placeholder="例如: LASER-001" />
          </view>
          <view class="input-group">
            <text class="input-label">二维码格式</text>
            <picker mode="selector" :range="qrFormats" :value="qrFormatIndex" @change="onQrFormatChange">
              <view class="picker">{{ qrFormats[qrFormatIndex] }}</view>
            </picker>
          </view>
          <view class="input-group">
            <text class="tip-text">二维码内容将根据选择的格式自动生成</text>
          </view>
          <view class="input-group">
            <text class="input-label">激光功率(W)</text>
            <input class="input" v-model="form.laser_power_w" type="digit" placeholder="例如: 50.0" />
          </view>
          <view class="input-group">
            <text class="input-label">扫描速度(mm/s)</text>
            <input class="input" v-model="form.scan_speed_mm_s" type="digit" placeholder="例如: 100.0" />
          </view>
          <view class="input-group">
            <text class="input-label">焦距(mm)</text>
            <input class="input" v-model="form.focal_length_mm" type="digit" placeholder="例如: 150.0" />
          </view>
          <view class="input-group">
            <text class="input-label">标刻深度(μm)</text>
            <input class="input" v-model="form.mark_depth_um" type="digit" placeholder="例如: 50.0" />
          </view>
        </template>
        
        <template v-if="processCode === 'FLUORESCENT_TEST'">
          <view class="input-group">
            <text class="input-label">检测设备编号 *</text>
            <input class="input" v-model="form.equipment_no" placeholder="例如: FLUO-001" />
          </view>
          <view class="input-group">
            <text class="input-label">停留时间(min) *</text>
            <input class="input" v-model="form.dwell_time_min" type="number" placeholder="例如: 10" />
          </view>
          <view class="input-group">
            <text class="input-label">荧光渗透剂批次号</text>
            <input class="input" v-model="form.penetrant_batch_no" placeholder="例如: PEN-20251228-001" />
          </view>
          <view class="input-group">
            <text class="input-label">显像剂类型</text>
            <input class="input" v-model="form.developer_type" placeholder="例如: DEV-A" />
          </view>
          <view class="input-group">
            <text class="input-label">显像时间(min)</text>
            <input class="input" v-model="form.developer_time_min" type="number" placeholder="例如: 5" />
          </view>
          <view class="input-group">
            <text class="input-label">紫外强度(μW/cm²)</text>
            <input class="input" v-model="form.uv_intensity_uw_cm2" type="digit" placeholder="例如: 1000.00" />
          </view>
          <view class="input-group">
            <text class="input-label">缺陷数量</text>
            <input class="input" v-model="form.defect_count" type="number" placeholder="例如: 0" />
          </view>
          <view class="input-group">
            <text class="input-label">最大缺陷长度(mm)</text>
            <input class="input" v-model="form.max_defect_length_mm" type="digit" placeholder="例如: 2.5" />
          </view>
          <view class="input-group">
            <text class="input-label">检查说明/备注</text>
            <textarea class="textarea" v-model="form.inspector_notes" placeholder="例如: 检测正常，无缺陷" />
          </view>
        </template>
        
        <!-- 所有11个工序的参数字段已完整实现 -->
        
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :loading="submitting">
        提交工序记录
      </button>
    </view>
  </view>
</template>

<script>
import { get, post } from '@/utils/request.js'
import storage from '@/utils/storage.js'
import { PROCESS_MAP } from '@/utils/config.js'

export default {
  data() {
    return {
      bladeId: null,
      bladeInfo: {},
      processCode: null,  // 工序编码
      processIndex: 0,
      currentProcess: null,
      availableProcesses: [],
      pageTitle: '工序录入',  // 页面标题
      form: {
        is_success: 1,
        fail_reason: '',
        remarks: '',
        // 工序特定参数
        furnace_no: '',
        target_temp_c: '',
        hold_time_min: '',
        press_no: '',
        die_no: '',
        tonnage_t: '',
        cooling_method: 'AIR',
        cooling_time_min: '',
        grinder_no: '',
        wheel_grit: '',
        feed_mm_s: '',
        // 涂陶瓷漆涂层加热参数
        paint_batch_no: '',
        coating_thickness_um: '',
        oven_no: '',
        bake_temp_c: '',
        bake_time_min: '',
        // 二次冲压参数（复用 press_no, die_no, tonnage_t）
        stroke_mm: '',
        speed_mm_s: '',
        lubrication_type: '',
        lubrication_amount_ml: '',
        // 压铸参数
        machine_no: '',
        alloy_batch_no: '',
        melt_temp_c: '',
        mold_temp_c: '',
        injection_pressure_mpa: '',
        fill_time_ms: '',
        hold_pressure_mpa: '',
        hold_time_ms: '',
        cooling_time_s: '',
        shot_weight_g: '',
        // 拉床加工参数（复用 machine_no）
        broach_tool_no: '',
        broach_speed_mm_s: '',
        feed_mm_per_stroke: '',
        cutting_oil_type: '',
        pass_count: '1',
        target_dimension_mm: '',
        measured_dimension_mm: '',
        // 液压机去除保护层参数（复用 press_no）
        pressure_mpa: '',
        hold_time_s: '',
        method: 'PRESS',
        solvent_type: '',
        solvent_temp_c: '',
        rinse_required: 1,
        // 雕刻二维码参数
        laser_machine_no: '',
        qr_format: 'BLADE_ID',
        laser_power_w: '',
        scan_speed_mm_s: '',
        focal_length_mm: '',
        mark_depth_um: '',
        // 荧光检测参数
        equipment_no: '',
        penetrant_batch_no: '',
        dwell_time_min: '',
        developer_type: '',
        developer_time_min: '',
        uv_intensity_uw_cm2: '',
        defect_count: '0',
        max_defect_length_mm: '',
        inspector_notes: ''
      },
      coolMethods: ['AIR', 'FORCED_AIR', 'WATER', 'OIL'],
      coolMethodIndex: 0,
      hydMethods: ['PRESS', 'PRESS_PLUS_SOLVENT'],
      hydMethodIndex: 0,
      hydMethodMap: { 'PRESS': 0, 'PRESS_PLUS_SOLVENT': 1 },
      rinseOptions: ['是', '否'],
      rinseIndex: 0,
      qrFormats: ['BLADE_ID', 'BLADE_SN', 'CUSTOM'],
      qrFormatIndex: 0,
      qrFormatMap: { 'BLADE_ID': 0, 'BLADE_SN': 1, 'CUSTOM': 2 },
      submitting: false
    }
  },
  onLoad(options) {
    this.bladeId = parseInt(options.bladeId)
    this.processCode = options.processCode || null
    
    if (!this.bladeId) {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    // 检查权限
    const userInfo = storage.getUserInfo()
    if (!userInfo) {
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    
    // 如果是荧光检测，允许质检员和管理员
    if (this.processCode === 'FLUORESCENT_TEST') {
      if (userInfo.role !== 'QC' && userInfo.role !== 'ADMIN') {
        uni.showToast({
          title: '只有质检员可以进行荧光检测',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        return
      }
    } else {
      // 其他工序，只允许操作员和管理员
      if (userInfo.role !== 'OPERATOR' && userInfo.role !== 'ADMIN') {
        uni.showToast({
          title: '无权限访问',
          icon: 'none'
        })
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        return
      }
    }
    
    // 立即初始化工序列表，以便在传入processCode时能立即显示
    // 操作员只能看到1-10步，质检员可以看到第11步
    let processCodes = Object.keys(PROCESS_MAP).filter(code => code !== 'QC_INSPECTION')
    if (userInfo.role === 'OPERATOR') {
      // 操作员不能选择第11步（荧光检测）
      processCodes = processCodes.filter(code => code !== 'FLUORESCENT_TEST')
    }
    
    this.availableProcesses = processCodes
      .map(code => ({
        code,
        name: PROCESS_MAP[code].name,
        order: PROCESS_MAP[code].order
      }))
      .sort((a, b) => a.order - b.order)
    
    // 如果指定了工序，立即设置当前工序
    if (this.processCode) {
      const process = this.availableProcesses.find(p => p.code === this.processCode)
      if (process) {
        this.currentProcess = process
        this.processIndex = this.availableProcesses.indexOf(process)
      }
    }
    
    this.loadBladeInfo()
    this.loadAvailableProcesses()
    
    // 确保导航栏标题正确设置
    this.setNavigationTitle()
  },
  onReady() {
    // 在页面渲染完成后再次设置标题，确保生效
    this.setNavigationTitle()
  },
  methods: {
    setNavigationTitle() {
      // 根据 processCode 设置导航栏标题
      if (this.processCode === 'FLUORESCENT_TEST') {
        this.pageTitle = '荧光检测'
        uni.setNavigationBarTitle({
          title: '荧光检测'
        })
      } else {
        this.pageTitle = '工序录入'
        uni.setNavigationBarTitle({
          title: '工序录入'
        })
      }
    },
    async loadBladeInfo() {
      try {
        const res = await get(`/blade/${this.bladeId}`)
        if (res && res.data) {
          this.bladeInfo = res.data
          
          // 检查权限：已完成所有工序的叶片，只有质检员可以操作
          const userInfo = storage.getUserInfo()
          if (res.data.status === 'READY_FOR_QC') {
            if (userInfo.role !== 'QC' && userInfo.role !== 'ADMIN') {
              uni.showModal({
                title: '权限不足',
                content: '该叶片已完成所有工序，只有质检员可以进行操作',
                showCancel: false,
                success: () => {
                  uni.navigateBack()
                }
              })
              return
            }
          }
          
          // 已完成或报废的叶片不能再录入工序
          if (res.data.status === 'COMPLETED' || res.data.status === 'SCRAPPED') {
            uni.showModal({
              title: '提示',
              content: `该叶片状态为${res.data.status === 'COMPLETED' ? '已完成' : '已报废'}，无法继续录入工序`,
              showCancel: false,
              success: () => {
                uni.navigateBack()
              }
            })
            return
          }
        }
      } catch (error) {
        console.error('加载叶片信息失败:', error)
      }
    },
    
    async loadAvailableProcesses() {
      // 获取可录入的工序列表（根据叶片当前进度）
      try {
        const res = await get(`/blade/${this.bladeId}/trace`)
        if (res && res.data) {
          const processes = res.data.processes || []
          const userInfo = storage.getUserInfo()
          
          // 找出下一个可录入的工序
          let processCodes = Object.keys(PROCESS_MAP)
            .filter(code => code !== 'QC_INSPECTION')
          
          // 操作员不能选择第11步（荧光检测）
          if (userInfo && userInfo.role === 'OPERATOR') {
            processCodes = processCodes.filter(code => code !== 'FLUORESCENT_TEST')
          }
          
          this.availableProcesses = processCodes
            .map(code => ({
              code,
              name: PROCESS_MAP[code].name,
              order: PROCESS_MAP[code].order
            }))
            .sort((a, b) => a.order - b.order)
          
          // 如果指定了工序，设置当前工序
          if (this.processCode) {
            const process = this.availableProcesses.find(p => p.code === this.processCode)
            if (process) {
              // 如果是荧光检测，检查前10个工序是否都已完成，以及是否已经进行过荧光检测
              if (process.code === 'FLUORESCENT_TEST') {
                // 检查是否已经进行过荧光检测
                const fluorescentRecord = processes.find(p => p.processCode === 'FLUORESCENT_TEST')
                if (fluorescentRecord && fluorescentRecord.record) {
                  uni.showModal({
                    title: '提示',
                    content: '该叶片已经进行过荧光检测，不能重复检测',
                    showCancel: false,
                    success: () => {
                      uni.navigateBack()
                    }
                  })
                  return
                }
                
                const first10ProcessCodes = [
                  'ALLOY_PREHEAT', 'STAMP_FORM_COOL', 'EDGE_GRIND', 'CERAMIC_COAT_HEAT',
                  'SECOND_STAMP', 'TRIM_EXCESS', 'DIE_CAST', 'BROACH',
                  'HYD_REMOVE_PROTECT', 'QR_ENGRAVE'
                ]
                
                let allFirst10Completed = true
                const missingProcesses = []
                
                for (const code of first10ProcessCodes) {
                  const processRecord = processes.find(p => p.processCode === code)
                  if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
                    allFirst10Completed = false
                    const processName = PROCESS_MAP[code]?.name || code
                    missingProcesses.push(processName)
                  }
                }
                
                if (!allFirst10Completed) {
                  uni.showModal({
                    title: '提示',
                    content: `前10个工序尚未全部完成，无法进行荧光检测。\n未完成的工序：${missingProcesses.join('、')}`,
                    showCancel: false,
                    success: () => {
                      uni.navigateBack()
                    }
                  })
                  return
                }
              }
              
              this.currentProcess = process
              this.processIndex = this.availableProcesses.indexOf(process)
            }
          } else {
            // 自动选择下一个工序
            const nextProcess = this.findNextProcess(processes)
            if (nextProcess) {
              this.processCode = nextProcess.code
              this.currentProcess = nextProcess
              this.processIndex = this.availableProcesses.indexOf(nextProcess)
            }
          }
        }
      } catch (error) {
        console.error('加载工序信息失败:', error)
        // 如果加载失败，使用默认工序列表
        this.availableProcesses = Object.keys(PROCESS_MAP)
          .filter(code => code !== 'QC_INSPECTION')
          .map(code => ({
            code,
            name: PROCESS_MAP[code].name,
            order: PROCESS_MAP[code].order
          }))
          .sort((a, b) => a.order - b.order)
      }
    },
    
    findNextProcess(processes) {
      // 找出第一个未完成的工序
      for (const process of this.availableProcesses) {
        const processRecord = processes.find(p => p.processCode === process.code)
        if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
          return process
        }
      }
      return null
    },
    
    async onProcessChange(e) {
      this.processIndex = parseInt(e.detail.value)
      this.currentProcess = this.availableProcesses[this.processIndex]
      this.processCode = this.currentProcess.code
      
      // 如果选择的是荧光检测，检查前10个工序是否都已完成，以及是否已经进行过荧光检测
      if (this.processCode === 'FLUORESCENT_TEST') {
        try {
          const traceRes = await get(`/blade/${this.bladeId}/trace`)
          if (traceRes && traceRes.data && traceRes.data.processes) {
            const processes = traceRes.data.processes
            
            // 检查是否已经进行过荧光检测
            const fluorescentRecord = processes.find(p => p.processCode === 'FLUORESCENT_TEST')
            if (fluorescentRecord && fluorescentRecord.record) {
              uni.showModal({
                title: '提示',
                content: '该叶片已经进行过荧光检测，不能重复检测',
                showCancel: false,
                success: () => {
                  // 重置选择
                  this.processIndex = 0
                  this.currentProcess = this.availableProcesses[0]
                  this.processCode = this.currentProcess.code
                }
              })
              return
            }
            
            const first10ProcessCodes = [
              'ALLOY_PREHEAT', 'STAMP_FORM_COOL', 'EDGE_GRIND', 'CERAMIC_COAT_HEAT',
              'SECOND_STAMP', 'TRIM_EXCESS', 'DIE_CAST', 'BROACH',
              'HYD_REMOVE_PROTECT', 'QR_ENGRAVE'
            ]
            
            let allFirst10Completed = true
            const missingProcesses = []
            
            for (const code of first10ProcessCodes) {
              const processRecord = processes.find(p => p.processCode === code)
              if (!processRecord || !processRecord.record || !processRecord.isSuccess) {
                allFirst10Completed = false
                const processName = PROCESS_MAP[code]?.name || code
                missingProcesses.push(processName)
              }
            }
            
            if (!allFirst10Completed) {
              uni.showModal({
                title: '提示',
                content: `前10个工序尚未全部完成，无法进行荧光检测。\n未完成的工序：${missingProcesses.join('、')}`,
                showCancel: false,
                success: () => {
                  // 重置选择
                  this.processIndex = 0
                  this.currentProcess = this.availableProcesses[0]
                  this.processCode = this.currentProcess.code
                }
              })
              return
            }
          }
        } catch (error) {
          console.error('检查工序完成情况失败:', error)
        }
      }
    },
    
    onCoolMethodChange(e) {
      this.coolMethodIndex = parseInt(e.detail.value)
      this.form.cooling_method = this.coolMethods[this.coolMethodIndex]
    },
    
    onHydMethodChange(e) {
      this.hydMethodIndex = parseInt(e.detail.value)
      this.form.method = this.hydMethods[this.hydMethodIndex]
    },
    
    onRinseChange(e) {
      this.rinseIndex = parseInt(e.detail.value)
      this.form.rinse_required = this.rinseIndex === 0 ? 1 : 0
    },
    
    onQrFormatChange(e) {
      this.qrFormatIndex = parseInt(e.detail.value)
      this.form.qr_format = this.qrFormats[this.qrFormatIndex]
      // 二维码内容由后端自动生成，不需要自定义输入
    },
    
    validateForm() {
      if (!this.processCode) {
        uni.showToast({
          title: '请选择工序',
          icon: 'none'
        })
        return false
      }
      
      if (this.form.is_success === 0 && !this.form.fail_reason) {
        uni.showToast({
          title: '失败时必须填写失败原因',
          icon: 'none'
        })
        return false
      }
      
      // 根据工序类型验证必填字段
      if (this.processCode === 'ALLOY_PREHEAT') {
        if (!this.form.furnace_no || !this.form.target_temp_c || !this.form.hold_time_min) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'STAMP_FORM_COOL') {
        if (!this.form.press_no || !this.form.die_no || !this.form.tonnage_t || !this.form.cooling_time_min) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'EDGE_GRIND') {
        if (!this.form.grinder_no || !this.form.wheel_grit) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'CERAMIC_COAT_HEAT') {
        if (!this.form.paint_batch_no || !this.form.coating_thickness_um || 
            !this.form.oven_no || !this.form.bake_temp_c || !this.form.bake_time_min) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'SECOND_STAMP') {
        if (!this.form.press_no || !this.form.die_no || !this.form.tonnage_t) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'DIE_CAST') {
        if (!this.form.machine_no || !this.form.alloy_batch_no || 
            !this.form.melt_temp_c || !this.form.injection_pressure_mpa) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'BROACH') {
        if (!this.form.machine_no || !this.form.broach_tool_no) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'HYD_REMOVE_PROTECT') {
        if (!this.form.press_no || !this.form.pressure_mpa || !this.form.hold_time_s) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'QR_ENGRAVE') {
        if (!this.form.laser_machine_no) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      if (this.processCode === 'FLUORESCENT_TEST') {
        if (!this.form.equipment_no || !this.form.dwell_time_min) {
          uni.showToast({
            title: '请填写完整的工艺参数',
            icon: 'none'
          })
          return false
        }
      }
      
      return true
    },
    
    async handleSubmit() {
      if (!this.validateForm()) {
        return
      }
      
      this.submitting = true
      
      try {
        const userInfo = storage.getUserInfo()
        
        // 构建提交数据
        const data = {
          blade_id: this.bladeId,
          operator_id: userInfo.operator_id,
          process_code: this.processCode,
          is_success: this.form.is_success,
          fail_reason: this.form.fail_reason || null,
          remarks: this.form.remarks || null,
          // 工序特定参数
          ...this.getProcessParams()
        }
        
        const res = await post('/process', data)
        
        if (res && res.data) {
          uni.showToast({
            title: '提交成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            // 返回追溯详情页
            uni.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.error('提交失败:', error)
        const errorMsg = error.message || error.data?.message || '提交失败，请重试'
        uni.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.submitting = false
      }
    },
    
    getProcessParams() {
      // 根据工序类型返回对应的参数
      const params = {}
      
      if (this.processCode === 'ALLOY_PREHEAT') {
        params.furnace_no = this.form.furnace_no
        params.target_temp_c = parseFloat(this.form.target_temp_c)
        params.hold_time_min = parseInt(this.form.hold_time_min)
      } else if (this.processCode === 'STAMP_FORM_COOL') {
        params.press_no = this.form.press_no
        params.die_no = this.form.die_no
        params.tonnage_t = parseFloat(this.form.tonnage_t)
        params.cooling_method = this.form.cooling_method
        params.cooling_time_min = parseInt(this.form.cooling_time_min)
      } else if (this.processCode === 'EDGE_GRIND') {
        params.grinder_no = this.form.grinder_no
        params.wheel_grit = parseInt(this.form.wheel_grit)
        if (this.form.feed_mm_s) {
          params.feed_mm_s = parseFloat(this.form.feed_mm_s)
        }
      } else if (this.processCode === 'CERAMIC_COAT_HEAT') {
        params.paint_batch_no = this.form.paint_batch_no
        params.coating_thickness_um = parseFloat(this.form.coating_thickness_um)
        params.oven_no = this.form.oven_no
        params.bake_temp_c = parseFloat(this.form.bake_temp_c)
        params.bake_time_min = parseInt(this.form.bake_time_min)
      } else if (this.processCode === 'SECOND_STAMP') {
        // 二次冲压复用 press_no, die_no, tonnage_t
        params.press_no = this.form.press_no
        params.die_no = this.form.die_no
        params.tonnage_t = parseFloat(this.form.tonnage_t)
        if (this.form.stroke_mm) {
          params.stroke_mm = parseFloat(this.form.stroke_mm)
        }
        if (this.form.speed_mm_s) {
          params.speed_mm_s = parseFloat(this.form.speed_mm_s)
        }
        if (this.form.lubrication_type) {
          params.lubrication_type = this.form.lubrication_type
        }
        if (this.form.lubrication_amount_ml) {
          params.lubrication_amount_ml = parseFloat(this.form.lubrication_amount_ml)
        }
      } else if (this.processCode === 'DIE_CAST') {
        params.machine_no = this.form.machine_no
        params.alloy_batch_no = this.form.alloy_batch_no
        params.melt_temp_c = parseFloat(this.form.melt_temp_c)
        if (this.form.mold_temp_c) {
          params.mold_temp_c = parseFloat(this.form.mold_temp_c)
        }
        params.injection_pressure_mpa = parseFloat(this.form.injection_pressure_mpa)
        if (this.form.fill_time_ms) {
          params.fill_time_ms = parseInt(this.form.fill_time_ms)
        }
        if (this.form.hold_pressure_mpa) {
          params.hold_pressure_mpa = parseFloat(this.form.hold_pressure_mpa)
        }
        if (this.form.hold_time_ms) {
          params.hold_time_ms = parseInt(this.form.hold_time_ms)
        }
        if (this.form.cooling_time_s) {
          params.cooling_time_s = parseInt(this.form.cooling_time_s)
        }
        if (this.form.shot_weight_g) {
          params.shot_weight_g = parseFloat(this.form.shot_weight_g)
        }
      } else if (this.processCode === 'BROACH') {
        // 拉床加工复用 machine_no
        params.machine_no = this.form.machine_no
        params.broach_tool_no = this.form.broach_tool_no
        if (this.form.broach_speed_mm_s) {
          params.broach_speed_mm_s = parseFloat(this.form.broach_speed_mm_s)
        }
        if (this.form.feed_mm_per_stroke) {
          params.feed_mm_per_stroke = parseFloat(this.form.feed_mm_per_stroke)
        }
        if (this.form.cutting_oil_type) {
          params.cutting_oil_type = this.form.cutting_oil_type
        }
        if (this.form.pass_count) {
          params.pass_count = parseInt(this.form.pass_count)
        }
        if (this.form.target_dimension_mm) {
          params.target_dimension_mm = parseFloat(this.form.target_dimension_mm)
        }
        if (this.form.measured_dimension_mm) {
          params.measured_dimension_mm = parseFloat(this.form.measured_dimension_mm)
        }
      } else if (this.processCode === 'HYD_REMOVE_PROTECT') {
        // 液压机去除保护层复用 press_no
        params.press_no = this.form.press_no
        params.pressure_mpa = parseFloat(this.form.pressure_mpa)
        params.hold_time_s = parseInt(this.form.hold_time_s)
        params.method = this.form.method
        if (this.form.solvent_type) {
          params.solvent_type = this.form.solvent_type
        }
        if (this.form.solvent_temp_c) {
          params.solvent_temp_c = parseFloat(this.form.solvent_temp_c)
        }
        params.rinse_required = this.rinseIndex === 0 ? 1 : 0
      } else if (this.processCode === 'QR_ENGRAVE') {
        params.laser_machine_no = this.form.laser_machine_no
        params.qr_format = this.form.qr_format
        // 二维码内容由后端自动生成，不传递 qr_text
        if (this.form.laser_power_w) {
          params.laser_power_w = parseFloat(this.form.laser_power_w)
        }
        if (this.form.scan_speed_mm_s) {
          params.scan_speed_mm_s = parseFloat(this.form.scan_speed_mm_s)
        }
        if (this.form.focal_length_mm) {
          params.focal_length_mm = parseFloat(this.form.focal_length_mm)
        }
        if (this.form.mark_depth_um) {
          params.mark_depth_um = parseFloat(this.form.mark_depth_um)
        }
      } else if (this.processCode === 'FLUORESCENT_TEST') {
        params.equipment_no = this.form.equipment_no
        params.dwell_time_min = parseInt(this.form.dwell_time_min)
        if (this.form.penetrant_batch_no) {
          params.penetrant_batch_no = this.form.penetrant_batch_no
        }
        if (this.form.developer_type) {
          params.developer_type = this.form.developer_type
        }
        if (this.form.developer_time_min) {
          params.developer_time_min = parseInt(this.form.developer_time_min)
        }
        if (this.form.uv_intensity_uw_cm2) {
          params.uv_intensity_uw_cm2 = parseFloat(this.form.uv_intensity_uw_cm2)
        }
        if (this.form.defect_count) {
          params.defect_count = parseInt(this.form.defect_count)
        }
        if (this.form.max_defect_length_mm) {
          params.max_defect_length_mm = parseFloat(this.form.max_defect_length_mm)
        }
        if (this.form.inspector_notes) {
          params.inspector_notes = this.form.inspector_notes
        }
      }
      // 所有11个工序的参数已完整实现
      
      return params
    }
  }
}
</script>

<style scoped>
.process-input-container {
  min-height: 100vh;
  background: #FFFFFF;
  padding: 20rpx;
}

.form-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  text-align: center;
}

.blade-info {
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  margin-bottom: 15rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
  font-size: 28rpx;
  width: 180rpx;
}

.info-item .value {
  color: #333;
  font-size: 28rpx;
  font-weight: 500;
}

.form-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.input-group {
  margin-bottom: 25rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.textarea {
  width: 100%;
  min-height: 150rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.radio-group {
  display: flex;
  gap: 30rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  color: #333;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFB6C1 100%);
  color: #ffffff;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn::after {
  border: none;
}

.tip-text {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.6;
  padding: 10rpx 0;
}
</style>

