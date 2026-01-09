import React, { useState } from 'react';
import { batchCreateVideoResources, type ResourceType } from '@/api/videoResource';
import { showSuccess, showWarning } from '@/utils/request';
import './ResourceSelectionModal.css';

interface ParsedAsset {
  id: string;
  name: string;
  type: 'character' | 'scene' | 'prop' | 'skill';
  prompt: string;
}

interface ResourceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ParsedAsset[];
  projectId: number;
  scriptId?: number;
  onBatchCreate: (selectedAssets: ParsedAsset[]) => void;
}

// 资源类型配置
const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  character: { label: '角色', color: '#818cf8', icon: '🎭' },
  scene: { label: '场景', color: '#34d399', icon: '🏞️' },
  prop: { label: '道具', color: '#fbbf24', icon: '⚔️' },
  skill: { label: '技能', color: '#f472b6', icon: '✨' },
};

const ResourceSelectionModal: React.FC<ResourceSelectionModalProps> = ({
  isOpen,
  onClose,
  assets,
  projectId,
  scriptId,
  onBatchCreate,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'character' | 'scene' | 'prop' | 'skill'>('all');

  // 按类型筛选
  const filteredAssets = filterType === 'all'
    ? assets
    : assets.filter((asset) => asset.type === filterType);

  // 统计各类型数量
  const typeCounts = {
    all: assets.length,
    character: assets.filter(a => a.type === 'character').length,
    scene: assets.filter(a => a.type === 'scene').length,
    prop: assets.filter(a => a.type === 'prop').length,
    skill: assets.filter(a => a.type === 'skill').length,
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/全不选当前筛选的资源
  const toggleSelectAll = () => {
    const currentAssetIds = filteredAssets.map(a => a.id);
    const allSelected = currentAssetIds.every(id => selectedIds.has(id));

    const newSelected = new Set(selectedIds);
    if (allSelected) {
      // 全不选
      currentAssetIds.forEach(id => newSelected.delete(id));
    } else {
      // 全选
      currentAssetIds.forEach(id => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  // 批量创建资源
  const handleBatchCreate = async () => {
    if (selectedIds.size === 0) {
      showWarning('请至少选择一个资源');
      return;
    }

    const selectedAssets = assets.filter(asset => selectedIds.has(asset.id));

    setIsCreating(true);
    try {
      // 调用批量创建 API
      const response = await batchCreateVideoResources({
        projectId,
        scriptId,
        resources: selectedAssets.map(asset => ({
          name: asset.name,
          type: asset.type as ResourceType,
          prompt: asset.prompt,
        })),
      });

      if (response.code === 200) {
        showSuccess(`成功创建 ${response.data.successCount} 个资源`);

        // 回调通知父组件创建节点
        onBatchCreate(selectedAssets);

        // 关闭弹窗
        onClose();
      } else {
        throw new Error(response.msg || '批量创建失败');
      }
    } catch (error) {
      console.error('批量创建资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '批量创建资源失败';
      showWarning(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // 渲染资源卡片
  const renderAssetCard = (asset: ParsedAsset) => {
    const isSelected = selectedIds.has(asset.id);
    const typeConfig = ASSET_TYPE_CONFIG[asset.type];

    return (
      <div
        key={asset.id}
        className={`resource-selection-card ${isSelected ? 'selected' : ''}`}
        onClick={() => toggleSelect(asset.id)}
      >
        {/* 复选框 */}
        <div className="resource-selection-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* 资源图标 */}
        <div className="resource-selection-icon" style={{ backgroundColor: typeConfig.color }}>
          <span>{typeConfig.icon}</span>
        </div>

        {/* 资源信息 */}
        <div className="resource-selection-info">
          <div className="resource-selection-name" title={asset.name}>
            {asset.name}
          </div>
          <div className="resource-selection-type" style={{ color: typeConfig.color }}>
            {typeConfig.label}
          </div>
          <div className="resource-selection-prompt" title={asset.prompt}>
            {asset.prompt}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const allFilteredSelected = filteredAssets.length > 0 && filteredAssets.every(a => selectedIds.has(a.id));

  return (
    <div className="resource-selection-overlay" onClick={onClose}>
      <div className="resource-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="resource-selection-header">
          <h2>选择要创建的资源</h2>
          <button className="resource-selection-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 类型筛选 */}
        <div className="resource-selection-filter">
          <label>类型筛选：</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="resource-selection-filter-select"
          >
            <option value="all">全部 ({typeCounts.all})</option>
            <option value="character">角色 ({typeCounts.character})</option>
            <option value="scene">场景 ({typeCounts.scene})</option>
            <option value="prop">道具 ({typeCounts.prop})</option>
            <option value="skill">技能 ({typeCounts.skill})</option>
          </select>

          <button
            className="resource-selection-toggle-all"
            onClick={toggleSelectAll}
            disabled={filteredAssets.length === 0}
          >
            {allFilteredSelected ? '全不选' : '全选'}
          </button>
        </div>

        {/* 资源列表 */}
        <div className="resource-selection-body">
          {filteredAssets.length === 0 ? (
            <div className="resource-selection-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>暂无{filterType === 'all' ? '' : ASSET_TYPE_CONFIG[filterType].label}资源</p>
            </div>
          ) : (
            <div className="resource-selection-grid">
              {filteredAssets.map(renderAssetCard)}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="resource-selection-footer">
          <span className="resource-selection-count">
            已选择 {selectedIds.size} / {assets.length} 个资源
          </span>
          <div className="resource-selection-actions">
            <button
              className="btn-cancel"
              onClick={onClose}
              disabled={isCreating}
            >
              取消
            </button>
            <button
              className="btn-confirm"
              onClick={handleBatchCreate}
              disabled={selectedIds.size === 0 || isCreating}
            >
              {isCreating ? '创建中...' : `批量创建 (${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceSelectionModal;
