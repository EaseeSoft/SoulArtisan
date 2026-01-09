/**
 * 视频资源 API 封装
 * 统一管理视频资源的创建、查询、生成角色等操作
 */

import { get, post, del } from '../utils/request';

// ========== 类型定义 ==========

/**
 * 资源类型
 */
export type ResourceType = 'character' | 'scene' | 'prop' | 'skill';

/**
 * 资源状态
 * 流转顺序: not_generated → video_generating → video_generated → character_generating → completed
 * - not_generated: 未生成（初始状态）
 * - video_generating: 视频生成中
 * - video_generated: 视频已生成
 * - character_generating: 角色生成中
 * - completed: 已完成
 * - failed: 失败
 */
export type ResourceStatus = 'not_generated' | 'video_generating' | 'video_generated' | 'character_generating' | 'completed' | 'failed';

/**
 * 视频资源信息
 */
export interface VideoResourceInfo {
  id: number;
  userId?: number;
  siteId?: number;
  scriptId: number | null;
  workflowProjectId: number | null;
  resourceName: string;
  resourceType: ResourceType;
  prompt: string | null;
  aspectRatio: string | null;  // 视频尺寸: 16:9-横版, 9:16-竖版
  videoTaskId: string | null;
  videoUrl: string | null;
  videoResultUrl: string | null;
  startTime: number | null;
  endTime: number | null;
  timestamps: string | null;
  generationTaskId: string | null;
  characterId: string | null;
  characterImageUrl: string | null;
  characterVideoUrl: string | null;
  status: ResourceStatus;
  errorMessage: string | null;
  isRealPerson: boolean;
  resultData: any;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  characterRequestedAt: string | null;  // 角色创建请求时间，用于超时重试判断
  // 兼容旧字段名
  projectId?: number;
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// ========== 请求类型 ==========

/**
 * 创建视频资源请求
 */
export interface CreateVideoResourceRequest {
  projectId: number;
  scriptId?: number;
  resourceName: string;
  resourceType?: ResourceType;
  prompt?: string;
  imageUrl?: string;
}

/**
 * 批量创建视频资源请求
 */
export interface BatchCreateVideoResourceRequest {
  projectId: number;
  scriptId?: number;
  resources: {
    name: string;
    type?: ResourceType;
    prompt?: string;
    imageUrl?: string;
  }[];
}

/**
 * 从视频生成角色请求
 */
export interface GenerateCharacterRequest {
  resourceId: number;
  videoUrl?: string;
  videoTaskId?: string;
  timestamps: string;
}

/**
 * 复制资源请求
 */
export interface CopyResourceRequest {
  targetScriptId: number;
  newResourceName?: string;
}

/**
 * 批量创建响应
 */
export interface BatchCreateResponse {
  projectId: number;
  successCount: number;
  failCount: number;
  resources: VideoResourceInfo[];
}

// ========== API 方法 ==========

const API_BASE = '/api/video-resource';

/**
 * 创建视频资源
 */
export const createVideoResource = async (
  params: CreateVideoResourceRequest
): Promise<ApiResponse<VideoResourceInfo>> => {
  const response = await post<ApiResponse<VideoResourceInfo>>(
    `${API_BASE}/create`,
    params
  );
  return response.data;
};

/**
 * 批量创建视频资源
 */
export const batchCreateVideoResources = async (
  params: BatchCreateVideoResourceRequest
): Promise<ApiResponse<BatchCreateResponse>> => {
  const response = await post<ApiResponse<BatchCreateResponse>>(
    `${API_BASE}/batch-create`,
    params
  );
  return response.data;
};

/**
 * 从视频生成角色
 */
export const generateCharacter = async (
  params: GenerateCharacterRequest
): Promise<ApiResponse<VideoResourceInfo>> => {
  const response = await post<ApiResponse<VideoResourceInfo>>(
    `${API_BASE}/generate-character`,
    params
  );
  return response.data;
};

/**
 * 获取资源详情
 */
export const getVideoResource = async (
  id: number
): Promise<ApiResponse<VideoResourceInfo>> => {
  const response = await get<ApiResponse<VideoResourceInfo>>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 获取项目的资源列表
 */
export const getProjectResources = async (
  projectId: number,
  resourceType?: ResourceType
): Promise<ApiResponse<{
  projectId: number;
  resources: VideoResourceInfo[];
  total: number;
}>> => {
  const url = resourceType
    ? `${API_BASE}/project/${projectId}?resourceType=${resourceType}`
    : `${API_BASE}/project/${projectId}`;
  const response = await get<ApiResponse<{
    projectId: number;
    resources: VideoResourceInfo[];
    total: number;
  }>>(url);
  return response.data;
};

/**
 * 获取剧本的资源列表
 */
export const getScriptResources = async (
  scriptId: number,
  resourceType?: ResourceType
): Promise<ApiResponse<{
  scriptId: number;
  scriptName: string;
  resources: VideoResourceInfo[];
  total: number;
}>> => {
  const url = resourceType
    ? `${API_BASE}/script/${scriptId}?resourceType=${resourceType}`
    : `${API_BASE}/script/${scriptId}`;
  const response = await get<ApiResponse<{
    scriptId: number;
    scriptName: string;
    resources: VideoResourceInfo[];
    total: number;
  }>>(url);
  return response.data;
};

/**
 * 获取资源列表（分页）
 */
export const getVideoResourceList = async (params?: {
  page?: number;
  pageSize?: number;
  status?: ResourceStatus;
}): Promise<ApiResponse<{
  list: VideoResourceInfo[];
  total: number;
  page: number;
  pageSize: number;
}>> => {
  const response = await get<ApiResponse<{
    list: VideoResourceInfo[];
    total: number;
    page: number;
    pageSize: number;
  }>>(`${API_BASE}/list`, { params });
  return response.data;
};

/**
 * 更新资源信息
 */
export const updateVideoResource = async (
  id: number,
  params: {
    resourceName?: string;
    resourceType?: ResourceType;
    prompt?: string;
    aspectRatio?: string;
    status?: ResourceStatus;
    videoTaskId?: string;
    videoUrl?: string;
    videoResultUrl?: string;
    errorMessage?: string;
  }
): Promise<ApiResponse<VideoResourceInfo>> => {
  const response = await post<ApiResponse<VideoResourceInfo>>(
    `${API_BASE}/update/${id}`,
    params
  );
  return response.data;
};

/**
 * 删除资源
 */
export const deleteVideoResource = async (id: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 复制资源到其他剧本
 */
export const copyVideoResource = async (
  id: number,
  params: CopyResourceRequest
): Promise<ApiResponse<{
  id: number;
  resourceName: string;
  scriptId: number;
  scriptName: string;
}>> => {
  const response = await post<ApiResponse<{
    id: number;
    resourceName: string;
    scriptId: number;
    scriptName: string;
  }>>(`${API_BASE}/${id}/copy`, params);
  return response.data;
};

/**
 * 轮询资源直到完成
 */
export const pollVideoResourceUntilComplete = async (
  id: number,
  onProgress?: (resource: VideoResourceInfo) => void,
  options: {
    interval?: number;      // 轮询间隔（毫秒），默认 5000
    maxAttempts?: number;   // 最大尝试次数，默认 120
  } = {}
): Promise<VideoResourceInfo> => {
  const { interval = 5000, maxAttempts = 120 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getVideoResource(id);

    if (result.code !== 200) {
      throw new Error(result.msg || '查询资源失败');
    }

    const resource = result.data;

    // 调用进度回调
    if (onProgress) {
      onProgress(resource);
    }

    // 资源创建完成
    if (resource.status === 'completed') {
      return resource;
    }

    // 资源创建失败
    if (resource.status === 'failed') {
      throw new Error(resource.errorMessage || '资源创建失败');
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('资源创建超时：超过最大轮询次数');
};

// ========== 兼容旧 API 的方法 ==========

/**
 * 从视频创建角色（兼容旧 character API）
 * @deprecated 请使用 createVideoResource + generateCharacter
 */
export const createCharacterFromVideo = async (params: {
  projectId: number;
  url?: string;
  fromTask?: string;
  timestamps: string;
  characterType?: 'character' | 'scene';
  characterName?: string;
}): Promise<ApiResponse<VideoResourceInfo>> => {
  // 先创建资源
  const createResult = await createVideoResource({
    projectId: params.projectId,
    resourceName: params.characterName || '未命名资源',
    resourceType: params.characterType || 'character',
  });

  if (createResult.code !== 200) {
    return createResult;
  }

  // 然后生成角色
  return generateCharacter({
    resourceId: createResult.data.id,
    videoUrl: params.url,
    videoTaskId: params.fromTask,
    timestamps: params.timestamps,
  });
};

/**
 * 获取项目的角色列表（兼容旧 character API）
 * @deprecated 请使用 getProjectResources
 */
export const getProjectCharacters = async (
  projectId: number
): Promise<ApiResponse<{
  projectId: number;
  characters: VideoResourceInfo[];
  total: number;
}>> => {
  const result = await getProjectResources(projectId);
  if (result.code === 200) {
    return {
      ...result,
      data: {
        projectId: result.data.projectId,
        characters: result.data.resources,
        total: result.data.total,
      }
    };
  }
  return result as any;
};

/**
 * 批量创建资源（兼容旧 character API）
 * @deprecated 请使用 batchCreateVideoResources
 */
export const batchCreateAssets = async (params: {
  projectId: number;
  scriptId?: number;
  assets: {
    name: string;
    type: 'character' | 'scene' | 'prop' | 'skill';
    prompt?: string;
    imageUrl?: string;
  }[];
}): Promise<ApiResponse<BatchCreateResponse>> => {
  return batchCreateVideoResources({
    projectId: params.projectId,
    scriptId: params.scriptId,
    resources: params.assets,
  });
};

// 导出默认对象
export default {
  createVideoResource,
  batchCreateVideoResources,
  generateCharacter,
  getVideoResource,
  getProjectResources,
  getScriptResources,
  getVideoResourceList,
  updateVideoResource,
  deleteVideoResource,
  copyVideoResource,
  pollVideoResourceUntilComplete,
  // 兼容旧 API
  createCharacterFromVideo,
  getProjectCharacters,
  batchCreateAssets,
};
