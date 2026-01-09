import request from './request';
import { User, UserQueryRequest, UserStats, PageResult } from '../types';

/**
 * 用户更新请求
 */
export interface UserUpdateRequest {
  nickname?: string;
  email?: string;
  phone?: string;
  remark?: string;
}

/**
 * 创建用户请求
 */
export interface UserCreateRequest {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  points?: number;
}

/**
 * 获取用户列表
 */
export const getUserList = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: UserQueryRequest
): Promise<PageResult<User>> => {
  return request.get('/api/admin/user/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取用户详情
 */
export const getUserDetail = async (userId: number): Promise<User> => {
  return request.get(`/api/admin/user/${userId}`);
};

/**
 * 更新用户信息
 */
export const updateUser = async (userId: number, data: UserUpdateRequest): Promise<void> => {
  return request.put(`/api/admin/user/${userId}`, data);
};

/**
 * 修改用户状态
 */
export const updateUserStatus = async (userId: number, status: number): Promise<void> => {
  return request.put(`/api/admin/user/${userId}/status`, null, {
    params: { status },
  });
};

/**
 * 删除用户
 */
export const deleteUser = async (userId: number): Promise<void> => {
  return request.delete(`/api/admin/user/${userId}`);
};

/**
 * 重置用户密码
 */
export const resetUserPassword = async (userId: number, newPassword: string): Promise<void> => {
  return request.put(`/api/admin/user/${userId}/password`, null, {
    params: { newPassword },
  });
};

/**
 * 获取用户统计数据
 */
export const getUserStats = async (): Promise<UserStats> => {
  return request.get('/api/admin/user/stats');
};

/**
 * 创建用户（站点管理员）
 */
export const createUser = async (data: UserCreateRequest): Promise<void> => {
  return request.post('/api/admin/user', data);
};
