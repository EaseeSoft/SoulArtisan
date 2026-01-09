import request from './request';
import { AdminUser, LoginResponse } from '../types';

/**
 * 管理员登录
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await request.post<any, LoginResponse>('/api/admin/auth/login', {
    username,
    password,
  });

  // 保存 token
  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }

  return response;
};

/**
 * 管理员登出
 */
export const logout = async (): Promise<void> => {
  try {
    await request.post('/api/admin/auth/logout');
  } finally {
    // 无论请求成功与否，都清除本地存储
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }
};

/**
 * 获取当前管理员信息
 */
export const getCurrentUser = async (): Promise<AdminUser | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }

  try {
    const user = await request.get<any, AdminUser>('/api/admin/auth/info');
    // 缓存用户信息
    localStorage.setItem('user_data', JSON.stringify(user));
    return user;
  } catch (error) {
    // 如果获取用户信息失败，清除 token
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    return null;
  }
};

/**
 * 修改密码
 */
export const updatePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await request.put('/api/admin/auth/password', {
    oldPassword,
    newPassword,
  });
};