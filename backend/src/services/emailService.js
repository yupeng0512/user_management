const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  // 初始化邮件传输器
  async init() {
    try {
      // 在开发环境中使用 Ethereal Email 测试服务
      if (process.env.NODE_ENV === 'development') {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } else {
        // 生产环境配置（需要在环境变量中设置）
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      console.log('📧 邮件服务初始化成功');
    } catch (error) {
      console.error('❌ 邮件服务初始化失败:', error);
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(email, resetToken, username) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@usermanagement.com',
        to: email,
        subject: '用户管理系统 - 密码重置请求',
        html: this.getPasswordResetTemplate(username, resetUrl, resetToken)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // 在开发环境中显示预览链接
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 密码重置邮件发送成功');
        console.log('预览链接:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 发送密码修改成功通知邮件
  async sendPasswordChangeNotification(email, username, ipAddress) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@usermanagement.com',
        to: email,
        subject: '用户管理系统 - 密码修改成功通知',
        html: this.getPasswordChangeTemplate(username, ipAddress)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 密码修改通知邮件发送成功');
        console.log('预览链接:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('发送密码修改通知邮件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 发送安全警告邮件
  async sendSecurityAlert(email, username, alertType, details) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@usermanagement.com',
        to: email,
        subject: '用户管理系统 - 安全警告',
        html: this.getSecurityAlertTemplate(username, alertType, details)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 安全警告邮件发送成功');
        console.log('预览链接:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('发送安全警告邮件失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 密码重置邮件模板
  getPasswordResetTemplate(username, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>密码重置请求</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
                display: inline-block; 
                background: #1890ff; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0; 
            }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 密码重置请求</h1>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${username}</strong>，</p>
                <p>我们收到了您的密码重置请求。如果这是您本人的操作，请点击下面的按钮重置您的密码：</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">重置密码</a>
                </div>
                
                <p>或者复制以下链接到浏览器地址栏：</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">
                    ${resetUrl}
                </p>
                
                <div class="warning">
                    <strong>⚠️ 安全提示：</strong>
                    <ul>
                        <li>此重置链接将在 <strong>30分钟</strong> 后过期</li>
                        <li>如果您没有申请密码重置，请忽略此邮件</li>
                        <li>为了您的账户安全，请不要将此邮件转发给他人</li>
                    </ul>
                </div>
                
                <p>如果您有任何问题，请联系我们的技术支持团队。</p>
                
                <p>祝好，<br>用户管理系统团队</p>
            </div>
            <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
                <p>重置令牌：${resetToken.substring(0, 8)}...</p>
                <p>发送时间：${new Date().toLocaleString('zh-CN')}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 密码修改成功通知模板
  getPasswordChangeTemplate(username, ipAddress) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>密码修改成功</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #52c41a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .info-box { background: white; border: 1px solid #d9d9d9; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ 密码修改成功</h1>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${username}</strong>，</p>
                <p>您的账户密码已成功修改。</p>
                
                <div class="info-box">
                    <h3>📋 操作详情</h3>
                    <p><strong>修改时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
                    <p><strong>操作IP：</strong>${ipAddress || '未知'}</p>
                    <p><strong>安全状态：</strong>所有设备已强制退出登录</p>
                </div>
                
                <div class="info-box">
                    <h3>🔒 安全提醒</h3>
                    <ul>
                        <li>为了您的账户安全，您需要重新登录所有设备</li>
                        <li>如果这不是您本人的操作，请立即联系我们</li>
                        <li>建议定期更换密码，保护账户安全</li>
                    </ul>
                </div>
                
                <p>如果您有任何疑问，请及时联系我们的技术支持团队。</p>
                
                <p>祝好，<br>用户管理系统团队</p>
            </div>
            <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
                <p>如果您没有进行此操作，请立即联系技术支持。</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 安全警告邮件模板
  getSecurityAlertTemplate(username, alertType, details) {
    const alertTypes = {
      suspicious_activity: '可疑活动检测',
      multiple_failed_attempts: '多次密码错误',
      unusual_login_location: '异常登录位置',
      password_breach_attempt: '密码破解尝试'
    };

    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>安全警告</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff4d4f; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .alert-box { background: #fff2f0; border: 1px solid #ffccc7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ 安全警告</h1>
            </div>
            <div class="content">
                <p>亲爱的 <strong>${username}</strong>，</p>
                <p>我们检测到您的账户存在以下安全风险：</p>
                
                <div class="alert-box">
                    <h3>🚨 ${alertTypes[alertType] || alertType}</h3>
                    <p>${details}</p>
                    <p><strong>检测时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
                </div>
                
                <h3>🛡️ 建议的安全措施：</h3>
                <ul>
                    <li>立即修改您的账户密码</li>
                    <li>检查账户的登录历史</li>
                    <li>启用双因素认证（如果可用）</li>
                    <li>确保使用安全的网络环境</li>
                </ul>
                
                <p>如果您认为这是误报，或者需要帮助，请联系我们的技术支持团队。</p>
                
                <p>祝好，<br>用户管理系统安全团队</p>
            </div>
            <div class="footer">
                <p>此邮件由安全监控系统自动发送，请勿回复。</p>
                <p>如需帮助，请联系技术支持。</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 测试邮件连接
  async testConnection() {
    try {
      if (!this.transporter) {
        await this.init();
      }
      
      await this.transporter.verify();
      console.log('📧 邮件服务连接测试成功');
      return true;
    } catch (error) {
      console.error('❌ 邮件服务连接测试失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const emailService = new EmailService();

module.exports = emailService;
