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
    enum: ['active', 'inactive', 'pending', 'banned'],
    default: 'pending'
  },
  avatar: {
    type: String,
    match: [/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, '请输入有效的头像URL']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guest'],
    default: 'user'
  },
  // 扩展字段
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, '昵称最多50个字符']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, '部门名称最多100个字符']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, '职位名称最多100个字符']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, '个人简介最多500个字符']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '标签最多50个字符']
  }],
  profile: {
    realName: {
      type: String,
      trim: true,
      maxlength: [50, '真实姓名最多50个字符']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    birthday: {
      type: Date
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, '地址最多200个字符']
    }
  },
  permissions: [{
    type: String,
    trim: true
  }],
  // 在线状态
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  refreshToken: {
    type: String
  },
  // 密码管理相关字段
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordChangeCount: {
    type: Number,
    default: 0
  },
  lastPasswordChangeDate: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  lastPasswordResetDate: {
    type: Date
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
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ lastActiveAt: -1 });
// 复合索引用于查询优化
userSchema.index({ status: 1, role: 1 });
userSchema.index({ department: 1, status: 1 });
userSchema.index({ isOnline: 1, lastActiveAt: -1 });
// 文本搜索索引
userSchema.index({ 
  username: 'text', 
  email: 'text', 
  nickname: 'text', 
  fullName: 'text',
  'profile.realName': 'text'
});

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

// 静态方法：高级搜索
userSchema.statics.advancedSearch = function(filters, options = {}) {
  const query = {};
  
  // 基本筛选条件
  if (filters.username) {
    query.username = { $regex: filters.username, $options: 'i' };
  }
  
  if (filters.email) {
    query.email = { $regex: filters.email, $options: 'i' };
  }
  
  if (filters.phone) {
    query.phone = filters.phone;
  }
  
  if (filters.status && Array.isArray(filters.status)) {
    query.status = { $in: filters.status };
  }
  
  if (filters.roles && Array.isArray(filters.roles)) {
    query.role = { $in: filters.roles };
  }
  
  if (filters.department) {
    query.department = { $regex: filters.department, $options: 'i' };
  }
  
  if (filters.tags && Array.isArray(filters.tags)) {
    query.tags = { $in: filters.tags };
  }
  
  // 时间范围筛选
  if (filters.createdAt) {
    query.createdAt = {};
    if (filters.createdAt.start) {
      query.createdAt.$gte = new Date(filters.createdAt.start);
    }
    if (filters.createdAt.end) {
      query.createdAt.$lte = new Date(filters.createdAt.end);
    }
  }
  
  if (filters.lastLoginAt) {
    query.lastLoginAt = {};
    if (filters.lastLoginAt.start) {
      query.lastLoginAt.$gte = new Date(filters.lastLoginAt.start);
    }
    if (filters.lastLoginAt.end) {
      query.lastLoginAt.$lte = new Date(filters.lastLoginAt.end);
    }
  }
  
  // 关键词搜索
  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }
  
  return this.find(query, null, options);
};

// 静态方法：获取统计信息
userSchema.statics.getStatistics = async function(options = {}) {
  const { period, groupBy } = options;
  
  const pipeline = [];
  
  // 按时间周期筛选
  if (period) {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    if (startDate) {
      pipeline.push({
        $match: {
          createdAt: { $gte: startDate }
        }
      });
    }
  }
  
  // 按字段分组统计
  if (groupBy) {
    pipeline.push({
      $group: {
        _id: `$${groupBy}`,
        count: { $sum: 1 }
      }
    });
    
    pipeline.push({
      $sort: { count: -1 }
    });
  } else {
    // 基础统计
    pipeline.push({
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        },
        inactive: {
          $sum: {
            $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
          }
        },
        banned: {
          $sum: {
            $cond: [{ $eq: ['$status', 'banned'] }, 1, 0]
          }
        },
        online: {
          $sum: {
            $cond: [{ $eq: ['$isOnline', true] }, 1, 0]
          }
        }
      }
    });
  }
  
  return this.aggregate(pipeline);
};

// 实例方法：更新在线状态
userSchema.methods.updateOnlineStatus = function(isOnline = true) {
  this.isOnline = isOnline;
  this.lastActiveAt = new Date();
  if (isOnline) {
    this.lastLoginAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
