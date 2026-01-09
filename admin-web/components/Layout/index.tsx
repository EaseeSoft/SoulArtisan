import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemConfigStore } from '../../store/useSystemConfigStore';

const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { config } = useSystemConfigStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-x-hidden">
          <Outlet />
        </main>
        <footer className="min-h-12 border-t border-gray-200 flex flex-col items-center justify-center py-2 text-xs text-gray-400 bg-white">
          <div>{config.copyright}</div>
          {config.footerText && <div className="mt-1">{config.footerText}</div>}
          {config.icpBeian && (
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 hover:text-gray-600"
            >
              {config.icpBeian}
            </a>
          )}
        </footer>
      </div>
    </div>
  );
};

export default Layout;