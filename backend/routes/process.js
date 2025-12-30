/**
 * 工序录入路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * 提交工序记录
 * POST /api/process
 */
router.post('/', authenticateToken, checkRole('OPERATOR', 'QC', 'ADMIN'), async (req, res) => {
  try {
    const {
      blade_id,
      process_code,
      is_success,
      fail_reason,
      remarks,
      // 工序特定参数
      furnace_no,
      target_temp_c,
      hold_time_min,
      press_no,
      die_no,
      tonnage_t,
      cooling_method,
      cooling_time_min,
      grinder_no,
      wheel_grit,
      feed_mm_s,
      // 涂陶瓷漆涂层加热参数
      paint_batch_no,
      coating_thickness_um,
      oven_no,
      bake_temp_c,
      bake_time_min,
      // 二次冲压参数（复用 press_no, die_no, tonnage_t，但需要单独处理）
      stroke_mm,
      speed_mm_s,
      lubrication_type,
      lubrication_amount_ml,
      // 压铸参数
      machine_no,
      alloy_batch_no,
      melt_temp_c,
      mold_temp_c,
      injection_pressure_mpa,
      fill_time_ms,
      hold_pressure_mpa,
      hold_time_ms,
      cooling_time_s,
      shot_weight_g,
      // 拉床加工参数（复用 machine_no）
      broach_tool_no,
      broach_speed_mm_s,
      feed_mm_per_stroke,
      cutting_oil_type,
      pass_count,
      target_dimension_mm,
      measured_dimension_mm,
      // 液压机去除保护层参数（复用 press_no）
      pressure_mpa,
      hold_time_s,
      method,
      solvent_type,
      solvent_temp_c,
      rinse_required,
      // 雕刻二维码参数
      laser_machine_no,
      qr_format,
      laser_power_w,
      scan_speed_mm_s,
      focal_length_mm,
      mark_depth_um,
      // 荧光检测参数
      equipment_no,
      penetrant_batch_no,
      dwell_time_min,
      developer_type,
      developer_time_min,
      uv_intensity_uw_cm2,
      defect_count,
      max_defect_length_mm,
      inspector_notes
    } = req.body;

    const operator_id = req.user.operator_id;

    // 验证必填字段
    if (!blade_id || !process_code) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：叶片ID和工序编码'
      });
    }

    // 检查叶片是否存在
    const [blades] = await pool.execute(
      'SELECT status FROM blade WHERE blade_id = ?',
      [blade_id]
    );

    if (blades.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '叶片不存在'
      });
    }

    const bladeStatus = blades[0].status;
    const userRole = req.user.role;

    // 权限检查：已完成所有工序的叶片（READY_FOR_QC），只有质检员和管理员可以操作
    if (bladeStatus === 'READY_FOR_QC') {
      if (userRole !== 'QC' && userRole !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: '该叶片已完成所有工序，只有质检员可以操作'
        });
      }
    }

    // 已完成或报废的叶片不能再录入工序
    if (bladeStatus === 'COMPLETED' || bladeStatus === 'SCRAPPED') {
      return res.status(400).json({
        code: 400,
        message: `该叶片状态为${bladeStatus === 'COMPLETED' ? '已完成' : '已报废'}，无法继续录入工序`
      });
    }

    // 权限检查：第11步（荧光检测）只能由质检员和管理员录入
    if (process_code === 'FLUORESCENT_TEST') {
      if (userRole !== 'QC' && userRole !== 'ADMIN') {
        return res.status(403).json({
          code: 403,
          message: '荧光检测只能由质检员进行'
        });
      }
      
      // 检查前10个工序是否都已完成（成功）
      const first10ProcessTables = [
        { code: 'ALLOY_PREHEAT', table: 'proc_alloy_preheat' },
        { code: 'STAMP_FORM_COOL', table: 'proc_stamp_form_cool' },
        { code: 'EDGE_GRIND', table: 'proc_edge_grind' },
        { code: 'CERAMIC_COAT_HEAT', table: 'proc_ceramic_coat_heat' },
        { code: 'SECOND_STAMP', table: 'proc_second_stamp' },
        { code: 'TRIM_EXCESS', table: 'proc_trim_excess' },
        { code: 'DIE_CAST', table: 'proc_die_cast' },
        { code: 'BROACH', table: 'proc_broach' },
        { code: 'HYD_REMOVE_PROTECT', table: 'proc_hyd_remove_protect' },
        { code: 'QR_ENGRAVE', table: 'proc_qr_engrave' }
      ];
      
      let allFirst10Completed = true;
      const missingProcesses = [];
      
      for (const process of first10ProcessTables) {
        const [records] = await pool.execute(
          `SELECT is_success FROM ${process.table} WHERE blade_id = ? ORDER BY attempt_no DESC LIMIT 1`,
          [blade_id]
        );
        
        if (records.length === 0 || records[0].is_success !== 1) {
          allFirst10Completed = false;
          missingProcesses.push(process.code);
        }
      }
      
      if (!allFirst10Completed) {
        return res.status(400).json({
          code: 400,
          message: `前10个工序尚未全部完成，无法进行荧光检测。未完成的工序：${missingProcesses.join(', ')}`
        });
      }
      
      // 检查是否已经进行过荧光检测
      const [existingFluorescent] = await pool.execute(
        'SELECT id FROM proc_fluorescent_test WHERE blade_id = ?',
        [blade_id]
      );
      
      if (existingFluorescent.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '该叶片已经进行过荧光检测，不能重复检测'
        });
      }
    } else {
      // 操作员只能录入1-10步，不能录入第11步
      if (userRole === 'OPERATOR' && process_code === 'FLUORESCENT_TEST') {
        return res.status(403).json({
          code: 403,
          message: '操作员不能录入荧光检测工序'
        });
      }
    }

    // 获取工序定义
    const [processDefs] = await pool.execute(
      'SELECT * FROM process_def WHERE process_code = ?',
      [process_code]
    );

    if (processDefs.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '工序编码不存在'
      });
    }

    const processDef = processDefs[0];
    const tableName = processDef.table_name;

    // 检查是否已有记录，确定 attempt_no
    const [existingRecords] = await pool.execute(
      `SELECT MAX(attempt_no) as max_attempt FROM ${tableName} WHERE blade_id = ?`,
      [blade_id]
    );
    const attemptNo = (existingRecords[0]?.max_attempt || 0) + 1;

    // 根据工序类型构建插入语句
    let insertSql = '';
    let params = [];

    if (process_code === 'ALLOY_PREHEAT') {
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, furnace_no, target_temp_c, hold_time_min, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id, furnace_no, target_temp_c, hold_time_min,
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'STAMP_FORM_COOL') {
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, cooling_method, cooling_time_min, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id, press_no, die_no, tonnage_t, cooling_method, cooling_time_min,
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'EDGE_GRIND') {
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, grinder_no, wheel_grit, feed_mm_s, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id, grinder_no, wheel_grit, feed_mm_s || null,
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'CERAMIC_COAT_HEAT') {
      // 涂陶瓷漆涂层加热：必填字段 paint_batch_no, coating_thickness_um, oven_no, bake_temp_c, bake_time_min
      // 验证必填字段
      if (!paint_batch_no || !coating_thickness_um || !oven_no || !bake_temp_c || !bake_time_min) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：陶瓷漆批次号、涂层厚度、烘箱编号、固化温度、固化时间'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, paint_batch_no, coating_thickness_um, oven_no, bake_temp_c, bake_time_min, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id, 
        paint_batch_no,  // 陶瓷漆批次号
        parseFloat(coating_thickness_um),  // 涂层厚度
        oven_no,  // 烘箱编号
        parseFloat(bake_temp_c),  // 固化温度
        parseInt(bake_time_min),  // 固化时间
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'SECOND_STAMP') {
      // 二次冲压：必填字段 press_no, die_no, tonnage_t
      // 验证必填字段
      if (!press_no || !die_no || !tonnage_t) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：冲压机编号、模具编号、吨位'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, press_no, die_no, tonnage_t, stroke_mm, speed_mm_s, lubrication_type, lubrication_amount_ml, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        press_no,  // 冲压机编号
        die_no,  // 模具编号
        parseFloat(tonnage_t),  // 吨位
        stroke_mm ? parseFloat(stroke_mm) : null,  // 行程
        speed_mm_s ? parseFloat(speed_mm_s) : null,  // 速度
        lubrication_type || null,  // 润滑剂类型
        lubrication_amount_ml ? parseFloat(lubrication_amount_ml) : null,  // 润滑剂用量
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'DIE_CAST') {
      // 压铸：必填字段 machine_no, alloy_batch_no, melt_temp_c, injection_pressure_mpa
      // 验证必填字段
      if (!machine_no || !alloy_batch_no || !melt_temp_c || !injection_pressure_mpa) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：压铸机编号、合金批次号、熔炼温度、注射压力'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, machine_no, alloy_batch_no, melt_temp_c, mold_temp_c, injection_pressure_mpa, fill_time_ms, hold_pressure_mpa, hold_time_ms, cooling_time_s, shot_weight_g, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        machine_no,  // 压铸机编号
        alloy_batch_no,  // 合金批次号
        parseFloat(melt_temp_c),  // 熔炼温度
        mold_temp_c ? parseFloat(mold_temp_c) : null,  // 模温
        parseFloat(injection_pressure_mpa),  // 注射压力
        fill_time_ms ? parseInt(fill_time_ms) : null,  // 充型时间
        hold_pressure_mpa ? parseFloat(hold_pressure_mpa) : null,  // 保压压力
        hold_time_ms ? parseInt(hold_time_ms) : null,  // 保压时间
        cooling_time_s ? parseInt(cooling_time_s) : null,  // 冷却时间
        shot_weight_g ? parseFloat(shot_weight_g) : null,  // 单次射出重量
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'BROACH') {
      // 拉床加工：必填字段 machine_no, broach_tool_no
      // 验证必填字段
      if (!machine_no || !broach_tool_no) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：拉床设备编号、拉刀编号'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, machine_no, broach_tool_no, broach_speed_mm_s, feed_mm_per_stroke, cutting_oil_type, pass_count, target_dimension_mm, measured_dimension_mm, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        machine_no,  // 拉床设备编号
        broach_tool_no,  // 拉刀编号
        broach_speed_mm_s ? parseFloat(broach_speed_mm_s) : null,  // 拉削速度
        feed_mm_per_stroke ? parseFloat(feed_mm_per_stroke) : null,  // 每行程进给
        cutting_oil_type || null,  // 切削油类型
        pass_count ? parseInt(pass_count) : 1,  // 走刀次数，默认1
        target_dimension_mm ? parseFloat(target_dimension_mm) : null,  // 目标尺寸
        measured_dimension_mm ? parseFloat(measured_dimension_mm) : null,  // 实测尺寸
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'HYD_REMOVE_PROTECT') {
      // 液压机去除保护层：必填字段 press_no, pressure_mpa, hold_time_s
      // 验证必填字段
      if (!press_no || !pressure_mpa || !hold_time_s) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：液压机编号、压力、保压时间'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, press_no, pressure_mpa, hold_time_s, method, solvent_type, solvent_temp_c, rinse_required, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        press_no,  // 液压机编号
        parseFloat(pressure_mpa),  // 压力
        parseInt(hold_time_s),  // 保压时间
        method || 'PRESS',  // 方式，默认PRESS
        solvent_type || null,  // 溶剂类型
        solvent_temp_c ? parseFloat(solvent_temp_c) : null,  // 溶剂温度
        rinse_required !== undefined ? (rinse_required ? 1 : 0) : 1,  // 是否需要清洗，默认1
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'QR_ENGRAVE') {
      // 雕刻二维码：必填字段 laser_machine_no
      // 验证必填字段
      if (!laser_machine_no) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：激光设备编号'
        });
      }
      
      // 根据格式自动生成二维码内容
      let finalQrText;
      if (qr_format === 'BLADE_SN') {
        // 需要查询叶片序列号
        const [bladeRows] = await pool.execute(
          'SELECT blade_sn FROM blade WHERE blade_id = ?',
          [blade_id]
        );
        if (bladeRows.length > 0) {
          finalQrText = `B${bladeRows[0].blade_sn}`;
        } else {
          finalQrText = `B${blade_id}`;
        }
      } else {
        // 默认使用 BLADE_ID 格式
        finalQrText = `B${blade_id}`;
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, laser_machine_no, qr_format, qr_text, laser_power_w, scan_speed_mm_s, focal_length_mm, mark_depth_um, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        laser_machine_no,  // 激光设备编号
        qr_format || 'BLADE_ID',  // 二维码格式，默认BLADE_ID
        finalQrText,  // 二维码内容
        laser_power_w ? parseFloat(laser_power_w) : null,  // 激光功率
        scan_speed_mm_s ? parseFloat(scan_speed_mm_s) : null,  // 扫描速度
        focal_length_mm ? parseFloat(focal_length_mm) : null,  // 焦距
        mark_depth_um ? parseFloat(mark_depth_um) : null,  // 标刻深度
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else if (process_code === 'FLUORESCENT_TEST') {
      // 荧光检测：必填字段 equipment_no, dwell_time_min
      // 验证必填字段
      if (!equipment_no || !dwell_time_min) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段：检测设备编号、停留时间'
        });
      }
      
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, equipment_no, penetrant_batch_no, dwell_time_min, developer_type, developer_time_min, uv_intensity_uw_cm2, defect_count, max_defect_length_mm, inspector_notes, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id,
        equipment_no,  // 检测设备编号
        penetrant_batch_no || null,  // 荧光渗透剂批次号
        parseInt(dwell_time_min),  // 停留时间
        developer_type || null,  // 显像剂类型
        developer_time_min ? parseInt(developer_time_min) : null,  // 显像时间
        uv_intensity_uw_cm2 ? parseFloat(uv_intensity_uw_cm2) : null,  // 紫外强度
        defect_count ? parseInt(defect_count) : 0,  // 缺陷数量，默认0
        max_defect_length_mm ? parseFloat(max_defect_length_mm) : null,  // 最大缺陷长度
        inspector_notes || null,  // 检查说明
        is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    } else {
      // 其他工序使用通用字段
      insertSql = `INSERT INTO ${tableName} 
        (blade_id, operator_id, performed_at, is_success, fail_reason, attempt_no, remarks)
        VALUES (?, ?, NOW(), ?, ?, ?, ?)`;
      params = [
        blade_id, operator_id, is_success ? 1 : 0, fail_reason || null, attemptNo, remarks || null
      ];
    }

    const [result] = await pool.execute(insertSql, params);

    // 更新叶片状态
    if (is_success) {
      // 如果是第11步（荧光检测）且成功，更新为待质检状态
      if (process_code === 'FLUORESCENT_TEST') {
        await pool.execute(
          'UPDATE blade SET status = ? WHERE blade_id = ?',
          ['READY_FOR_QC', blade_id]
        );
      } else {
        // 其他工序成功：更新为加工中
        await pool.execute(
          'UPDATE blade SET status = ? WHERE blade_id = ?',
          ['IN_PROCESS', blade_id]
        );
      }
      
      // 更新工序状态表
      await pool.execute(
        `INSERT INTO blade_process_state (blade_id, current_success_order, last_process_code, is_blocked, updated_at)
         VALUES (?, ?, ?, 0, NOW())
         ON DUPLICATE KEY UPDATE 
         current_success_order = ?,
         last_process_code = ?,
         is_blocked = 0,
         updated_at = NOW()`,
        [blade_id, processDef.process_order, process_code, processDef.process_order, process_code]
      );
    } else {
      // 失败：设置为阻塞
      await pool.execute(
        'UPDATE blade SET status = ? WHERE blade_id = ?',
        ['BLOCKED', blade_id]
      );
      
      await pool.execute(
        `INSERT INTO blade_process_state (blade_id, current_success_order, last_process_code, is_blocked, blocked_order, blocked_code, blocked_reason, updated_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
         is_blocked = 1,
         blocked_order = ?,
         blocked_code = ?,
         blocked_reason = ?,
         updated_at = NOW()`,
        [blade_id, processDef.process_order - 1, processDef.process_code, processDef.process_order, process_code, fail_reason || '工序失败', processDef.process_order, process_code, fail_reason || '工序失败']
      );
    }

    res.json({
      code: 200,
      message: '提交成功',
      data: {
        id: result.insertId,
        attempt_no: attemptNo
      }
    });
  } catch (error) {
    console.error('提交工序记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '提交失败'
    });
  }
});

module.exports = router;

