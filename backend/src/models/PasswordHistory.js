const mongoose = require('mongoose');

const passwordHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 31536000 // 自动过期时间：365天（秒）
  }
}, {
  timestamps: true
});

// 创建复合索引
passwordHistorySchema.index({ userId: 1, createdAt: -1 });

// 静态方法：添加密码历史记录
passwordHistorySchema.statics.addPasswordHistory = async function(userId, passwordHash) {
  try {
    // 添加新的密码历史记录
    await this.create({
      userId,
      passwordHash
    });

    // 只保留最近5次的密码历史
    const histories = await this.find({ userId })
      .sort({ createdAt: -1 })
      .skip(5);

    if (histories.length > 0) {
      const idsToDelete = histories.map(h => h._id);
      await this.deleteMany({ _id: { $in: idsToDelete } });
    }

    return true;
  } catch (error) {
    console.error('添加密码历史记录失败:', error);
    return false;
  }
};

// 静态方法：检查密码是否在历史记录中
passwordHistorySchema.statics.isPasswordInHistory = async function(userId, passwordHash) {
  try {
    const bcrypt = require('bcryptjs');
    
    // 获取用户最近5次的密码历史
    const histories = await this.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 检查新密码是否与历史密码相同
    for (const history of histories) {
      const isMatch = await bcrypt.compare(passwordHash, history.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('检查密码历史失败:', error);
    return false;
  }
};

// 静态方法：清理过期的密码历史记录
passwordHistorySchema.statics.cleanExpiredHistories = async function() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log(`清理了 ${result.deletedCount} 条过期的密码历史记录`);
    return result.deletedCount;
  } catch (error) {
    console.error('清理密码历史记录失败:', error);
    return 0;
  }
};

module.exports = mongoose.model('PasswordHistory', passwordHistorySchema);
