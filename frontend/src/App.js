import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './App.css';

// 页面组件
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import UserProfile from './pages/UserProfile';

// 布局和路由保护组件
import AppLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// 服务
import { authStorage } from './services/auth';

function App() {
  const { isAuthenticated } = authStorage.getAuth();

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="App">
          <Routes>
            {/* 公开路由 */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
              } 
            />

            {/* 受保护的路由 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* 默认重定向到仪表盘 */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* 仪表盘 */}
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* 用户管理 - 需要管理员权限 */}
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requireAdmin>
                    <UserList />
                  </ProtectedRoute>
                } 
              />
              
              {/* 用户详情/编辑 */}
              <Route path="users/:id" element={<UserProfile />} />
            </Route>

            {/* 404 页面 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
