/**
 * 叶片质量追溯系统 - 后端API
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('  查询参数:', req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  请求体:', req.body);
  }
  next();
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blade', require('./routes/blade'));
app.use('/api/qc', require('./routes/qc'));
app.use('/api/process', require('./routes/process'));
app.use('/api/user', require('./routes/user'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/yolo', require('./routes/yolo'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 API文档: http://localhost:${PORT}/health`);
});

module.exports = app;

