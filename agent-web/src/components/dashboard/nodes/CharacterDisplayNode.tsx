import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { updateCharacter, getCharacterStatus, type CharacterInfo } from '../../../api/character';
import { getResourceStatus, pollResourceUntilComplete, updateResourceName, type ScriptResourceInfo, type ResourceType, isImageResource, getResourceImageUrl } from '../../../api/scriptResource';
import { type VideoResourceInfo } from '../../../api/videoResource';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { showSuccess, showWarning } from '../../../utils/request';
import './CharacterDisplayNode.css';

interface CharacterDisplayNodeData {
  label: string;

  // 新版字段（ScriptResource）
  resourceId?: number;                // script_resources 表的 ID
  resourceType?: ResourceType;        // video_character | image_character | video_scene | image_scene
  resourceCategory?: 'character' | 'scene'; // character | scene

  // 旧版字段（兼容期保留）
  characterTaskId?: number;           // 角色创建任务的数据库 ID，用于轮询
  characterId?: string;
  characterName?: string;
  characterImageUrl?: string;
  id?: number;

  // 通用状态字段
  status?: 'idle' | 'loading' | 'success' | 'error';
  progress?: number;
  errorMessage?: string;
  characterType?: 'character' | 'scene'; // 人物角色或场景角色（@deprecated，使用 resourceCategory）
}

interface CharacterDisplayNodeProps {
  data: CharacterDisplayNodeData;
  id: string;
}

const CharacterDisplayNode: React.FC<CharacterDisplayNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes } = useReactFlow();
  const { addCharacterToCache } = useWorkflowStore();
  const [isEditingName, setIsEditingName] = useState(false);

  // 判断是否为新版资源类型
  const isNewResource = data.resourceId !== undefined && data.resourceType !== undefined;

  // 根据类型确定显示文本（兼容新旧版本）
  const isScene = data.resourceCategory === 'scene' || data.characterType === 'scene';
  const entityType = isScene ? '场景' : '角色';
  const entityIcon = isScene ? '🏞️' : '👤';
  const defaultName = isScene ? '未命名场景' : '未命名角色';

  // 判断是否为图片资源
  const isImage = data.resourceType ? isImageResource(data.resourceType) : false;

  const [editedName, setEditedName] = useState(data.characterName || defaultName);
  const [isSaving, setIsSaving] = useState(false);

  // 监听data变化，同步更新本地state
  useEffect(() => {
    if (data.characterName !== undefined) {
      setEditedName(data.characterName);
    }
  }, [data.characterName]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<CharacterDisplayNodeData>) => {
    const nodes = getNodes();
    setNodes(
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                ...updates,
              },
            }
          : node
      )
    );
  };

  // 轮询资源创建任务状态（兼容新旧API）
  useEffect(() => {
    // 优先使用新版 API
    if (isNewResource && data.resourceId) {
      if (data.status === 'success' || data.status === 'error') {
        return;
      }

      let isCancelled = false;

      const pollNewResource = async () => {
        try {
          const resource = await pollResourceUntilComplete(
            data.resourceId!,
            (progress) => {
              if (isCancelled) return;
              // 更新进度
              updateNodeData({ progress: progress.status === 'completed' ? 100 : 50 });
            },
            { interval: 5000, maxAttempts: 120 }
          );

          if (isCancelled) return;

          // 任务完成
          updateNodeData({
            status: 'success',
            characterImageUrl: getResourceImageUrl(resource) || undefined,
            characterName: resource.resourceName || defaultName,
            progress: 100,
          });

          // 添加到缓存（新版资源）
          if (addCharacterToCache) {
            // 将 ScriptResourceInfo 转换为兼容格式
            const compatibleResource = {
              id: resource.id,
              characterName: resource.resourceName,
              characterImageUrl: getResourceImageUrl(resource),
              characterId: (resource.resourceDetails as any).videoCharacterId || String(resource.id),
              characterType: resource.resourceCategory,
              status: resource.status,
              createdAt: resource.createdAt,
              updatedAt: resource.updatedAt,
            };
            addCharacterToCache(compatibleResource as any);
          }
        } catch (error: any) {
          if (isCancelled) return;
          console.error('轮询资源任务失败:', error);
          updateNodeData({
            status: 'error',
            errorMessage: error.message || '查询任务失败',
          });
        }
      };

      pollNewResource();

      return () => {
        isCancelled = true;
      };
    }

    // 兼容旧版 API
    if (!data.characterTaskId || data.status === 'success' || data.status === 'error') {
      return;
    }

    let isCancelled = false;

    const pollTask = async () => {
      try {
        const result = await getCharacterStatus(data.characterTaskId!);

        if (isCancelled) return;

        if (result.code !== 200) {
          updateNodeData({
            status: 'error',
            errorMessage: result.msg || '查询任务失败',
          });
          return;
        }

        const character: CharacterInfo = result.data;

        // 任务完成
        if (character.status === 'completed') {
          // 将 CharacterInfo 转换为 VideoResourceInfo 格式添加到缓存
          const compatibleResource: VideoResourceInfo = {
            id: character.id,
            scriptId: null,
            workflowProjectId: null,
            resourceName: character.characterName || defaultName,
            resourceType: (character.characterType === 'scene' ? 'scene' : 'character'),
            prompt: null,
            aspectRatio: null,
            videoTaskId: null,
            videoUrl: null,
            videoResultUrl: null,
            startTime: null,
            endTime: null,
            timestamps: null,
            generationTaskId: null,
            characterId: character.characterId || null,
            characterImageUrl: character.characterImageUrl || null,
            characterVideoUrl: null,
            status: 'completed',
            errorMessage: null,
            isRealPerson: false,
            resultData: null,
            createdAt: character.createdAt || new Date().toISOString(),
            updatedAt: character.updatedAt || new Date().toISOString(),
            completedAt: null,
            characterRequestedAt: null,
          };
          addCharacterToCache(compatibleResource);

          updateNodeData({
            status: 'success',
            characterId: character.characterId,
            characterName: character.characterName || defaultName,
            characterImageUrl: character.characterImageUrl || undefined,
            id: character.id,
            progress: 100,
          });
          return;
        }

        // 任务失败
        if (character.status === 'failed') {
          updateNodeData({
            status: 'error',
            errorMessage: character.errorMessage || '创建失败',
          });
          return;
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('轮询角色任务失败:', error);
        updateNodeData({
          status: 'error',
          errorMessage: error.message || '查询任务失败',
        });
      }
    };

    // 立即执行一次
    pollTask();

    // 设置轮询（每5秒一次）
    const interval = setInterval(pollTask, 5000);

    // 清理
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [data.resourceId, data.characterTaskId, data.status, isNewResource]);

  // 处理名称保存
  const handleSaveName = async () => {
    console.log('handleSaveName 被调用');
    console.log('当前状态:', { isSaving, editedName, characterId: data.id, resourceId: data.resourceId, isNewResource });

    // 防止重复保存
    if (isSaving) {
      console.log('正在保存中，跳过');
      return;
    }

    const trimmedName = editedName.trim();

    // 验证名称不为空
    if (!trimmedName) {
      console.log('名称为空，恢复原始值');
      setEditedName(data.characterName || defaultName);
      setIsEditingName(false);
      return;
    }

    // 如果名称没有变化，直接退出编辑模式
    if (trimmedName === data.characterName) {
      console.log('名称未变化，退出编辑');
      setIsEditingName(false);
      return;
    }

    try {
      setIsSaving(true);

      if (isNewResource && data.resourceId) {
        // 新版 API：更新 ScriptResource 资源名称
        console.log('开始调用 updateResourceName API:', { id: data.resourceId, name: trimmedName });

        const result = await updateResourceName(data.resourceId, trimmedName);

        console.log('API 返回结果:', result);

        if (result.code === 200) {
          // 保存成功，更新节点数据
          updateNodeData({ characterName: trimmedName });
          showSuccess(`${entityType}名称已更新`);
          setIsEditingName(false);
        } else {
          // 保存失败，显示错误信息
          showWarning(result.msg || '保存失败');
          setEditedName(data.characterName || defaultName);
        }
      } else {
        // 旧版 API：更新 Character
        // 验证是否有数据库ID
        if (!data.id) {
          console.log(`缺少${entityType}ID`);
          showWarning(`无法保存：缺少${entityType}ID`);
          setIsEditingName(false);
          return;
        }

        console.log('开始调用 updateCharacter API:', { id: data.id, name: trimmedName });

        // 调用API保存名称到数据库
        const result = await updateCharacter(data.id, {
          characterName: trimmedName
        });

        console.log('API 返回结果:', result);

        if (result.code === 200) {
          // 保存成功，更新节点数据
          updateNodeData({ characterName: trimmedName });
          showSuccess(`${entityType}名称已更新`);
          setIsEditingName(false);
        } else {
          // 保存失败，显示错误信息
          showWarning(result.msg || '保存失败');
          setEditedName(data.characterName || defaultName);
        }
      }
    } catch (error) {
      console.error(`保存${entityType}名称失败:`, error);
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      showWarning(errorMessage);
      setEditedName(data.characterName || defaultName);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理名称取消
  const handleCancelEdit = () => {
    setEditedName(data.characterName || defaultName);
    setIsEditingName(false);
  };

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  return (
    <div className="character-display-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#9333ea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>{entityIcon} {data.label}</strong>
      </div>

      <div className="node-body">
        {/* Loading 状态 */}
        {data.status === 'loading' ? (
          <div className="character-loading-wrapper">
            <div className="character-avatar-placeholder">
              <div className="spinner"></div>
            </div>
            <div className="loading-text">
              <p className="loading-title">{entityType}生成中...</p>
              {data.progress !== undefined && data.progress > 0 && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${data.progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{data.progress}%</p>
                </>
              )}
            </div>
          </div>
        ) : data.status === 'error' ? (
          /* 错误状态 */
          <div className="character-error-wrapper">
            <div className="character-avatar-placeholder error">
              <span className="placeholder-icon">❌</span>
              <p className="placeholder-text">生成失败</p>
            </div>
            {data.errorMessage && (
              <div className="error-message">
                <p>{data.errorMessage}</p>
              </div>
            )}
          </div>
        ) : (
          /* 正常/成功状态 */
          <>
            {/* 角色/场景头像 */}
            <div className="character-avatar-wrapper">
              {data.characterImageUrl ? (
                <img
                  src={data.characterImageUrl}
                  alt={data.characterName || `${entityType}形象`}
                  className="character-avatar"
                />
              ) : (
                <div className="character-avatar-placeholder">
                  <span className="placeholder-icon">{entityIcon}</span>
                  <p className="placeholder-text">暂无形象</p>
                </div>
              )}
            </div>

            {/* 角色/场景信息 */}
            <div className="character-info">
              <div className="info-item">
                <label className="info-label">{entityType}名称</label>
                {isEditingName ? (
                  <div className="name-edit-wrapper nodrag">
                    <input
                      type="text"
                      className="name-edit-input nodrag"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <div className="name-edit-buttons nodrag">
                      <button
                        type="button"
                        className="name-edit-btn save nodrag"
                        onClick={(e) => {
                          console.log('✓ 按钮 onClick 被触发');
                          e.stopPropagation();
                          e.preventDefault();
                          handleSaveName();
                        }}
                        onMouseDown={(e) => {
                          console.log('✓ 按钮 onMouseDown 被触发');
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          console.log('✓ 按钮 onPointerDown 被触发');
                          e.stopPropagation();
                        }}
                        disabled={isSaving}
                        title={isSaving ? '保存中...' : '保存'}
                      >
                        {isSaving ? '⏳' : '✓'}
                      </button>
                      <button
                        type="button"
                        className="name-edit-btn cancel nodrag"
                        onClick={(e) => {
                          console.log('✕ 按钮 onClick 被触发');
                          e.stopPropagation();
                          e.preventDefault();
                          handleCancelEdit();
                        }}
                        onMouseDown={(e) => {
                          console.log('✕ 按钮 onMouseDown 被触发');
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          console.log('✕ 按钮 onPointerDown 被触发');
                          e.stopPropagation();
                        }}
                        disabled={isSaving}
                        title="取消"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="info-value editable"
                    onClick={() => setIsEditingName(true)}
                    title="点击编辑名称"
                  >
                    {data.characterName || defaultName}
                    <span className="edit-icon">✏️</span>
                  </div>
                )}
              </div>

              {data.characterId && (
                <div className="info-item">
                  <label className="info-label">{entityType}ID</label>
                  <div className="info-value character-id">{data.characterId}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#9333ea', width: 10, height: 10 }}
      />
    </div>
  );
};

export default CharacterDisplayNode;
