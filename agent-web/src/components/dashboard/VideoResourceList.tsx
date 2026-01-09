import React, { useState, useEffect } from 'react';
import type { ScriptResourceInfo } from '@/api/scriptResource';
import ResourceCard from './ResourceCard';

interface VideoResourceListProps {
  resources: ScriptResourceInfo[];
  projectMap: Map<number, string>;
  onDelete: (resource: ScriptResourceInfo) => void;
  onPreview: (resource: ScriptResourceInfo) => void;
}

const VideoResourceList: React.FC<VideoResourceListProps> = ({
  resources,
  projectMap,
  onDelete,
  onPreview,
}) => {
  // 筛选器状态
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'character' | 'scene' | ''>('character');

  // 切换分类时重置类型筛选
  useEffect(() => {
    setTypeFilter('');
  }, [categoryFilter]);

  // 筛选视频资源
  const filteredResources = resources.filter((resource) => {
    // 只显示视频资源
    if (!resource.resourceType.startsWith('video_')) {
      return false;
    }

    // 应用其他筛选条件
    if (categoryFilter && resource.resourceCategory !== categoryFilter) {
      return false;
    }
    if (statusFilter && resource.status !== statusFilter) {
      return false;
    }
    if (typeFilter && resource.resourceType !== typeFilter) {
      return false;
    }
    return true;
  });

  // 获取当前分类下的资源类型选项
  const getTypeOptions = () => {
    if (categoryFilter === 'character') {
      return [
        { value: '', label: '全部类型' },
        { value: 'video_character', label: '视频角色' },
        { value: 'image_character', label: '图片角色' },
      ];
    } else if (categoryFilter === 'scene') {
      return [
        { value: '', label: '全部类型' },
        { value: 'video_scene', label: '视频场景' },
        { value: 'image_scene', label: '图片场景' },
      ];
    }
    return [
      { value: '', label: '全部类型' },
      { value: 'video_character', label: '视频角色' },
      { value: 'image_character', label: '图片角色' },
      { value: 'video_scene', label: '视频场景' },
      { value: 'image_scene', label: '图片场景' },
    ];
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="sd-filters">
        <select
          className="sd-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter((e.target.value as 'character' | 'scene' | ''))}
        >
          <option value="">角色 + 场景</option>
          <option value="character">仅角色</option>
          <option value="scene">仅场景</option>
        </select>

        <select
          className="sd-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="pending">等待中</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>

        <select
          className="sd-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {getTypeOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 列表 */}
      {filteredResources.length === 0 ? (
        <div className="sd-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <p>暂无视频资源</p>
          <span>点击上方按钮添加资源，或在工作流项目中创建资源后自动关联</span>
        </div>
      ) : (
        <div className="rc-grid">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              projectName={projectMap.get(resource.workflowProjectId)}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default VideoResourceList;
