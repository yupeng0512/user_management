const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
    expires: 0 // MongoDB自动删除过期文档
  },
  used: {
    type: Boolean,
    default: false
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// 创建索引
passwordResetTokenSchema.index({ token: 1 });
passwordResetTokenSchema.index({ userId: 1, used: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });

// 静态方法：生成重置令牌
passwordResetTokenSchema.statics.generateResetToken = async function(userId, ipAddress, userAgent) {
  try {
    // 先删除该用户所有未使用的重置令牌
    await this.deleteMany({ 
      userId, 
      used: false 
    });

    // 生成随机令牌
    const token = crypto.randomBytes(32).toString('hex');
    
    // 创建新的重置令牌记录
    const resetToken = await this.create({
      userId,
      token,
      ipAddress,
      userAgent
    });

    return resetToken.token;
  } catch (error) {
    console.error('生成重置令牌失败:', error);
    return null;
  }
};

// 静态方法：验证重置令牌
passwordResetTokenSchema.statics.validateResetToken = async function(token) {
  try {
    const resetToken = await this.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'email username');

    return resetToken;
  } catch (error) {
    console.error('验证重置令牌失败:', error);
    return null;
  }
};

// 静态方法：使用重置令牌
passwordResetTokenSchema.statics.useResetToken = async function(token) {
  try {
    const resetToken = await this.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return null;
    }

    // 标记令牌为已使用
    resetToken.used = true;
    await resetToken.save();

    return resetToken;
  } catch (error) {
    console.error('使用重置令牌失败:', error);
    return null;
  }
};

// 静态方法：清理过期令牌
passwordResetTokenSchema.statics.cleanExpiredTokens = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 清理24小时前已使用的令牌
      ]
    });
    console.log(`清理了 ${result.deletedCount} 个过期的重置令牌`);
    return result.deletedCount;
  } catch (error) {
    console.error('清理重置令牌失败:', error);
    return 0;
  }
};

// 静态方法：检查用户重置频率
passwordResetTokenSchema.statics.checkResetFrequency = async function(userId) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.countDocuments({
      userId,
      createdAt: { $gt: oneHourAgo }
    });

    return count < 3; // 1小时内最多3次
  } catch (error) {
    console.error('检查重置频率失败:', error);
    return false;
  }
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
