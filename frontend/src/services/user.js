import api from './api';

// 用户管理相关API
export const userAPI = {
  // 获取用户列表
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // 获取用户详情
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // 创建新用户
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // 更新用户信息
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // 删除用户
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
