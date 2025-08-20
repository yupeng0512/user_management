const config = require('../../config');

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error('Error:', err);

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: message
      }
    };
    return res.status(400).json(error);
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} 已存在`;
    error = {
      success: false,
      error: {
        code: 'DUPLICATE_FIELD',
        message
      }
    };
    return res.status(409).json(error);
  }

  // Mongoose CastError (无效的ObjectId)
  if (err.name === 'CastError') {
    error = {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: '无效的资源ID'
      }
    };
    return res.status(400).json(error);
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的访问令牌'
      }
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '访问令牌已过期'
      }
    };
    return res.status(401).json(error);
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'development' ? message : '服务器内部错误'
    }
  };

  // 在开发环境中包含堆栈跟踪
  if (config.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 错误处理中间件
const notFoundHandler = (req, res, next) => {
  const error = new Error(`路由 ${req.originalUrl} 不存在`);
  error.statusCode = 404;
  next(error);
};

// 异步错误捕获包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
