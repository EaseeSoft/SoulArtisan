/**
 * 资源类型定义
 * 使用 VideoResourceInfo 作为统一资源类型
 */

import type {
  VideoResourceInfo,
  ResourceType,
  ResourceStatus,
} from '../api/videoResource';

/**
 * 资源分类
 */
export type ResourceCategory = 'character' | 'scene' | 'prop' | 'skill';

/**
 * 统一资源类型
 */
export type UnifiedResourceInfo = VideoResourceInfo;

/**
 * 获取资源类型
 */
export function getResourceType(
  resource: VideoResourceInfo
): ResourceType | undefined {
  return resource.resourceType;
}

/**
 * 获取资源分类
 */
export function getResourceCategory(
  resource: VideoResourceInfo
): ResourceCategory | undefined {
  return resource.resourceType;
}

/**
 * 获取资源展示名称
 */
export function getResourceName(resource: VideoResourceInfo): string {
  return resource.resourceName;
}

/**
 * 获取资源展示图片
 */
export function getResourceImage(resource: VideoResourceInfo): string | undefined {
  return resource.characterImageUrl || undefined;
}

/**
 * 获取资源状态
 */
export function getResourceStatus(
  resource: VideoResourceInfo
): ResourceStatus {
  return resource.status;
}

/**
 * 判断资源是否完成
 */
export function isResourceCompleted(resource: VideoResourceInfo): boolean {
  return getResourceStatus(resource) === 'completed';
}

/**
 * 判断资源是否失败
 */
export function isResourceFailed(resource: VideoResourceInfo): boolean {
  return getResourceStatus(resource) === 'failed';
}

/**
 * 判断资源是否处理中
 */
export function isResourceProcessing(resource: VideoResourceInfo): boolean {
  const status = getResourceStatus(resource);
  return status === 'video_generating' || status === 'character_generating';
}

// 导出类型供其他模块使用
export type { VideoResourceInfo, ResourceType, ResourceStatus };
