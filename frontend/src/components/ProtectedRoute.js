import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authStorage } from '../services/auth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const { isAuthenticated, user } = authStorage.getAuth();

  // 未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 需要管理员权限但当前用户不是管理员
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
