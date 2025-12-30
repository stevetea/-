/**
 * 质检相关路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * 提交质检报告
 * POST /api/qc
 */
router.post('/', authenticateToken, checkRole('QC', 'ADMIN'), async (req, res) => {
  try {
    const {
      blade_id,
      result,
      dimension_pass,
      surface_pass,
      weight_g,
      key_dimension_mm,
      defect_level,
      ncr_no,
      remarks
    } = req.body;

    const inspector_id = req.user.operator_id;

    // 验证必填字段
    if (!blade_id || !result) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：叶片ID和质检结论'
      });
    }

    // 验证质检结论
    if (result !== 'PASS' && result !== 'FAIL') {
      return res.status(400).json({
        code: 400,
        message: '质检结论必须是PASS或FAIL'
      });
    }

    // 验证尺寸检查和外观检查
    if (dimension_pass === null || dimension_pass === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：尺寸检查结果'
      });
    }

    if (surface_pass === null || surface_pass === undefined) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：外观/表面检查结果'
      });
    }

    // 不通过时的验证
    if (result === 'FAIL') {
      if (!defect_level || defect_level === 'NONE') {
        return res.status(400).json({
          code: 400,
          message: '不通过时必须选择缺陷等级'
        });
      }
    }

    // 检查叶片状态
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

    // 检查是否已经质检过
    const [existingQC] = await pool.execute(
      'SELECT id FROM qc_inspection WHERE blade_id = ?',
      [blade_id]
    );

    if (existingQC.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该叶片已经进行过质检，不能重复质检'
      });
    }

    // 不允许对已完成或报废的叶片进行质检
    if (bladeStatus === 'COMPLETED' || bladeStatus === 'SCRAPPED') {
      return res.status(400).json({
        code: 400,
        message: '该叶片已完成或已报废，无法进行质检'
      });
    }

    // 只要进行了荧光检测（无论成功失败）就可以进行质检录入
    const [fluorescentRecords] = await pool.execute(
      'SELECT id, is_success, performed_at, equipment_no, dwell_time_min, defect_count, max_defect_length_mm, inspector_notes, fail_reason FROM proc_fluorescent_test WHERE blade_id = ? ORDER BY attempt_no DESC LIMIT 1',
      [blade_id]
    );

    if (fluorescentRecords.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '该叶片尚未进行荧光检测，无法进行质检录入。请先完成荧光检测。'
      });
    }

    // 验证数字格式
    let weightValue = null;
    if (weight_g !== null && weight_g !== undefined && weight_g !== '') {
      weightValue = parseFloat(weight_g);
      if (isNaN(weightValue) || weightValue <= 0) {
        return res.status(400).json({
          code: 400,
          message: '重量格式不正确，必须为正数'
        });
      }
    }

    let dimensionValue = null;
    if (key_dimension_mm !== null && key_dimension_mm !== undefined && key_dimension_mm !== '') {
      dimensionValue = parseFloat(key_dimension_mm);
      if (isNaN(dimensionValue) || dimensionValue <= 0) {
        return res.status(400).json({
          code: 400,
          message: '关键尺寸格式不正确，必须为正数'
        });
      }
    }

    // 插入质检记录
    const [result_] = await pool.execute(
      `INSERT INTO qc_inspection 
       (blade_id, inspector_id, inspected_at, result, dimension_pass, surface_pass, 
        weight_g, key_dimension_mm, defect_level, ncr_no, remarks)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        blade_id,
        inspector_id,
        result,
        dimension_pass ? 1 : 0,
        surface_pass ? 1 : 0,
        weightValue,
        dimensionValue,
        defect_level || 'NONE',
        ncr_no || null,
        remarks || null
      ]
    );

    // 更新叶片状态
    const newStatus = result === 'PASS' ? 'COMPLETED' : 'SCRAPPED';
    await pool.execute(
      'UPDATE blade SET status = ? WHERE blade_id = ?',
      [newStatus, blade_id]
    );

    res.json({
      code: 200,
      message: '提交成功',
      data: {
        id: result_.insertId
      }
    });
  } catch (error) {
    console.error('提交质检报告错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;

