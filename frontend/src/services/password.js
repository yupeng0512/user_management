import api from './api';

// 密码管理相关API
export const passwordAPI = {
  // 修改密码
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/password/change', passwordData);
    return response.data;
  },

  // 发起密码重置
  resetPassword: async (email) => {
    const response = await api.post('/auth/password/reset', { email });
    return response.data;
  },

  // 确认密码重置
  confirmResetPassword: async (resetData) => {
    const response = await api.post('/auth/password/reset/confirm', resetData);
    return response.data;
  },

  // 验证密码强度
  validatePassword: async (password) => {
    const response = await api.post('/auth/password/validate', { password });
    return response.data;
  },

  // 获取密码策略
  getPasswordPolicy: async () => {
    const response = await api.get('/auth/password/policy');
    return response.data;
  }
};

// 为了向后兼容，也导出单独的函数
export const {
  changePassword,
  resetPassword,
  confirmResetPassword,
  validatePassword,
  getPasswordPolicy
} = passwordAPI;
