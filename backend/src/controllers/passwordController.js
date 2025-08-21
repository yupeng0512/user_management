const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const PasswordService = require('../services/passwordService');
const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

// 修改密码
const changePassword = async (req, res) => {
  try {
    // 检查验证错误
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        data: {
          errors: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // 确认新密码一致性
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '新密码和确认密码不一致',
        timestamp: new Date().toISOString()
      });
    }

    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '当前密码错误',
        timestamp: new Date().toISOString()
      });
    }

    // 检查密码修改频率
    const frequencyCheck = await PasswordService.checkPasswordChangeFrequency(userId);
    if (!frequencyCheck.allowed) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: frequencyCheck.reason,
        data: {
          nextAllowedTime: frequencyCheck.nextAllowedTime
        },
        timestamp: new Date().toISOString()
      });
    }

    // 验证新密码强度
    const strengthValidation = PasswordService.validatePasswordStrength(
      newPassword, 
      user.username, 
      user.email
    );

    if (!strengthValidation.isValid) {
      return res.status(422).json({
        success: false,
        code: 422,
        message: '密码强度不符合要求',
        data: {
          strength: strengthValidation.strength,
          score: strengthValidation.score,
          requirements: strengthValidation.requirements,
          suggestions: strengthValidation.suggestions
        },
        timestamp: new Date().toISOString()
      });
    }

    // 检查密码历史
    const historyCheck = await PasswordService.checkPasswordHistory(userId, newPassword);
    if (!historyCheck.isValid) {
      return res.status(422).json({
        success: false,
        code: 422,
        message: historyCheck.reason,
        timestamp: new Date().toISOString()
      });
    }

    // 更新密码
    await PasswordService.updatePassword(userId, newPassword, true);

    // 获取客户端IP
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // 发送密码修改通知邮件
    try {
      // await emailService.sendPasswordChangeNotification(user.email, user.username, ipAddress);
      console.log('邮件通知已禁用（测试模式）');
    } catch (emailError) {
      console.error('发送密码修改通知邮件失败:', emailError);
    }

    res.json({
      success: true,
      code: 200,
      message: '密码修改成功',
      data: {
        changedAt: new Date().toISOString(),
        forceLogout: true,
        strengthScore: strengthValidation.score
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

// 发起密码重置
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        data: {
          errors: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // 出于安全考虑，不暴露用户是否存在
      return res.json({
        success: true,
        code: 200,
        message: '如果该邮箱地址存在，重置邮件已发送',
        data: {
          email: email,
          expiresIn: 1800,
          sentAt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }

    // 检查重置频率
    const canReset = await PasswordResetToken.checkResetFrequency(user._id);
    if (!canReset) {
      return res.status(429).json({
        success: false,
        code: 429,
        message: '重置请求过于频繁，请1小时后再试',
        timestamp: new Date().toISOString()
      });
    }

    // 获取客户端信息
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    // 生成重置令牌
    const resetToken = await PasswordResetToken.generateResetToken(
      user._id, 
      ipAddress, 
      userAgent
    );

    if (!resetToken) {
      return res.status(500).json({
        success: false,
        code: 500,
        message: '生成重置令牌失败',
        timestamp: new Date().toISOString()
      });
    }

    // 发送重置邮件
    // const emailResult = await emailService.sendPasswordResetEmail(
    //   user.email, 
    //   resetToken, 
    //   user.username
    // );
    
    // 测试模式：模拟邮件发送成功
    const emailResult = {
      success: true,
      messageId: 'test-message-id',
      previewUrl: `http://localhost:3000/reset-password?token=${resetToken}`
    };

    // if (!emailResult.success) {
    //   return res.status(500).json({
    //     success: false,
    //     code: 500,
    //     message: '发送重置邮件失败',
    //     data: {
    //       error: emailResult.error
    //     },
    //     timestamp: new Date().toISOString()
    //   });
    // }

    res.json({
      success: true,
      code: 200,
      message: '重置邮件已发送',
      data: {
        email: user.email,
        expiresIn: 1800, // 30分钟
        sentAt: new Date().toISOString(),
        previewUrl: emailResult.previewUrl // 开发环境下的预览链接
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('密码重置失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

// 确认密码重置
const confirmResetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        data: {
          errors: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { token, newPassword, confirmPassword } = req.body;

    // 确认新密码一致性
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '新密码和确认密码不一致',
        timestamp: new Date().toISOString()
      });
    }

    // 验证重置令牌
    const resetToken = await PasswordResetToken.validateResetToken(token);
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '重置令牌无效或已过期',
        timestamp: new Date().toISOString()
      });
    }

    const user = resetToken.userId;
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        timestamp: new Date().toISOString()
      });
    }

    // 验证新密码强度
    const strengthValidation = PasswordService.validatePasswordStrength(
      newPassword, 
      user.username, 
      user.email
    );

    if (!strengthValidation.isValid) {
      return res.status(422).json({
        success: false,
        code: 422,
        message: '密码强度不符合要求',
        data: {
          strength: strengthValidation.strength,
          score: strengthValidation.score,
          requirements: strengthValidation.requirements,
          suggestions: strengthValidation.suggestions
        },
        timestamp: new Date().toISOString()
      });
    }

    // 检查密码历史（重置时不检查历史，因为用户可能忘记了历史密码）
    // const historyCheck = await PasswordService.checkPasswordHistory(user._id, newPassword);

    // 使用重置令牌（标记为已使用）
    await PasswordResetToken.useResetToken(token);

    // 更新密码（不添加到历史记录，因为是重置）
    await PasswordService.updatePassword(user._id, newPassword, false);

    // 清除所有其他重置令牌
    await PasswordResetToken.deleteMany({ 
      userId: user._id, 
      used: false 
    });

    // 获取客户端IP
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // 发送密码重置成功通知
    try {
      // await emailService.sendPasswordChangeNotification(user.email, user.username, ipAddress);
      console.log('邮件通知已禁用（测试模式）');
    } catch (emailError) {
      console.error('发送密码重置通知邮件失败:', emailError);
    }

    res.json({
      success: true,
      code: 200,
      message: '密码重置成功',
      data: {
        resetAt: new Date().toISOString(),
        forceLogout: true,
        strengthScore: strengthValidation.score
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('确认密码重置失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

// 验证密码强度
const validatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        data: {
          errors: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { password } = req.body;
    const userId = req.user?.id;
    let username = '';
    let email = '';

    // 如果用户已登录，获取用户信息用于更准确的验证
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        username = user.username;
        email = user.email;
      }
    }

    // 验证密码强度
    const validation = PasswordService.validatePasswordStrength(password, username, email);

    res.json({
      success: true,
      code: 200,
      message: validation.isValid ? '密码强度验证通过' : '密码强度不符合要求',
      data: {
        isValid: validation.isValid,
        strength: validation.strength,
        strengthText: PasswordService.getStrengthText(validation.strength),
        strengthColor: PasswordService.getStrengthColor(validation.strength),
        score: validation.score,
        requirements: validation.requirements,
        suggestions: validation.suggestions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('验证密码强度失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

// 获取密码策略信息
const getPasswordPolicy = async (req, res) => {
  try {
    const policy = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxHistoryCount: 5,
      maxDailyChanges: 3,
      resetTokenExpiry: 1800, // 30分钟
      maxResetAttemptsPerHour: 3
    };

    res.json({
      success: true,
      code: 200,
      message: '获取密码策略成功',
      data: {
        policy
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取密码策略失败:', error);
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  changePassword,
  resetPassword,
  confirmResetPassword,
  validatePassword,
  getPasswordPolicy
};
