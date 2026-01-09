import React, { useState } from 'react';
import {
  VideoResourceInfo,
  ResourceType,
  ResourceStatus,
  updateVideoResource,
  generateCharacter,
} from '@/api/videoResource';
import {
  createVideo,
  getTaskStatus as getVideoTaskStatus,
} from '@/api/videoGeneration';
import { showWarning, showSuccess } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';

// 资源类型标签
const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  skill: '技能',
};

// 资源状态标签
// 流转顺序: 未生成 → 视频生成中 → 视频已生成 → 角色生成中 → 已完成
const RESOURCE_STATUS_LABELS: Record<ResourceStatus, string> = {
  not_generated: '未生成',
  video_generating: '视频生成中',
  video_generated: '视频已生成',
  character_generating: '角色生成中',
  completed: '已完成',
  failed: '失败',
};

// 角色生成超时时间（5分钟）
const CHARACTER_GENERATION_TIMEOUT_MS = 5 * 60 * 1000;

interface VideoResourceTableProps {
  resources: VideoResourceInfo[];
  scriptStyle?: string;
  onResourcesChange: (resources: VideoResourceInfo[]) => void;
  onPreview: (resource: VideoResourceInfo) => void;
  onDelete?: (resourceId: number, resourceName?: string) => void;
  readOnly?: boolean;
}

const VideoResourceTable: React.FC<VideoResourceTableProps> = ({
  resources,
  scriptStyle,
  onResourcesChange,
  onPreview,
  onDelete,
  readOnly = false,
}) => {
  // 筛选器状态
  const [typeFilter, setTypeFilter] = useState<ResourceType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | ''>('');

  // 视频生成状态
  const [generatingVideoId, setGeneratingVideoId] = useState<number | null>(null);

  // 角色生成状态
  const [generatingCharacterId, setGeneratingCharacterId] = useState<number | null>(null);

  // 提示词编辑状态
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  // 名称编辑状态
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // 时间戳输入状态（开始时间和结束时间分开）
  const [startTimeInput, setStartTimeInput] = useState<Record<number, string>>({});
  const [endTimeInput, setEndTimeInput] = useState<Record<number, string>>({});

  // 尺寸选择状态
  const [aspectRatioInput, setAspectRatioInput] = useState<Record<number, string>>({});

  // 获取资源的默认尺寸：角色默认竖版(9:16)，其他默认横版(16:9)
  const getDefaultAspectRatio = (resourceType: ResourceType): string => {
    return resourceType === 'character' ? '9:16' : '16:9';
  };

  // 获取资源的尺寸（优先使用用户选择，其次是已保存值，最后是默认值）
  const getAspectRatio = (resource: VideoResourceInfo): string => {
    return aspectRatioInput[resource.id] ?? resource.aspectRatio ?? getDefaultAspectRatio(resource.resourceType);
  };

  // 筛选资源
  const filteredResources = resources.filter((resource) => {
    if (typeFilter && resource.resourceType !== typeFilter) {
      return false;
    }
    if (statusFilter && resource.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // 生成视频
  const handleGenerateVideo = async (resource: VideoResourceInfo) => {
    if (!resource.prompt) {
      showWarning('提示词不能为空');
      return;
    }

    setGeneratingVideoId(resource.id);
    try {
      // 更新本地状态为视频生成中
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, status: 'video_generating' as ResourceStatus } : r)
      );

      // 先更新数据库状态为 video_generating，并保存尺寸
      const aspectRatio = getAspectRatio(resource);
      await updateVideoResource(resource.id, { status: 'video_generating', aspectRatio });

      // 构建提示词：如果剧本有风格，将风格提示词加在前面
      let finalPrompt = resource.prompt;
      if (scriptStyle) {
        const styleOption = IMAGE_STYLES.find(s => s.value === scriptStyle);
        if (styleOption?.prompt) {
          finalPrompt = `${styleOption.prompt}, ${resource.prompt}`;
        }
      }

      // 创建视频生成任务
      const result = await createVideo({
        prompt: finalPrompt,
        aspectRatio: aspectRatio as '16:9' | '9:16',
        duration: 10,
        scriptId: resource.scriptId ?? undefined,
        projectId: resource.workflowProjectId ?? undefined,
      });

      if (result.code !== 200) {
        throw new Error(result.msg || '创建任务失败');
      }

      const taskId = result.data.id;  // 数据库ID，用于轮询查询状态
      const videoTaskId = result.data.taskId;  // 外部taskId（sora的taskId），用于角色生成
      showSuccess('视频生成任务已创建，正在生成中...');

      // 更新数据库，保存外部taskId（角色生成需要用这个ID）
      await updateVideoResource(resource.id, {
        videoTaskId: videoTaskId,
        status: 'video_generating',
      });

      // 更新本地状态
      onResourcesChange(
        resources.map(r => r.id === resource.id ? {
          ...r,
          status: 'video_generating' as ResourceStatus,
          videoTaskId: videoTaskId,
        } : r)
      );

      // 轮询任务状态
      const pollTask = async () => {
        try {
          const statusResult = await getVideoTaskStatus(taskId);
          if (statusResult.code !== 200) {
            throw new Error(statusResult.msg || '查询任务状态失败');
          }

          const task = statusResult.data;

          if (task.status === 'succeeded' && task.resultUrl) {
            // 更新数据库 - 视频生成完成，状态变为 video_generated
            await updateVideoResource(resource.id, {
              videoUrl: task.resultUrl,
              videoResultUrl: task.resultUrl,
              status: 'video_generated',
            });

            // 更新本地状态
            onResourcesChange(
              resources.map(r => r.id === resource.id ? {
                ...r,
                videoUrl: task.resultUrl!,
                videoResultUrl: task.resultUrl!,
                status: 'video_generated' as ResourceStatus,
              } : r)
            );
            showSuccess('视频生成完成');
            setGeneratingVideoId(null);
          } else if (task.status === 'error') {
            // 更新数据库状态为失败
            await updateVideoResource(resource.id, {
              status: 'failed',
              errorMessage: task.errorMessage || '视频生成失败',
            });

            // 更新本地状态
            onResourcesChange(
              resources.map(r => r.id === resource.id ? {
                ...r,
                status: 'failed' as ResourceStatus,
                errorMessage: task.errorMessage,
              } : r)
            );
            showWarning('视频生成失败: ' + (task.errorMessage || '未知错误'));
            setGeneratingVideoId(null);
          } else {
            // 继续轮询
            setTimeout(pollTask, 10000);
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error);
          // 更新数据库状态为失败
          await updateVideoResource(resource.id, { status: 'failed' });
          onResourcesChange(
            resources.map(r => r.id === resource.id ? { ...r, status: 'failed' as ResourceStatus } : r)
          );
          setGeneratingVideoId(null);
        }
      };

      // 开始轮询
      setTimeout(pollTask, 5000);

    } catch (error) {
      console.error('生成视频失败:', error);
      showWarning('生成视频失败');
      // 更新数据库状态为未生成
      await updateVideoResource(resource.id, { status: 'not_generated' });
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, status: 'not_generated' as ResourceStatus } : r)
      );
      setGeneratingVideoId(null);
    }
  };

  // 生成角色
  const handleGenerateCharacter = async (resource: VideoResourceInfo) => {
    // 需要有视频 URL 或视频任务 ID
    if (!resource.videoUrl && !resource.videoTaskId) {
      showWarning('请先生成视频');
      return;
    }

    // 获取开始和结束时间
    const startTime = startTimeInput[resource.id] ?? (resource.startTime?.toString() || '0');
    const endTime = endTimeInput[resource.id] ?? (resource.endTime?.toString() || '3');

    // 验证时间格式
    const startNum = parseFloat(startTime);
    const endNum = parseFloat(endTime);
    if (isNaN(startNum) || isNaN(endNum)) {
      showWarning('请输入有效的时间');
      return;
    }
    if (startNum >= endNum) {
      showWarning('开始时间必须小于结束时间');
      return;
    }

    const timestamps = `${startTime},${endTime}`;

    setGeneratingCharacterId(resource.id);
    try {
      // 更新状态为角色生成中
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, status: 'character_generating' as ResourceStatus } : r)
      );

      // 调用角色生成 API - 优先使用 videoTaskId，为空时才用 videoUrl
      const result = await generateCharacter({
        resourceId: resource.id,
        videoUrl: resource.videoTaskId ? undefined : (resource.videoUrl ?? undefined),
        videoTaskId: resource.videoTaskId ?? undefined,
        timestamps: timestamps,
      });

      if (result.code !== 200) {
        throw new Error(result.msg || '创建角色生成任务失败');
      }

      showSuccess('角色生成任务已创建');

      // 更新资源 - 保持角色生成中状态
      onResourcesChange(
        resources.map(r => r.id === resource.id ? {
          ...r,
          ...result.data,
          status: 'character_generating' as ResourceStatus,
        } : r)
      );

    } catch (error) {
      console.error('生成角色失败:', error);
      showWarning('生成角色失败');
      onResourcesChange(
        resources.map(r => r.id === resource.id ? { ...r, status: 'failed' as ResourceStatus } : r)
      );
    } finally {
      setGeneratingCharacterId(null);
    }
  };

  // 开始编辑提示词
  const handleStartEditPrompt = (resource: VideoResourceInfo) => {
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
      await updateVideoResource(resourceId, { prompt: editingPromptValue });
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
  const handleStartEditName = (resource: VideoResourceInfo) => {
    setEditingNameId(resource.id);
    setEditingNameValue(resource.resourceName || '');
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
      await updateVideoResource(resourceId, { resourceName: editingNameValue.trim() });
      // 更新本地状态
      onResourcesChange(
        resources.map(r => r.id === resourceId ? { ...r, resourceName: editingNameValue.trim() } : r)
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

  // 判断角色生成是否超时（超过5分钟）
  const isCharacterGenerationTimeout = (resource: VideoResourceInfo): boolean => {
    if (resource.status !== 'character_generating' || !resource.characterRequestedAt) {
      return false;
    }
    const requestedTime = new Date(resource.characterRequestedAt).getTime();
    const now = Date.now();
    return (now - requestedTime) > CHARACTER_GENERATION_TIMEOUT_MS;
  };

  // 判断是否可以生成角色（视频已生成状态才能生成角色，或者角色生成超时可以重新提交）
  const canGenerateCharacter = (resource: VideoResourceInfo) => {
    const hasVideo = resource.videoUrl || resource.videoTaskId;
    const isNotGenerating = resource.status !== 'video_generating' && resource.status !== 'character_generating';
    const isTimeout = isCharacterGenerationTimeout(resource);
    return hasVideo && (isNotGenerating || isTimeout);
  };

  return (
    <>
      {/* 筛选器 */}
      <div className="sd-filters">
        <select
          className="sd-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ResourceType | '')}
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
          onChange={(e) => setStatusFilter(e.target.value as ResourceStatus | '')}
        >
          <option value="">全部状态</option>
          <option value="not_generated">未生成</option>
          <option value="video_generating">视频生成中</option>
          <option value="video_generated">视频已生成</option>
          <option value="character_generating">角色生成中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
      </div>

      {/* 列表 */}
      {filteredResources.length === 0 ? (
        <div className="sd-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <p>暂无视频资源</p>
          <span>点击上方"自动识别"按钮从剧本中提取资源</span>
        </div>
      ) : (
        <div className="video-resource-list">
          <table className="video-resource-table">
            <thead>
              <tr>
                <th>预览</th>
                <th>名称</th>
                <th>类型</th>
                <th>状态</th>
                <th>提示词</th>
                {!readOnly && <th>尺寸</th>}
                {!readOnly && <th>开始(秒)</th>}
                {!readOnly && <th>结束(秒)</th>}
                <th>创建时间</th>
                {!readOnly && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id}>
                  <td>
                    <div
                      className={`video-resource-thumbnail ${resource.videoUrl || resource.characterImageUrl ? 'clickable' : ''}`}
                      onClick={() => (resource.videoUrl || resource.characterImageUrl) && onPreview(resource)}
                    >
                      {resource.characterImageUrl ? (
                        <img src={resource.characterImageUrl} alt={resource.resourceName} />
                      ) : resource.videoUrl ? (
                        <video src={resource.videoUrl} />
                      ) : (
                        <div className="video-resource-no-preview">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="video-resource-name">
                    {editingNameId === resource.id && !readOnly ? (
                      <div className="video-resource-name-edit">
                        <input
                          type="text"
                          className="video-resource-name-input"
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
                        <div className="video-resource-name-actions">
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
                        className={`video-resource-name-display ${readOnly ? 'readonly' : ''}`}
                        onClick={() => !readOnly && handleStartEditName(resource)}
                        title={readOnly ? resource.resourceName : '点击编辑名称'}
                        style={readOnly ? { cursor: 'default' } : undefined}
                      >
                        <span>{resource.resourceName}</span>
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
                    <span className="video-resource-type-tag">
                      {RESOURCE_TYPE_LABELS[resource.resourceType as ResourceType] || resource.resourceType}
                    </span>
                  </td>
                  <td>
                    <span className={`video-resource-status-tag status-${resource.status}`}>
                      {RESOURCE_STATUS_LABELS[resource.status as ResourceStatus] || resource.status}
                    </span>
                  </td>
                  <td className="video-resource-prompt-cell">
                    {editingPromptId === resource.id && !readOnly ? (
                      <div className="video-resource-prompt-edit">
                        <textarea
                          className="video-resource-prompt-textarea"
                          value={editingPromptValue}
                          onChange={(e) => setEditingPromptValue(e.target.value)}
                          placeholder="输入提示词..."
                          rows={3}
                          autoFocus
                        />
                        <div className="video-resource-prompt-actions">
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
                        className={`video-resource-prompt-display ${readOnly ? 'readonly' : ''}`}
                        onClick={() => !readOnly && handleStartEditPrompt(resource)}
                        title={readOnly ? (resource.prompt ?? undefined) : '点击编辑提示词'}
                        style={readOnly ? { cursor: 'default' } : undefined}
                      >
                        {resource.prompt ? (
                          <span className="video-resource-prompt">
                            {resource.prompt.length > 60 ? resource.prompt.slice(0, 60) + '...' : resource.prompt}
                          </span>
                        ) : (
                          <span className="video-resource-no-prompt">{readOnly ? '无提示词' : '点击添加提示词'}</span>
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
                  {!readOnly && (
                    <td className="video-resource-aspect-cell">
                      <select
                        className="video-resource-aspect-select"
                        value={getAspectRatio(resource)}
                        onChange={(e) => setAspectRatioInput({
                          ...aspectRatioInput,
                          [resource.id]: e.target.value,
                        })}
                        disabled={resource.status === 'video_generating'}
                      >
                        <option value="16:9">横版</option>
                        <option value="9:16">竖版</option>
                      </select>
                    </td>
                  )}
                  {!readOnly && (
                    <td className="video-resource-time-cell">
                      {resource.videoUrl || resource.videoTaskId ? (
                        <input
                          type="number"
                          className="video-resource-time-input"
                          placeholder="0"
                          step="0.1"
                          min="0"
                          value={startTimeInput[resource.id] ?? resource.startTime ?? ''}
                          onChange={(e) => setStartTimeInput({
                            ...startTimeInput,
                            [resource.id]: e.target.value,
                          })}
                        />
                      ) : (
                        <span className="video-resource-no-time">-</span>
                      )}
                    </td>
                  )}
                  {!readOnly && (
                    <td className="video-resource-time-cell">
                      {resource.videoUrl || resource.videoTaskId ? (
                        <input
                          type="number"
                          className="video-resource-time-input"
                          placeholder="3"
                          step="0.1"
                          min="0"
                          value={endTimeInput[resource.id] ?? resource.endTime ?? ''}
                          onChange={(e) => setEndTimeInput({
                            ...endTimeInput,
                            [resource.id]: e.target.value,
                          })}
                        />
                      ) : (
                        <span className="video-resource-no-time">-</span>
                      )}
                    </td>
                  )}
                  <td className="video-resource-date">{formatDate(resource.createdAt)}</td>
                  {!readOnly && (
                    <td className="video-resource-actions">
                      <div className="video-resource-action-group">
                        {/* 视频创作按钮 */}
                        {resource.prompt && (
                          <button
                            className="video-resource-action-btn video-generate"
                            onClick={() => handleGenerateVideo(resource)}
                            disabled={generatingVideoId === resource.id || resource.status === 'video_generating'}
                            title="生成视频"
                          >
                            {generatingVideoId === resource.id || resource.status === 'video_generating' ? (
                              <>
                                <span className="btn-spinner"></span>
                                生成中
                              </>
                            ) : resource.videoUrl ? (
                              '重新生成'
                            ) : (
                              '视频创作'
                            )}
                          </button>
                        )}

                        {/* 角色创作按钮 */}
                        {canGenerateCharacter(resource) && (
                          <button
                            className={`video-resource-action-btn character-generate ${isCharacterGenerationTimeout(resource) ? 'timeout' : ''}`}
                            onClick={() => handleGenerateCharacter(resource)}
                            disabled={generatingCharacterId === resource.id}
                            title={isCharacterGenerationTimeout(resource) ? '角色生成超时，点击重新提交' : '从视频生成角色'}
                          >
                            {generatingCharacterId === resource.id ? (
                              <>
                                <span className="btn-spinner"></span>
                                生成中
                              </>
                            ) : isCharacterGenerationTimeout(resource) ? (
                              '重新提交'
                            ) : resource.characterId ? (
                              '重新生成'
                            ) : (
                              '角色创作'
                            )}
                          </button>
                        )}

                        {/* 删除按钮 */}
                        {onDelete && (
                          <button
                            className="video-resource-action-btn delete"
                            onClick={() => onDelete(resource.id, resource.resourceName)}
                            title="删除"
                          >
                            删除
                          </button>
                        )}
                      </div>
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

export default VideoResourceTable;
