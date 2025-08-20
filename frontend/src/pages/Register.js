import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, authStorage } from '../services/auth';
import { FORM_RULES } from '../utils/constants';
import './Register.css';

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 处理注册
  const handleRegister = async (values) => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.register(values);
      
      // 保存认证信息（注册成功后自动登录）
      authStorage.saveAuth(response);
      
      // 跳转到主页
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || '注册失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <Card className="register-card">
          <div className="register-header">
            <Title level={2}>用户注册</Title>
            <Text type="secondary">创建您的新账户</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form
            form={form}
            name="register"
            size="large"
            onFinish={handleRegister}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={FORM_RULES.username}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={FORM_RULES.email}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱地址"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={FORM_RULES.password}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                ...FORM_RULES.confirmPassword,
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="fullName"
              rules={FORM_RULES.fullName}
            >
              <Input
                prefix={<IdcardOutlined />}
                placeholder="真实姓名（可选）"
                autoComplete="name"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={FORM_RULES.phone}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="手机号码（可选）"
                autoComplete="tel"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider>或者</Divider>

          <div className="register-footer">
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Text>
                已有账户？{' '}
                <Link to="/login">立即登录</Link>
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
