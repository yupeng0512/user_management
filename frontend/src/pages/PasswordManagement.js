import React, { useState } from 'react';
import { Card, Tabs, Alert, Space, Typography } from 'antd';
import { 
  LockOutlined, 
  SafetyOutlined, 
  HistoryOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import ChangePassword from '../components/ChangePassword';
import './PasswordManagement.css';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

const PasswordManagement = () => {
  const [activeTab, setActiveTab] = useState('change');

  const handlePasswordChangeSuccess = (data) => {
    console.log('密码修改成功:', data);
    // 这里可以添加额外的处理逻辑，比如记录日志等
  };

  return (
    <div className="password-management">
      <div className="password-management-header">
        <Title level={2}>
          <Space>
            <SafetyOutlined />
            密码管理
          </Space>
        </Title>
        <Paragraph type="secondary">
          管理您的账户密码，确保账户安全。建议定期更换密码以保护您的账户安全。
        </Paragraph>
      </div>

      <Alert
        message="安全提醒"
        description={
          <div>
            <p>• 密码应包含大写字母、小写字母和数字，长度至少8位</p>
            <p>• 不要使用与其他网站相同的密码</p>
            <p>• 避免使用个人信息（如生日、姓名）作为密码</p>
            <p>• 修改密码后需要重新登录所有设备</p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card className="password-management-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <TabPane 
            tab={
              <Space>
                <LockOutlined />
                修改密码
              </Space>
            } 
            key="change"
          >
            <ChangePassword onSuccess={handlePasswordChangeSuccess} />
          </TabPane>
          
          <TabPane 
            tab={
              <Space>
                <HistoryOutlined />
                密码策略
              </Space>
            } 
            key="policy"
          >
            <div className="password-policy">
              <Title level={4}>密码安全策略</Title>
              
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>密码强度要求</Title>
                <ul>
                  <li>最小长度：8位字符</li>
                  <li>最大长度：128位字符</li>
                  <li>必须包含：大写字母（A-Z）</li>
                  <li>必须包含：小写字母（a-z）</li>
                  <li>必须包含：数字（0-9）</li>
                  <li>可选包含：特殊字符（!@#$%^&*等）</li>
                </ul>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>密码历史限制</Title>
                <ul>
                  <li>不能与最近5次使用的密码相同</li>
                  <li>不能与当前密码相同</li>
                  <li>密码历史记录安全加密存储</li>
                </ul>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>密码修改限制</Title>
                <ul>
                  <li>24小时内最多修改3次密码</li>
                  <li>修改密码后将强制退出所有设备</li>
                  <li>密码修改后会发送邮件通知</li>
                </ul>
              </Card>

              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>安全建议</Title>
                <ul>
                  <li>使用密码管理器生成和存储复杂密码</li>
                  <li>启用双因素认证（如果可用）</li>
                  <li>定期检查账户登录记录</li>
                  <li>不要在公共场所输入密码</li>
                  <li>发现异常活动立即修改密码</li>
                </ul>
              </Card>

              <Alert
                message="重要提醒"
                description="如果您怀疑账户可能被盗用，请立即修改密码并联系系统管理员。我们会记录所有密码相关的操作日志以确保账户安全。"
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PasswordManagement;
