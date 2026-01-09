import React, { useState } from 'react';
import {
  deletePictureResource,
  updatePictureImageUrl,
  updatePicturePrompt,
  updatePictureName,
  type PictureResourceType,
  type PictureResourceStatus,
  type PictureResource,
  RESOURCE_TYPE_LABELS,
  RESOURCE_STATUS_LABELS,
} from '@/api/pictureResource';
import {
  textToImage,
  getTaskStatus,
} from '@/api/imageGeneration';
import { showWarning, showSuccess } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';

interface PictureResourceListProps {
  resources: PictureResource[];
  scriptStyle?: string;
  onResourcesChange: (resources: PictureResource[]) => void;
  onPreview: (resource: PictureResource) => void;
  onDelete?: (resourceId: number, resourceName?: string) => void;
  readOnly?: boolean;
}

const PictureResourceList: React.FC<PictureResourceListProps> = ({
  resources,
  scriptStyle,
  onResourcesChange,
  onPreview,
  onDelete,
  readOnly = false,
}) => {
  // 筛选器状态
  const [typeFilter, setTypeFilter] = useState<PictureResourceType | ''>('');
  const [statusFilter, setStatusFilter] = useState<PictureResourceStatus | ''>('');

  // 图片生成状态
  const [generatingResourceId, setGeneratingResourceId] = useState<number | null>(null);

  // 提示词编辑状态
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  // 名称编辑状态
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // 筛选资源
  const filteredResources = resources.filter((resource) => {
    if (typeFilter && resource.type !== typeFilter) {
      return false;
    }
    if (statusFilter && resource.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // 生成图片
  const handleGenerateImage = async (resource: PictureResource) => {
    if (!resource.prompt) {
      showWarning('提示词不能为空');
      return;
    }

    setGeneratingResourceId(resource.id);
    try {
      // 如果有旧图片，先清空并更新状态为生成中
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, imageUrl: '', status: 'generating' as PictureResourceStatus } : r)
      );

      // 构建提示词：如果剧本有风格，将风格提示词加在前面
      let finalPrompt = resource.prompt;
      if (scriptStyle) {
        const styleOption = IMAGE_STYLES.find(s => s.value === scriptStyle);
        if (styleOption?.prompt) {
          finalPrompt = `${styleOption.prompt}, ${resource.prompt}`;
        }
      }

      // 创建图片生成任务
      const result = await textToImage({
        prompt: finalPrompt,
        aspectRatio: '1:1',
        imageSize: '1K',
      });

      if (result.code !== 200) {
        throw new Error(result.msg || '创建任务失败');
      }

      const taskId = result.data.id;
      showSuccess('图片生成任务已创建，正在生成中...');

      // 更新资源状态为生成中
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, status: 'generating' as PictureResourceStatus } : r)
      );

      // 轮询任务状态
      const pollTask = async () => {
        try {
          const statusResult = await getTaskStatus(taskId);
          if (statusResult.code !== 200) {
            throw new Error(statusResult.msg || '查询任务状态失败');
          }

          const task = statusResult.data;

          if (task.status === 'completed' && task.resultUrl) {
            // 更新图片资源的图片地址
            await updatePictureImageUrl(resource.id, task.resultUrl);
            // 更新本地状态
            onResourcesChange(
              resources.map(r => r.id === resource.id ? { ...r, imageUrl: task.resultUrl!, status: 'generated' as PictureResourceStatus } : r)
            );
            showSuccess('图片生成完成');
            setGeneratingResourceId(null);
          } else if (task.status === 'failed') {
            // 更新状态为待生成
            onResourcesChange(
              resources.map(r => r.id === resource.id ? { ...r, status: 'pending' as PictureResourceStatus } : r)
            );
            showWarning('图片生成失败: ' + (task.errorMessage || '未知错误'));
            setGeneratingResourceId(null);
          } else {
            // 继续轮询
            setTimeout(pollTask, 5000);
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error);
          onResourcesChange(
            resources.map(r => r.id === resource.id ? { ...r, status: 'pending' as PictureResourceStatus } : r)
          );
          setGeneratingResourceId(null);
        }
      };

      // 开始轮询
      setTimeout(pollTask, 3000);

    } catch (error) {
      console.error('生成图片失败:', error);
      showWarning('生成图片失败');
      setGeneratingResourceId(null);
    }
  };

  // 开始编辑提示词
  const handleStartEditPrompt = (resource: PictureResource) => {
    setEditingPromptId(resource.id);
    setEditingPromptValue(resource.prompt || '');
  };

  // 取消编辑提示词
  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptValue('');
  };

  // 保存提示词
  const handleSavePrompt = async (resourceId: number) => {
    setSavingPrompt(true);
    try {
      await updatePicturePrompt(resourceId, editingPromptValue);
      // 更新本地状态
      onResourcesChange(
        resources.map(r => r.id === resourceId ? { ...r, prompt: editingPromptValue } : r)
      );
      setEditingPromptId(null);
      setEditingPromptValue('');
      showSuccess('提示词已保存');
    } catch (error) {
      console.error('保存提示词失败:', error);
      showWarning('保存提示词失败');
    } finally {
      setSavingPrompt(false);
    }
  };

  // 开始编辑名称
  const handleStartEditName = (resource: PictureResource) => {
    setEditingNameId(resource.id);
    setEditingNameValue(resource.name || '');
  };

  // 取消编辑名称
  const handleCancelEditName = () => {
    setEditingNameId(null);
    setEditingNameValue('');
  };

  // 保存名称
  const handleSaveName = async (resourceId: number) => {
    if (!editingNameValue.trim()) {
      showWarning('名称不能为空');
      return;
    }
    setSavingName(true);
    try {
      await updatePictureName(resourceId, editingNameValue.trim());
      // 更新本地状态
      onResourcesChange(
        resources.map(r => r.id === resourceId ? { ...r, name: editingNameValue.trim() } : r)
      );
      setEditingNameId(null);
      setEditingNameValue('');
      showSuccess('名称已保存');
    } catch (error) {
      console.error('保存名称失败:', error);
      showWarning('保存名称失败');
    } finally {
      setSavingName(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="sd-filters">
        <select
          className="sd-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PictureResourceType | '')}
        >
          <option value="">全部类型</option>
          <option value="character">角色</option>
          <option value="scene">场景</option>
          <option value="prop">道具</option>
          <option value="skill">技能</option>
        </select>

        <select
          className="sd-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PictureResourceStatus | '')}
        >
          <option value="">全部状态</option>
          <option value="pending">未生成</option>
          <option value="generating">生成中</option>
          <option value="generated">已生成</option>
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
          <p>暂无图片资源</p>
          <span>点击上方按钮添加资源</span>
        </div>
      ) : (
        <div className="picture-resource-list">
          <table className="picture-resource-table">
            <thead>
              <tr>
                <th>缩略图</th>
                <th>名称</th>
                <th>类型</th>
                <th>状态</th>
                <th>提示词</th>
                <th>创建时间</th>
                <th>更新时间</th>
                {!readOnly && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div
                      className={`picture-resource-thumbnail ${resource.imageUrl ? 'clickable' : ''}`}
                      onClick={() => resource.imageUrl && onPreview(resource)}
                    >
                      {resource.imageUrl ? (
                        <img src={resource.imageUrl} alt={resource.name} />
                      ) : (
                        <div className="picture-resource-no-image">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="picture-resource-name">
                    {editingNameId === resource.id && !readOnly ? (
                      <div className="picture-resource-name-edit">
                        <input
                          type="text"
                          className="picture-resource-name-input"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          placeholder="输入名称..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveName(resource.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditName();
                            }
                          }}
                        />
                        <div className="picture-resource-name-actions">
                          <button
                            className="name-action-btn save"
                            onClick={() => handleSaveName(resource.id)}
                            disabled={savingName}
                          >
                            {savingName ? '...' : '✓'}
                          </button>
                          <button
                            className="name-action-btn cancel"
                            onClick={handleCancelEditName}
                            disabled={savingName}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`picture-resource-name-display ${readOnly ? 'readonly' : ''}`}
                        onClick={() => !readOnly && handleStartEditName(resource)}
                        title={readOnly ? resource.name : '点击编辑名称'}
                        style={readOnly ? { cursor: 'default' } : undefined}
                      >
                        <span>{resource.name}</span>
                        {!readOnly && (
                          <svg className="name-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="picture-resource-type-tag">
                      {RESOURCE_TYPE_LABELS[resource.type]}
                    </span>
                  </td>
                  <td>
                    <span className={`picture-resource-status-tag status-${resource.status}`}>
                      {RESOURCE_STATUS_LABELS[resource.status]}
                    </span>
                  </td>
                  <td className="picture-resource-prompt-cell">
                    {editingPromptId === resource.id && !readOnly ? (
                      <div className="picture-resource-prompt-edit">
                        <textarea
                          className="picture-resource-prompt-textarea"
                          value={editingPromptValue}
                          onChange={(e) => setEditingPromptValue(e.target.value)}
                          placeholder="输入提示词..."
                          rows={3}
                          autoFocus
                        />
                        <div className="picture-resource-prompt-actions">
                          <button
                            className="prompt-action-btn save"
                            onClick={() => handleSavePrompt(resource.id)}
                            disabled={savingPrompt}
                          >
                            {savingPrompt ? '保存中...' : '保存'}
                          </button>
                          <button
                            className="prompt-action-btn cancel"
                            onClick={handleCancelEditPrompt}
                            disabled={savingPrompt}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`picture-resource-prompt-display ${readOnly ? 'readonly' : ''}`}
                        onClick={() => !readOnly && handleStartEditPrompt(resource)}
                        title={readOnly ? resource.prompt : '点击编辑提示词'}
                        style={readOnly ? { cursor: 'default' } : undefined}
                      >
                        {resource.prompt ? (
                          <span className="picture-resource-prompt">
                            {resource.prompt.length > 80 ? resource.prompt.slice(0, 80) + '...' : resource.prompt}
                          </span>
                        ) : (
                          <span className="picture-resource-no-prompt">{readOnly ? '无提示词' : '点击添加提示词'}</span>
                        )}
                        {!readOnly && (
                          <svg className="prompt-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="picture-resource-date">{formatDate(resource.createdAt)}</td>
                  <td className="picture-resource-date">{formatDate(resource.updatedAt)}</td>
                  {!readOnly && (
                    <td className="picture-resource-actions">
                      {resource.prompt && (
                        <button
                          className="picture-resource-generate-btn"
                          onClick={() => handleGenerateImage(resource)}
                          disabled={generatingResourceId === resource.id || resource.status === 'generating'}
                        >
                          {generatingResourceId === resource.id || resource.status === 'generating' ? (
                            <>
                              <span className="btn-spinner"></span>
                              生成中
                            </>
                          ) : resource.status === 'generated' ? (
                            '重新生成'
                          ) : (
                            '生成图片'
                          )}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="picture-resource-delete-btn"
                          onClick={() => onDelete(resource.id, resource.name)}
                        >
                          删除
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default PictureResourceList;
