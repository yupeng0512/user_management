import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Avatar,
  Upload,
  message,
  Spin,
  Typography,
  Divider,
} from 'antd';
import { UserOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../services/user';
import { authStorage } from '../services/auth';
import {
  USER_STATUS,
  USER_STATUS_LABELS,
  FORM_RULES,
} from '../utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // 获取用户信息
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserById(id);
      const userData = response.data;
      
      setUser(userData);
      form.setFieldsValue(userData);

      // 检查是否是当前用户
      const { user: currentUser } = authStorage.getAuth();
      setIsCurrentUser(currentUser?.id === userData.id);
    } catch (error) {
      message.error('获取用户信息失败');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  // 保存用户信息
  const handleSave = async (values) => {
    try {
      setSaving(true);
      const response = await userAPI.updateUser(id, values);
      
      setUser(response.data);
      message.success('用户信息更新成功');

      // 如果是当前用户，更新本地存储的用户信息
      if (isCurrentUser) {
        authStorage.updateUser(response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || '更新失败';
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 处理头像上传
  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      // 这里应该处理上传成功后的逻辑
      message.success('头像上传成功');
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>
            {isCurrentUser ? '个人资料' : '用户详情'}
          </Title>
          <Text type="secondary">
            {isCurrentUser ? '管理您的个人信息' : '查看和编辑用户信息'}
          </Text>
        </div>

        <Row gutter={24}>
          {/* 左侧：头像和基本信息 */}
          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  size={120}
                  src={user.avatar}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 16 }}
                />
                
                <Upload
                  name="avatar"
                  listType="picture"
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  beforeUpload={() => false} // 阻止自动上传
                >
                  <Button icon={<UploadOutlined />} size="small">
                    更换头像
                  </Button>
                </Upload>

                <Divider />

                <div style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>用户ID: </Text>
                    <Text>{user.id}</Text>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>用户名: </Text>
                    <Text>{user.username}</Text>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>角色: </Text>
                    <Text>{user.role === 'admin' ? '管理员' : '普通用户'}</Text>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>创建时间: </Text>
                    <Text>{dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>最后更新: </Text>
                    <Text>{dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <Text strong>最后登录: </Text>
                      <Text>{dayjs(user.lastLoginAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>

          {/* 右侧：编辑表单 */}
          <Col xs={24} md={16}>
            <Card title="基本信息">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="邮箱地址"
                      rules={FORM_RULES.email}
                    >
                      <Input placeholder="请输入邮箱地址" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="fullName"
                      label="真实姓名"
                      rules={FORM_RULES.fullName}
                    >
                      <Input placeholder="请输入真实姓名" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="手机号码"
                      rules={FORM_RULES.phone}
                    >
                      <Input placeholder="请输入手机号码" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="status"
                      label="账户状态"
                    >
                      <Select 
                        placeholder="请选择状态"
                        disabled={isCurrentUser} // 用户不能修改自己的状态
                      >
                        <Option value={USER_STATUS.ACTIVE}>
                          {USER_STATUS_LABELS[USER_STATUS.ACTIVE]}
                        </Option>
                        <Option value={USER_STATUS.INACTIVE}>
                          {USER_STATUS_LABELS[USER_STATUS.INACTIVE]}
                        </Option>
                        <Option value={USER_STATUS.PENDING}>
                          {USER_STATUS_LABELS[USER_STATUS.PENDING]}
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="avatar"
                  label="头像URL"
                >
                  <Input placeholder="请输入头像URL（可选）" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={<SaveOutlined />}
                  >
                    保存更改
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UserProfile;
