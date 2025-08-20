import api from './api';

// 认证相关API
export const authAPI = {
  // 用户登录
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // 用户注册
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 用户登出
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// 本地存储管理
export const authStorage = {
  // 保存认证信息
  saveAuth: (authData) => {
    const { token, refreshToken, user } = authData;
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(user));
  },

  // 获取认证信息
  getAuth: () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return {
      token,
      refreshToken,
      user,
      isAuthenticated: !!token,
    };
  },

  // 清除认证信息
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // 更新用户信息
  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};
