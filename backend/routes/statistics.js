/**
 * 数据统计路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * 获取统计数据
 * GET /api/statistics
 */
router.get('/', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    // 叶片统计
    const [bladeStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'IN_PROCESS' THEN 1 ELSE 0 END) as in_process_count,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked_count,
        SUM(CASE WHEN status = 'READY_FOR_QC' THEN 1 ELSE 0 END) as ready_for_qc_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'SCRAPPED' THEN 1 ELSE 0 END) as scrapped_count
      FROM blade`
    );

    // 用户统计
    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'OPERATOR' THEN 1 ELSE 0 END) as operator_count,
        SUM(CASE WHEN role = 'QC' THEN 1 ELSE 0 END) as qc_count,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM operator_user`
    );

    // 工序统计（最近30天）
    const [processStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN is_success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN is_success = 0 THEN 1 ELSE 0 END) as fail_count
      FROM (
        SELECT is_success FROM proc_alloy_preheat WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_stamp_form_cool WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_edge_grind WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_ceramic_coat_heat WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_second_stamp WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_trim_excess WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_die_cast WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_broach WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_hyd_remove_protect WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_qr_engrave WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT is_success FROM proc_fluorescent_test WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) as all_processes`
    );

    // 质检统计
    const [qcStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as fail_count
      FROM qc_inspection`
    );

    // 最近7天的叶片创建数量
    const [dailyBladeStats] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM blade
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    res.json({
      code: 200,
      data: {
        blade: bladeStats[0] || {},
        user: userStats[0] || {},
        process: processStats[0] || {},
        qc: qcStats[0] || {},
        dailyBlade: dailyBladeStats || []
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '获取数据失败'
    });
  }
});

module.exports = router;

