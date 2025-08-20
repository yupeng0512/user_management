// 用户状态常量
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

// 用户状态标签
export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: '激活',
  [USER_STATUS.INACTIVE]: '禁用',
  [USER_STATUS.PENDING]: '待激活',
};

// 用户状态颜色
export const USER_STATUS_COLORS = {
  [USER_STATUS.ACTIVE]: 'success',
  [USER_STATUS.INACTIVE]: 'error',
  [USER_STATUS.PENDING]: 'warning',
};

// 用户角色常量
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// 用户角色标签
export const USER_ROLE_LABELS = {
  [USER_ROLES.USER]: '普通用户',
  [USER_ROLES.ADMIN]: '管理员',
};

// 表单验证规则
export const FORM_RULES = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 50, message: '用户名长度应在3-50个字符之间' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
  ],
  email: [
    { required: true, message: '请输入邮箱地址' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 8, message: '密码至少8个字符' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
  ],
  fullName: [
    { max: 100, message: '真实姓名最多100个字符' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
  ],
};

// 分页默认配置
export const PAGINATION_CONFIG = {
  defaultCurrent: 1,
  defaultPageSize: 20,
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
};
