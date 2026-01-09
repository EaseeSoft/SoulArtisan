/**
 * 剧本管理 API 封装
 */

import { get, post, put, del } from '../utils/request';

const API_BASE = '/api/script';

// ========== 类型定义 ==========

export interface Script {
  id: number;
  name: string;
  description?: string;
  coverImage?: string;
  style?: string;
  status: 'active' | 'archived';
  pictureResourceCount?: number;
  videoResourceCount?: number;
  projectCount?: number;
  userRole?: 'creator' | 'member'; // 当前用户在剧本中的角色
  createdAt: string;
  updatedAt: string;
}

export interface CreateScriptRequest {
  name: string;
  description?: string;
  coverImage?: string;
  style?: string;
}

export interface UpdateScriptRequest {
  name?: string;
  description?: string;
  coverImage?: string;
  style?: string;
  status?: 'active' | 'archived';
}

export interface ScriptListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'active' | 'archived';
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CharacterInfo {
  id: number;
  characterName: string;
  characterId?: string;
  characterImageUrl?: string;
  characterVideoUrl?: string;
  videoUrl?: string;
  timestamps?: string;
  startTime?: number;
  endTime?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  characterType?: 'character' | 'scene';
  isRealPerson?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  // 与 character.ts 中的 CharacterInfo 保持兼容的可选属性
  imageUrl?: string;
  videoTaskId?: string | null;
  resultData?: any;
  errorMessage?: string | null;
}

export interface CopyCharacterRequest {
  targetScriptId: number;
  newCharacterName?: string;
}

// ========== 成员相关类型 ==========

export interface ScriptMember {
  id: number;
  scriptId: number;
  userId: number;
  username: string;
  nickname?: string;
  avatar?: string;
  role: 'creator' | 'member';
  createdAt: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
}

export interface ApiResponse<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data: T;
}

// ========== API 方法 ==========

/**
 * 创建剧本
 */
export const createScript = async (data: CreateScriptRequest): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(API_BASE, data);
  return response.data;
};

/**
 * 获取剧本详情
 */
export const getScript = async (id: number): Promise<Script> => {
  const response = await get<ApiResponse<Script>>(`${API_BASE}/${id}`);
  return response.data.data;
};

/**
 * 更新剧本
 */
export const updateScript = async (id: number, data: UpdateScriptRequest): Promise<ApiResponse> => {
  const response = await put<ApiResponse>(`${API_BASE}/${id}`, data);
  return response.data;
};

/**
 * 删除剧本
 */
export const deleteScript = async (id: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 获取剧本列表
 */
export const getScriptList = async (params: ScriptListParams = {}): Promise<ApiResponse> => {
  const response = await get<ApiResponse>(`${API_BASE}/list`, { params });
  return response.data;
};

/**
 * 获取简单剧本列表（用于下拉选择）
 */
export const getSimpleScriptList = async (): Promise<ApiResponse<Array<{ id: number; name: string; style?: string }>>> => {
  const response = await get<ApiResponse<Array<{ id: number; name: string; style?: string }>>>(`${API_BASE}/simple-list`);
  return response.data;
};

/**
 * 获取剧本角色列表
 */
export const getScriptCharacters = async (scriptId: number): Promise<ApiResponse<{
  scriptId: number;
  scriptName: string;
  characters: CharacterInfo[];
  total: number;
}>> => {
  const response = await get<ApiResponse<{
    scriptId: number;
    scriptName: string;
    characters: CharacterInfo[];
    total: number;
  }>>(`${API_BASE}/${scriptId}/characters`);
  return response.data;
};

/**
 * 获取剧本关联的项目列表
 */
export const getScriptProjects = async (scriptId: number): Promise<ApiResponse> => {
  const response = await get<ApiResponse>(`${API_BASE}/${scriptId}/projects`);
  return response.data;
};

/**
 * 复制角色到其他剧本
 */
export const copyCharacterToScript = async (characterId: number, data: CopyCharacterRequest): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(`/api/character/${characterId}/copy`, data);
  return response.data;
};

// ========== 成员管理 API ==========

/**
 * 获取剧本成员列表
 */
export const getScriptMembers = async (scriptId: number): Promise<ApiResponse<{
  scriptId: number;
  members: ScriptMember[];
  total: number;
}>> => {
  const response = await get<ApiResponse<{
    scriptId: number;
    members: ScriptMember[];
    total: number;
  }>>(`${API_BASE}/${scriptId}/members`);
  return response.data;
};

/**
 * 批量添加剧本成员
 */
export const addScriptMembers = async (scriptId: number, userIds: number[]): Promise<ApiResponse<{
  addedCount: number;
  skippedCount: number;
}>> => {
  const response = await post<ApiResponse<{
    addedCount: number;
    skippedCount: number;
  }>>(`${API_BASE}/${scriptId}/members`, { userIds });
  return response.data;
};

/**
 * 移除剧本成员
 */
export const removeScriptMember = async (scriptId: number, userId: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${scriptId}/members/${userId}`);
  return response.data;
};

/**
 * 搜索用户（用于添加成员）
 */
export const searchUsers = async (keyword: string): Promise<ApiResponse<UserSearchResult[]>> => {
  const response = await get<ApiResponse<UserSearchResult[]>>('/api/user/search', { params: { keyword } });
  return response.data;
};

// 导出默认对象
export default {
  createScript,
  getScript,
  updateScript,
  deleteScript,
  getScriptList,
  getSimpleScriptList,
  getScriptCharacters,
  getScriptProjects,
  copyCharacterToScript,
  getScriptMembers,
  addScriptMembers,
  removeScriptMember,
  searchUsers,
};
