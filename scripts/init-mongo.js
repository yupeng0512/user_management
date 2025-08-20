// MongoDB 初始化脚本
// 创建用户管理数据库和初始管理员用户

// 切换到用户管理数据库
db = db.getSiblingDB('user_management');

// 创建集合（可选，MongoDB会在插入数据时自动创建）
db.createCollection('users');

// 插入初始管理员用户
// 密码: admin123 (已使用bcryptjs加密)
db.users.insertOne({
  username: 'admin',
  email: 'admin@example.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.KPSNF6jmW', // admin123
  fullName: '系统管理员',
  phone: '13800138000',
  status: 'active',
  role: 'admin',
  avatar: null,
  lastLoginAt: null,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 创建索引
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "createdAt": -1 });

print('用户管理数据库初始化完成！');
print('默认管理员账户：');
print('  用户名: admin');
print('  密码: admin123');
print('  邮箱: admin@example.com');
