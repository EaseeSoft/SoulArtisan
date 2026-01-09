import request from './request';
import { Site, SiteConfig, SiteConfigRequest, SiteCreateRequest, SiteUpdateRequest, PageResult } from '../types';

/**
 * 获取站点列表
 */
export const getSiteList = async (pageNum: number = 1, pageSize: number = 10): Promise<PageResult<Site>> => {
  return request.get('/api/admin/site/list', {
    params: { pageNum, pageSize },
  });
};

/**
 * 获取站点详情
 */
export const getSiteDetail = async (siteId: number): Promise<Site> => {
  return request.get(`/api/admin/site/${siteId}`);
};

/**
 * 创建站点
 */
export const createSite = async (data: SiteCreateRequest): Promise<any> => {
  return request.post('/api/admin/site', data);
};

/**
 * 更新站点信息
 */
export const updateSite = async (siteId: number, data: SiteUpdateRequest): Promise<void> => {
  return request.put(`/api/admin/site/${siteId}`, data);
};

/**
 * 修改站点状态
 */
export const updateSiteStatus = async (siteId: number, status: number): Promise<void> => {
  return request.put(`/api/admin/site/${siteId}/status`, null, {
    params: { status },
  });
};

/**
 * 删除站点
 */
export const deleteSite = async (siteId: number): Promise<void> => {
  return request.delete(`/api/admin/site/${siteId}`);
};

/**
 * 重置站点管理员密码
 */
export const resetAdminPassword = async (siteId: number, newPassword: string): Promise<void> => {
  return request.put(`/api/admin/site/${siteId}/admin/password`, null, {
    params: { newPassword },
  });
};

/**
 * 获取站点配置
 */
export const getSiteConfig = async (siteId: number): Promise<SiteConfig> => {
  return request.get(`/api/admin/site/${siteId}/config`);
};

/**
 * 更新站点配置
 */
export const updateSiteConfig = async (siteId: number, data: SiteConfigRequest): Promise<void> => {
  return request.put(`/api/admin/site/${siteId}/config`, data);
};

// ============ 站点管理员专用接口 ============

/**
 * 获取当前站点详情（站点管理员）
 */
export const getMySiteDetail = async (): Promise<Site> => {
  return request.get('/api/admin/my-site/detail');
};

/**
 * 获取当前站点配置（站点管理员）
 */
export const getMySiteConfig = async (): Promise<SiteConfig> => {
  return request.get('/api/admin/my-site/config');
};

/**
 * 更新当前站点配置（站点管理员）
 */
export const updateMySiteConfig = async (data: SiteConfigRequest): Promise<void> => {
  return request.put('/api/admin/my-site/config', data);
};

// ============ 文件上传接口 ============

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
}

/**
 * 上传文件（管理员）
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/api/admin/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
