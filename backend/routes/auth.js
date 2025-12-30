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

    // 验证密码
    // 默认密码为 123456，如果数据库中有密码字段，可以使用 bcrypt 验证
    // 这里为了简化，使用固定默认密码
    const defaultPassword = '123456';
    
    if (password && password !== defaultPassword) {
      return res.status(401).json({
        code: 401,
        message: '密码错误，默认密码为：123456'
      });
    }
    
    // 如果没有提供密码，也要求输入（可选，根据需求调整）
    // if (!password) {
    //   return res.status(400).json({
    //     code: 400,
    //     message: '请输入密码'
    //   });
    // }

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

