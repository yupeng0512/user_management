const User = require('../models/User');
const { validationResult } = require('express-validator');

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, username, email, status } = req.query;
    
    // 构建查询条件
    const query = {};
    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // 执行查询
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取用户列表失败'
      }
    });
  }
};

// 获取单个用户详情
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: '无效的用户ID'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取用户信息失败'
      }
    });
  }
};

// 创建新用户
const createUser = async (req, res) => {
  try {
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details: errors.array()
        }
      });
    }

    const { username, email, password, fullName, phone } = req.body;

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      const field = existingUser.username === username ? '用户名' : '邮箱';
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USER',
          message: `${field}已存在`
        }
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password,
      fullName,
      phone,
      status: 'active' // 直接设为激活状态，实际项目中可能需要邮箱验证
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '创建用户失败'
      }
    });
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // 不允许更新的字段
    delete updateData.password;
    delete updateData.username;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // 如果更新邮箱，检查是否已存在
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: '邮箱已存在'
          }
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: '无效的用户ID'
        }
      });
    }

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '数据验证失败',
          details
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新用户信息失败'
      }
    });
  }
};

// 删除用户（软删除）
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: '无效的用户ID'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '删除用户失败'
      }
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
