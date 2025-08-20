const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../../config');

// JWT令牌生成
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN
  });
};

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '访问令牌缺失或格式错误'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      if (decoded.type === 'refresh') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '无效的令牌类型'
          }
        });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: '账户未激活'
          }
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: '访问令牌已过期'
          }
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '无效的访问令牌'
          }
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });
  }
};

// 管理员权限检查中间件
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PRIVILEGES',
        message: '权限不足'
      }
    });
  }
  next();
};

// 用户权限检查中间件（只能访问自己的资源）
const requireOwnership = (req, res, next) => {
  const requestedUserId = req.params.id;
  const currentUserId = req.user._id.toString();
  
  // 管理员可以访问任何用户资源
  if (req.user.role === 'admin') {
    return next();
  }
  
  // 普通用户只能访问自己的资源
  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: '无权访问该资源'
      }
    });
  }
  
  next();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticate,
  requireAdmin,
  requireOwnership
};
