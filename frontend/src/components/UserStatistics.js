import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  Space,
  Tag,
  Table,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { getUserStatistics } from '../services/user';
import './UserStatistics.css';

const { Option } = Select;

const UserStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('');
  const [groupBy, setGroupBy] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [period, groupBy]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (period) params.period = period;
      if (groupBy) params.groupBy = groupBy;
      
      const response = await getUserStatistics(params);
      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    } finally {
      setLoading(false);
    }
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      user: 'blue',
      guest: 'green'
    };
    return colors[role] || 'default';
  };

  // 部门统计表格列定义
  const departmentColumns = [
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '人数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      render: (count) => <Tag color="blue">{count}</Tag>
    }
  ];

  // 角色统计表格列定义
  const roleColumns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {role === 'admin' ? '管理员' : role === 'user' ? '普通用户' : '访客'}
        </Tag>
      )
    },
    {
      title: '人数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
      render: (count) => <Tag color="blue">{count}</Tag>
    }
  ];

  if (!statistics) {
    return (
      <Card loading={loading}>
        <Alert message="正在加载统计信息..." type="info" />
      </Card>
    );
  }

  // 准备表格数据
  const departmentData = Object.entries(statistics.byDepartment || {}).map(([dept, count]) => ({
    key: dept,
    department: dept,
    count
  }));

  const roleData = Object.entries(statistics.byRole || {}).map(([role, count]) => ({
    key: role,
    role,
    count
  }));

  return (
    <div className="user-statistics">
      {/* 筛选控件 */}
      <Card title="统计筛选" style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="选择统计周期"
            value={period}
            onChange={setPeriod}
            allowClear
            style={{ width: 150 }}
          >
            <Option value="day">今日</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="year">本年</Option>
          </Select>
          
          <Select
            placeholder="分组统计"
            value={groupBy}
            onChange={setGroupBy}
            allowClear
            style={{ width: 150 }}
          >
            <Option value="status">按状态</Option>
            <Option value="role">按角色</Option>
            <Option value="department">按部门</Option>
          </Select>
        </Space>
      </Card>

      {/* 基础统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={statistics.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={statistics.activeUsers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={statistics.onlineUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="非活跃用户"
              value={statistics.inactiveUsers}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待激活用户"
              value={statistics.pendingUsers}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已禁用用户"
              value={statistics.bannedUsers}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={statistics.newUsersToday}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本周新增"
              value={statistics.newUsersThisWeek}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分组统计表格 */}
      <Row gutter={[16, 16]}>
        {departmentData.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title="部门统计" loading={loading}>
              <Table
                columns={departmentColumns}
                dataSource={departmentData}
                size="small"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        )}
        
        {roleData.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title="角色统计" loading={loading}>
              <Table
                columns={roleColumns}
                dataSource={roleData}
                size="small"
                pagination={false}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default UserStatistics;
