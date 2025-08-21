import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Button } from 'antd';
import { UserOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/user';
import { authStorage } from '../services/auth';
import { USER_STATUS } from '../utils/constants';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(false);
  
  // 使用 useMemo 缓存 user 对象，避免不必要的重新渲染
  const { user } = useMemo(() => authStorage.getAuth(), []);
  
  // 防抖定时器引用
  const timerRef = useRef(null);

  // 带重试功能的请求函数
  const fetchWithRetry = async (fn, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`尝试 ${attempt + 1}/${maxRetries} 失败:`, error.message);
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          // 等待一段时间再重试，每次增加延迟
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  };
  
  // 获取单个统计数据的函数
  const fetchSingleStat = async (params) => {
    return await fetchWithRetry(() => userAPI.getUsers(params));
  };

  // 获取用户统计数据
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // 如果是管理员，获取所有用户统计
      if (user?.role === 'admin') {
        try {
          // 顺序获取统计数据，而不是并行，以避免资源不足错误
          const totalRes = await fetchSingleStat({ limit: 1 });
          const activeRes = await fetchSingleStat({ status: USER_STATUS.ACTIVE, limit: 1 });
          const inactiveRes = await fetchSingleStat({ status: USER_STATUS.INACTIVE, limit: 1 });
          const pendingRes = await fetchSingleStat({ status: USER_STATUS.PENDING, limit: 1 });

          // 添加防御性检查，确保数据存在
          setStats({
            total: totalRes?.pagination?.total || 0,
            active: activeRes?.pagination?.total || 0,
            inactive: inactiveRes?.pagination?.total || 0,
            pending: pendingRes?.pagination?.total || 0,
          });
        } catch (innerError) {
          console.error('Failed to fetch individual stats:', innerError);
          // 设置默认值，避免界面显示错误
          setStats({
            total: 0,
            active: 0,
            inactive: 0,
            pending: 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 使用防抖函数包装 fetchStats
  const debouncedFetchStats = () => {
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // 设置新的定时器，300ms 后执行
    timerRef.current = setTimeout(() => {
      if (user?.role === 'admin') {
        fetchStats();
      }
    }, 300);
  };

  useEffect(() => {
    // 组件挂载时获取一次数据
    if (user?.role === 'admin') {
      debouncedFetchStats();
    }
    
    // 组件卸载时清除定时器
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user?.role]); // 只依赖于 user.role，而不是整个 user 对象

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>仪表盘</Title>
        <Text type="secondary">
          欢迎回来，{user?.fullName || user?.username}！
        </Text>
      </div>

      {/* 用户个人信息卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>个人资料</Title>
              <Text type="secondary">管理您的个人信息和设置</Text>
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  onClick={() => navigate(`/users/${user?.id}`)}
                >
                  查看资料
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {user?.role === 'admin' && (
          <Col xs={24} lg={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <TeamOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>用户管理</Title>
                <Text type="secondary">管理系统中的所有用户</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/users')}
                  >
                    管理用户
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* 管理员统计信息 */}
      {user?.role === 'admin' && (
        <>
          <Title level={3} style={{ marginBottom: 16 }}>系统统计</Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats.total}
                  prefix={<TeamOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="待激活"
                  value={stats.pending}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="已禁用"
                  value={stats.inactive}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#8c8c8c' }}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* 普通用户信息 */}
      {user?.role !== 'admin' && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card>
              <Title level={4}>欢迎使用用户管理系统</Title>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Text>
                  您当前是普通用户，可以管理自己的个人信息。
                </Text>
                <div>
                  <Button 
                    type="primary" 
                    onClick={() => navigate(`/users/${user?.id}`)}
                  >
                    编辑个人资料
                  </Button>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
