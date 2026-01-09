/**
 * 角色创建 API 封装
 * @deprecated 此文件已废弃，请使用 videoResource.ts
 * 保留此文件仅为了向后兼容
 */

import {
  VideoResourceInfo,
  ResourceType,
  ResourceStatus,
  ApiResponse,
  createVideoResource,
  batchCreateVideoResources,
  generateCharacter,
  getVideoResource,
  getProjectResources,
  getVideoResourceList,
  updateVideoResource,
  deleteVideoResource,
  pollVideoResourceUntilComplete,
  createCharacterFromVideo as _createCharacterFromVideo,
  getProjectCharacters as _getProjectCharacters,
  batchCreateAssets as _batchCreateAssets,
} from './videoResource';

// ========== 类型定义（兼容旧类型）==========

export interface CreateCharacterFromVideoParams {
  projectId: number;
  url?: string;
  fromTask?: string;
  timestamps: string;
  characterType: 'character' | 'scene';
  characterName?: string;
}

export interface CharacterInfo {
  id: number;
  characterName: string;
  imageUrl: string;
  characterId: string;
  videoTaskId: string | null;
  videoUrl: string | null;
  characterType: 'character' | 'scene';
  timestamps: string;
  startTime: number;
  endTime: number;
  status: 'not_generated' | 'video_generating' | 'video_generated' | 'character_generating' | 'completed' | 'failed';
  resultData: any;
  characterImageUrl: string | null;
  characterVideoUrl: string | null;
  errorMessage: string | null;
  isRealPerson: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface BatchCreateAssetsParams {
  projectId: number;
  scriptId?: number;
  assets: {
    name: string;
    type: 'character' | 'scene' | 'prop' | 'skill';
    prompt?: string;
    imageUrl?: string;
  }[];
}

export interface BatchCreateAssetsResponse {
  projectId: number;
  successCount: number;
  failCount: number;
  assets: {
    id: number;
    name: string;
    type: string;
    status: string;
    imageUrl: string | null;
  }[];
}

// 导出类型
export type { ApiResponse };

// ========== 辅助函数：转换资源为旧格式 ==========

const convertToCharacterInfo = (resource: VideoResourceInfo): CharacterInfo => {
  return {
    id: resource.id,
    characterName: resource.resourceName,
    imageUrl: resource.characterImageUrl || '',
    characterId: resource.characterId || '',
    videoTaskId: resource.videoTaskId,
    videoUrl: resource.videoUrl,
    characterType: (resource.resourceType as 'character' | 'scene') || 'character',
    timestamps: resource.timestamps || '',
    startTime: resource.startTime || 0,
    endTime: resource.endTime || 0,
    status: resource.status,
    resultData: resource.resultData,
    characterImageUrl: resource.characterImageUrl,
    characterVideoUrl: resource.characterVideoUrl,
    errorMessage: resource.errorMessage,
    isRealPerson: resource.isRealPerson,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    completedAt: resource.completedAt,
  };
};

// ========== API 方法（兼容旧接口）==========

/**
 * 从视频创建角色
 * @deprecated 请使用 videoResource.createVideoResource + videoResource.generateCharacter
 */
export const createCharacterFromVideo = async (
  params: CreateCharacterFromVideoParams
): Promise<ApiResponse<CharacterInfo>> => {
  const result = await _createCharacterFromVideo(params);
  if (result.code === 200) {
    return {
      ...result,
      data: convertToCharacterInfo(result.data),
    };
  }
  return result as any;
};

/**
 * 查询角色状态
 * @deprecated 请使用 videoResource.getVideoResource
 */
export const getCharacterStatus = async (id: number): Promise<ApiResponse<CharacterInfo>> => {
  const result = await getVideoResource(id);
  if (result.code === 200) {
    return {
      ...result,
      data: convertToCharacterInfo(result.data),
    };
  }
  return result as any;
};

/**
 * 获取角色列表
 * @deprecated 请使用 videoResource.getVideoResourceList
 */
export const getCharacterList = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<ApiResponse<{
  list: CharacterInfo[];
  total: number;
  page: number;
  pageSize: number;
}>> => {
  const result = await getVideoResourceList(params as any);
  if (result.code === 200) {
    return {
      ...result,
      data: {
        ...result.data,
        list: result.data.list.map(convertToCharacterInfo),
      },
    };
  }
  return result as any;
};

/**
 * 获取项目的角色列表
 * @deprecated 请使用 videoResource.getProjectResources
 */
export const getProjectCharacters = async (
  projectId: number
): Promise<ApiResponse<{
  projectId: number;
  characters: CharacterInfo[];
  total: number;
}>> => {
  const result = await getProjectResources(projectId);
  if (result.code === 200) {
    return {
      ...result,
      data: {
        projectId: result.data.projectId,
        characters: result.data.resources.map(convertToCharacterInfo),
        total: result.data.total,
      },
    };
  }
  return result as any;
};

/**
 * 更新角色信息
 * @deprecated 请使用 videoResource.updateVideoResource
 */
export const updateCharacter = async (
  id: number,
  params: { characterName?: string }
): Promise<ApiResponse<CharacterInfo>> => {
  const result = await updateVideoResource(id, {
    resourceName: params.characterName,
  });
  if (result.code === 200) {
    return {
      ...result,
      data: convertToCharacterInfo(result.data),
    };
  }
  return result as any;
};

/**
 * 删除角色
 * @deprecated 请使用 videoResource.deleteVideoResource
 */
export const deleteCharacter = async (id: number): Promise<ApiResponse> => {
  return deleteVideoResource(id);
};

/**
 * 轮询角色直到完成
 * @deprecated 请使用 videoResource.pollVideoResourceUntilComplete
 */
export const pollCharacterUntilComplete = async (
  id: number,
  onProgress?: (character: CharacterInfo) => void,
  options: {
    interval?: number;
    maxAttempts?: number;
  } = {}
): Promise<CharacterInfo> => {
  const result = await pollVideoResourceUntilComplete(
    id,
    onProgress ? (resource) => onProgress(convertToCharacterInfo(resource)) : undefined,
    options
  );
  return convertToCharacterInfo(result);
};

/**
 * 批量创建资源
 * @deprecated 请使用 videoResource.batchCreateVideoResources
 */
export const batchCreateAssets = async (
  params: BatchCreateAssetsParams
): Promise<ApiResponse<BatchCreateAssetsResponse>> => {
  const result = await _batchCreateAssets(params);
  if (result.code === 200) {
    return {
      ...result,
      data: {
        projectId: result.data.projectId,
        successCount: result.data.successCount,
        failCount: result.data.failCount,
        assets: result.data.resources.map(r => ({
          id: r.id,
          name: r.resourceName,
          type: r.resourceType,
          status: r.status,
          imageUrl: r.characterImageUrl,
        })),
      },
    };
  }
  return result as any;
};

// 导出默认对象
export default {
  createCharacterFromVideo,
  getCharacterStatus,
  getCharacterList,
  getProjectCharacters,
  updateCharacter,
  deleteCharacter,
  pollCharacterUntilComplete,
  batchCreateAssets,
};
