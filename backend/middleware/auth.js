/**
 * 身份验证中间件
 */

const jwt = require('jsonwebtoken');

/**
 * JWT 验证中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未提供访问令牌'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(401).json({
        code: 401,
        message: '令牌无效或已过期'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * 角色权限检查中间件
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未认证'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  checkRole
};

