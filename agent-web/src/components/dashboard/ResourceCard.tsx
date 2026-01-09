import React from 'react';
import {
  ScriptResourceInfo,
  isVideoResource,
  isCharacterResource,
} from '@/api/scriptResource';
import './ResourceCard.css';

interface ResourceCardProps {
  resource: ScriptResourceInfo;
  projectName?: string;
  onDelete?: (resource: ScriptResourceInfo) => void;
  onPreview?: (resource: ScriptResourceInfo) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  projectName,
  onDelete,
  onPreview,
}) => {
  const getStatusText = (status: ScriptResourceInfo['status']) => {
    const statusMap: Record<string, string> = {
      pending: '等待中',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status: ScriptResourceInfo['status']) => {
    const classMap: Record<string, string> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      failed: 'failed',
    };
    return classMap[status] || '';
  };

  const getResourceTypeLabel = (resourceType: ScriptResourceInfo['resourceType']) => {
    const typeLabels: Record<string, string> = {
      video_character: '视频角色',
      image_character: '图片角色',
      video_scene: '视频场景',
      image_scene: '图片场景',
    };
    return typeLabels[resourceType] || resourceType;
  };

  const typeLabel = getResourceTypeLabel(resource.resourceType);

  const getPreviewUrl = (): string | undefined => {
    const details = resource.resourceDetails as any;
    if (!details) return undefined;

    if (isVideoResource(resource.resourceType)) {
      // 视频资源返回封面图
      return details.characterImageUrl || details.videoUrl;
    } else {
      // 图片资源返回图片URL
      return details.imageUrl;
    }
  };

  const getVideoUrl = (): string | undefined => {
    const details = resource.resourceDetails as any;
    if (!details) return undefined;

    if (isVideoResource(resource.resourceType)) {
      return details.videoUrl;
    }
    return undefined;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const previewUrl = getPreviewUrl();
  const videoUrl = getVideoUrl();

  return (
    <div className="rc-card">
      <div className="rc-preview">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={previewUrl}
            muted
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : previewUrl ? (
          <img src={previewUrl} alt={resource.resourceName} />
        ) : (
          <div className="rc-placeholder">
            <span className="rc-placeholder-text">
              {isCharacterResource(resource.resourceType) ? '角色' : '场景'}
            </span>
          </div>
        )}

        <span className={`rc-status ${getStatusClass(resource.status)}`}>
          {getStatusText(resource.status)}
        </span>

        <span className="rc-type-badge">{typeLabel}</span>
      </div>

      <div className="rc-info">
        <h3>{resource.resourceName}</h3>
        <div className="rc-meta">
          {projectName && <span className="rc-project">{projectName}</span>}
          <span>{formatDate(resource.createdAt)}</span>
        </div>
        {resource.status === 'failed' && resource.errorMessage && (
          <div className="rc-error" title={resource.errorMessage}>
            错误: {resource.errorMessage}
          </div>
        )}
      </div>

      <div className="rc-actions">
        <button
          className="rc-action-btn"
          onClick={() => onPreview?.(resource)}
          title="预览"
        >
          预览
        </button>
        <button
          className="rc-action-btn danger"
          onClick={() => onDelete?.(resource)}
          title="删除"
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
