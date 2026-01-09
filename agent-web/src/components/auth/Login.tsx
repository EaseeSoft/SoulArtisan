import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSystemConfig } from '../../api/auth';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enableRegister, setEnableRegister] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const response = await getSystemConfig();
        if (response.code === 0 && response.data) {
          setEnableRegister(response.data.enableRegister);
        }
      } catch (err) {
        console.error('Failed to fetch system config:', err);
      }
    };

    fetchSystemConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('用户名或密码错误');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('登录失败，请稍后再试');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>用户登录</h2>
          <p>欢迎使用AI Agent Video平台</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <button type="submit" className="login-button">登录</button>
        </form>
        
        <div className="login-footer">
          <button onClick={handleBackToHome} className="back-button">返回首页</button>
          {enableRegister && <Link to="/register" className="register-link">没有账号？立即注册</Link>}
        </div>
      </div>
    </div>
  );
};

export default Login;