import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, Users, Image, Video, LogOut, FileText, Settings, Cog, KeyRound, Coins, Sliders, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemConfigStore } from '../../store/useSystemConfigStore';
import { message } from 'antd';

const Sidebar: React.FC = () => {
  const { user, logout, isSystemAdmin } = useAuthStore();
  const { config } = useSystemConfigStore();
  const navigate = useNavigate();

  const activeClass = "flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 transition-all";
  const inactiveClass = "flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all";

  const handleLogout = async () => {
    try {
      await logout();
      message.success('退出登录成功');
      navigate('/login');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        {config.systemLogo ? (
          <img src={config.systemLogo} alt="Logo" className="h-8 mr-3" />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
        )}
        <span className="font-bold text-xl text-gray-800 tracking-tight">{config.systemTitle}</span>
      </div>

      <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          概览
        </div>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <LayoutDashboard size={20} />
          <span>仪表盘</span>
        </NavLink>

        {isSystemAdmin() && (
          <>
            <div className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              系统管理
            </div>
            <NavLink to="/sites" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Globe size={20} />
              <span>站点管理</span>
            </NavLink>
            <NavLink to="/system/config" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Cog size={20} />
              <span>系统配置</span>
            </NavLink>
            <NavLink to="/points/config" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Sliders size={20} />
              <span>积分配置</span>
            </NavLink>
            <NavLink to="/chat-prompts" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <MessageSquare size={20} />
              <span>提示词配置</span>
            </NavLink>
          </>
        )}

        {!isSystemAdmin() && (
          <>
            <div className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              站点设置
            </div>
            <NavLink to="/my-site/config" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Settings size={20} />
              <span>站点配置</span>
            </NavLink>
            <NavLink to="/cardkeys" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <KeyRound size={20} />
              <span>卡密管理</span>
            </NavLink>
            <NavLink to="/points/records" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <Coins size={20} />
              <span>积分记录</span>
            </NavLink>
          </>
        )}

        <div className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          用户管理
        </div>
        <NavLink to="/users" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Users size={20} />
          <span>用户列表</span>
        </NavLink>

        <div className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          内容管理
        </div>
        <NavLink to="/tasks/images" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Image size={20} />
          <span>图片任务</span>
        </NavLink>
        <NavLink to="/tasks/videos" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
          <Video size={20} />
          <span>视频任务</span>
        </NavLink>

        {isSystemAdmin() && (
          <>
            <div className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              日志管理
            </div>
            <NavLink to="/logs/operation" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <FileText size={20} />
              <span>操作日志</span>
            </NavLink>
            <NavLink to="/logs/login" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
              <FileText size={20} />
              <span>登录日志</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-3 px-4">
          <div className="text-sm font-medium text-gray-700">{user?.realName}</div>
          <div className="text-xs text-gray-500">
            {user?.role === 'SYSTEM_ADMIN' ? '系统管理员' : '站点管理员'}
          </div>
          {user?.siteName && (
            <div className="text-xs text-indigo-600 mt-1">{user.siteName}</div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;