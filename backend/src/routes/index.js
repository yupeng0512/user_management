const express = require('express');
const router = express.Router();

// 导入路由模块
const authRoutes = require('./auth');
const userRoutes = require('./users');
const passwordRoutes = require('./password');

// 注册路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/auth/password', passwordRoutes);

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '用户管理系统API服务正常运行',
    timestamp: new Date().toISOString()
  });
});

// 根路由
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎使用用户管理系统API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      password: '/api/auth/password',
      health: '/api/health'
    }
  });
});

module.exports = router;
