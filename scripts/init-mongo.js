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
  nickname: '管理员',
  phone: '13800138000',
  status: 'active',
  role: 'admin',
  department: '系统部',
  position: '系统管理员',
  bio: '用户管理系统管理员',
  tags: ['系统', '管理'],
  profile: {
    realName: '系统管理员',
    gender: 'other'
  },
  permissions: ['read', 'write', 'delete', 'admin'],
  isOnline: false,
  lastActiveAt: new Date(),
  avatar: null,
  lastLoginAt: null,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 插入示例测试用户
const sampleUsers = [
  {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.KPSNF6jmW', // admin123
    fullName: '测试用户一',
    nickname: '用户一',
    phone: '13800138001',
    status: 'active',
    role: 'user',
    department: '技术部',
    position: '前端工程师',
    bio: '负责前端开发工作',
    tags: ['前端', '技术'],
    profile: {
      realName: '张三',
      gender: 'male',
      birthday: new Date('1990-01-01'),
      address: '北京市朝阳区'
    },
    permissions: ['read', 'write'],
    isOnline: true,
    lastActiveAt: new Date(),
    lastLoginAt: new Date(),
    avatar: null,
    refreshToken: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7天前
    updatedAt: new Date()
  },
  {
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.KPSNF6jmW', // admin123
    fullName: '测试用户二',
    nickname: '用户二',
    phone: '13800138002',
    status: 'active',
    role: 'user',
    department: '产品部',
    position: '产品经理',
    bio: '负责产品设计工作',
    tags: ['产品', '设计'],
    profile: {
      realName: '李四',
      gender: 'female',
      birthday: new Date('1992-06-15'),
      address: '上海市浦东新区'
    },
    permissions: ['read', 'write'],
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1天前
    avatar: null,
    refreshToken: null,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15天前
    updatedAt: new Date()
  },
  {
    username: 'testuser3',
    email: 'testuser3@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.KPSNF6jmW', // admin123
    fullName: '测试用户三',
    nickname: '用户三',
    phone: '13800138003',
    status: 'inactive',
    role: 'user',
    department: '运营部',
    position: '运营专员',
    bio: '负责产品运营工作',
    tags: ['运营', '推广'],
    profile: {
      realName: '王五',
      gender: 'male',
      birthday: new Date('1988-12-30'),
      address: '广州市天河区'
    },
    permissions: ['read'],
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    avatar: null,
    refreshToken: null,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60天前
    updatedAt: new Date()
  }
];

db.users.insertMany(sampleUsers);

// 创建索引
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "status": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "department": 1 });
db.users.createIndex({ "isOnline": 1 });
db.users.createIndex({ "createdAt": -1 });
db.users.createIndex({ "lastLoginAt": -1 });
db.users.createIndex({ "lastActiveAt": -1 });

// 复合索引
db.users.createIndex({ "status": 1, "role": 1 });
db.users.createIndex({ "department": 1, "status": 1 });
db.users.createIndex({ "isOnline": 1, "lastActiveAt": -1 });

// 文本搜索索引
db.users.createIndex({ 
  "username": "text", 
  "email": "text", 
  "nickname": "text", 
  "fullName": "text",
  "profile.realName": "text"
});

print('用户管理数据库初始化完成！');
print('创建了以下用户：');
print('1. 管理员账户：');
print('   用户名: admin');
print('   密码: admin123');
print('   邮箱: admin@example.com');
print('2. 测试用户账户：');
print('   用户名: testuser1, testuser2, testuser3');
print('   密码: admin123');
print('数据库索引已创建完成！');
print('支持用户查询功能的所有字段索引！');
