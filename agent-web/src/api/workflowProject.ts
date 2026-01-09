/**
 * 工作流项目管理 API 封装
 */

import { get, post, put, del } from '../utils/request';

const API_BASE = '/api/workflow/project';

// ========== 类型定义 ==========

// 工作流类型
export type WorkflowType = 'character-resource' | 'storyboard';

export interface WorkflowData {
  nodes: any[];
  edges: any[];
  nodeOutputs: Record<string, any>;
  viewport?: { x: number; y: number; zoom: number };
}

export interface WorkflowProject {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  scriptId?: number;
  scriptName?: string;
  workflowType?: WorkflowType; // 工作流类型
  style?: string; // 项目风格
  workflowData?: WorkflowData;
  nodeCount: number;
  lastOpenedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  thumbnail?: string;
  scriptId?: number;
  workflowType?: WorkflowType; // 工作流类型
  style?: string; // 项目风格
  workflowData: WorkflowData;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  thumbnail?: string;
  scriptId?: number;
  workflowType?: WorkflowType; // 工作流类型
  style?: string; // 项目风格
  workflowData?: WorkflowData;
}

export interface ProjectListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  scriptId?: number;
  workflowType?: WorkflowType; // 按工作流类型筛选
  sortBy?: 'createdAt' | 'updatedAt' | 'lastOpenedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data: T;
}

// ========== API 方法 ==========

/**
 * 创建项目
 */
export const createProject = async (data: CreateProjectRequest): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(API_BASE, data);
  return response.data;
};

/**
 * 获取项目详情
 */
export const getProject = async (id: number): Promise<WorkflowProject> => {
  const response = await get<ApiResponse<WorkflowProject>>(`${API_BASE}/${id}`);
  return response.data.data;
};

/**
 * 更新项目
 */
export const updateProject = async (id: number, data: UpdateProjectRequest): Promise<ApiResponse> => {
  const response = await put<ApiResponse>(`${API_BASE}/${id}`, data);
  return response.data;
};

/**
 * 删除项目
 */
export const deleteProject = async (id: number): Promise<ApiResponse> => {
  const response = await del<ApiResponse>(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * 获取项目列表
 */
export const getProjectList = async (params: ProjectListParams = {}): Promise<ApiResponse> => {
  const response = await get<ApiResponse>(`${API_BASE}/list`, { params });
  return response.data;
};

/**
 * 复制项目
 */
export const duplicateProject = async (id: number): Promise<ApiResponse> => {
  const response = await post<ApiResponse>(`${API_BASE}/${id}/duplicate`);
  return response.data;
};

// 导出默认对象
export default {
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getProjectList,
  duplicateProject,
};
