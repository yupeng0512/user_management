import React from 'react';
import { Progress, Tag, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import './PasswordStrengthIndicator.css';

const PasswordStrengthIndicator = ({ 
  password = '', 
  validation = null, 
  showDetails = true,
  size = 'default' 
}) => {
  // 如果没有密码输入，不显示指示器
  if (!password && !validation) {
    return null;
  }

  // 默认验证结果
  const defaultValidation = {
    isValid: false,
    strength: 'weak',
    strengthText: '弱',
    strengthColor: '#ff4d4f',
    score: 0,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    },
    suggestions: []
  };

  const result = validation || defaultValidation;

  // 强度配置
  const strengthConfig = {
    very_weak: { text: '非常弱', color: '#ff4d4f', percent: 20 },
    weak: { text: '弱', color: '#ff7875', percent: 40 },
    medium: { text: '中等', color: '#faad14', percent: 60 },
    strong: { text: '强', color: '#52c41a', percent: 80 },
    very_strong: { text: '非常强', color: '#389e0d', percent: 100 }
  };

  const config = strengthConfig[result.strength] || strengthConfig.weak;

  // 需求项配置
  const requirementConfig = [
    { key: 'length', label: '长度8-128位', icon: result.requirements.length },
    { key: 'uppercase', label: '包含大写字母', icon: result.requirements.uppercase },
    { key: 'lowercase', label: '包含小写字母', icon: result.requirements.lowercase },
    { key: 'number', label: '包含数字', icon: result.requirements.number },
    { key: 'special', label: '包含特殊字符(可选)', icon: result.requirements.special, optional: true }
  ];

  return (
    <div className={`password-strength-indicator ${size}`}>
      {/* 强度进度条 */}
      <div className="strength-progress">
        <Progress
          percent={result.score}
          strokeColor={config.color}
          showInfo={false}
          size="small"
          trailColor="#f5f5f5"
        />
        <div className="strength-info">
          <span className="strength-text" style={{ color: config.color }}>
            密码强度: {result.strengthText || config.text}
          </span>
          <span className="strength-score">
            {result.score}/100
          </span>
        </div>
      </div>

      {/* 详细要求和建议 */}
      {showDetails && (
        <div className="strength-details">
          {/* 密码要求 */}
          <div className="requirements">
            <div className="requirements-title">
              <InfoCircleOutlined /> 密码要求
            </div>
            <div className="requirements-list">
              {requirementConfig.map(req => (
                <div 
                  key={req.key} 
                  className={`requirement-item ${req.icon ? 'met' : 'unmet'} ${req.optional ? 'optional' : ''}`}
                >
                  {req.icon ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  <span>{req.label}</span>
                  {req.optional && (
                    <Tag size="small" color="blue">可选</Tag>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 改进建议 */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="suggestions">
              <div className="suggestions-title">
                <InfoCircleOutlined /> 改进建议
              </div>
              <div className="suggestions-list">
                {result.suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    • {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 强度说明 */}
          <div className="strength-guide">
            <Tooltip title="密码强度评分规则">
              <div className="strength-levels">
                {Object.entries(strengthConfig).map(([key, value]) => (
                  <div 
                    key={key} 
                    className={`strength-level ${result.strength === key ? 'current' : ''}`}
                  >
                    <div 
                      className="level-indicator" 
                      style={{ backgroundColor: value.color }}
                    />
                    <span>{value.text}</span>
                  </div>
                ))}
              </div>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
