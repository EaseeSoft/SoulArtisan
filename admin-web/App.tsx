import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SiteList from './pages/Site/List';
import CreateSite from './pages/Site/Create';
import EditSite from './pages/Site/Edit';
import MySiteConfig from './pages/MySite/Config';
import SystemConfig from './pages/System/Config';
import UserList from './pages/User/List';
import ImageTaskList from './pages/Content/ImageTaskList';
import VideoTaskList from './pages/Content/VideoTaskList';
import OperationLogList from './pages/Log/Operation';
import LoginLogList from './pages/Log/Login';
import CardKeyList from './pages/CardKey/List';
import PointsRecordList from './pages/Points/RecordList';
import PointsConfigPage from './pages/Points/Config';
import ChatPromptList from './pages/ChatPrompt/List';
import { useAuthStore } from './store/useAuthStore';
import { useSystemConfigStore } from './store/useSystemConfigStore';
import { setMessageInstance } from './utils/antdStatic';
import 'antd/dist/reset.css';

// 内部组件，用于初始化 antd 静态方法
const AppContent: React.FC = () => {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    setMessageInstance(message);
  }, [message]);

  return null;
};

function App() {
  const { isLoading, isAuthenticated, loadUser } = useAuthStore();
  const { loadConfig } = useSystemConfigStore();

  useEffect(() => {
    loadUser();
    loadConfig();
  }, [loadUser, loadConfig]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <AppContent />
        <HashRouter>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* 系统管理员 - 站点管理 */}
              <Route path="/sites" element={<SiteList />} />
              <Route path="/sites/create" element={<CreateSite />} />
              <Route path="/sites/edit/:id" element={<EditSite />} />

              {/* 系统管理员 - 系统配置 */}
              <Route path="/system/config" element={<SystemConfig />} />

              {/* 系统管理员 - 提示词配置 */}
              <Route path="/chat-prompts" element={<ChatPromptList />} />

              {/* 站点管理员 - 站点配置 */}
              <Route path="/my-site/config" element={<MySiteConfig />} />

              {/* 站点管理员 - 卡密管理 */}
              <Route path="/cardkeys" element={<CardKeyList />} />

              {/* 站点管理员 - 积分管理 */}
              <Route path="/points/records" element={<PointsRecordList />} />
              <Route path="/points/config" element={<PointsConfigPage />} />

              <Route path="/users" element={<UserList />} />

              <Route path="/tasks/images" element={<ImageTaskList />} />
              <Route path="/tasks/videos" element={<VideoTaskList />} />

              <Route path="/logs/operation" element={<OperationLogList />} />
              <Route path="/logs/login" element={<LoginLogList />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;