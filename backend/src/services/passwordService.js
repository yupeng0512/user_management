const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordHistory = require('../models/PasswordHistory');

class PasswordService {
  // 密码强度验证
  static validatePasswordStrength(password, username = '', email = '') {
    const result = {
      isValid: false,
      strength: 'weak',
      score: 0,
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      },
      suggestions: []
    };

    // 检查长度
    if (password.length >= 8 && password.length <= 128) {
      result.requirements.length = true;
      result.score += 20;
    } else if (password.length < 8) {
      result.suggestions.push('密码长度至少8位');
    } else {
      result.suggestions.push('密码长度不能超过128位');
    }

    // 检查大写字母
    if (/[A-Z]/.test(password)) {
      result.requirements.uppercase = true;
      result.score += 15;
    } else {
      result.suggestions.push('请添加大写字母');
    }

    // 检查小写字母
    if (/[a-z]/.test(password)) {
      result.requirements.lowercase = true;
      result.score += 15;
    } else {
      result.suggestions.push('请添加小写字母');
    }

    // 检查数字
    if (/\d/.test(password)) {
      result.requirements.number = true;
      result.score += 15;
    } else {
      result.suggestions.push('请添加数字');
    }

    // 检查特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.requirements.special = true;
      result.score += 15;
    }

    // 额外安全检查
    const lowerPassword = password.toLowerCase();
    const lowerUsername = username.toLowerCase();
    const emailPrefix = email.split('@')[0]?.toLowerCase() || '';

    // 不能包含用户名
    if (lowerUsername && lowerPassword.includes(lowerUsername)) {
      result.score -= 20;
      result.suggestions.push('密码不能包含用户名');
    }

    // 不能包含邮箱前缀
    if (emailPrefix && lowerPassword.includes(emailPrefix)) {
      result.score -= 20;
      result.suggestions.push('密码不能包含邮箱前缀');
    }

    // 检查常见弱密码
    const commonWeakPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123', 
      'password123', '123456789', 'welcome', 'admin', 'letmein'
    ];
    
    if (commonWeakPasswords.includes(lowerPassword)) {
      result.score -= 30;
      result.suggestions.push('请避免使用常见弱密码');
    }

    // 检查重复字符
    const hasRepeatingChars = /(.)\1{2,}/.test(password);
    if (hasRepeatingChars) {
      result.score -= 10;
      result.suggestions.push('避免连续重复字符');
    }

    // 检查连续字符
    const hasSequentialChars = this.hasSequentialCharacters(password);
    if (hasSequentialChars) {
      result.score -= 10;
      result.suggestions.push('避免连续字符序列');
    }

    // 长度加分
    if (password.length >= 12) {
      result.score += 10;
    }
    if (password.length >= 16) {
      result.score += 10;
    }

    // 确保分数在0-100之间
    result.score = Math.max(0, Math.min(100, result.score));

    // 计算强度等级
    if (result.score >= 80) {
      result.strength = 'very_strong';
    } else if (result.score >= 60) {
      result.strength = 'strong';
    } else if (result.score >= 40) {
      result.strength = 'medium';
    } else if (result.score >= 20) {
      result.strength = 'weak';
    } else {
      result.strength = 'very_weak';
    }

    // 基本要求必须满足
    const basicRequirements = result.requirements.length && 
                             result.requirements.uppercase && 
                             result.requirements.lowercase && 
                             result.requirements.number;

    result.isValid = basicRequirements && result.score >= 50;

    return result;
  }

  // 检查连续字符
  static hasSequentialCharacters(password) {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiopasdfghjklzxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subSeq = sequence.substring(i, i + 3);
        if (lowerPassword.includes(subSeq)) {
          return true;
        }
      }
    }

    return false;
  }

  // 检查密码修改频率
  static async checkPasswordChangeFrequency(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { allowed: false, reason: '用户不存在' };
      }

      // 检查24小时内的修改次数
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (user.lastPasswordChangeDate && user.lastPasswordChangeDate > twentyFourHoursAgo) {
        if (user.passwordChangeCount >= 3) {
          return { 
            allowed: false, 
            reason: '24小时内密码修改次数已达上限(3次)',
            nextAllowedTime: new Date(user.lastPasswordChangeDate.getTime() + 24 * 60 * 60 * 1000)
          };
        }
      } else {
        // 重置计数器
        user.passwordChangeCount = 0;
      }

      return { allowed: true };
    } catch (error) {
      console.error('检查密码修改频率失败:', error);
      return { allowed: false, reason: '服务器错误' };
    }
  }

  // 更新密码修改记录
  static async updatePasswordChangeRecord(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 如果上次修改时间在24小时内，增加计数
      if (user.lastPasswordChangeDate && user.lastPasswordChangeDate > twentyFourHoursAgo) {
        user.passwordChangeCount += 1;
      } else {
        user.passwordChangeCount = 1;
      }

      user.lastPasswordChangeDate = now;
      user.passwordChangedAt = now;
      
      await user.save();
      return true;
    } catch (error) {
      console.error('更新密码修改记录失败:', error);
      return false;
    }
  }

  // 检查密码是否与历史密码重复
  static async checkPasswordHistory(userId, newPassword) {
    try {
      // 检查当前密码
      const user = await User.findById(userId);
      if (!user) {
        return { isValid: false, reason: '用户不存在' };
      }

      const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
      if (isSameAsCurrent) {
        return { isValid: false, reason: '新密码不能与当前密码相同' };
      }

      // 检查历史密码
      const isInHistory = await PasswordHistory.isPasswordInHistory(userId, newPassword);
      if (isInHistory) {
        return { isValid: false, reason: '新密码不能与最近5次使用的密码相同' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('检查密码历史失败:', error);
      return { isValid: false, reason: '服务器错误' };
    }
  }

  // 更新用户密码
  static async updatePassword(userId, newPassword, addToHistory = true) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 如果需要，将当前密码添加到历史记录
      if (addToHistory) {
        await PasswordHistory.addPasswordHistory(userId, user.password);
      }

      // 加密新密码
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新用户密码和相关字段
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      user.refreshToken = null; // 清空刷新令牌，强制重新登录

      await user.save();

      // 更新密码修改记录
      await this.updatePasswordChangeRecord(userId);

      return true;
    } catch (error) {
      console.error('更新密码失败:', error);
      throw error;
    }
  }

  // 生成密码强度提示文本
  static getStrengthText(strength) {
    const strengthTexts = {
      very_weak: '非常弱',
      weak: '弱',
      medium: '中等',
      strong: '强',
      very_strong: '非常强'
    };

    return strengthTexts[strength] || '未知';
  }

  // 生成密码强度颜色
  static getStrengthColor(strength) {
    const strengthColors = {
      very_weak: '#ff4d4f',
      weak: '#ff7875',
      medium: '#faad14',
      strong: '#52c41a',
      very_strong: '#389e0d'
    };

    return strengthColors[strength] || '#d9d9d9';
  }
}

module.exports = PasswordService;
