import request from './request';
import { SystemConfig, SystemConfigRequest } from '../types';

// 获取系统配置（需要登录）
export const getSystemConfig = (): Promise<SystemConfig> => {
  return request.get('/api/admin/system/config');
};

// 更新系统配置（系统管理员）
export const updateSystemConfig = (data: SystemConfigRequest): Promise<void> => {
  return request.put('/api/admin/system/config', data);
};

// 获取公开系统配置（无需登录，用于登录页等）
export const getPublicSystemConfig = (): Promise<SystemConfig> => {
  return request.get('/api/public/system/config');
};
