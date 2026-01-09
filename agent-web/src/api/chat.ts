/**
 * AI 聊天 API 封装
 */

import { post, get } from '../utils/request';

// ==================== 类型定义 ====================

/**
 * 简化的聊天请求（推荐使用）
 */
export interface SimpleChatRequest {
  content: string;
  model?: string;
  scenario?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 聊天完成请求
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  scenario?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
  stop?: string;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

/**
 * 聊天完成响应
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 聊天场景
 */
export interface ChatScenario {
  value: string;
  label: string;
  description: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
}

/**
 * 聊天模型
 */
export interface ChatModel {
  value: string;
  label: string;
  description: string;
}

/**
 * 角色列表项
 */
export interface CharacterListItem {
  name: string;
  prompt: string;
}

/**
 * 剧本解析请求
 */
export interface PlaybookAnalysisRequest {
  content: string;
}

/**
 * 剧本解析响应项
 */
export interface PlaybookAnalysisItem {
  name: string;
  content: string;
}

/**
 * 剧本资源解析项（包含类型）
 */
export interface PlaybookAssetItem {
  type: 'character' | 'scene' | 'prop' | 'skill';
  name: string;
  content: string;
}

/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// ==================== API 方法 ====================

/**
 * 发送聊天消息（简化版，推荐使用）
 * 只需传入消息内容，后端自动构建消息格式
 */
export const sendChatMessage = async (
  request: SimpleChatRequest
): Promise<ApiResponse<ChatCompletionResponse>> => {
  const response = await post<ApiResponse<ChatCompletionResponse>>(
    '/api/chat/send',
    request
  );
  return response.data;
};

/**
 * 发送聊天请求（完整版）
 * 支持多轮对话，需传入完整的 messages 数组
 */
export const chatCompletions = async (
  request: ChatCompletionRequest
): Promise<ApiResponse<ChatCompletionResponse>> => {
  const response = await post<ApiResponse<ChatCompletionResponse>>(
    '/api/chat/completions',
    request
  );
  return response.data;
};

/**
 * 获取聊天场景列表
 */
export const getChatScenarios = async (): Promise<ApiResponse<ChatScenario[]>> => {
  const response = await get<ApiResponse<ChatScenario[]>>('/api/chat/scenarios');
  return response.data;
};

/**
 * 获取场景提示词
 */
export const getScenarioPrompt = async (scenarioCode: string): Promise<ApiResponse<{
  scenario: string;
  prompt: string;
}>> => {
  const response = await get<ApiResponse<{
    scenario: string;
    prompt: string;
  }>>(`/api/chat/scenarios/${scenarioCode}/prompt`);
  return response.data;
};

/**
 * 获取可用的聊天模型列表
 */
export const getChatModels = async (): Promise<ApiResponse<ChatModel[]>> => {
  const response = await get<ApiResponse<ChatModel[]>>('/api/chat/models');
  return response.data;
};

/**
 * 解析角色列表
 * 调用 AI 接口获取角色解析结果，并将文本解析为角色列表
 *
 * @param request 聊天请求参数
 * @returns 角色列表，包含角色名和提示词
 */
export const parseCharacterList = async (
  request: SimpleChatRequest
): Promise<ApiResponse<CharacterListItem[]>> => {
  try {
    // 调用聊天接口获取 AI 返回的文本
    const response = await sendChatMessage(request);

    if (response.code !== 200 || !response.data?.choices?.[0]?.message?.content) {
      throw new Error(response.msg || '角色解析失败');
    }

    // 获取 AI 返回的文本内容
    const content = response.data.choices[0].message.content;

    // 解析文本为角色列表
    // 格式：角色名: 提示词\n角色名: 提示词
    const characterList: CharacterListItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue; // 跳过空行

      // 查找第一个冒号的位置
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex === -1) continue; // 跳过没有冒号的行

      // 提取角色名和提示词
      const name = trimmedLine.substring(0, colonIndex).trim();
      const prompt = trimmedLine.substring(colonIndex + 1).trim();

      if (name && prompt) {
        characterList.push({ name, prompt });
      }
    }

    // 返回解析后的角色列表
    return {
      code: 200,
      msg: '解析成功',
      data: characterList,
    };
  } catch (error) {
    console.error('角色列表解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '角色列表解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

/**
 * 解析角色列表（新接口）
 * 调用剧本解析接口提取角色信息
 *
 * @param content 剧本内容
 * @returns 角色列表，包含角色名和提示词
 */
export const parseRoleList = async (
  content: string
): Promise<ApiResponse<CharacterListItem[]>> => {
  try {
    const response = await post<ApiResponse<{ data: PlaybookAnalysisItem[] }>>(
      '/api/playbook-analysis/role',
      { content }
    );

    if (response.data.code !== 200 || !response.data.data?.data) {
      throw new Error(response.data.msg || '角色解析失败');
    }

    // 将 content 字段映射为 prompt 字段
    const characterList: CharacterListItem[] = response.data.data.data.map(item => ({
      name: item.name,
      prompt: item.content
    }));

    return {
      code: 200,
      msg: response.data.msg,
      data: characterList,
    };
  } catch (error) {
    console.error('角色列表解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '角色列表解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

/**
 * 解析场景列表（新接口）
 * 调用剧本解析接口提取场景信息
 *
 * @param content 剧本内容
 * @returns 场景列表，包含场景名和提示词
 */
export const parseSceneList = async (
  content: string
): Promise<ApiResponse<CharacterListItem[]>> => {
  try {
    const response = await post<ApiResponse<{ data: PlaybookAnalysisItem[] }>>(
      '/api/playbook-analysis/scene',
      { content }
    );

    if (response.data.code !== 200 || !response.data.data?.data) {
      throw new Error(response.data.msg || '场景解析失败');
    }

    // 将 content 字段映射为 prompt 字段
    const sceneList: CharacterListItem[] = response.data.data.data.map(item => ({
      name: item.name,
      prompt: item.content
    }));

    return {
      code: 200,
      msg: response.data.msg,
      data: sceneList,
    };
  } catch (error) {
    console.error('场景列表解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '场景列表解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

/**
 * 解析角色图片提示词（新接口）
 * 调用剧本解析接口提取角色图片生成提示词
 *
 * @param content 剧本内容
 * @returns 角色列表，包含角色名和图片提示词
 */
export const parseRoleImagePrompt = async (
  content: string
): Promise<ApiResponse<CharacterListItem[]>> => {
  try {
    const response = await post<ApiResponse<{ data: PlaybookAnalysisItem[] }>>(
      '/api/playbook-analysis/roleImagePrompt',
      { content }
    );

    if (response.data.code !== 200 || !response.data.data?.data) {
      throw new Error(response.data.msg || '角色图片提示词解析失败');
    }

    // 将 content 字段映射为 prompt 字段
    const roleList: CharacterListItem[] = response.data.data.data.map(item => ({
      name: item.name,
      prompt: item.content
    }));

    return {
      code: 200,
      msg: response.data.msg,
      data: roleList,
    };
  } catch (error) {
    console.error('角色图片提示词解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '角色图片提示词解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

/**
 * 解析场景图片提示词（新接口）
 * 调用剧本解析接口提取场景图片生成提示词
 *
 * @param content 剧本内容
 * @returns 场景列表，包含场景名和图片提示词
 */
export const parseSceneImagePrompt = async (
  content: string
): Promise<ApiResponse<CharacterListItem[]>> => {
  try {
    const response = await post<ApiResponse<{ data: PlaybookAnalysisItem[] }>>(
      '/api/playbook-analysis/sceneImagePrompt',
      { content }
    );

    if (response.data.code !== 200 || !response.data.data?.data) {
      throw new Error(response.data.msg || '场景图片提示词解析失败');
    }

    // 将 content 字段映射为 prompt 字段
    const sceneList: CharacterListItem[] = response.data.data.data.map(item => ({
      name: item.name,
      prompt: item.content
    }));

    return {
      code: 200,
      msg: response.data.msg,
      data: sceneList,
    };
  } catch (error) {
    console.error('场景图片提示词解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '场景图片提示词解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

/**
 * 解析剧本资源（角色、场景、道具、技能）
 * 调用剧本解析接口提取所有资源信息
 *
 * @param content 剧本内容
 * @returns 资源列表，包含类型、名称和提示词
 */
export const parsePlaybookAsset = async (
  content: string
): Promise<ApiResponse<PlaybookAssetItem[]>> => {
  try {
    const response = await post<ApiResponse<{ data: PlaybookAssetItem[] }>>(
      '/api/playbook-analysis/asset',
      { content }
    );

    if (response.data.code !== 200 || !response.data.data?.data) {
      throw new Error(response.data.msg || '剧本资源解析失败');
    }

    return {
      code: 200,
      msg: response.data.msg,
      data: response.data.data.data,
    };
  } catch (error) {
    console.error('剧本资源解析失败:', error);
    const errorMessage = error instanceof Error ? error.message : '剧本资源解析失败';
    return {
      code: 500,
      msg: errorMessage,
      data: [],
    };
  }
};

// 导出默认对象
export default {
  sendChatMessage,
  chatCompletions,
  getChatScenarios,
  getScenarioPrompt,
  getChatModels,
  parseCharacterList,
  parseRoleList,
  parseSceneList,
  parseRoleImagePrompt,
  parseSceneImagePrompt,
  parsePlaybookAsset,
};
