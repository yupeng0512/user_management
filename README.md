# 用户管理系统

一个基于 Node.js + Express + MongoDB + React + Ant Design 的现代化用户管理系统。

## 功能特性

### 核心功能
- 🔐 用户注册和登录认证
- 👤 用户信息管理（查看、编辑、删除）
- 📋 用户列表管理（分页、筛选、搜索）
- 🛡️ 基于角色的权限控制（管理员/普通用户）
- 📊 系统仪表盘和统计信息

### 技术特性
- 🚀 RESTful API 设计
- 🔒 JWT 令牌认证
- 📱 响应式设计，支持移动端
- 🐳 Docker 容器化部署
- 🔍 数据验证和错误处理
- 📈 请求限流和安全防护

## 技术栈

### 后端
- **Node.js** - JavaScript 运行时
- **Express.js** - Web 应用框架
- **MongoDB** - NoSQL 数据库
- **Mongoose** - MongoDB 对象建模工具
- **JWT** - JSON Web Token 认证
- **bcryptjs** - 密码加密
- **express-validator** - 数据验证
- **helmet** - 安全中间件
- **express-rate-limit** - 请求限流

### 前端
- **React** - 用户界面库
- **Ant Design** - UI 组件库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **dayjs** - 日期处理库

### 开发工具
- **Docker & Docker Compose** - 容器化部署
- **nodemon** - 开发时自动重启
- **ESLint** - 代码规范检查

## 快速开始

### 环境要求
- Node.js 18+
- MongoDB 7.0+
- Docker (可选)

### 使用 Docker 启动（推荐）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd user_management
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **访问应用**
   - 前端应用: http://localhost:3000
   - 后端API: http://localhost:3001/api
   - API健康检查: http://localhost:3001/api/health

4. **默认管理员账户**
   - 用户名: `admin`
   - 密码: `admin123`
   - 邮箱: `admin@example.com`

### 手动启动

1. **启动 MongoDB**
   ```bash
   # 使用 Docker 启动 MongoDB
   docker run -d --name mongodb -p 27017:27017 mongo:7.0
   ```

2. **启动后端服务**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **启动前端应用**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## API 文档

### 认证接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 公开 |
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/logout` | 用户登出 | 认证 |
| GET | `/api/auth/me` | 获取当前用户信息 | 认证 |

### 用户管理接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | 管理员 |
| POST | `/api/users` | 创建新用户 | 管理员 |
| GET | `/api/users/:id` | 获取用户详情 | 认证 |
| PUT | `/api/users/:id` | 更新用户信息 | 认证 |
| DELETE | `/api/users/:id` | 删除用户 | 管理员 |

### 请求示例

#### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### 获取用户列表
```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## 项目结构

```
user_management/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── middleware/     # 中间件
│   │   ├── config/         # 配置文件
│   │   └── app.js          # 应用入口
│   ├── package.json
│   └── Dockerfile
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   ├── utils/         # 工具函数
│   │   └── App.js         # 应用入口
│   ├── package.json
│   └── Dockerfile
├── scripts/               # 脚本文件
│   └── init-mongo.js      # MongoDB初始化脚本
├── docker-compose.yml     # Docker编排文件
└── README.md             # 项目文档
```

## 环境变量

### 后端环境变量

在 `backend/` 目录创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/user_management

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 前端环境变量

在 `frontend/` 目录创建 `.env` 文件：

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## 开发指南

### 后端开发

1. **添加新的API接口**
   - 在 `controllers/` 中添加控制器逻辑
   - 在 `routes/` 中定义路由
   - 在 `middleware/validation.js` 中添加数据验证规则

2. **数据模型**
   - 在 `models/` 中定义Mongoose模型
   - 添加必要的索引和验证规则

3. **中间件**
   - 认证中间件: `middleware/auth.js`
   - 错误处理: `middleware/errorHandler.js`
   - 数据验证: `middleware/validation.js`

### 前端开发

1. **添加新页面**
   - 在 `pages/` 中创建页面组件
   - 在 `App.js` 中添加路由配置

2. **API服务**
   - 在 `services/` 中封装API调用
   - 使用统一的错误处理和认证拦截器

3. **组件开发**
   - 使用Ant Design组件库
   - 遵循React最佳实践
   - 实现响应式设计

## 部署

### 生产环境部署

1. **环境配置**
   ```bash
   # 修改环境变量
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   MONGODB_URI=your-production-mongodb-uri
   ```

2. **构建应用**
   ```bash
   # 构建前端
   cd frontend
   npm run build
   
   # 构建后端Docker镜像
   cd ../backend
   docker build -t user-management-backend .
   ```

3. **使用Docker Compose**
   ```bash
   # 生产环境启动
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 安全考虑

- 🔐 密码使用 bcryptjs 加密存储
- 🛡️ JWT 令牌认证和授权
- 🚫 请求限流防止暴力攻击
- 🔒 CORS 跨域访问控制
- 🛡️ Helmet 安全头设置
- ✅ 输入数据验证和清理
- 🔍 SQL注入和XSS防护

## 测试

```bash
# 运行后端测试
cd backend
npm test

# 运行前端测试
cd frontend
npm test
```

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您在使用过程中遇到问题，请：

1. 查看 [Issues](../../issues) 页面寻找解决方案
2. 创建新的 Issue 描述问题
3. 联系项目维护者

---

**用户管理系统** - 现代化的用户管理解决方案 🚀
