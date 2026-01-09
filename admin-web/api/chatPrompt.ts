import request from './request';

/**
 * 聊天提示词配置信息
 */
export interface ChatPrompt {
  id: number;
  code: string;
  label: string;
  description: string | null;
  systemPrompt: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  isEnabled: number;  // 0-禁用 1-启用
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 更新提示词配置请求
 */
export interface ChatPromptUpdateRequest {
  label?: string;
  description?: string;
  systemPrompt: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  isEnabled?: number;
  sortOrder?: number;
}

/**
 * 创建提示词配置请求
 */
export interface ChatPromptCreateRequest {
  code: string;
  label: string;
  description?: string;
  systemPrompt: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  isEnabled?: number;
  sortOrder?: number;
}

/**
 * 获取提示词配置列表
 */
export const getChatPromptList = async (): Promise<ChatPrompt[]> => {
  return request.get('/api/admin/chat-prompts/list');
};

/**
 * 获取单个提示词配置
 */
export const getChatPromptById = async (id: number): Promise<ChatPrompt> => {
  return request.get(`/api/admin/chat-prompts/${id}`);
};

/**
 * 更新提示词配置
 */
export const updateChatPrompt = async (id: number, data: ChatPromptUpdateRequest): Promise<void> => {
  return request.put(`/api/admin/chat-prompts/${id}`, data);
};

/**
 * 切换启用状态
 */
export const toggleChatPromptEnabled = async (id: number, isEnabled: number): Promise<void> => {
  return request.put(`/api/admin/chat-prompts/${id}/toggle`, null, {
    params: { isEnabled },
  });
};

/**
 * 创建提示词配置
 */
export const createChatPrompt = async (data: ChatPromptCreateRequest): Promise<ChatPrompt> => {
  return request.post('/api/admin/chat-prompts', data);
};

/**
 * 刷新缓存
 */
export const refreshChatPromptCache = async (): Promise<void> => {
  return request.post('/api/admin/chat-prompts/refresh-cache');
};
