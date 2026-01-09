/**
 * 剧本资源 API 封装
 * @deprecated 此文件已废弃，请使用 videoResource.ts
 * 保留此文件仅为了向后兼容
 */

import {
  VideoResourceInfo,
  ResourceType as VideoResourceType,
  ResourceStatus,
  ApiResponse,
  createVideoResource,
  batchCreateVideoResources,
  generateCharacter,
  getVideoResource,
  getProjectResources as _getProjectResources,
  getScriptResources as _getScriptResources,
  getVideoResourceList,
  updateVideoResource,
  deleteVideoResource,
  pollVideoResourceUntilComplete,
} from './videoResource';

// ========== 类型定义（兼容旧类型）==========

/**
 * 资源类型
 * @deprecated 请使用 videoResource.ResourceType
 */
export type ResourceType = 'video_character' | 'video_scene' | 'image_character' | 'image_scene';

/**
 * 资源分类
 */
export type ResourceCategory = 'character' | 'scene';

/**
 * 剧本资源信息
 * @deprecated 请使用 videoResource.VideoResourceInfo
 */
export interface ScriptResourceInfo {
  id: number;
  userId: number;
  siteId: number;
  scriptId: number;
  workflowProjectId: number;
  resourceType: ResourceType;
  resourceName: string;
  resourceCategory: ResourceCategory;
  status: ResourceStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  resourceDetails: any;
}

// 请求类型
export interface CreateVideoCharacterRequest {
  projectId: number;
  resourceName: string;
  timestamps: string;
  characterImageUrl?: string;
  isRealPerson?: boolean;
}

export interface CreateImageCharacterRequest {
  projectId: number;
  resourceName: string;
  imageUrl: string;
  imageFormat?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageUrlOss?: string;
  designPrompt?: string;
}

export interface CreateVideoSceneRequest {
  projectId: number;
  resourceName: string;
  timestamps: string;
}

export interface CreateImageSceneRequest {
  projectId: number;
  resourceName: string;
  imageUrl: string;
  imageFormat?: string;
  gridLayout?: string;
  sceneDescriptions?: string[];
  imageUrlOss?: string;
  designPrompt?: string;
}

// 导出类型
export type { ApiResponse, ResourceStatus };

// ========== 辅助函数：转换资源格式 ==========

const convertToScriptResource = (resource: VideoResourceInfo): ScriptResourceInfo => {
  const resourceType = resource.resourceType === 'character' ? 'video_character' :
    resource.resourceType === 'scene' ? 'video_scene' : 'video_character';

  return {
    id: resource.id,
    userId: resource.userId || 0,
    siteId: resource.siteId || 0,
    scriptId: resource.scriptId || 0,
    workflowProjectId: resource.workflowProjectId || 0,
    resourceType: resourceType as ResourceType,
    resourceName: resource.resourceName,
    resourceCategory: (resource.resourceType === 'scene' ? 'scene' : 'character') as ResourceCategory,
    status: resource.status,
    errorMessage: resource.errorMessage || undefined,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    completedAt: resource.completedAt || undefined,
    resourceDetails: {
      videoCharacterId: resource.characterId,
      generationTaskId: resource.generationTaskId,
      videoTaskId: resource.videoTaskId,
      videoUrl: resource.videoUrl,
      timestamps: resource.timestamps,
      startTime: resource.startTime,
      endTime: resource.endTime,
      characterImageUrl: resource.characterImageUrl,
      characterVideoUrl: resource.characterVideoUrl,
      isRealPerson: resource.isRealPerson,
      resultData: resource.resultData,
    },
  };
};

// ========== API 方法（兼容旧接口）==========

/**
 * 获取剧本下的所有资源
 * @deprecated 请使用 videoResource.getScriptResources
 */
export const getScriptResources = async (
  scriptId: number,
  category?: ResourceCategory
): Promise<ApiResponse<ScriptResourceInfo[]>> => {
  const result = await _getScriptResources(scriptId);
  if (result.code === 200) {
    let resources = result.data.resources.map(convertToScriptResource);
    if (category) {
      resources = resources.filter(r => r.resourceCategory === category);
    }
    return { ...result, data: resources };
  }
  return result as any;
};

/**
 * 获取剧本下的所有角色资源
 * @deprecated 请使用 videoResource.getScriptResources
 */
export const getCharacterResources = async (
  scriptId: number
): Promise<ApiResponse<ScriptResourceInfo[]>> => {
  return getScriptResources(scriptId, 'character');
};

/**
 * 获取剧本下的所有场景资源
 * @deprecated 请使用 videoResource.getScriptResources
 */
export const getSceneResources = async (
  scriptId: number
): Promise<ApiResponse<ScriptResourceInfo[]>> => {
  return getScriptResources(scriptId, 'scene');
};

/**
 * 获取项目下的所有资源
 * @deprecated 请使用 videoResource.getProjectResources
 */
export const getProjectResources = async (
  projectId: number
): Promise<ApiResponse<ScriptResourceInfo[]>> => {
  const result = await _getProjectResources(projectId);
  if (result.code === 200) {
    return {
      ...result,
      data: result.data.resources.map(convertToScriptResource),
    };
  }
  return result as any;
};

/**
 * 获取资源详情
 * @deprecated 请使用 videoResource.getVideoResource
 */
export const getResourceStatus = async (
  id: number
): Promise<ApiResponse<ScriptResourceInfo>> => {
  const result = await getVideoResource(id);
  if (result.code === 200) {
    return {
      ...result,
      data: convertToScriptResource(result.data),
    };
  }
  return result as any;
};

/**
 * 创建视频角色资源
 * @deprecated 请使用 videoResource.createVideoResource + videoResource.generateCharacter
 */
export const createVideoCharacter = async (
  params: CreateVideoCharacterRequest
): Promise<ApiResponse<ScriptResourceInfo>> => {
  const result = await createVideoResource({
    projectId: params.projectId,
    resourceName: params.resourceName,
    resourceType: 'character',
    imageUrl: params.characterImageUrl,
  });
  if (result.code === 200) {
    return {
      ...result,
      data: convertToScriptResource(result.data),
    };
  }
  return result as any;
};

/**
 * 创建图片角色资源
 * @deprecated 请使用 videoResource.createVideoResource
 */
export const createImageCharacter = async (
  params: CreateImageCharacterRequest
): Promise<ApiResponse<ScriptResourceInfo>> => {
  const result = await createVideoResource({
    projectId: params.projectId,
    resourceName: params.resourceName,
    resourceType: 'character',
    imageUrl: params.imageUrl,
    prompt: params.designPrompt,
  });
  if (result.code === 200) {
    return {
      ...result,
      data: convertToScriptResource(result.data),
    };
  }
  return result as any;
};

/**
 * 创建视频场景资源
 * @deprecated 请使用 videoResource.createVideoResource + videoResource.generateCharacter
 */
export const createVideoScene = async (
  params: CreateVideoSceneRequest
): Promise<ApiResponse<ScriptResourceInfo>> => {
  const result = await createVideoResource({
    projectId: params.projectId,
    resourceName: params.resourceName,
    resourceType: 'scene',
  });
  if (result.code === 200) {
    return {
      ...result,
      data: convertToScriptResource(result.data),
    };
  }
  return result as any;
};

/**
 * 创建图片场景资源
 * @deprecated 请使用 videoResource.createVideoResource
 */
export const createImageScene = async (
  params: CreateImageSceneRequest
): Promise<ApiResponse<ScriptResourceInfo>> => {
  const result = await createVideoResource({
    projectId: params.projectId,
    resourceName: params.resourceName,
    resourceType: 'scene',
    imageUrl: params.imageUrl,
    prompt: params.designPrompt,
  });
  if (result.code === 200) {
    return {
      ...result,
      data: convertToScriptResource(result.data),
    };
  }
  return result as any;
};

/**
 * 更新资源名称
 * @deprecated 请使用 videoResource.updateVideoResource
 */
export const updateResourceName = async (
  id: number,
  resourceName: string
): Promise<ApiResponse> => {
  return updateVideoResource(id, { resourceName });
};

/**
 * 删除资源
 * @deprecated 请使用 videoResource.deleteVideoResource
 */
export const deleteResource = async (id: number): Promise<ApiResponse> => {
  return deleteVideoResource(id);
};

/**
 * 轮询资源直到完成
 * @deprecated 请使用 videoResource.pollVideoResourceUntilComplete
 */
export const pollResourceUntilComplete = async (
  id: number,
  onProgress?: (resource: ScriptResourceInfo) => void,
  options: {
    interval?: number;
    maxAttempts?: number;
  } = {}
): Promise<ScriptResourceInfo> => {
  const result = await pollVideoResourceUntilComplete(
    id,
    onProgress ? (resource) => onProgress(convertToScriptResource(resource)) : undefined,
    options
  );
  return convertToScriptResource(result);
};

// ========== 工具函数 ==========

/**
 * 判断是否为视频资源
 */
export const isVideoResource = (resourceType: ResourceType): boolean => {
  return resourceType.startsWith('video_');
};

/**
 * 判断是否为图片资源
 */
export const isImageResource = (resourceType: ResourceType): boolean => {
  return resourceType.startsWith('image_');
};

/**
 * 判断是否为角色资源
 */
export const isCharacterResource = (resourceType: ResourceType): boolean => {
  return resourceType.endsWith('_character');
};

/**
 * 判断是否为场景资源
 */
export const isSceneResource = (resourceType: ResourceType): boolean => {
  return resourceType.endsWith('_scene');
};

/**
 * 获取资源的展示图片URL
 */
export const getResourceImageUrl = (
  resource: ScriptResourceInfo
): string | undefined => {
  const details = resource.resourceDetails;
  if (isVideoResource(resource.resourceType)) {
    return details?.characterImageUrl;
  } else {
    return details?.imageUrl;
  }
};

/**
 * 获取资源的视频URL
 */
export const getResourceVideoUrl = (
  resource: ScriptResourceInfo
): string | undefined => {
  const details = resource.resourceDetails;
  if (isVideoResource(resource.resourceType)) {
    return details?.videoUrl;
  }
  return undefined;
};

// 导出默认对象
export default {
  getScriptResources,
  getCharacterResources,
  getSceneResources,
  getProjectResources,
  getResourceStatus,
  createVideoCharacter,
  createImageCharacter,
  createVideoScene,
  createImageScene,
  updateResourceName,
  deleteResource,
  pollResourceUntilComplete,
  isVideoResource,
  isImageResource,
  isCharacterResource,
  isSceneResource,
  getResourceImageUrl,
  getResourceVideoUrl,
};
