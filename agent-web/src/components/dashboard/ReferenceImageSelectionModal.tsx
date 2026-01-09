import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  type PictureResource,
  type PictureResourceType,
  RESOURCE_TYPE_LABELS,
} from '@/api/pictureResource';
import { showSuccess, showWarning, showError, upload } from '@/utils/request';
import './ReferenceImageSelectionModal.css';

// 上传响应接口
interface UploadResponse {
  id: number;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface ReferenceImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceList: PictureResource[];
  loading: boolean;
  maxImages: number;
  currentCount: number;
  onConfirm: (selectedImages: string[]) => void;
  onUpload?: (imageUrl: string) => void;
}

const ReferenceImageSelectionModal: React.FC<ReferenceImageSelectionModalProps> = ({
  isOpen,
  onClose,
  resourceList,
  loading,
  maxImages,
  currentCount,
  onConfirm,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 筛选状态
  const [typeFilter, setTypeFilter] = useState<PictureResourceType | ''>('');
  const [nameFilter, setNameFilter] = useState('');

  // 选择状态
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 根据筛选条件过滤资源列表
  const filteredResources = useMemo(() => {
    return resourceList.filter((resource) => {
      // 类型筛选
      if (typeFilter && resource.type !== typeFilter) {
        return false;
      }
      // 名称筛选（模糊匹配）
      if (nameFilter && !resource.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [resourceList, typeFilter, nameFilter]);

  // 统计各类型数量
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: resourceList.length,
      character: 0,
      scene: 0,
      prop: 0,
      skill: 0,
    };
    resourceList.forEach((r) => {
      if (counts[r.type] !== undefined) {
        counts[r.type]++;
      }
    });
    return counts;
  }, [resourceList]);

  // 切换资源选择
  const handleToggleResource = (resourceId: number) => {
    const isSelected = selectedResourceIds.includes(resourceId);

    if (isSelected) {
      setSelectedResourceIds((prev) => prev.filter((id) => id !== resourceId));
    } else {
      const totalCount = currentCount + selectedResourceIds.length + 1;
      if (totalCount > maxImages) {
        showWarning(`最多只能选择 ${maxImages} 张参考图`);
        return;
      }
      setSelectedResourceIds((prev) => [...prev, resourceId]);
    }
  };

  // 全选/全不选当前筛选的资源
  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredResources.map((r) => r.id);
    const allSelected = currentFilteredIds.every((id) => selectedResourceIds.includes(id));

    if (allSelected) {
      // 全不选
      setSelectedResourceIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      // 检查是否会超过最大数量
      const newSelectedIds = [...new Set([...selectedResourceIds, ...currentFilteredIds])];
      const totalCount = currentCount + newSelectedIds.length;
      if (totalCount > maxImages) {
        showWarning(`最多只能选择 ${maxImages} 张参考图`);
        return;
      }
      setSelectedResourceIds(newSelectedIds);
    }
  };

  // 确认选择
  const handleConfirmSelect = () => {
    const selectedImages = resourceList
      .filter((r) => selectedResourceIds.includes(r.id))
      .map((r) => r.imageUrl);

    onConfirm(selectedImages);
    handleClose();
  };

  // 上传图片
  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showWarning('请选择图片文件');
      return;
    }

    // 检查数量限制
    if (currentCount >= maxImages) {
      showWarning(`最多只能添加 ${maxImages} 张参考图`);
      return;
    }

    try {
      setUploadingImage(true);

      const response = await upload<{ code: number; data: UploadResponse; message?: string }>(
        '/api/file/upload',
        file
      );

      if (response.data.code === 200 && response.data.data?.url) {
        if (onUpload) {
          onUpload(response.data.data.url);
        }
        showSuccess('图片上传成功');
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      showError('文件上传失败');
    } finally {
      setUploadingImage(false);
      // 清空input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 关闭弹窗时重置状态
  const handleClose = () => {
    setSelectedResourceIds([]);
    setTypeFilter('');
    setNameFilter('');
    onClose();
  };

  // 判断是否全选了当前筛选的资源
  const allFilteredSelected =
    filteredResources.length > 0 &&
    filteredResources.every((r) => selectedResourceIds.includes(r.id));

  if (!isOpen) return null;

  // 使用 Portal 渲染到 body，确保弹窗在画布外层
  return createPortal(
    <div className="ref-img-modal-overlay" onClick={handleClose}>
      <div className="ref-img-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="ref-img-modal-header">
          <h2>选择参考图</h2>
          <button className="ref-img-modal-close" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="ref-img-modal-filter">
          <div className="ref-img-filter-item">
            <label>类型：</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PictureResourceType | '')}
              className="ref-img-filter-select"
            >
              <option value="">全部 ({typeCounts.all})</option>
              <option value="character">角色 ({typeCounts.character})</option>
              <option value="scene">场景 ({typeCounts.scene})</option>
              <option value="prop">道具 ({typeCounts.prop})</option>
              <option value="skill">技能 ({typeCounts.skill})</option>
            </select>
          </div>

          <div className="ref-img-filter-item">
            <label>名称：</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="输入名称搜索..."
              className="ref-img-filter-input"
            />
            {nameFilter && (
              <button
                className="ref-img-filter-clear"
                onClick={() => setNameFilter('')}
                title="清除"
              >
                ×
              </button>
            )}
          </div>

          <button
            className="ref-img-toggle-all-btn"
            onClick={handleToggleSelectAll}
            disabled={filteredResources.length === 0}
          >
            {allFilteredSelected ? '全不选' : '全选'}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="ref-img-modal-body">
          {loading ? (
            <div className="ref-img-loading">
              <div className="ref-img-spinner"></div>
              <span>加载中...</span>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="ref-img-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>
                {resourceList.length === 0
                  ? '暂无图片资源'
                  : '没有符合筛选条件的资源'}
              </p>
              <span>可以上传新图片作为参考图</span>
            </div>
          ) : (
            <div className="ref-img-grid">
              {filteredResources.map((resource) => {
                const isSelected = selectedResourceIds.includes(resource.id);
                return (
                  <div
                    key={resource.id}
                    className={`ref-img-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleResource(resource.id)}
                  >
                    <div className="ref-img-thumbnail">
                      <img src={resource.imageUrl} alt={resource.name} />
                    </div>
                    <div className="ref-img-item-overlay">
                      <div className="ref-img-checkbox">{isSelected && '✓'}</div>
                    </div>
                    <div className="ref-img-item-info">
                      <span className="ref-img-item-name" title={resource.name}>
                        {resource.name}
                      </span>
                      <span className={`ref-img-item-type type-${resource.type}`}>
                        {RESOURCE_TYPE_LABELS[resource.type]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="ref-img-modal-footer">
          <button
            className="ref-img-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || currentCount >= maxImages}
          >
            {uploadingImage ? '上传中...' : '上传图片'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUploadImage}
          />
          <div className="ref-img-modal-actions">
            <span className="ref-img-selected-count">
              已选 {selectedResourceIds.length}，可添加 {maxImages - currentCount} 张
            </span>
            <button className="ref-img-cancel-btn" onClick={handleClose}>
              取消
            </button>
            <button
              className="ref-img-confirm-btn"
              onClick={handleConfirmSelect}
              disabled={selectedResourceIds.length === 0}
            >
              确定（{selectedResourceIds.length}）
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReferenceImageSelectionModal;
