/**
 * 认证路由
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { code, operatorName, password } = req.body;

    if (!operatorName) {
      return res.status(400).json({
        code: 400,
        message: '请输入工号或姓名'
      });
    }

    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM operator_user WHERE operator_name = ? AND is_active = 1',
      [operatorName]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已停用'
      });
    }

    const user = users[0];

    // 查询用户的密码（从 auth_account 表）
    let hashedPassword = null;
    try {
      const [authAccounts] = await pool.execute(
        'SELECT password FROM auth_account WHERE operator_id = ?',
        [user.operator_id]
      );
      
      if (authAccounts.length > 0) {
        hashedPassword = authAccounts[0].password;
      }
    } catch (error) {
      // 如果 auth_account 表不存在或查询失败，使用默认密码
      console.warn('查询 auth_account 失败，使用默认密码验证:', error.message);
    }

    // 验证密码
    if (!password) {
      return res.status(400).json({
        code: 400,
        message: '请输入密码'
      });
    }

    // 如果有哈希密码，使用 bcrypt 验证；否则使用默认密码
    if (hashedPassword) {
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          code: 401,
          message: '密码错误'
        });
      }
    } else {
      const defaultPassword = '123456';
      if (password !== defaultPassword) {
        return res.status(401).json({
          code: 401,
          message: '密码错误，默认密码为：123456'
        });
      }
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        operator_id: user.operator_id,
        operator_name: user.operator_name,
        role: user.role
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // 返回用户信息和token
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: token,
        userInfo: {
          operator_id: user.operator_id,
          operator_name: user.operator_name,
          role: user.role,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;

