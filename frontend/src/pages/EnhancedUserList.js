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
  Tabs,
  Avatar,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  BarChartOutlined,
  TeamOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { userAPI } from '../services/user';
import AdvancedSearch from '../components/AdvancedSearch';
import UserStatistics from '../components/UserStatistics';
import OnlineUsers from '../components/OnlineUsers';
import './UserList.css';

const { Option } = Select;
// 不再需要 TabPane 导入
const { TextArea } = Input;

const EnhancedUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [sorter, setSorter] = useState({});

  useEffect(() => {
    if (activeTab === 'list') {
      fetchUsers();
    }
  }, [pagination.current, pagination.pageSize, filters, sorter, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
        ...sorter
      };

      const response = await userAPI.getUsers(params);
      if (response.success) {
        setUsers(response.data.users || response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || response.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchParams) => {
    setSearchLoading(true);
    try {
      const response = await userAPI.searchUsers(searchParams);
      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('搜索用户失败');
      console.error('搜索用户失败:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchReset = () => {
    setFilters({});
    setSorter({});
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchUsers();
  };

  const handleTableChange = (newPagination, newFilters, newSorter) => {
    setPagination(newPagination);
    
    // 处理筛选
    const filterParams = {};
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        filterParams[key] = newFilters[key];
      }
    });
    setFilters(filterParams);

    // 处理排序
    const sortParams = {};
    if (newSorter.field) {
      sortParams.sort = newSorter.field;
      sortParams.order = newSorter.order === 'ascend' ? 'asc' : 'desc';
    }
    setSorter(sortParams);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      tags: user.tags || []
    });
    setIsModalVisible(true);
  };

  const handleViewDetail = async (user) => {
    try {
      const response = await userAPI.getUserById(user._id, { include: 'profile,roles' });
      if (response.success) {
        setSelectedUser(response.data.user);
        setIsDetailModalVisible(true);
      }
    } catch (error) {
      message.error('获取用户详情失败');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await userAPI.deleteUser(userId);
      message.success('删除用户成功');
      fetchUsers();
    } catch (error) {
      message.error('删除用户失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await userAPI.updateUser(editingUser._id, values);
        message.success('更新用户成功');
      } else {
        await userAPI.createUser(values);
        message.success('创建用户成功');
      }
      
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(editingUser ? '更新用户失败' : '创建用户失败');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'warning',
      pending: 'processing',
      banned: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      active: '活跃',
      inactive: '非活跃',
      pending: '待激活',
      banned: '已禁用'
    };
    return texts[status] || status;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      user: 'blue',
      guest: 'green'
    };
    return colors[role] || 'default';
  };

  const getRoleText = (role) => {
    const texts = {
      admin: '管理员',
      user: '普通用户',
      guest: '访客'
    };
    return texts[role] || role;
  };

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <Space>
          <Badge status={record.isOnline ? "success" : "default"} dot>
            <Avatar 
              src={record.avatar} 
              icon={<UserOutlined />} 
              size="default"
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.nickname || record.fullName || record.username}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              @{record.username}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      width: 200,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (phone) => phone || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => department ? (
        <Tag color="blue">{department}</Tag>
      ) : '-',
      filters: [
        { text: '技术部', value: '技术部' },
        { text: '产品部', value: '产品部' },
        { text: '运营部', value: '运营部' },
        { text: '系统部', value: '系统部' },
      ],
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (position) => position || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '普通用户', value: 'user' },
        { text: '访客', value: 'guest' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: '活跃', value: 'active' },
        { text: '非活跃', value: 'inactive' },
        { text: '待激活', value: 'pending' },
        { text: '已禁用', value: 'banned' },
      ],
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <>
          {tags && tags.slice(0, 2).map(tag => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
          {tags && tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(', ')}>
              <Tag size="small">+{tags.length - 2}</Tag>
            </Tooltip>
          )}
        </>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt) => new Date(createdAt).toLocaleDateString(),
      sorter: true,
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 120,
      render: (lastLoginAt) => lastLoginAt ? 
        new Date(lastLoginAt).toLocaleDateString() : '-',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此用户吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="enhanced-user-list">
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabBarExtraContent={
            activeTab === 'list' && (
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  新建用户
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            )
          }
          items={[
            {
              key: "list",
              label: (
                <span>
                  <TeamOutlined />
                  用户列表
                </span>
              ),
              children: (
                <>
                  {/* 高级搜索 */}
                  <AdvancedSearch 
                    onSearch={handleSearch}
                    onReset={handleSearchReset}
                    loading={searchLoading}
                  />
                  
                  {/* 用户表格 */}
                  <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                      ...pagination,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    size="middle"
                  />
                </>
              )
            },
            {
              key: "statistics",
              label: (
                <span>
                  <BarChartOutlined />
                  统计信息
                </span>
              ),
              children: <UserStatistics />
            },
            {
              key: "online",
              label: (
                <span>
                  <UserOutlined />
                  在线用户
                </span>
              ),
              children: <OnlineUsers />
            }
          ]}
        />
      </Card>

      {/* 创建/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="密码"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="确认密码"
                  rules={[
                    { required: true, message: '请确认密码' },
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
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
          )}
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="真实姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nickname" label="昵称">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="部门">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="职位">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="角色">
                <Select>
                  <Option value="user">普通用户</Option>
                  <Option value="admin">管理员</Option>
                  <Option value="guest">访客</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="active">活跃</Option>
                  <Option value="inactive">非活跃</Option>
                  <Option value="pending">待激活</Option>
                  <Option value="banned">已禁用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签">
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="bio" label="个人简介">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Avatar size={80} src={selectedUser.avatar} icon={<UserOutlined />} />
              </Col>
              <Col span={18}>
                <Space direction="vertical" size="small">
                  <h3>{selectedUser.nickname || selectedUser.fullName || selectedUser.username}</h3>
                  <p>@{selectedUser.username} | {selectedUser.email}</p>
                  <Space>
                    <Tag color={getRoleColor(selectedUser.role)}>
                      {getRoleText(selectedUser.role)}
                    </Tag>
                    <Tag color={getStatusColor(selectedUser.status)}>
                      {getStatusText(selectedUser.status)}
                    </Tag>
                    <Badge 
                      status={selectedUser.isOnline ? "success" : "default"} 
                      text={selectedUser.isOnline ? "在线" : "离线"}
                    />
                  </Space>
                </Space>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <h4>基本信息</h4>
                <p><strong>手机号：</strong>{selectedUser.phone || '-'}</p>
                <p><strong>部门：</strong>{selectedUser.department || '-'}</p>
                <p><strong>职位：</strong>{selectedUser.position || '-'}</p>
                <p><strong>个人简介：</strong>{selectedUser.bio || '-'}</p>
              </Col>
              <Col span={12}>
                <h4>系统信息</h4>
                <p><strong>创建时间：</strong>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                <p><strong>最后登录：</strong>{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : '-'}</p>
                <p><strong>最后活跃：</strong>{selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleString() : '-'}</p>
                <p><strong>权限：</strong>{selectedUser.permissions?.join(', ') || '-'}</p>
              </Col>
            </Row>
            
            {selectedUser.tags && selectedUser.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>标签</h4>
                <Space wrap>
                  {selectedUser.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
            
            {selectedUser.profile && (
              <div style={{ marginTop: 16 }}>
                <h4>个人资料</h4>
                <p><strong>真实姓名：</strong>{selectedUser.profile.realName || '-'}</p>
                <p><strong>性别：</strong>{selectedUser.profile.gender || '-'}</p>
                <p><strong>生日：</strong>{selectedUser.profile.birthday ? new Date(selectedUser.profile.birthday).toLocaleDateString() : '-'}</p>
                <p><strong>地址：</strong>{selectedUser.profile.address || '-'}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedUserList;
