/**
 * 叶片相关路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');

/**
 * 获取操作员的最近记录
 * GET /api/blade/my-recent
 * 注意：必须在 /:bladeId 路由之前定义
 */
router.get('/my-recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.operator_id;
    const limit = parseInt(req.query.limit) || 10;
    
    // 确保 limit 是有效的整数
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }

    // MySQL2 的 LIMIT 参数需要直接拼接，不能使用参数绑定
    const [records] = await pool.execute(
      `SELECT DISTINCT b.blade_id, b.blade_sn, b.status, b.updated_at
       FROM blade b
       WHERE b.blade_id IN (
         SELECT DISTINCT blade_id FROM proc_alloy_preheat WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_stamp_form_cool WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_edge_grind WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_ceramic_coat_heat WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_second_stamp WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_trim_excess WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_die_cast WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_broach WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_hyd_remove_protect WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_qr_engrave WHERE operator_id = ?
         UNION SELECT DISTINCT blade_id FROM proc_fluorescent_test WHERE operator_id = ?
       )
       ORDER BY b.updated_at DESC
       LIMIT ${limit}`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({
      code: 200,
      data: {
        list: records || []
      }
    });
  } catch (error) {
    console.error('获取最近记录错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '获取数据失败'
    });
  }
});

/**
 * 获取所有最近记录
 * GET /api/blade/recent
 * 注意：必须在 /:bladeId 路由之前定义
 */
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // 确保 limit 是有效的整数
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }

    // MySQL2 的 LIMIT 参数需要直接拼接，不能使用参数绑定
    const [records] = await pool.execute(
      `SELECT blade_id, blade_sn, status, updated_at FROM blade ORDER BY updated_at DESC LIMIT ${limit}`
    );

    res.json({
      code: 200,
      data: {
        list: records || []
      }
    });
  } catch (error) {
    console.error('获取最近记录错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '获取数据失败'
    });
  }
});

/**
 * 创建新叶片
 * POST /api/blade
 * 注意：必须在 /:bladeId 路由之前定义
 */
router.post('/', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const { blade_sn } = req.body;
    
    // 验证必填字段
    if (!blade_sn) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：叶片序列号'
      });
    }
    
    // 检查序列号是否已存在
    const [existing] = await pool.execute(
      'SELECT blade_id FROM blade WHERE blade_sn = ?',
      [blade_sn]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '叶片序列号已存在'
      });
    }
    
    // 插入新叶片
    const [result] = await pool.execute(
      'INSERT INTO blade (blade_sn, status, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [blade_sn, 'NEW']
    );
    
    const bladeId = result.insertId;
    
    res.json({
      code: 200,
      message: '创建成功',
      data: {
        blade_id: bladeId,
        blade_sn: blade_sn,
        status: 'NEW'
      }
    });
  } catch (error) {
    console.error('创建叶片错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '创建失败'
    });
  }
});

/**
 * 获取叶片列表
 * GET /api/blade/list
 * 注意：必须在 /:bladeId 路由之前定义
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT blade_id, blade_sn, status, created_at, updated_at FROM blade WHERE 1=1';
    const params = [];

    if (status && status !== '') {
      sql += ' AND status = ?';
      params.push(status);
    }

    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;
    
    // 确保参数是有效的整数
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000 || isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }
    
    // MySQL2 的 LIMIT 和 OFFSET 需要直接拼接，不能使用参数绑定
    sql += ` ORDER BY updated_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [records] = await pool.execute(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM blade WHERE 1=1';
    const countParams = [];
    if (status && status !== '') {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.execute(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      code: 200,
      data: {
        list: records || [],
        total: total
      }
    });
  } catch (error) {
    console.error('获取列表错误:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '获取数据失败'
    });
  }
});

/**
 * 获取完整追溯信息
 * GET /api/blade/:bladeId/trace
 * 注意：必须在 /:bladeId 路由之前定义
 */
router.get('/:bladeId/trace', authenticateToken, async (req, res) => {
  try {
    const { bladeId } = req.params;
    const userId = req.user.operator_id;
    const userRole = req.user.role;

    // 获取叶片基本信息
    const [blades] = await pool.execute(
      'SELECT * FROM blade WHERE blade_id = ?',
      [bladeId]
    );

    if (blades.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '叶片不存在'
      });
    }

    const blade = blades[0];

    // 获取工序定义
    const [processDefs] = await pool.execute(
      'SELECT * FROM process_def WHERE is_qc = 0 ORDER BY process_order'
    );

    // 获取所有工序记录
    const processes = [];
    for (const def of processDefs) {
      const [records] = await pool.execute(
        `SELECT p.*, o.operator_name 
         FROM ${def.table_name} p
         LEFT JOIN operator_user o ON p.operator_id = o.operator_id
         WHERE p.blade_id = ? 
         ORDER BY p.attempt_no DESC 
         LIMIT 1`,
        [bladeId]
      );

      if (records.length > 0) {
        const record = records[0];
        
        // 权限控制：操作员只能看到自己操作的工序详情
        if (userRole === 'OPERATOR' && record.operator_id !== userId) {
          // 只返回基本信息，不返回工艺参数
          const limitedRecord = {
            id: record.id,
            blade_id: record.blade_id,
            operator_id: record.operator_id,
            operator_name: record.operator_name,
            performed_at: record.performed_at,
            is_success: record.is_success,
            attempt_no: record.attempt_no,
            fail_reason: record.fail_reason
            // 不包含工艺参数
          };
          
          processes.push({
            processCode: def.process_code,
            processName: def.process_name,
            processOrder: def.process_order,
            record: limitedRecord,
            isSuccess: record.is_success === 1
          });
        } else {
          // 质检员和管理员可以看到完整信息
          processes.push({
            processCode: def.process_code,
            processName: def.process_name,
            processOrder: def.process_order,
            record: record,
            isSuccess: record.is_success === 1
          });
        }
      } else {
        // 没有记录
        processes.push({
          processCode: def.process_code,
          processName: def.process_name,
          processOrder: def.process_order,
          record: null,
          isSuccess: false
        });
      }
    }

    // 获取质检信息
    const [qcRecords] = await pool.execute(
      `SELECT q.*, o.operator_name as inspector_name 
       FROM qc_inspection q
       LEFT JOIN operator_user o ON q.inspector_id = o.operator_id
       WHERE q.blade_id = ? 
       ORDER BY q.inspected_at DESC 
       LIMIT 1`,
      [bladeId]
    );

    const qc = qcRecords.length > 0 ? qcRecords[0] : null;

    // 获取状态信息
    const [states] = await pool.execute(
      'SELECT * FROM blade_process_state WHERE blade_id = ?',
      [bladeId]
    );

    const state = states.length > 0 ? states[0] : null;

    res.json({
      code: 200,
      data: {
        blade: blade,
        processes: processes,
        qc: qc,
        state: state
      }
    });
  } catch (error) {
    console.error('获取追溯信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * 获取叶片基本信息
 * GET /api/blade/:bladeId
 * 注意：这个路由必须放在最后，因为会匹配所有路径
 */
router.get('/:bladeId', authenticateToken, async (req, res) => {
  try {
    const { bladeId } = req.params;

    const [blades] = await pool.execute(
      'SELECT * FROM blade WHERE blade_id = ?',
      [bladeId]
    );

    if (blades.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '叶片不存在'
      });
    }

    res.json({
      code: 200,
      data: blades[0]
    });
  } catch (error) {
    console.error('获取叶片信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;
