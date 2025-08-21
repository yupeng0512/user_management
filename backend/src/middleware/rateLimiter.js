const rateLimit = require('express-rate-limit');

// 密码修改频率限制
const passwordChangeLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时窗口
  max: 3, // 每个用户24小时内最多3次
  keyGenerator: (req) => req.user?.id || req.ip, // 使用用户ID或IP作为键
  message: {
    success: false,
    code: 429,
    message: '密码修改过于频繁，请24小时后再试',
    data: {
      retryAfter: '24小时',
      maxAttempts: 3,
      windowMs: 24 * 60 * 60 * 1000
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
  skip: (req) => {
    // 管理员可以跳过某些限制（可选）
    return req.user?.role === 'admin' && process.env.NODE_ENV === 'development';
  }
});

// 密码重置频率限制
const passwordResetLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时窗口
  max: 3, // 每个IP每小时最多3次
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    code: 429,
    message: '密码重置请求过于频繁，请1小时后再试',
    data: {
      retryAfter: '1小时',
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false // 重置请求都要计入限制
});

// 密码强度验证频率限制（防止暴力测试）
const passwordValidationLimit = rateLimit({
  windowMs: 60 * 1000, // 1分钟窗口
  max: 20, // 每个IP每分钟最多20次
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    code: 429,
    message: '密码验证请求过于频繁，请稍后再试',
    data: {
      retryAfter: '1分钟',
      maxAttempts: 20,
      windowMs: 60 * 1000
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// 通用API频率限制
const generalApiLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 100, // 每个IP每15分钟最多100次请求
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    code: 429,
    message: 'API请求过于频繁，请稍后再试',
    data: {
      retryAfter: '15分钟',
      maxAttempts: 100,
      windowMs: 15 * 60 * 1000
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 健康检查接口跳过限制
    return req.path === '/api/health';
  }
});

// 自定义频率限制器工厂
const createCustomRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.ip,
    standardHeaders: true,
    legacyHeaders: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 使用内存存储而不是MongoDB存储
  // if (options.useMongoStore) {
  //   mergedOptions.store = new MongoStore({
  //     uri: process.env.MONGO_URI || 'mongodb://admin:password123@mongodb:27017/user_management?authSource=admin',
  //     collectionName: options.collectionName || 'rate_limits',
  //     expireTimeMs: mergedOptions.windowMs,
  //   });
  // }

  return rateLimit(mergedOptions);
};

// 基于用户的频率限制器
const createUserBasedRateLimit = (options = {}) => {
  return createCustomRateLimit({
    ...options,
    keyGenerator: (req) => {
      // 优先使用用户ID，其次使用IP
      return req.user?.id || req.ip;
    },
    useMongoStore: true
  });
};

module.exports = {
  passwordChangeLimit,
  passwordResetLimit,
  passwordValidationLimit,
  generalApiLimit,
  createCustomRateLimit,
  createUserBasedRateLimit
};
