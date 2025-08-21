const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 创建Express应用
const app = express();

// 连接数据库
connectDB();

// 信任代理（如果部署在代理后面）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS配置
app.use(cors({
  origin: function(origin, callback) {
    // 允许的源列表
    const allowedOrigins = config.CORS_ORIGIN.split(',');
    
    // 允许没有 origin 的请求（如 Postman）
    if (!origin) return callback(null, true);
    
    // 检查请求的源是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS 阻止来自 ${origin} 的请求，允许的源: ${allowedOrigins.join(', ')}`);
      callback(new Error('不允许的源'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求日志
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 限流配置 - 仅对敏感操作应用
const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15分钟
  max: config.RATE_LIMIT_MAX_REQUESTS, // 限制每个IP最多请求次数
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 仅对敏感路径应用限流（登录、注册等）
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/logout', authLimiter);

// 开发环境中，不对其他API应用限流
// 生产环境可以根据需要添加更多限流规则

// 解析JSON请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API路由
app.use('/api', routes);

// 根路径重定向到API
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const PORT = config.PORT;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 用户管理系统后端服务已启动
📍 环境: ${config.NODE_ENV}
🌐 端口: ${PORT}
📡 API地址: http://localhost:${PORT}/api
🔗 健康检查: http://localhost:${PORT}/api/health
  `);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// 处理未捕获的Promise拒绝
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
