/**
 * 用户 API 封装
 */

import { post, get } from '../utils/request';

export interface PointsRecord {
  id: number;
  siteId: number;
  userId: number;
  type: number; // 1-收入 2-支出
  points: number;
  balance: number;
  source: string;
  sourceId?: number;
  remark?: string;
  operatorId?: number;
  operatorName?: string;
  createdAt: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data: T;
}

export interface RedeemResult {
  points: number;
  newBalance: number;
  message: string;
}

export interface UserInfo {
  user_id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  points: number;
  role: string;
}

export interface UpdateUserInfoParams {
  nickname?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordParams {
  oldPassword: string;
  newPassword: string;
}

/**
 * 获取用户信息
 */
export const getUserInfo = async (): Promise<ApiResponse<UserInfo>> => {
  const response = await get<ApiResponse<UserInfo>>('/api/user/info');
  return response.data;
};

/**
 * 获取积分记录
 */
export const getPointsRecords = async (
  pageNum: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PageResult<PointsRecord>>> => {
  const response = await get<ApiResponse<PageResult<PointsRecord>>>(
    `/api/user/points/records?pageNum=${pageNum}&pageSize=${pageSize}`
  );
  return response.data;
};

/**
 * 卡密充值
 */
export const redeemCardKey = async (cardCode: string): Promise<ApiResponse<RedeemResult>> => {
  const response = await post<ApiResponse<RedeemResult>>(
    `/api/user/cardkey/redeem?cardCode=${encodeURIComponent(cardCode)}`
  );
  return response.data;
};

/**
 * 更新用户信息
 */
export const updateUserInfo = async (params: UpdateUserInfoParams): Promise<ApiResponse<UserInfo>> => {
  const response = await post<ApiResponse<UserInfo>>('/api/user/update', params);
  return response.data;
};

/**
 * 修改密码
 */
export const updatePassword = async (params: UpdatePasswordParams): Promise<ApiResponse<{ message: string }>> => {
  const response = await post<ApiResponse<{ message: string }>>('/api/user/password', params);
  return response.data;
};

/**
 * 上传头像
 */
export const uploadAvatar = async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await post<ApiResponse<{ avatar: string }>>('/api/user/avatar', formData);
  return response.data;
};

export default {
  getUserInfo,
  getPointsRecords,
  redeemCardKey,
  updateUserInfo,
  updatePassword,
  uploadAvatar,
};
