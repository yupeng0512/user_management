const { body } = require('express-validator');

// 用户登录验证
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 8 })
    .withMessage('密码至少8个字符')
];

// 用户注册验证
const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('密码长度应在8-128个字符之间'),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('真实姓名最多100个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码')
];

// 创建用户验证
const validateCreateUser = [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度应在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('密码长度应在8-128个字符之间'),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('真实姓名最多100个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码')
];

// 更新用户验证
const validateUpdateUser = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('真实姓名最多100个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('用户状态必须是 active、inactive 或 pending'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('请输入有效的头像URL')
];

module.exports = {
  validateLogin,
  validateRegister,
  validateCreateUser,
  validateUpdateUser
};
