const { body } = require('express-validator');

// 密码修改验证规则
const validatePasswordChange = [
  body('oldPassword')
    .notEmpty()
    .withMessage('当前密码是必填项')
    .isLength({ min: 1 })
    .withMessage('当前密码不能为空'),

  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('新密码长度必须在8-128个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含大写字母、小写字母和数字'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('确认密码是必填项')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不一致');
      }
      return true;
    })
];

// 密码重置验证规则
const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('邮箱地址过长')
];

// 密码重置确认验证规则
const validatePasswordResetConfirm = [
  body('token')
    .notEmpty()
    .withMessage('重置令牌是必填项')
    .isLength({ min: 32, max: 128 })
    .withMessage('重置令牌格式不正确'),

  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('新密码长度必须在8-128个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('新密码必须包含大写字母、小写字母和数字'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('确认密码是必填项')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不一致');
      }
      return true;
    })
];

// 密码强度验证规则
const validatePasswordStrength = [
  body('password')
    .notEmpty()
    .withMessage('密码是必填项')
    .isLength({ min: 1, max: 128 })
    .withMessage('密码长度不能超过128个字符')
];

module.exports = {
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validatePasswordStrength
};
