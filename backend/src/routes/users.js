const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, requireOwnership } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser } = require('../middleware/validation');

// 获取用户列表 - 需要管理员权限
router.get('/', authenticate, requireAdmin, userController.getUsers);

// 创建新用户 - 需要管理员权限
router.post('/', authenticate, requireAdmin, validateCreateUser, userController.createUser);

// 获取用户详情 - 需要认证，用户只能查看自己的信息，管理员可以查看所有
router.get('/:id', authenticate, requireOwnership, userController.getUserById);

// 更新用户信息 - 需要认证，用户只能修改自己的信息，管理员可以修改所有
router.put('/:id', authenticate, requireOwnership, validateUpdateUser, userController.updateUser);

// 删除用户 - 需要管理员权限
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
