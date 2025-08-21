const User = require('../models/User');
const { validationResult } = require('express-validator');

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      username, 
      email, 
      status, 
      role, 
      department,
      keyword,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
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
    if (role) {
      query.role = role;
    }
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // 分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // 排序参数
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    // 执行查询
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      code: 200,
      message: '查询成功',
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      timestamp: new Date().toISOString()
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
    const { fields, include } = req.query;

    // 构建查询
    let query = User.findById(id);

    // 选择特定字段
    if (fields) {
      const selectedFields = fields.split(',').join(' ');
      query = query.select(selectedFields);
    } else {
      query = query.select('-password -refreshToken');
    }

    const user = await query.exec();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        data: {
          error: 'user_not_found',
          userId: id,
          suggestion: '请检查用户ID是否正确'
        },
        timestamp: new Date().toISOString()
      });
    }

    // 处理关联数据包含
    let userData = user.toJSON();
    
    if (include) {
      const includeFields = include.split(',');
      
      if (includeFields.includes('roles')) {
        userData.roleDetails = {
          name: user.role,
          permissions: user.permissions || []
        };
      }
    }

    res.json({
      success: true,
      code: 200,
      message: '查询成功',
      data: { user: userData },
      timestamp: new Date().toISOString()
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

// 高级搜索用户
const searchUsers = async (req, res) => {
  try {
    const { filters = {}, sort = {}, pagination = {} } = req.body;
    
    // 分页参数
    const page = Math.max(1, parseInt(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 20));
    const skip = (page - 1) * limit;
    
    // 排序参数
    const sortOption = {};
    if (sort.field) {
      sortOption[sort.field] = sort.order === 'asc' ? 1 : -1;
    } else {
      sortOption.createdAt = -1;
    }
    
    // 执行高级搜索
    const [users, total] = await Promise.all([
      User.advancedSearch(filters, { 
        skip, 
        limit, 
        sort: sortOption 
      }).select('-password -refreshToken'),
      User.advancedSearch(filters).countDocuments()
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      code: 200,
      message: '搜索成功',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '搜索用户失败'
      }
    });
  }
};

// 获取用户统计信息
const getUserStatistics = async (req, res) => {
  try {
    const { period, groupBy } = req.query;
    
    const [basicStats, groupedStats] = await Promise.all([
      User.getStatistics({ period }),
      groupBy ? User.getStatistics({ period, groupBy }) : Promise.resolve([])
    ]);
    
    // 格式化基础统计数据
    const stats = basicStats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      banned: 0,
      online: 0
    };
    
    // 获取今日、本周、本月新增用户
    const [todayStats, weekStats, monthStats] = await Promise.all([
      User.getStatistics({ period: 'day' }),
      User.getStatistics({ period: 'week' }),
      User.getStatistics({ period: 'month' })
    ]);
    
    // 按角色和部门分组统计
    const [roleStats, deptStats] = await Promise.all([
      User.getStatistics({ groupBy: 'role' }),
      User.getStatistics({ groupBy: 'department' })
    ]);
    
    const statistics = {
      totalUsers: stats.total,
      activeUsers: stats.active,
      inactiveUsers: stats.inactive,
      pendingUsers: stats.pending,
      bannedUsers: stats.banned,
      onlineUsers: stats.online,
      newUsersToday: todayStats[0]?.total || 0,
      newUsersThisWeek: weekStats[0]?.total || 0,
      newUsersThisMonth: monthStats[0]?.total || 0,
      byRole: roleStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byDepartment: deptStats.reduce((acc, item) => {
        if (item._id) {
          acc[item._id] = item.count;
        }
        return acc;
      }, {})
    };
    
    if (groupBy && groupedStats.length > 0) {
      statistics[`by${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`] = 
        groupedStats.reduce((acc, item) => {
          if (item._id) {
            acc[item._id] = item.count;
          }
          return acc;
        }, {});
    }
    
    res.json({
      success: true,
      code: 200,
      message: '查询成功',
      data: { statistics },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取统计信息失败'
      }
    });
  }
};

// 获取在线用户列表
const getOnlineUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, department } = req.query;
    
    // 构建查询条件
    const query = { isOnline: true };
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    // 分页参数
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    
    // 执行查询
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ lastActiveAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      code: 200,
      message: '查询成功',
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取在线用户失败'
      }
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  getUserStatistics,
  getOnlineUsers
};
