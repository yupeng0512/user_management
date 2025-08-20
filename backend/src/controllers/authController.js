const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');

// 用户登录
const login = async (req, res) => {
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

    const { username, password } = req.body;

    // 查找用户（支持用户名或邮箱登录）
    const user = await User.findByUsernameOrEmail(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      let message;
      switch (user.status) {
        case 'pending':
          message = '账户待激活，请检查邮箱激活链接';
          break;
        case 'inactive':
          message = '账户已被禁用，请联系管理员';
          break;
        default:
          message = '账户状态异常';
      }
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_STATUS_ERROR',
          message
        }
      });
    }

    // 生成令牌
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 更新用户登录时间和刷新令牌
    user.lastLoginAt = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    // 返回登录成功响应
    res.json({
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7天，以秒为单位
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '登录失败，请稍后重试'
      }
    });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    // 清除用户的刷新令牌
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 }
    });

    res.json({
      message: '登出成功'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '登出失败'
      }
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toJSON()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '获取用户信息失败'
      }
    });
  }
};

// 用户注册
const register = async (req, res) => {
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
      status: 'active' // 简化处理，直接激活
    });

    await user.save();

    // 自动登录新注册用户
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    res.status(201).json({
      token,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7天，以秒为单位
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);

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
        message: '注册失败，请稍后重试'
      }
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  register
};
