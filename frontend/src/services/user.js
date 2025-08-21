import api from './api';

// 用户管理相关API
export const userAPI = {
  // 获取用户列表
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // 获取用户详情
  getUserById: async (id, params = {}) => {
    const response = await api.get(`/users/${id}`, { params });
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

  // 高级搜索用户
  searchUsers: async (searchData) => {
    const response = await api.post('/users/search', searchData);
    return response.data;
  },

  // 获取用户统计信息
  getUserStatistics: async (params = {}) => {
    const response = await api.get('/users/statistics', { params });
    return response.data;
  },

  // 获取在线用户列表
  getOnlineUsers: async (params = {}) => {
    const response = await api.get('/users/online', { params });
    return response.data;
  },
};

// 为了向后兼容，也导出单独的函数
export const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  getUserStatistics,
  getOnlineUsers
} = userAPI;
