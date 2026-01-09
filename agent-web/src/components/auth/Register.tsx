import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getSystemConfig } from '../../api/auth';
import './Register.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableRegister, setEnableRegister] = useState(true);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const response = await getSystemConfig();
        if (response.code === 0 && response.data) {
          setEnableRegister(response.data.enableRegister);
          if (!response.data.enableRegister) {
            setError('注册功能已关闭');
          }
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
    setSuccess('');

    if (!enableRegister) {
      setError('注册功能已关闭');
      return;
    }
    
    if (!username || !password || !confirmPassword) {
      setError('用户名和密码不能为空');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await register({
        username,
        password,
        email: email || undefined,
        nickname: nickname || undefined,
        phone: phone || undefined
      });

      if (result.success) {
        setSuccess('注册成功！即将跳转到登录页面...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: unknown) {
      console.error('Register error:', err);
      setError('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h2>用户注册</h2>
          <p>欢迎加入AI Agent Video平台</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">用户名 *</label>
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
            <label htmlFor="password">密码 *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码 *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="nickname">昵称</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入昵称"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">手机号</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
            />
          </div>
          
          <button 
            type="submit" 
            className="register-button" 
            disabled={loading || !enableRegister}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        <div className="register-footer">
          <button onClick={handleBackToHome} className="back-button">返回首页</button>
          <Link to="/login" className="login-link">已有账号？立即登录</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;