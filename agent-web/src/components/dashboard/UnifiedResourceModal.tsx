import React, { useState, useCallback, useEffect } from 'react';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import {
  getPictureResourcesByScript,
  getPictureResourcesByProject,
  deletePictureResource,
  type PictureResource,
  type PictureResourceType,
  RESOURCE_STATUS_LABELS,
} from '@/api/pictureResource';
import {
  getScriptResources,
  getProjectResources,
  updateVideoResource,
  deleteVideoResource,
  type VideoResourceInfo,
  type ResourceType,
} from '@/api/videoResource';
import { showSuccess, showWarning } from '@/utils/request';
import './UnifiedResourceModal.css';

interface UnifiedResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'image' | 'video';

// 图片资源类型配置
const PICTURE_TYPE_CONFIG: Record<PictureResourceType, { label: string; color: string }> = {
  character: { label: '角色', color: '#818cf8' },
  scene: { label: '场景', color: '#34d399' },
  prop: { label: '道具', color: '#fbbf24' },
  skill: { label: '技能', color: '#f472b6' },
};

// 视频资源类型配置
const VIDEO_TYPE_CONFIG: Record<ResourceType, { label: string; color: string }> = {
  character: { label: '人物', color: '#818cf8' },
  scene: { label: '场景', color: '#34d399' },
  prop: { label: '道具', color: '#fbbf24' },
  skill: { label: '技能', color: '#f472b6' },
};

// 获取视频资源生成状态
const getVideoResourceStatus = (resource: VideoResourceInfo): {
  status: string;
  label: string;
  className: string;
} => {
  // 1. 已完成：有角色图片
  if (resource.status === 'completed' && resource.characterImageUrl) {
    return { status: 'completed', label: '已完成', className: 'status-completed' };
  }

  // 2. 生成角色中：character_generating 状态且有视频
  if (resource.status === 'character_generating' && resource.videoResultUrl) {
    return { status: 'generating-character', label: '生成角色中', className: 'status-generating-character' };
  }

  // 3. 已生成视频：video_generated 状态或有视频结果但没有角色图片
  if (resource.status === 'video_generated' || (resource.videoResultUrl && !resource.characterImageUrl)) {
    return { status: 'video-ready', label: '已生成视频', className: 'status-video-ready' };
  }

  // 4. 生成视频中：video_generating 状态
  if (resource.status === 'video_generating') {
    return { status: 'generating-video', label: '生成视频中', className: 'status-generating-video' };
  }

  // 5. 失败
  if (resource.status === 'failed') {
    return { status: 'failed', label: '失败', className: 'status-failed' };
  }

  // 6. 未生成
  return { status: 'not-generated', label: '未生成', className: 'status-not-generated' };
};

const UnifiedResourceModal: React.FC<UnifiedResourceModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProjectId,
    currentScriptId,
    currentScriptName,
  } = useWorkflowStore();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('image');

  // ========== 图片资源状态 ==========
  const [pictureResources, setPictureResources] = useState<PictureResource[]>([]);
  const [loadingPictures, setLoadingPictures] = useState(false);
  const [pictureFilterType, setPictureFilterType] = useState<PictureResourceType | 'all'>('all');
  const [deletePictureTarget, setDeletePictureTarget] = useState<PictureResource | null>(null);
  const [isDeletingPicture, setIsDeletingPicture] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ========== 视频资源状态 ==========
  const [videoResources, setVideoResources] = useState<VideoResourceInfo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoFilterType, setVideoFilterType] = useState<ResourceType | 'all'>('all');
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editingVideoName, setEditingVideoName] = useState('');
  const [deleteVideoTarget, setDeleteVideoTarget] = useState<VideoResourceInfo | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // 按类型筛选图片资源
  const filteredPictureResources = pictureFilterType === 'all'
    ? pictureResources
    : pictureResources.filter((r) => r.type === pictureFilterType);

  // 按类型筛选视频资源
  const filteredVideoResources = videoFilterType === 'all'
    ? videoResources
    : videoResources.filter((r) => r.resourceType === videoFilterType);

  // 统计图片资源各类型数量
  const pictureTypeCounts = {
    all: pictureResources.length,
    character: pictureResources.filter(r => r.type === 'character').length,
    scene: pictureResources.filter(r => r.type === 'scene').length,
    prop: pictureResources.filter(r => r.type === 'prop').length,
    skill: pictureResources.filter(r => r.type === 'skill').length,
  };

  // 统计视频资源各类型数量
  const videoTypeCounts = {
    all: videoResources.length,
    character: videoResources.filter(r => r.resourceType === 'character').length,
    scene: videoResources.filter(r => r.resourceType === 'scene').length,
    prop: videoResources.filter(r => r.resourceType === 'prop').length,
    skill: videoResources.filter(r => r.resourceType === 'skill').length,
  };

  // ========== 加载图片资源 ==========
  const loadPictureResources = useCallback(async () => {
    if (!currentScriptId && !currentProjectId) {
      setPictureResources([]);
      return;
    }

    setLoadingPictures(true);
    try {
      let response;
      if (currentScriptId) {
        response = await getPictureResourcesByScript(currentScriptId);
      } else if (currentProjectId) {
        response = await getPictureResourcesByProject(currentProjectId);
      }

      if (response && response.code === 200) {
        setPictureResources(response.data || []);
      }
    } catch (error) {
      console.error('加载图片资源失败:', error);
    } finally {
      setLoadingPictures(false);
    }
  }, [currentScriptId, currentProjectId]);

  // ========== 加载视频资源 ==========
  const loadVideoResources = useCallback(async () => {
    if (!currentScriptId && !currentProjectId) {
      setVideoResources([]);
      return;
    }

    setLoadingVideos(true);
    try {
      let response;
      if (currentScriptId) {
        response = await getScriptResources(currentScriptId);
      } else if (currentProjectId) {
        response = await getProjectResources(currentProjectId);
      }

      if (response && response.code === 200) {
        setVideoResources(response.data.resources || []);
      }
    } catch (error) {
      console.error('加载视频资源失败:', error);
    } finally {
      setLoadingVideos(false);
    }
  }, [currentScriptId, currentProjectId]);

  // 打开弹窗时同时加载图片和视频资源
  useEffect(() => {
    if (isOpen) {
      loadPictureResources();
      loadVideoResources();
    }
  }, [isOpen, loadPictureResources, loadVideoResources]);

  // ========== 图片资源操作 ==========
  const handleConfirmDeletePicture = useCallback(async () => {
    if (!deletePictureTarget) return;

    setIsDeletingPicture(true);
    try {
      const response = await deletePictureResource(deletePictureTarget.id);
      if (response.code === 200) {
        setPictureResources(prev => prev.filter(r => r.id !== deletePictureTarget.id));
        showSuccess('删除成功');
        setDeletePictureTarget(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
      showWarning('删除失败');
    } finally {
      setIsDeletingPicture(false);
    }
  }, [deletePictureTarget]);

  // ========== 视频资源操作 ==========
  const handleStartEditVideo = useCallback((resource: VideoResourceInfo) => {
    setEditingVideoId(resource.id);
    setEditingVideoName(resource.resourceName);
  }, []);

  const handleCancelEditVideo = useCallback(() => {
    setEditingVideoId(null);
    setEditingVideoName('');
  }, []);

  const handleSaveEditVideo = useCallback(async (resource: VideoResourceInfo) => {
    const trimmedName = editingVideoName.trim();
    if (!trimmedName) {
      showWarning('名称不能为空');
      return;
    }

    if (trimmedName === resource.resourceName) {
      handleCancelEditVideo();
      return;
    }

    setIsUpdatingVideo(true);
    try {
      const response = await updateVideoResource(resource.id, { resourceName: trimmedName });
      if (response.code === 200) {
        setVideoResources(prev => prev.map(r => r.id === resource.id ? response.data : r));
        showSuccess('重命名成功');
        handleCancelEditVideo();
      }
    } catch (error) {
      console.error('重命名失败:', error);
      showWarning('重命名失败');
    } finally {
      setIsUpdatingVideo(false);
    }
  }, [editingVideoName, handleCancelEditVideo]);

  const handleConfirmDeleteVideo = useCallback(async () => {
    if (!deleteVideoTarget) return;

    setIsDeletingVideo(true);
    try {
      const response = await deleteVideoResource(deleteVideoTarget.id);
      if (response.code === 200) {
        setVideoResources(prev => prev.filter(r => r.id !== deleteVideoTarget.id));
        showSuccess('删除成功');
        setDeleteVideoTarget(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
      showWarning('删除失败');
    } finally {
      setIsDeletingVideo(false);
    }
  }, [deleteVideoTarget]);

  // ========== 渲染图片资源卡片 ==========
  const renderPictureCard = (resource: PictureResource) => {
    const typeConfig = PICTURE_TYPE_CONFIG[resource.type];
    const statusLabel = RESOURCE_STATUS_LABELS[resource.status];

    return (
      <div key={resource.id} className="unified-resource-card">
        <div className="unified-resource-thumbnail">
          {resource.imageUrl ? (
            <img
              src={resource.imageUrl}
              alt={resource.name}
              onClick={() => setPreviewImage(resource.imageUrl)}
              className="clickable"
            />
          ) : (
            <div className="unified-resource-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          {/* 类型标签 */}
          <span
            className="unified-resource-type-tag"
            style={{ backgroundColor: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
          {/* 状态标签 */}
          <span className={`unified-resource-gen-status status-${resource.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="unified-resource-info">
          <div className="unified-resource-name" title={resource.name}>
            {resource.name}
          </div>
          <div className="unified-resource-actions">
            <button className="btn-delete" onClick={() => setDeletePictureTarget(resource)} title="删除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========== 渲染视频资源卡片 ==========
  const renderVideoCard = (resource: VideoResourceInfo) => {
    const isEditing = editingVideoId === resource.id;
    const typeConfig = VIDEO_TYPE_CONFIG[resource.resourceType];
    const genStatus = getVideoResourceStatus(resource);
    const displayImage = resource.characterImageUrl || resource.videoResultUrl;

    return (
      <div key={resource.id} className="unified-resource-card">
        <div className="unified-resource-thumbnail">
          {displayImage ? (
            resource.characterImageUrl ? (
              <img
                src={resource.characterImageUrl}
                alt={resource.resourceName}
                onClick={() => setPreviewImage(resource.characterImageUrl!)}
                className="clickable"
              />
            ) : resource.videoResultUrl ? (
              <video
                src={resource.videoResultUrl}
                muted
                loop
                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                onMouseLeave={(e) => {
                  const vid = e.target as HTMLVideoElement;
                  vid.pause();
                  vid.currentTime = 0;
                }}
                onClick={() => setPreviewVideo(resource.videoResultUrl)}
                className="clickable"
              />
            ) : null
          ) : (
            <div className="unified-resource-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          )}
          {/* 类型标签 */}
          <span
            className="unified-resource-type-tag"
            style={{ backgroundColor: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
          {/* 生成状态标签 */}
          <span className={`unified-resource-gen-status ${genStatus.className}`}>
            {genStatus.label}
          </span>
        </div>

        <div className="unified-resource-info">
          {isEditing ? (
            <input
              type="text"
              className="unified-resource-name-input"
              value={editingVideoName}
              onChange={(e) => setEditingVideoName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEditVideo(resource);
                if (e.key === 'Escape') handleCancelEditVideo();
              }}
              autoFocus
              disabled={isUpdatingVideo}
            />
          ) : (
            <div className="unified-resource-name" title={resource.resourceName}>
              {resource.resourceName}
            </div>
          )}

          {isEditing ? (
            <div className="unified-resource-actions">
              <button className="btn-save" onClick={() => handleSaveEditVideo(resource)} disabled={isUpdatingVideo}>
                保存
              </button>
              <button className="btn-cancel" onClick={handleCancelEditVideo} disabled={isUpdatingVideo}>
                取消
              </button>
            </div>
          ) : (
            <div className="unified-resource-actions">
              <button className="btn-edit" onClick={() => handleStartEditVideo(resource)} title="重命名">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="btn-delete" onClick={() => setDeleteVideoTarget(resource)} title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========== 渲染图片资源内容 ==========
  const renderImageContent = () => {
    if (loadingPictures) {
      return (
        <div className="unified-loading">
          <div className="unified-loading-spinner" />
          <p>加载中...</p>
        </div>
      );
    }

    if (!currentScriptId && !currentProjectId) {
      return (
        <div className="unified-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>请先保存项目</p>
          <span>保存项目后可以查看图片资源</span>
        </div>
      );
    }

    return (
      <>
        {/* 类型筛选下拉框 */}
        <div className="unified-filter-bar">
          <label>类型筛选：</label>
          <select
            value={pictureFilterType}
            onChange={(e) => setPictureFilterType(e.target.value as PictureResourceType | 'all')}
            className="unified-filter-select"
          >
            <option value="all">全部 ({pictureTypeCounts.all})</option>
            <option value="character">角色 ({pictureTypeCounts.character})</option>
            <option value="scene">场景 ({pictureTypeCounts.scene})</option>
            <option value="prop">道具 ({pictureTypeCounts.prop})</option>
            <option value="skill">技能 ({pictureTypeCounts.skill})</option>
          </select>
        </div>

        {filteredPictureResources.length === 0 ? (
          <div className="unified-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>{pictureFilterType === 'all' ? '暂无图片资源' : `暂无${PICTURE_TYPE_CONFIG[pictureFilterType as PictureResourceType].label}资源`}</p>
            <span>解析剧本后会自动创建图片资源</span>
          </div>
        ) : (
          <div className="unified-grid unified-grid-uniform">
            {filteredPictureResources.map(renderPictureCard)}
          </div>
        )}
      </>
    );
  };

  // ========== 渲染视频资源内容 ==========
  const renderVideoContent = () => {
    if (loadingVideos) {
      return (
        <div className="unified-loading">
          <div className="unified-loading-spinner" />
          <p>加载中...</p>
        </div>
      );
    }

    if (!currentScriptId && !currentProjectId) {
      return (
        <div className="unified-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p>请先保存项目或绑定剧本</p>
          <span>保存后可以查看视频资源</span>
        </div>
      );
    }

    return (
      <>
        {/* 类型筛选下拉框 */}
        <div className="unified-filter-bar">
          <label>类型筛选：</label>
          <select
            value={videoFilterType}
            onChange={(e) => setVideoFilterType(e.target.value as ResourceType | 'all')}
            className="unified-filter-select"
          >
            <option value="all">全部 ({videoTypeCounts.all})</option>
            <option value="character">人物 ({videoTypeCounts.character})</option>
            <option value="scene">场景 ({videoTypeCounts.scene})</option>
            <option value="prop">道具 ({videoTypeCounts.prop})</option>
            <option value="skill">技能 ({videoTypeCounts.skill})</option>
          </select>
        </div>

        {filteredVideoResources.length === 0 ? (
          <div className="unified-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <p>{videoFilterType === 'all' ? '暂无视频资源' : `暂无${VIDEO_TYPE_CONFIG[videoFilterType as ResourceType].label}资源`}</p>
            <span>从工作流节点创建资源后会显示在这里</span>
          </div>
        ) : (
          <div className="unified-grid unified-grid-uniform">
            {filteredVideoResources.map(renderVideoCard)}
          </div>
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="unified-modal-overlay" onClick={onClose}>
      <div className="unified-modal" onClick={(e) => e.stopPropagation()}>
        <div className="unified-modal-header">
          <h2>资源管理</h2>
          {currentScriptId && (
            <span className="unified-source-badge">
              来自剧本: {currentScriptName}
            </span>
          )}
          <button className="unified-modal-close" onClick={onClose}>
            ❌
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="unified-tabs">
          <button
            className={`unified-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            图片资源
            <span className="unified-tab-count">{pictureResources.length}</span>
          </button>
          <button
            className={`unified-tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            视频资源
            <span className="unified-tab-count">{videoResources.length}</span>
          </button>
        </div>

        <div className="unified-modal-body">
          {activeTab === 'image' ? renderImageContent() : renderVideoContent()}
        </div>

        {/* 底部工具栏 */}
        <div className="unified-modal-footer">
          <span className="unified-count">
            共 {activeTab === 'image' ? filteredPictureResources.length : filteredVideoResources.length} 个{activeTab === 'image' ? '图片' : '视频'}资源
          </span>
          <button
            className="btn-refresh"
            onClick={activeTab === 'image' ? loadPictureResources : loadVideoResources}
            disabled={activeTab === 'image' ? loadingPictures : loadingVideos}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <div className="unified-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="unified-preview-content">
            <img src={previewImage} alt="预览" />
            <button className="unified-preview-close" onClick={() => setPreviewImage(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 视频预览 */}
      {previewVideo && (
        <div className="unified-preview-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="unified-preview-content" onClick={(e) => e.stopPropagation()}>
            <video src={previewVideo} controls autoPlay />
            <button className="unified-preview-close" onClick={() => setPreviewVideo(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 删除图片资源确认弹框 */}
      {deletePictureTarget && (
        <div className="unified-delete-overlay" onClick={() => setDeletePictureTarget(null)}>
          <div className="unified-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="unified-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3>确认删除</h3>
            <p>
              确定要删除「{deletePictureTarget.name}」吗？
              <br />
              <span>此操作不可撤销</span>
            </p>
            <div className="unified-delete-actions">
              <button className="btn-cancel" onClick={() => setDeletePictureTarget(null)} disabled={isDeletingPicture}>
                取消
              </button>
              <button className="btn-confirm" onClick={handleConfirmDeletePicture} disabled={isDeletingPicture}>
                {isDeletingPicture ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除视频资源确认弹框 */}
      {deleteVideoTarget && (
        <div className="unified-delete-overlay" onClick={() => setDeleteVideoTarget(null)}>
          <div className="unified-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="unified-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3>确认删除</h3>
            <p>
              确定要删除「{deleteVideoTarget.resourceName}」吗？
              <br />
              <span>此操作不可撤销</span>
            </p>
            <div className="unified-delete-actions">
              <button className="btn-cancel" onClick={() => setDeleteVideoTarget(null)} disabled={isDeletingVideo}>
                取消
              </button>
              <button className="btn-confirm" onClick={handleConfirmDeleteVideo} disabled={isDeletingVideo}>
                {isDeletingVideo ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedResourceModal;
