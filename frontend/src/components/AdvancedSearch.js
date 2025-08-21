import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  Row, 
  Col, 
  Space,
  Tag
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import './AdvancedSearch.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdvancedSearch = ({ onSearch, onReset, loading = false }) => {
  const [form] = Form.useForm();
  const [tags, setTags] = useState([]);

  const handleSearch = (values) => {
    // 处理表单数据
    const filters = {};
    
    if (values.username) filters.username = values.username;
    if (values.email) filters.email = values.email;
    if (values.phone) filters.phone = values.phone;
    if (values.status) filters.status = values.status;
    if (values.roles) filters.roles = values.roles;
    if (values.department) filters.department = values.department;
    if (values.keyword) filters.keyword = values.keyword;
    
    // 处理时间范围
    if (values.createdAt && values.createdAt.length === 2) {
      filters.createdAt = {
        start: values.createdAt[0].toISOString(),
        end: values.createdAt[1].toISOString()
      };
    }
    
    if (values.lastLoginAt && values.lastLoginAt.length === 2) {
      filters.lastLoginAt = {
        start: values.lastLoginAt[0].toISOString(),
        end: values.lastLoginAt[1].toISOString()
      };
    }
    
    // 处理标签
    if (tags.length > 0) {
      filters.tags = tags;
    }
    
    const searchParams = {
      filters,
      sort: {
        field: values.sortField || 'createdAt',
        order: values.sortOrder || 'desc'
      },
      pagination: {
        page: 1,
        limit: 20
      }
    };
    
    onSearch(searchParams);
  };

  const handleReset = () => {
    form.resetFields();
    setTags([]);
    onReset();
  };

  const handleTagClose = (removedTag) => {
    const newTags = tags.filter(tag => tag !== removedTag);
    setTags(newTags);
  };

  const handleTagAdd = (value) => {
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
  };

  return (
    <Card title="高级搜索" className="advanced-search-card">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        autoComplete="off"
      >
        <Row gutter={[16, 16]}>
          {/* 基本信息搜索 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="关键词搜索" name="keyword">
              <Input 
                placeholder="搜索用户名、邮箱、昵称、真实姓名"
                allowClear
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="用户名" name="username">
              <Input placeholder="用户名" allowClear />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="邮箱" name="email">
              <Input placeholder="邮箱地址" allowClear />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="手机号" name="phone">
              <Input placeholder="手机号码" allowClear />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="部门" name="department">
              <Input placeholder="部门名称" allowClear />
            </Form.Item>
          </Col>
          
          {/* 状态和角色筛选 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="用户状态" name="status">
              <Select
                mode="multiple"
                placeholder="选择用户状态"
                allowClear
              >
                <Option value="active">活跃</Option>
                <Option value="inactive">非活跃</Option>
                <Option value="pending">待激活</Option>
                <Option value="banned">已禁用</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="用户角色" name="roles">
              <Select
                mode="multiple"
                placeholder="选择用户角色"
                allowClear
              >
                <Option value="admin">管理员</Option>
                <Option value="user">普通用户</Option>
                <Option value="guest">访客</Option>
              </Select>
            </Form.Item>
          </Col>
          
          {/* 标签管理 */}
          <Col xs={24} md={8}>
            <Form.Item label="用户标签">
              <Input
                placeholder="输入标签后按回车添加"
                onPressEnter={(e) => {
                  handleTagAdd(e.target.value);
                  e.target.value = '';
                }}
              />
              <div style={{ marginTop: 8 }}>
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleTagClose(tag)}
                    style={{ marginBottom: 4 }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </Form.Item>
          </Col>
          
          {/* 时间范围筛选 */}
          <Col xs={24} md={8}>
            <Form.Item label="创建时间" name="createdAt">
              <RangePicker 
                style={{ width: '100%' }}
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={8}>
            <Form.Item label="最后登录时间" name="lastLoginAt">
              <RangePicker 
                style={{ width: '100%' }}
                placeholder={['开始时间', '结束时间']}
              />
            </Form.Item>
          </Col>
          
          {/* 排序设置 */}
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="排序字段" name="sortField">
              <Select placeholder="选择排序字段" allowClear>
                <Option value="createdAt">创建时间</Option>
                <Option value="lastLoginAt">最后登录</Option>
                <Option value="lastActiveAt">最后活跃</Option>
                <Option value="username">用户名</Option>
                <Option value="email">邮箱</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="排序方向" name="sortOrder">
              <Select placeholder="选择排序方向" allowClear>
                <Option value="desc">降序</Option>
                <Option value="asc">升序</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {/* 操作按钮 */}
        <Row justify="end">
          <Col>
            <Space>
              <Button onClick={handleReset} icon={<ClearOutlined />}>
                重置
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<SearchOutlined />}
              >
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AdvancedSearch;
