import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Space,
  Alert,
  Result,
  Steps,
  Divider
} from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { passwordAPI } from '../services/password';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import './ResetPassword.css';

const { Step } = Steps;

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showStrengthIndicator, setShowStrengthIndicator] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();

  // 检查URL中的重置令牌
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      setResetToken(token);
      setCurrentStep(1); // 跳转到设置新密码步骤
    }
  }, [location]);

  // 倒计时效果
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送重置邮件
  const handleSendResetEmail = async (values) => {
    setLoading(true);

    try {
      const response = await passwordAPI.resetPassword(values.email);

      if (response.success) {
        setResetEmail(values.email);
        setCurrentStep(1);
        setCountdown(60); // 60秒倒计时
        message.success('重置邮件已发送，请查收您的邮箱');
        
        // 如果是开发环境，显示预览链接
        if (response.data.previewUrl) {
          message.info(
            <div>
              开发环境预览链接：
              <a href={response.data.previewUrl} target="_blank" rel="noopener noreferrer">
                查看邮件
              </a>
            </div>,
            10
          );
        }
      }
    } catch (error) {
      console.error('发送重置邮件失败:', error);
      
      if (error.response?.data) {
        const { code, message: errorMessage } = error.response.data;
        
        switch (code) {
          case 429:
            message.error('请求过于频繁，请稍后再试');
            setCountdown(300); // 5分钟倒计时
            break;
          default:
            message.error(errorMessage || '发送重置邮件失败，请稍后重试');
        }
      } else {
        message.error('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 验证密码强度
  const handlePasswordChange = async (e) => {
    const password = e.target.value;
    
    if (!password) {
      setPasswordValidation(null);
      setShowStrengthIndicator(false);
      return;
    }

    setShowStrengthIndicator(true);

    try {
      const response = await passwordAPI.validatePassword(password);
      if (response.success) {
        setPasswordValidation(response.data);
      }
    } catch (error) {
      console.error('密码强度验证失败:', error);
    }
  };

  // 确认重置密码
  const handleConfirmReset = async (values) => {
    setLoading(true);

    try {
      const response = await passwordAPI.confirmResetPassword({
        token: resetToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });

      if (response.success) {
        setCurrentStep(2);
        message.success('密码重置成功！请使用新密码登录。');
        form.resetFields();
        
        // 3秒后跳转到登录页
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      
      if (error.response?.data) {
        const { code, message: errorMessage, data } = error.response.data;
        
        switch (code) {
          case 400:
            message.error('重置链接无效或已过期，请重新申请');
            setCurrentStep(0);
            setResetToken('');
            break;
          case 422:
            message.error('密码不符合安全要求');
            if (data?.suggestions) {
              data.suggestions.forEach(suggestion => {
                message.warning(suggestion);
              });
            }
            break;
          default:
            message.error(errorMessage || '密码重置失败，请稍后重试');
        }
      } else {
        message.error('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 重新发送邮件
  const handleResendEmail = () => {
    if (countdown > 0) {
      message.warning(`请等待 ${countdown} 秒后再次发送`);
      return;
    }
    
    handleSendResetEmail({ email: resetEmail });
  };

  // 步骤内容
  const stepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card
            title={
              <Space>
                <MailOutlined />
                找回密码
              </Space>
            }
            className="reset-password-card"
          >
            <Alert
              message="密码重置说明"
              description="请输入您的邮箱地址，我们将向您发送密码重置链接。重置链接将在30分钟后过期。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSendResetEmail}
              className="reset-password-form"
            >
              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入您的邮箱地址"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  disabled={countdown > 0}
                >
                  {countdown > 0 
                    ? `重新发送 (${countdown}s)` 
                    : loading 
                      ? '发送中...' 
                      : '发送重置邮件'
                  }
                </Button>
              </Form.Item>
            </Form>
          </Card>
        );

      case 1:
        return resetToken ? (
          <Card
            title={
              <Space>
                <LockOutlined />
                设置新密码
              </Space>
            }
            className="reset-password-card"
          >
            <Alert
              message="设置新密码"
              description="请设置一个安全的新密码。密码重置后，您需要使用新密码重新登录。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleConfirmReset}
              className="reset-password-form"
            >
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '新密码至少8个字符' },
                  { max: 128, message: '新密码最多128个字符' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      
                      if (passwordValidation && !passwordValidation.isValid) {
                        return Promise.reject(new Error('密码强度不符合要求'));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                  size="large"
                  onChange={handlePasswordChange}
                  iconRender={(visible) => 
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              {/* 密码强度指示器 */}
              {showStrengthIndicator && (
                <PasswordStrengthIndicator
                  password={form.getFieldValue('newPassword')}
                  validation={passwordValidation}
                  showDetails={true}
                />
              )}

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<CheckCircleOutlined />}
                  placeholder="请再次输入新密码"
                  size="large"
                  iconRender={(visible) => 
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  disabled={passwordValidation && !passwordValidation.isValid}
                >
                  {loading ? '重置中...' : '重置密码'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          <Card className="reset-password-card">
            <Alert
              message="等待邮件确认"
              description={
                <div>
                  <p>重置邮件已发送到：<strong>{resetEmail}</strong></p>
                  <p>请点击邮件中的链接来重置您的密码。如果没有收到邮件，请检查垃圾邮箱。</p>
                </div>
              }
              type="warning"
              showIcon
              icon={<ClockCircleOutlined />}
              action={
                <Button 
                  size="small" 
                  onClick={handleResendEmail}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                </Button>
              }
            />
          </Card>
        );

      case 2:
        return (
          <Result
            status="success"
            title="密码重置成功！"
            subTitle="您的密码已成功重置，请使用新密码登录您的账户。"
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                立即登录
              </Button>,
              <Button key="home" onClick={() => navigate('/')}>
                返回首页
              </Button>
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="reset-password">
      <div className="reset-password-container">
        <div className="reset-password-header">
          <Space>
            <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <h2>密码重置</h2>
          </Space>
        </div>

        {currentStep < 2 && (
          <Steps current={currentStep} style={{ marginBottom: 32 }}>
            <Step title="验证邮箱" description="输入邮箱地址" />
            <Step title="设置密码" description="设置新密码" />
            <Step title="完成重置" description="重置成功" />
          </Steps>
        )}

        {stepContent()}

        {currentStep === 0 && (
          <div className="reset-password-footer">
            <Divider />
            <div className="footer-links">
              <Button type="link" onClick={() => navigate('/login')}>
                返回登录
              </Button>
              <Button type="link" onClick={() => navigate('/register')}>
                注册新账户
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
