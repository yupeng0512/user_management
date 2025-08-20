import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          if (window.location.pathname !== '/login') {
            message.error(data?.error?.message || '登录已过期，请重新登录');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
          break;
          
        case 403:
          message.error(data?.error?.message || '权限不足');
          break;
          
        case 404:
          message.error(data?.error?.message || '请求的资源不存在');
          break;
          
        case 409:
          message.error(data?.error?.message || '数据冲突');
          break;
          
        case 429:
          message.error(data?.error?.message || '请求过于频繁，请稍后重试');
          break;
          
        case 500:
          message.error(data?.error?.message || '服务器内部错误');
          break;
          
        default:
          message.error(data?.error?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请检查网络连接');
    } else {
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

export default api;
