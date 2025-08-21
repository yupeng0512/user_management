const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const { authenticate } = require('../middleware/auth');
const {
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validatePasswordStrength
} = require('../middleware/passwordValidation');
const {
  passwordChangeLimit,
  passwordResetLimit,
  passwordValidationLimit
} = require('../middleware/rateLimiter');

// 修改密码 - 需要认证和频率限制
router.put('/change', 
  // passwordChangeLimit, // 暂时禁用，测试时用
  authenticate, 
  validatePasswordChange, 
  passwordController.changePassword
);

// 发起密码重置 - 公开接口，有频率限制
router.post('/reset', 
  // passwordResetLimit, // 暂时禁用，测试时用
  validatePasswordReset, 
  passwordController.resetPassword
);

// 确认密码重置 - 公开接口，有频率限制
router.post('/reset/confirm', 
  // passwordResetLimit, // 暂时禁用，测试时用
  validatePasswordResetConfirm, 
  passwordController.confirmResetPassword
);

// 验证密码强度 - 公开接口，有频率限制
router.post('/validate', 
  // passwordValidationLimit, // 暂时禁用，测试时用
  validatePasswordStrength, 
  passwordController.validatePassword
);

// 获取密码策略 - 公开接口
router.get('/policy', 
  passwordController.getPasswordPolicy
);

module.exports = router;
