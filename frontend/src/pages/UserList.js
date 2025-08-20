import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Modal,
  Form,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { userAPI } from '../services/user';
import {
  USER_STATUS,
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,
  PAGINATION_CONFIG,
  FORM_RULES,
} from '../utils/constants';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search } = Input;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    status: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        ...params,
      };

      // 移除空值
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) {
          delete queryParams[key];
        }
      });

      const response = await userAPI.getUsers(queryParams);
      
      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        current: response.pagination.page,
      }));
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理表格变化（分页、排序、筛选）
  const handleTableChange = (newPagination, tableFilters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));
    
    fetchUsers({
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  // 处理搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers({ page: 1 });
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      username: '',
      email: '',
      status: '',
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers({ page: 1, username: '', email: '', status: '' });
  };

  // 打开创建/编辑用户模态框
  const openModal = (user = null) => {
    setEditingUser(user);
    setModalVisible(true);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 保存用户
  const handleSave = async (values) => {
    try {
      if (editingUser) {
        await userAPI.updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await userAPI.createUser(values);
        message.success('用户创建成功');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || '操作失败';
      message.error(errorMessage);
    }
  };

  // 删除用户
  const handleDelete = async (id) => {
    try {
      await userAPI.deleteUser(id);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || '删除失败';
      message.error(errorMessage);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '真实姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={USER_STATUS_COLORS[status]}>
          {USER_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索用户名"
                value={filters.username}
                onChange={(e) => setFilters(prev => ({ ...prev, username: e.target.value }))}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索邮箱"
                value={filters.email}
                onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="选择状态"
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value={USER_STATUS.ACTIVE}>{USER_STATUS_LABELS[USER_STATUS.ACTIVE]}</Option>
                <Option value={USER_STATUS.INACTIVE}>{USER_STATUS_LABELS[USER_STATUS.INACTIVE]}</Option>
                <Option value={USER_STATUS.PENDING}>{USER_STATUS_LABELS[USER_STATUS.PENDING]}</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新增用户
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...PAGINATION_CONFIG,
            ...pagination,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={FORM_RULES.username}
              >
                <Input placeholder="请输入用户名" disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={FORM_RULES.email}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={FORM_RULES.password}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="真实姓名"
                rules={FORM_RULES.fullName}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={FORM_RULES.phone}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态">
              <Option value={USER_STATUS.ACTIVE}>{USER_STATUS_LABELS[USER_STATUS.ACTIVE]}</Option>
              <Option value={USER_STATUS.INACTIVE}>{USER_STATUS_LABELS[USER_STATUS.INACTIVE]}</Option>
              <Option value={USER_STATUS.PENDING}>{USER_STATUS_LABELS[USER_STATUS.PENDING]}</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={closeModal}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
