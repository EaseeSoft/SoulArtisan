/**
 * 角色项目 API 封装
 * 包含项目管理、资源管理、分镜管理等完整功能
 */

import { get, post, put, del } from '../utils/request';

const API_BASE = '/api/character-project';

// ========== 类型定义 ==========

/**
 * 项目状态
 */
export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

/**
 * 资源类型
 */
export type ResourceType = 'character' | 'scene' | 'prop' | 'skill';

/**
 * 资源来源类型
 */
export type SourceType = 'extract' | 'script';

/**
 * 资源状态
 */
export type ResourceStatus = 'not_generated' | 'video_generating' | 'video_generated' | 'character_generating' | 'completed' | 'failed';

/**
 * 分镜状态
 */
export type StoryboardStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * 资源角色
 */
export type ResourceRole = 'main_character' | 'supporting' | 'scene' | 'prop';

/**
 * 角色项目信息
 */
export interface CharacterProject {
  id: number;
  userId: number;
  siteId: number;
  name: string;
  description?: string;
  scriptId?: number;
  scriptName?: string;
  style?: string;
  scriptContent?: string;
  currentStep: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 项目资源信息
 * 字段与 VideoResourceInfo 保持一致
 */
export interface ProjectResource {
  id: number;
  resourceName: string;
  resourceType: ResourceType;
  prompt?: string;
  aspectRatio?: string;
  videoTaskId?: string;
  videoUrl?: string;
  videoResultUrl?: string;
  startTime?: number;
  endTime?: number;
  timestamps?: string;
  generationTaskId?: string;
  characterId?: string;
  characterImageUrl?: string;
  characterVideoUrl?: string;
  status: ResourceStatus;
  errorMessage?: string;
  isRealPerson?: boolean;
  resultData?: any;
  projectId?: number;
  scriptId?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  characterRequestedAt?: string;
  // 角色项目特有字段
  sourceType: SourceType;
  sourceScriptId?: number;
  sourceScriptName?: string;
  sortOrder: number;
}

/**
 * 分镜信息
 */
export interface Storyboard {
  id: number;
  projectId: number;
  sceneNumber: number;
  sceneName?: string;
  sceneDescription?: string;
  videoPrompt?: string;
  videoTaskId?: number;
  videoUrl?: string;
  status: StoryboardStatus;
  errorMessage?: string;
  resources: StoryboardResource[];
  videos: StoryboardVideo[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 分镜关联的资源信息
 */
export interface StoryboardResource {
  resourceId: number;
  resourceName: string;
  resourceType: ResourceType;
  resourceRole?: ResourceRole;
  characterImageUrl?: string;
  characterId?: string;
  sortOrder: number;
}

/**
 * 分镜视频信息
 */
export interface StoryboardVideo {
  id: number;
  taskId?: string;
  videoUrl?: string;
  prompt?: string;
  aspectRatio?: string;
  duration?: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
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
 * 创建项目请求
 */
export interface CreateProjectRequest {
  name: string;
  description?: string;
  scriptId?: number;
  style?: string;
}

/**
 * 更新项目请求
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  style?: string;
  scriptContent?: string;
  currentStep?: number;
  status?: ProjectStatus;
}

/**
 * 保存剧本内容请求
 */
export interface SaveScriptRequest {
  scriptContent: string;
  style?: string;
}

/**
 * 提取资源请求
 */
export interface ExtractResourcesRequest {
  scriptContent: string;
}

/**
 * 批量创建资源项
 */
export interface BatchResourceItem {
  resourceName: string;
  resourceType?: ResourceType;
  prompt?: string;
}

/**
 * 批量创建资源请求
 */
export interface BatchCreateResourcesRequest {
  resources: BatchResourceItem[];
}

/**
 * 绑定资源请求
 */
export interface BindResourcesRequest {
  scriptId: number;
  resourceIds: number[];
}

/**
 * 生成资源视频请求
 */
export interface GenerateResourceRequest {
  characterImageUrl?: string;
  prompt?: string;
}

/**
 * 批量创建分镜项
 */
export interface BatchStoryboardItem {
  sceneNumber: number;
  sceneName?: string;
  sceneDescription?: string;
  resources: {
    resourceId: number;
    resourceRole?: ResourceRole;
  }[];
}

/**
 * 批量创建分镜请求
 */
export interface BatchCreateStoryboardsRequest {
  storyboards: BatchStoryboardItem[];
}

/**
 * 绑定分镜资源请求
 */
export interface BindStoryboardResourcesRequest {
  resources: {
    resourceId: number;
    resourceRole?: ResourceRole;
  }[];
}

/**
 * 批量生成分镜请求
 */
export interface BatchGenerateStoryboardsRequest {
  storyboardIds: number[];
}

/**
 * 更新分镜请求
 */
export interface UpdateStoryboardRequest {
  sceneName?: string;
  sceneDescription?: string;
  videoPrompt?: string;
}

// ========== API 方法：项目管理 ==========

/**
 * 创建角色项目
 */
export const createProject = async (data: CreateProjectRequest): Promise<ApiResponse<CharacterProject>> => {
  const response = await post<ApiResponse<CharacterProject>>(API_BASE, data);
  return response.data;
};

/**
 * 获取项目列表
 */
export const getProjectList = async (params?: {
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<{
  list: CharacterProject[];
  total: number;
  page: number;
  pageSize: number;
}>> => {
  const response = await get<ApiResponse<{
    list: CharacterProject[];
    total: number;
    page: number;
    pageSize: number;
  }>>(`${API_BASE}/list`, { params });
  return response.data;
};

/**
 * 获取项目详情
 */
export const getProject = async (projectId: number): Promise<ApiResponse<CharacterProject>> => {
  const response = await get<ApiResponse<CharacterProject>>(`${API_BASE}/${projectId}`);
  return response.data;
};

/**
 * 更新项目
 */
export const updateProject = async (projectId: number, data: UpdateProjectRequest): Promise<ApiResponse<CharacterProject>> => {
  const response = await put<ApiResponse<CharacterProject>>(`${API_BASE}/${projectId}`, data);
  return response.data;
};

/**
 * 删除项目
 */
export const deleteProject = async (projectId: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${projectId}`);
  return response.data;
};

// ========== API 方法：步骤1 - 剧本管理 ==========

/**
 * 保存剧本内容
 */
export const saveScript = async (projectId: number, data: SaveScriptRequest): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(`${API_BASE}/${projectId}/script`, data);
  return response.data;
};

// ========== API 方法：步骤2 - 资源管理 ==========

/**
 * 批量创建资源
 */
export const batchCreateResources = async (
  projectId: number,
  data: BatchCreateResourcesRequest
): Promise<ApiResponse<ProjectResource[]>> => {
  const response = await post<ApiResponse<ProjectResource[]>>(
    `${API_BASE}/${projectId}/resources/batch`,
    data
  );
  return response.data;
};

/**
 * 绑定已有资源
 */
export const bindResources = async (
  projectId: number,
  data: BindResourcesRequest
): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(
    `${API_BASE}/${projectId}/resources/bind`,
    data
  );
  return response.data;
};

/**
 * 解绑资源
 */
export const unbindResource = async (projectId: number, resourceId: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${projectId}/resources/${resourceId}/unbind`);
  return response.data;
};

/**
 * 获取项目资源列表
 */
export const getProjectResources = async (projectId: number): Promise<ApiResponse<ProjectResource[]>> => {
  const response = await get<ApiResponse<ProjectResource[]>>(`${API_BASE}/${projectId}/resources`);
  return response.data;
};

/**
 * 获取可选资源列表（从剧本）
 */
export const getAvailableResources = async (
  projectId: number,
  scriptId: number
): Promise<ApiResponse<{
  scriptId: number;
  scriptName: string;
  resources: Array<ProjectResource & { alreadyBound: boolean }>;
}>> => {
  const response = await get<ApiResponse<{
    scriptId: number;
    scriptName: string;
    resources: Array<ProjectResource & { alreadyBound: boolean }>;
  }>>(`${API_BASE}/${projectId}/available-resources`, {
    params: { scriptId }
  });
  return response.data;
};

/**
 * 生成资源视频
 */
export const generateResourceVideo = async (
  projectId: number,
  resourceId: number,
  data: GenerateResourceRequest
): Promise<ApiResponse<ProjectResource>> => {
  const response = await post<ApiResponse<ProjectResource>>(
    `${API_BASE}/${projectId}/resources/${resourceId}/generate`,
    data
  );
  return response.data;
};

/**
 * 删除资源
 */
export const deleteResource = async (projectId: number, resourceId: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${projectId}/resources/${resourceId}`);
  return response.data;
};

// ========== API 方法：步骤3 - 分镜管理 ==========

/**
 * 批量创建分镜
 */
export const batchCreateStoryboards = async (
  projectId: number,
  data: BatchCreateStoryboardsRequest
): Promise<ApiResponse<Storyboard[]>> => {
  const response = await post<ApiResponse<Storyboard[]>>(
    `${API_BASE}/${projectId}/storyboards/batch`,
    data
  );
  return response.data;
};

/**
 * 获取分镜列表
 */
export const getStoryboards = async (projectId: number): Promise<ApiResponse<Storyboard[]>> => {
  const response = await get<ApiResponse<Storyboard[]>>(`${API_BASE}/${projectId}/storyboards`);
  return response.data;
};

/**
 * 绑定分镜资源
 */
export const bindStoryboardResources = async (
  projectId: number,
  storyboardId: number,
  data: BindStoryboardResourcesRequest
): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(
    `${API_BASE}/${projectId}/storyboards/${storyboardId}/resources`,
    data
  );
  return response.data;
};

/**
 * 解绑分镜资源
 */
export const unbindStoryboardResource = async (
  projectId: number,
  storyboardId: number,
  resourceId: number
): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(
    `${API_BASE}/${projectId}/storyboards/${storyboardId}/resources/${resourceId}`
  );
  return response.data;
};

/**
 * 生成分镜视频
 */
export const generateStoryboardVideo = async (
  projectId: number,
  storyboardId: number
): Promise<ApiResponse<Storyboard>> => {
  const response = await post<ApiResponse<Storyboard>>(
    `${API_BASE}/${projectId}/storyboards/${storyboardId}/generate`
  );
  return response.data;
};

/**
 * 批量生成分镜视频
 */
export const batchGenerateStoryboards = async (
  projectId: number,
  data: BatchGenerateStoryboardsRequest
): Promise<ApiResponse<Storyboard[]>> => {
  const response = await post<ApiResponse<Storyboard[]>>(
    `${API_BASE}/${projectId}/storyboards/batch-generate`,
    data
  );
  return response.data;
};

/**
 * 更新分镜
 */
export const updateStoryboard = async (
  projectId: number,
  storyboardId: number,
  data: UpdateStoryboardRequest
): Promise<ApiResponse<Storyboard>> => {
  const response = await put<ApiResponse<Storyboard>>(
    `${API_BASE}/${projectId}/storyboards/${storyboardId}`,
    data
  );
  return response.data;
};

/**
 * 删除分镜
 */
export const deleteStoryboard = async (projectId: number, storyboardId: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${projectId}/storyboards/${storyboardId}`);
  return response.data;
};

// 导出默认对象
export default {
  // 项目管理
  createProject,
  getProjectList,
  getProject,
  updateProject,
  deleteProject,
  // 剧本管理
  saveScript,
  // 资源管理
  batchCreateResources,
  bindResources,
  unbindResource,
  getProjectResources,
  getAvailableResources,
  generateResourceVideo,
  deleteResource,
  // 分镜管理
  batchCreateStoryboards,
  getStoryboards,
  bindStoryboardResources,
  unbindStoryboardResource,
  generateStoryboardVideo,
  batchGenerateStoryboards,
  updateStoryboard,
  deleteStoryboard,
};
