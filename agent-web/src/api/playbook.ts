/**
 * 剧本解析 API 封装
 */

import { post } from '../utils/request';

// 类型定义
export interface PlayAnalysisRequest {
  content: string;
  characterProjectId?: number;
  style?: string;
  storyboardCount?: number;
}

export interface StoryboardItem {
  id: number;
  duration: string;
  summary: string;
  prompt: string;
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// API 方法

/**
 * 解析角色
 */
export const analysisRole = async (
  content: string
): Promise<ApiResponse> => {
  const response = await post<ApiResponse>('/api/playbook-analysis/role', { content });
  return response.data;
};

/**
 * 解析场景
 */
export const analysisScene = async (
  content: string
): Promise<ApiResponse> => {
  const response = await post<ApiResponse>('/api/playbook-analysis/scene', { content });
  return response.data;
};

/**
 * 解析分镜
 */
export const analysisCamera = async (
  params: PlayAnalysisRequest
): Promise<ApiResponse<{ storyboard: StoryboardItem[] }>> => {
  const response = await post<ApiResponse<{ storyboard: StoryboardItem[] }>>(
    '/api/playbook-analysis/camera',
    params
  );
  return response.data;
};

/**
 * 获取分镜列表
 */
export const getCameraList = async (
  params: PlayAnalysisRequest
): Promise<ApiResponse<any>> => {
  const response = await post<ApiResponse<any>>(
    '/api/playbook-analysis/getCameraList',
    params
  );
  return response.data;
};

/**
 * 获取分镜图提示词
 */
export const getCameraPrompt = async (
  content: string
): Promise<ApiResponse<string>> => {
  const response = await post<ApiResponse<string>>(
    '/api/playbook-analysis/getCameraPrompt',
    { content }
  );
  return response.data;
};

/**
 * 分镜图片转视频提示词请求参数
 */
export interface CameraImageToVideoPromptRequest {
  content: string;
  mediaUrl?: string;
}

/**
 * 分镜图片提示词转视频提示词
 * 将分镜图的图片生成提示词转换为适合视频生成的提示词
 * @param params - 包含 content（分镜剧本文案）和可选的 mediaUrl（图片路径）
 */
export const cameraImageToVideoPrompt = async (
  params: CameraImageToVideoPromptRequest | string
): Promise<ApiResponse<string>> => {
  // 兼容旧的调用方式（只传字符串）
  const requestParams = typeof params === 'string'
    ? { content: params }
    : params;

  const response = await post<ApiResponse<string>>(
    '/api/playbook-analysis/cameraImageToVideoPrompt',
    requestParams
  );
  return response.data;
};

/**
 * 媒体反推请求参数
 */
export interface MediaReverseRequest {
  mediaUrl: string;
  text?: string;
  model?: string;
}

/**
 * 图片反推提示词
 * 传入图片 URL，AI 分析图片内容并生成提示词
 */
export const imagePromptReverse = async (
  params: MediaReverseRequest
): Promise<ApiResponse<string>> => {
  const response = await post<ApiResponse<string>>(
    '/api/playbook-analysis/imagePromptReverse',
    params
  );
  return response.data;
};

/**
 * 视频反推提示词
 * 传入视频 URL，AI 分析视频内容并生成提示词
 */
export const videoPromptReverse = async (
  params: MediaReverseRequest
): Promise<ApiResponse<string>> => {
  const response = await post<ApiResponse<string>>(
    '/api/playbook-analysis/videoPromptReverse',
    params
  );
  return response.data;
};

/**
 * 资源项类型
 */
export interface AssetItem {
  name: string;
  type: 'character' | 'scene' | 'prop' | 'skill';
  prompt: string;
}

/**
 * 解析剧本资源响应
 */
export interface AssetAnalysisResponse {
  characters?: AssetItem[];
  scenes?: AssetItem[];
  props?: AssetItem[];
  skills?: AssetItem[];
}

/**
 * 解析剧本资源
 * 提取剧本中的角色、场景、道具、技能等资源信息
 */
export const analysisAsset = async (
  content: string
): Promise<ApiResponse<AssetAnalysisResponse>> => {
  const response = await post<ApiResponse<AssetAnalysisResponse>>(
    '/api/playbook-analysis/asset',
    { content }
  );
  return response.data;
};

/**
 * 解析剧本视频资源
 * 自动识别剧本中的视频资源信息
 */
export const analysisAssetVideo = async (
  content: string
): Promise<ApiResponse<AssetAnalysisResponse>> => {
  const response = await post<ApiResponse<AssetAnalysisResponse>>(
    '/api/playbook-analysis/assetVideo',
    { content }
  );
  return response.data;
};

/**
 * 视频资源项
 */
export interface VideoResourceItem {
  characterId: string;
  name: string;
  type?: string;
  videoUrl?: string;
}

/**
 * 提取视频资源请求参数
 */
export interface ExtractVideoResourceRequest {
  videoPrompt: string;
  resources: VideoResourceItem[];
}

/**
 * 提取视频资源
 * 将视频提示词中的资源引用替换为 @ID 格式
 */
export const extractVideoResource = async (
  params: ExtractVideoResourceRequest
): Promise<ApiResponse<string>> => {
  const response = await post<ApiResponse<string>>(
    '/api/playbook-analysis/extractVideoResource',
    params
  );
  return response.data;
};

// 导出默认对象
export default {
  analysisRole,
  analysisScene,
  analysisCamera,
  getCameraList,
  getCameraPrompt,
  cameraImageToVideoPrompt,
  imagePromptReverse,
  videoPromptReverse,
  analysisAsset,
  analysisAssetVideo,
  extractVideoResource,
};
