import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { config, loading } = useSiteConfig();

  const handleLogin = () => {
    navigate('/login');
  };

  // 获取显示名称（优先使用displayName，否则使用siteName）
  const displayName = config?.displayName || config?.siteName || 'AI Agent Video';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        {config?.logo ? (
          <img src={config.logo} alt={displayName} className="navbar-logo" />
        ) : (
          <>🎬</>
        )}
        {' '}{loading ? '...' : displayName}
      </Link>

      <div className="navbar-nav">
        <Link to="/" className="nav-link">首页</Link>
        <Link to="#features" className="nav-link">功能</Link>
        <Link to="#about" className="nav-link">关于</Link>
        <Link to="#contact" className="nav-link">联系</Link>
      </div>

      <div className="navbar-actions">
        <button className="login-button" onClick={handleLogin}>登录</button>
      </div>

      <button className="mobile-menu-button">☰</button>
    </nav>
  );
};

export default Navbar;