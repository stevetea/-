/**
 * 用户管理路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

/**
 * 获取所有用户列表
 * GET /api/user/list
 */
router.get('/list', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT operator_id, operator_name, role, is_active, created_at FROM operator_user ORDER BY created_at DESC'
    );

    res.json({
      code: 200,
      data: {
        list: users || []
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '获取数据失败'
    });
  }
});

/**
 * 创建新用户
 * POST /api/user
 */
router.post('/', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const { operator_name, role, password } = req.body;

    if (!operator_name || !role) {
      return res.status(400).json({
        code: 400,
        message: '缺少必填字段：工号/姓名和角色'
      });
    }

    // 检查用户是否已存在
    const [existing] = await pool.execute(
      'SELECT operator_id FROM operator_user WHERE operator_name = ?',
      [operator_name]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '用户已存在'
      });
    }

    // 验证角色
    const validRoles = ['OPERATOR', 'QC', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '无效的角色，必须是：OPERATOR、QC或ADMIN'
      });
    }

    // 默认密码
    const defaultPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 插入新用户到 operator_user 表（不包含密码）
      const [result] = await connection.execute(
        'INSERT INTO operator_user (operator_name, role, is_active, created_at) VALUES (?, ?, 1, NOW())',
        [operator_name, role]
      );

      const operatorId = result.insertId;

      // 在 auth_account 表中创建登录账号
      // 检查 auth_account 表是否存在，如果不存在则跳过（不影响用户创建）
      try {
        await connection.execute(
          'INSERT INTO auth_account (operator_id, username, password, created_at) VALUES (?, ?, ?, NOW())',
          [operatorId, operator_name, hashedPassword]
        );
      } catch (authError) {
        // 如果 auth_account 表不存在或插入失败，记录警告但不阻止用户创建
        // 因为有些系统可能不使用 auth_account 表
        console.warn('创建 auth_account 记录失败（用户仍可创建）:', authError.message);
        // 继续执行，不抛出错误
      }

      // 提交事务
      await connection.commit();

      res.json({
        code: 200,
        message: '创建成功',
        data: {
          operator_id: operatorId,
          operator_name,
          role,
          is_active: 1
        }
      });
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '创建失败'
    });
  }
});

/**
 * 更新用户信息
 * PUT /api/user/:userId
 */
router.put('/:userId', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { operator_name, role, is_active, password } = req.body;

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT * FROM operator_user WHERE operator_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 构建更新语句
    const updates = [];
    const params = [];

    if (operator_name !== undefined) {
      // 检查新名称是否与其他用户冲突
      const [existing] = await pool.execute(
        'SELECT operator_id FROM operator_user WHERE operator_name = ? AND operator_id != ?',
        [operator_name, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在'
        });
      }
      updates.push('operator_name = ?');
      params.push(operator_name);
    }

    if (role !== undefined) {
      const validRoles = ['OPERATOR', 'QC', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          code: 400,
          message: '无效的角色'
        });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      // 密码存储在 auth_account 表中，需要单独更新
      await pool.execute(
        'UPDATE auth_account SET password = ? WHERE operator_id = ?',
        [hashedPassword, userId]
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有要更新的字段'
      });
    }

    params.push(userId);

    await pool.execute(
      `UPDATE operator_user SET ${updates.join(', ')} WHERE operator_id = ?`,
      params
    );

    res.json({
      code: 200,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '更新失败'
    });
  }
});

/**
 * 删除用户（软删除，设置为非激活）
 * DELETE /api/user/:userId
 */
router.delete('/:userId', authenticateToken, checkRole('ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;

    // 检查用户是否存在
    const [users] = await pool.execute(
      'SELECT * FROM operator_user WHERE operator_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 软删除：设置为非激活
    await pool.execute(
      'UPDATE operator_user SET is_active = 0 WHERE operator_id = ?',
      [userId]
    );

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '删除失败'
    });
  }
});

module.exports = router;

