import React, { useState, useCallback } from 'react';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import {
  updateVideoResource,
  deleteVideoResource,
  type VideoResourceInfo,
} from '@/api/videoResource';
import { showSuccess, showWarning } from '@/utils/request';
import './ResourceListModal.css';

interface ResourceListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResourceListModal: React.FC<ResourceListModalProps> = ({ isOpen, onClose }) => {
  const {
    currentScriptId,
    currentScriptName,
    getEffectiveResources,
    updateResourceInCache,
    removeResourceFromCache,
  } = useWorkflowStore();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VideoResourceInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const resources = getEffectiveResources();

  // 分离角色和场景
  const characterList = resources.filter((r) => r.resourceType === 'character');
  const sceneList = resources.filter((r) => r.resourceType === 'scene');

  // 开始编辑
  const handleStartEdit = useCallback((resource: VideoResourceInfo) => {
    setEditingId(resource.id);
    setEditingName(resource.resourceName);
  }, []);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  // 保存编辑
  const handleSaveEdit = useCallback(async (resource: VideoResourceInfo) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      showWarning('名称不能为空');
      return;
    }

    if (trimmedName === resource.resourceName) {
      handleCancelEdit();
      return;
    }

    setIsUpdating(true);
    try {
      const response = await updateVideoResource(resource.id, { resourceName: trimmedName });
      if (response.code === 200) {
        updateResourceInCache(response.data);
        showSuccess('重命名成功');
        handleCancelEdit();
      }
    } catch (error) {
      console.error('重命名失败:', error);
      showWarning('重命名失败');
    } finally {
      setIsUpdating(false);
    }
  }, [editingName, updateResourceInCache, handleCancelEdit]);

  // 删除确认
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsUpdating(true);
    try {
      const response = await deleteVideoResource(deleteTarget.id);
      if (response.code === 200) {
        removeResourceFromCache(deleteTarget.id);
        showSuccess('删除成功');
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
      showWarning('删除失败');
    } finally {
      setIsUpdating(false);
    }
  }, [deleteTarget, removeResourceFromCache]);

  // 渲染资源卡片
  const renderResourceCard = (resource: VideoResourceInfo) => {
    const isEditing = editingId === resource.id;
    const imageUrl = resource.characterImageUrl;
    const isCharacter = resource.resourceType === 'character';

    return (
      <div key={resource.id} className={`resource-card ${isCharacter ? 'card-character' : 'card-scene'}`}>
        <div className={`resource-thumbnail ${isCharacter ? 'ratio-9-16' : 'ratio-16-9'}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={resource.resourceName}
              onClick={() => setPreviewImage(imageUrl)}
              className="clickable"
            />
          ) : (
            <div className="resource-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {isCharacter ? (
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                ) : (
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
                )}
              </svg>
            </div>
          )}
          {/* 状态标签 */}
          <span className={`resource-status ${resource.status}`}>
            {resource.status === 'completed' ? '已完成' :
             resource.status === 'video_generating' ? '视频生成中' :
             resource.status === 'video_generated' ? '视频已生成' :
             resource.status === 'character_generating' ? '角色生成中' :
             resource.status === 'failed' ? '失败' : '未生成'}
          </span>
        </div>

        <div className="resource-info">
          {isEditing ? (
            <input
              type="text"
              className="resource-name-input"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(resource);
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              disabled={isUpdating}
            />
          ) : (
            <div className="resource-name" title={resource.resourceName}>
              {resource.resourceName}
            </div>
          )}

          {isEditing ? (
            <div className="resource-actions">
              <button
                className="btn-save"
                onClick={() => handleSaveEdit(resource)}
                disabled={isUpdating}
              >
                保存
              </button>
              <button
                className="btn-cancel"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                取消
              </button>
            </div>
          ) : (
            <div className="resource-actions">
              <button
                className="btn-edit"
                onClick={() => handleStartEdit(resource)}
                title="重命名"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                className="btn-delete"
                onClick={() => setDeleteTarget(resource)}
                title="删除"
              >
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

  if (!isOpen) return null;

  return (
    <div className="resource-modal-overlay" onClick={onClose}>
      <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resource-modal-header">
          <h2>资源列表</h2>
          {currentScriptId && (
            <span className="resource-source-badge">
              来自剧本: {currentScriptName}
            </span>
          )}
          <button className="resource-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="resource-modal-body">
          {resources.length === 0 ? (
            <div className="resource-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>暂无资源</p>
              <span>从视频节点创建角色或场景后会显示在这里</span>
            </div>
          ) : (
            <>
              {/* 角色列表 */}
              <div className="resource-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  角色 ({characterList.length})
                </h3>
                {characterList.length > 0 ? (
                  <div className="resource-grid resource-grid-character">
                    {characterList.map(renderResourceCard)}
                  </div>
                ) : (
                  <div className="resource-section-empty">暂无角色资源</div>
                )}
              </div>

              {/* 场景列表 */}
              <div className="resource-section">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  场景 ({sceneList.length})
                </h3>
                {sceneList.length > 0 ? (
                  <div className="resource-grid resource-grid-scene">
                    {sceneList.map(renderResourceCard)}
                  </div>
                ) : (
                  <div className="resource-section-empty">暂无场景资源</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <div className="resource-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="resource-preview-content">
            <img src={previewImage} alt="预览" />
            <button className="resource-preview-close" onClick={() => setPreviewImage(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹框 */}
      {deleteTarget && (
        <div className="resource-delete-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="resource-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="resource-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3>确认删除</h3>
            <p>
              确定要删除「{deleteTarget.resourceName}」吗？
              <br />
              <span>此操作不可撤销</span>
            </p>
            <div className="resource-delete-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={isUpdating}
              >
                取消
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmDelete}
                disabled={isUpdating}
              >
                {isUpdating ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceListModal;
