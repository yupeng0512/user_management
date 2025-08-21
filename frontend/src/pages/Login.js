import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, authStorage } from '../services/auth';
import { FORM_RULES } from '../utils/constants';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 处理登录
  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.login(values);
      
      // 保存认证信息
      authStorage.saveAuth(response);
      
      // 跳转到主页
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || '登录失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <Title level={2}>用户管理系统</Title>
            <Text type="secondary">请登录您的账户</Text>
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
            name="login"
            size="large"
            onFinish={handleLogin}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名或邮箱' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名或邮箱"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
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
                登录
              </Button>
            </Form.Item>
          </Form>

          <Divider>或者</Divider>

          <div className="login-footer">
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Text>
                <Link to="/reset-password">忘记密码？</Link>
              </Text>
              <Text>
                还没有账户？{' '}
                <Link to="/register">立即注册</Link>
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
