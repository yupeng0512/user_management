import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Avatar, 
  Select, 
  Space,
  Button,
  Typography,
  Badge,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  ReloadOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { getOnlineUsers } from '../services/user';
import './OnlineUsers.css';

const { Option } = Select;
const { Text } = Typography;

const OnlineUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    department: undefined
  });

  useEffect(() => {
    fetchOnlineUsers();
    // 设置定时刷新（每30秒）
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchOnlineUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      
      const response = await getOnlineUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('获取在线用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleDepartmentChange = (value) => {
    setFilters({ ...filters, department: value });
    setPagination({ ...pagination, current: 1 });
  };

  const formatLastActive = (lastActiveAt) => {
    if (!lastActiveAt) return '未知';
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (username, record) => (
        <Space>
          <Badge status="success" dot>
            <Avatar 
              src={record.avatar} 
              icon={<UserOutlined />} 
              size="small"
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname || username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              @{username}
            </Text>
          </div>
        </Space>
      ),
      width: 180
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
      width: 200
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (department) => department ? (
        <Tag color="blue">{department}</Tag>
      ) : <Text type="secondary">-</Text>,
      width: 120
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position) => position ? (
        <Text>{position}</Text>
      ) : <Text type="secondary">-</Text>,
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleConfig = {
          admin: { color: 'red', text: '管理员' },
          user: { color: 'blue', text: '普通用户' },
          guest: { color: 'green', text: '访客' }
        };
        const config = roleConfig[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
      width: 100
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      render: (lastActiveAt) => (
        <Tooltip title={new Date(lastActiveAt).toLocaleString()}>
          <Text style={{ fontSize: '12px' }}>
            {formatLastActive(lastActiveAt)}
          </Text>
        </Tooltip>
      ),
      width: 120,
      sorter: true
    },
    {
      title: '状态',
      dataIndex: 'isOnline',
      key: 'isOnline',
      render: (isOnline) => (
        <Badge 
          status={isOnline ? "success" : "default"} 
          text={isOnline ? "在线" : "离线"}
        />
      ),
      width: 80
    }
  ];

  // 获取部门选项
  const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

  return (
    <div className="online-users">
      <Card 
        title={
          <Space>
            <DashboardOutlined />
            在线用户管理
            <Badge 
              count={pagination.total} 
              style={{ backgroundColor: '#52c41a' }}
            />
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="筛选部门"
              value={filters.department}
              onChange={handleDepartmentChange}
              allowClear
              style={{ width: 150 }}
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchOnlineUsers}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div className="online-users-info">
          <Text type="secondary">
            共 {pagination.total} 位用户在线，数据每30秒自动刷新
          </Text>
        </div>
        
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default OnlineUsers;
