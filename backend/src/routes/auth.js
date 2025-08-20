const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');

// 用户登录
router.post('/login', validateLogin, authController.login);

// 用户注册
router.post('/register', validateRegister, authController.register);

// 用户登出
router.post('/logout', authenticate, authController.logout);

// 获取当前用户信息
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
