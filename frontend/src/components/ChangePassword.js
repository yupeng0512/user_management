import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Space,
  Alert,
  Divider
} from 'antd';
import { 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  SafetyOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { passwordAPI } from '../services/password';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useAuth } from '../contexts/AuthContext';
import './ChangePassword.css';

const ChangePassword = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showStrengthIndicator, setShowStrengthIndicator] = useState(false);
  const { logout } = useAuth();

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

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const response = await passwordAPI.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });

      if (response.success) {
        message.success('密码修改成功！为了安全，请重新登录。');
        form.resetFields();
        setPasswordValidation(null);
        setShowStrengthIndicator(false);
        
        // 调用成功回调
        if (onSuccess) {
          onSuccess(response.data);
        }

        // 延迟1秒后自动登出
        setTimeout(() => {
          logout();
        }, 1000);
      }
    } catch (error) {
      console.error('密码修改失败:', error);
      
      if (error.response?.data) {
        const { code, message: errorMessage, data } = error.response.data;
        
        switch (code) {
          case 401:
            message.error('当前密码错误，请重新输入');
            form.setFields([{
              name: 'oldPassword',
              errors: ['当前密码错误']
            }]);
            break;
          case 403:
            message.error(errorMessage);
            if (data?.nextAllowedTime) {
              const nextTime = new Date(data.nextAllowedTime).toLocaleString();
              message.info(`下次可修改时间：${nextTime}`);
            }
            break;
          case 422:
            message.error('新密码不符合安全要求');
            if (data?.suggestions) {
              data.suggestions.forEach(suggestion => {
                message.warning(suggestion);
              });
            }
            break;
          default:
            message.error(errorMessage || '密码修改失败，请稍后重试');
        }
      } else {
        message.error('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password">
      <Card
        title={
          <Space>
            <SafetyOutlined />
            修改密码
          </Space>
        }
        bordered={false}
        className="change-password-card"
      >
        <Alert
          message="安全提醒"
          description="修改密码后，您将被自动登出，需要使用新密码重新登录。请确保记住新密码。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          className="change-password-form"
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              size="large"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Divider />

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
              {loading ? '正在修改...' : '修改密码'}
            </Button>
          </Form.Item>
        </Form>

        <div className="password-tips">
          <h4>密码安全建议：</h4>
          <ul>
            <li>使用包含大小写字母、数字的复杂密码</li>
            <li>避免使用个人信息（如生日、姓名）作为密码</li>
            <li>不要与其他网站使用相同的密码</li>
            <li>建议定期更换密码以保障账户安全</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ChangePassword;
