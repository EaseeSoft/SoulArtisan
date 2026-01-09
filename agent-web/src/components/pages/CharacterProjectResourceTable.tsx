import React, { useState } from 'react';
import type { ProjectResource, ResourceType, ResourceStatus } from '@/api/characterProject';
import type { VideoResourceInfo } from '@/api/videoResource';
import VideoResourceTable from '@/components/dashboard/VideoResourceTable';
import '@/components/dashboard/ScriptDetail.css';

// 资源类型标签
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  skill: '技能',
};

interface CharacterProjectResourceTableProps {
  resources: ProjectResource[];
  projectStyle?: string;
  onResourcesChange: (resources: ProjectResource[]) => void;
  onDelete?: (resourceId: number, resourceName: string) => void;
}

/**
 * 将 ProjectResource 转换为 VideoResourceInfo 格式
 * 后端已统一返回格式，直接映射字段
 */
const convertToVideoResourceInfo = (resource: ProjectResource): VideoResourceInfo => {
  return {
    id: resource.id,
    scriptId: resource.scriptId ?? resource.sourceScriptId ?? null,
    workflowProjectId: resource.projectId ?? null,
    resourceName: resource.resourceName,
    resourceType: resource.resourceType as VideoResourceInfo['resourceType'],
    prompt: resource.prompt ?? null,
    aspectRatio: resource.aspectRatio ?? null,
    videoTaskId: resource.videoTaskId ?? null,
    videoUrl: resource.videoUrl ?? null,
    videoResultUrl: resource.videoResultUrl ?? null,
    startTime: resource.startTime ?? null,
    endTime: resource.endTime ?? null,
    timestamps: resource.timestamps ?? null,
    generationTaskId: resource.generationTaskId ?? null,
    characterId: resource.characterId ?? null,
    characterImageUrl: resource.characterImageUrl ?? null,
    characterVideoUrl: resource.characterVideoUrl ?? null,
    status: resource.status as VideoResourceInfo['status'],
    errorMessage: resource.errorMessage ?? null,
    isRealPerson: resource.isRealPerson ?? false,
    resultData: resource.resultData ?? null,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    completedAt: resource.completedAt ?? null,
    characterRequestedAt: resource.characterRequestedAt ?? null,
  };
};

/**
 * 将 VideoResourceInfo 转换回 ProjectResource 格式
 */
const convertToProjectResource = (
  videoResource: VideoResourceInfo,
  originalResource: ProjectResource
): ProjectResource => {
  return {
    ...originalResource,
    resourceName: videoResource.resourceName,
    resourceType: videoResource.resourceType as ResourceType,
    prompt: videoResource.prompt ?? undefined,
    aspectRatio: videoResource.aspectRatio ?? undefined,
    videoTaskId: videoResource.videoTaskId ?? undefined,
    videoUrl: videoResource.videoUrl ?? undefined,
    videoResultUrl: videoResource.videoResultUrl ?? undefined,
    startTime: videoResource.startTime ?? undefined,
    endTime: videoResource.endTime ?? undefined,
    timestamps: videoResource.timestamps ?? undefined,
    generationTaskId: videoResource.generationTaskId ?? undefined,
    characterId: videoResource.characterId ?? undefined,
    characterImageUrl: videoResource.characterImageUrl ?? undefined,
    characterVideoUrl: videoResource.characterVideoUrl ?? undefined,
    status: videoResource.status as ResourceStatus,
    errorMessage: videoResource.errorMessage ?? undefined,
    isRealPerson: videoResource.isRealPerson ?? undefined,
    resultData: videoResource.resultData ?? undefined,
    updatedAt: videoResource.updatedAt,
    completedAt: videoResource.completedAt ?? undefined,
    characterRequestedAt: videoResource.characterRequestedAt ?? undefined,
  };
};

const CharacterProjectResourceTable: React.FC<CharacterProjectResourceTableProps> = ({
  resources,
  projectStyle,
  onResourcesChange,
  onDelete,
}) => {
  // 预览模态框状态
  const [previewResource, setPreviewResource] = useState<VideoResourceInfo | null>(null);

  // 将 ProjectResource[] 转换为 VideoResourceInfo[]
  const videoResources = resources.map(convertToVideoResourceInfo);

  // 处理资源变更，将 VideoResourceInfo[] 转换回 ProjectResource[]
  const handleResourcesChange = (updatedVideoResources: VideoResourceInfo[]) => {
    const updatedResources = updatedVideoResources.map((vr) => {
      const originalResource = resources.find((r) => r.id === vr.id);
      if (originalResource) {
        return convertToProjectResource(vr, originalResource);
      }
      // 如果找不到原始资源，返回转换后的基本信息
      return {
        id: vr.id,
        resourceName: vr.resourceName,
        resourceType: vr.resourceType as ResourceType,
        prompt: vr.prompt ?? undefined,
        aspectRatio: vr.aspectRatio ?? undefined,
        videoTaskId: vr.videoTaskId ?? undefined,
        videoUrl: vr.videoUrl ?? undefined,
        videoResultUrl: vr.videoResultUrl ?? undefined,
        startTime: vr.startTime ?? undefined,
        endTime: vr.endTime ?? undefined,
        timestamps: vr.timestamps ?? undefined,
        generationTaskId: vr.generationTaskId ?? undefined,
        characterId: vr.characterId ?? undefined,
        characterImageUrl: vr.characterImageUrl ?? undefined,
        characterVideoUrl: vr.characterVideoUrl ?? undefined,
        status: vr.status as ResourceStatus,
        errorMessage: vr.errorMessage ?? undefined,
        isRealPerson: vr.isRealPerson ?? undefined,
        resultData: vr.resultData ?? undefined,
        projectId: vr.workflowProjectId ?? undefined,
        scriptId: vr.scriptId ?? undefined,
        sourceType: 'extract' as const,
        sortOrder: 0,
        createdAt: vr.createdAt,
        updatedAt: vr.updatedAt,
        completedAt: vr.completedAt ?? undefined,
        characterRequestedAt: vr.characterRequestedAt ?? undefined,
      };
    });
    onResourcesChange(updatedResources);
  };

  // 处理预览
  const handlePreview = (resource: VideoResourceInfo) => {
    setPreviewResource(resource);
  };

  // 处理删除
  const handleDelete = onDelete
    ? (resourceId: number, resourceName?: string) => {
        onDelete(resourceId, resourceName || '未命名资源');
      }
    : undefined;

  return (
    <>
      <VideoResourceTable
        resources={videoResources}
        scriptStyle={projectStyle}
        onResourcesChange={handleResourcesChange}
        onPreview={handlePreview}
        onDelete={handleDelete}
        readOnly={false}
      />

      {/* 预览模态框 */}
      {previewResource && (
        <div className="cpd-preview-overlay" onClick={() => setPreviewResource(null)}>
          <div className="cpd-preview-container" onClick={(e) => e.stopPropagation()}>
            <button className="cpd-preview-close" onClick={() => setPreviewResource(null)}>
              ×
            </button>
            {previewResource.characterImageUrl ? (
              <img
                src={previewResource.characterImageUrl}
                alt={previewResource.resourceName}
                className="cpd-preview-image"
              />
            ) : previewResource.videoUrl ? (
              <video
                src={previewResource.videoUrl}
                controls
                autoPlay
                className="cpd-preview-video"
              />
            ) : null}
            <div className="cpd-preview-info">
              <h3>{previewResource.resourceName}</h3>
              <span className={`cpd-resource-type ${previewResource.resourceType}`}>
                {RESOURCE_TYPE_LABELS[previewResource.resourceType]}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CharacterProjectResourceTable;
