import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getUserInfo } from '../api/auth';

interface UserInfo {
  user_id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  points: number;
  role: string;
  role_name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  appId: string;
  login: (username: string, password: string, appId?: string) => Promise<boolean>;
  register: (userData: {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
    phone?: string;
  }, appId?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [appId, setAppId] = useState<string>('default');

  useEffect(() => {
    // 检查本地存储中的认证状态
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedUserInfo = localStorage.getItem('userInfo');
    const storedAppId = localStorage.getItem('appId');
    
    // 使用setTimeout避免在effect中直接调用setState
    const timer = setTimeout(() => {
      if (storedAuth === 'true' && storedAccessToken && storedUserInfo) {
        setIsAuthenticated(true);
        setAccessToken(storedAccessToken);
        setUserInfo(JSON.parse(storedUserInfo));
        setAppId(storedAppId || 'default');
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string, loginAppId: string = 'default'): Promise<boolean> => {
    try {
      // 调用后端登录接口
      const data = await authApi.login({ username, password, app_id: loginAppId });
      
      if (data.code === 200) {
        // 登录成功
        setIsAuthenticated(true);
        setUserInfo(data.data.user);
        setAccessToken(data.data.token);
        setAppId(loginAppId);
        
        // 存储到localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('accessToken', data.data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.data.user));
        localStorage.setItem('appId', loginAppId);
        
        return true;
      } else {
        // 登录失败
        console.error('Login failed:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    email?: string;
    nickname?: string;
    phone?: string;
  }, registerAppId: string = 'default'): Promise<{ success: boolean; message: string }> => {
    try {
      // 调用后端注册接口
      const data = await authApi.register({ ...userData, app_id: registerAppId });
      
      if (data.code === 200) {
        // 注册成功
        setIsAuthenticated(true);
        setUserInfo(data.data.user);
        setAccessToken(data.data.token);
        setAppId(registerAppId);
        
        // 存储到localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('accessToken', data.data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.data.user));
        localStorage.setItem('appId', registerAppId);
        
        return { success: true, message: '注册成功' };
      } else {
        // 注册失败
        return { success: false, message: data.msg || '注册失败' };
      }
    } catch (error) {
      console.error('Network error:', error);
      return { success: false, message: '网络错误，请稍后再试' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    setAccessToken(null);
    setAppId('default');

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('appId');
  };

  const refreshUserInfo = async () => {
    try {
      const response = await getUserInfo();
      if (response.code === 200 && response.data) {
        const updatedUser = {
          ...userInfo,
          ...response.data,
          role_name: userInfo?.role_name || ''
        } as UserInfo;
        setUserInfo(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  };

  const value = {
    isAuthenticated,
    userInfo,
    appId,
    login,
    register,
    logout,
    refreshUserInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
