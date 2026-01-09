/**
 * 认证 API 封装
 */

import { post, get } from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
  app_id?: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
  nickname?: string;
  phone?: string;
  app_id?: string;
}

export interface UserInfo {
  user_id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  points: number;
  role: string;
  role_name: string;
}

export interface LoginResponse {
  token_type: string;
  token: string;
  user: UserInfo;
}

export interface RegisterResponse {
  token_type: string;
  token: string;
  user: UserInfo;
}

export interface SystemConfig {
  enableRegister: boolean;
}

export interface ApiResponse<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data: T;
}

export const login = async (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
  const response = await post<ApiResponse<LoginResponse>>('/api/auth/login', params);
  return response.data;
};

export const register = async (params: RegisterParams): Promise<ApiResponse<RegisterResponse>> => {
  const response = await post<ApiResponse<RegisterResponse>>('/api/auth/register', params);
  return response.data;
};

export const getSystemConfig = async (): Promise<ApiResponse<SystemConfig>> => {
  const response = await get<ApiResponse<SystemConfig>>('/api/auth/system-config');
  return response.data;
};

export default {
  login,
  register,
  getSystemConfig,
};