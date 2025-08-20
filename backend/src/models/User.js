const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必填项'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [50, '用户名最多50个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
  },
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [8, '密码至少8个字符'],
    maxlength: [128, '密码最多128个字符']
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, '真实姓名最多100个字符']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  avatar: {
    type: String,
    match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, '请输入有效的头像URL']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLoginAt: {
    type: Date
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    }
  }
});

// 创建索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 静态方法：根据用户名或邮箱查找用户
userSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  });
};

module.exports = mongoose.model('User', userSchema);
