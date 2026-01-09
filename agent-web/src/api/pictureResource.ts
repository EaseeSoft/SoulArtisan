/**
 * 图片资源 API 封装
 */

import { post, get, put, del } from '../utils/request';

// ========== 类型定义 ==========

/**
 * 图片资源类型
 */
export type PictureResourceType = 'character' | 'scene' | 'prop' | 'skill';

/**
 * 图片资源状态
 */
export type PictureResourceStatus = 'pending' | 'generating' | 'generated';

/**
 * 资源类型标签映射
 */
export const RESOURCE_TYPE_LABELS: Record<PictureResourceType, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  skill: '技能',
};

/**
 * 资源状态标签映射
 */
export const RESOURCE_STATUS_LABELS: Record<PictureResourceStatus, string> = {
  pending: '未生成',
  generating: '生成中',
  generated: '已生成',
};

/**
 * 创建图片资源请求
 */
export interface CreatePictureResourceRequest {
  projectId?: number;
  scriptId?: number;
  name: string;
  type: PictureResourceType;
  imageUrl: string;
  prompt?: string;
}

/**
 * 图片资源响应
 */
export interface PictureResource {
  id: number;
  userId: number;
  siteId: number;
  scriptId: number;
  name: string;
  type: PictureResourceType;
  imageUrl: string;
  prompt?: string;
  status: PictureResourceStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// ========== API 方法 ==========

const API_BASE = '/api/picture-resource';

/**
 * 创建图片资源
 */
export const createPictureResource = async (
  request: CreatePictureResourceRequest
): Promise<ApiResponse<PictureResource>> => {
  const response = await post<ApiResponse<PictureResource>>(`${API_BASE}/create`, request);
  return response.data;
};

/**
 * 获取资源详情
 */
export const getPictureResource = async (id: number): Promise<ApiResponse<PictureResource>> => {
  const response = await get<ApiResponse<PictureResource>>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 获取剧本下的所有图片资源
 */
export const getPictureResourcesByScript = async (
  scriptId: number,
  type?: PictureResourceType
): Promise<ApiResponse<PictureResource[]>> => {
  const url = type ? `${API_BASE}/script/${scriptId}?type=${type}` : `${API_BASE}/script/${scriptId}`;
  const response = await get<ApiResponse<PictureResource[]>>(url);
  return response.data;
};

/**
 * 获取项目下的所有图片资源
 */
export const getPictureResourcesByProject = async (
  projectId: number,
  type?: PictureResourceType
): Promise<ApiResponse<PictureResource[]>> => {
  const url = type ? `${API_BASE}/project/${projectId}?type=${type}` : `${API_BASE}/project/${projectId}`;
  const response = await get<ApiResponse<PictureResource[]>>(url);
  return response.data;
};

/**
 * 根据类型获取图片资源列表
 */
export const getPictureResourcesByType = async (
  type: PictureResourceType
): Promise<ApiResponse<PictureResource[]>> => {
  const response = await get<ApiResponse<PictureResource[]>>(`${API_BASE}/type/${type}`);
  return response.data;
};

/**
 * 分页查询图片资源
 */
export const pagePictureResources = async (params: {
  scriptId?: number;
  type?: PictureResourceType;
  status?: PictureResourceStatus;
  current?: number;
  size?: number;
}): Promise<ApiResponse<{
  records: PictureResource[];
  total: number;
  size: number;
  current: number;
  pages: number;
}>> => {
  const response = await get<ApiResponse<any>>(`${API_BASE}/page`, { params });
  return response.data;
};

/**
 * 更新图片地址
 */
export const updatePictureImageUrl = async (
  id: number,
  imageUrl: string
): Promise<ApiResponse> => {
  const response = await put<ApiResponse>(`${API_BASE}/${id}/image-url`, { imageUrl });
  return response.data;
};

/**
 * 更新提示词
 */
export const updatePicturePrompt = async (
  id: number,
  prompt: string
): Promise<ApiResponse> => {
  const response = await put<ApiResponse>(`${API_BASE}/${id}/prompt`, { prompt });
  return response.data;
};

/**
 * 更新资源名称
 */
export const updatePictureName = async (
  id: number,
  name: string
): Promise<ApiResponse> => {
  const response = await put<ApiResponse>(`${API_BASE}/${id}/name`, { name });
  return response.data;
};

/**
 * 删除图片资源
 */
export const deletePictureResource = async (id: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 批量创建图片资源请求
 */
export interface BatchCreatePictureResourceRequest {
  scriptId: number;
  resources: {
    name: string;
    type: PictureResourceType;
    prompt?: string;
    imageUrl?: string;
  }[];
}

/**
 * 批量创建图片资源响应
 */
export interface BatchCreatePictureResourceResponse {
  scriptId: number;
  successCount: number;
  resources: {
    id: number;
    name: string;
    type: string;
    imageUrl: string | null;
    prompt: string | null;
    status: string;
    createdAt: string;
  }[];
}

/**
 * 批量创建图片资源
 */
export const batchCreatePictureResources = async (
  request: BatchCreatePictureResourceRequest
): Promise<ApiResponse<BatchCreatePictureResourceResponse>> => {
  const response = await post<ApiResponse<BatchCreatePictureResourceResponse>>(`${API_BASE}/batch-create`, request);
  return response.data;
};

// 导出默认对象
export default {
  createPictureResource,
  getPictureResource,
  getPictureResourcesByScript,
  getPictureResourcesByProject,
  getPictureResourcesByType,
  pagePictureResources,
  updatePictureImageUrl,
  updatePicturePrompt,
  updatePictureName,
  deletePictureResource,
  batchCreatePictureResources,
};
