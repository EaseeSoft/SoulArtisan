import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { createCharacterFromVideo } from '../../../api/character';
import type { CreateCharacterFromVideoParams } from '../../../api/character';
import { getTaskStatus as getVideoTaskStatus, type CharacterTask } from '../../../api/characterGeneration';
import { createVideoCharacter, createVideoScene, type CreateVideoCharacterRequest, type CreateVideoSceneRequest } from '../../../api/scriptResource';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { showSuccess, showWarning } from '../../../utils/request';
import './CharacterVideoNode.css';

interface CharacterVideoNodeData {
  label: string;
  videoUrl?: string;
  taskId?: string;
  videoTaskId?: number; // 视频生成任务的数据库 ID，用于轮询
  startTime?: number;
  endTime?: number;
  status?: 'idle' | 'loading' | 'success' | 'error';
  progress?: number;
  errorMessage?: string;
  characterType?: 'character' | 'scene'; // 人物角色或场景角色
  characterName?: string; // 角色/场景名称

  // 新版字段（ScriptResource）
  resourceType?: 'video_character' | 'video_scene' | 'image_character' | 'image_scene';
  resourceCategory?: 'character' | 'scene';
  useNewApi?: boolean; // 是否使用新版 API
}

interface CharacterVideoNodeProps {
  data: CharacterVideoNodeData;
  id: string;
}

const CharacterVideoNode: React.FC<CharacterVideoNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const { currentProjectId } = useWorkflowStore();
  const [startTime, setStartTime] = useState<string>(String(data.startTime ?? 0));
  const [endTime, setEndTime] = useState<string>(String(data.endTime ?? 3));
  const [isCreating, setIsCreating] = useState(false);

  // 根据类型确定显示文本
  const isScene = data.characterType === 'scene';
  const entityType = isScene ? '场景' : '角色';
  const entityIcon = isScene ? '🏞️' : '🎭';

  // 监听data变化，同步更新本地state
  useEffect(() => {
    if (data.startTime !== undefined) {
      setStartTime(String(data.startTime));
    }
    if (data.endTime !== undefined) {
      setEndTime(String(data.endTime));
    }
  }, [data.startTime, data.endTime]);

  // 轮询视频生成任务状态
  useEffect(() => {
    if (!data.videoTaskId || data.status === 'success' || data.status === 'error') {
      return;
    }

    let isCancelled = false;

    const pollTask = async () => {
      try {
        const result = await getVideoTaskStatus(data.videoTaskId!);

        if (isCancelled) return;

        if (result.code !== 200) {
          updateNodeData({
            status: 'error',
            errorMessage: result.msg || '查询任务失败',
          });
          return;
        }

        const task: CharacterTask = result.data;

        // 更新进度
        updateNodeData({
          progress: task.progress,
        });

        // 任务完成
        if (task.status === 'succeeded' && task.resultUrl) {
          updateNodeData({
            status: 'success',
            videoUrl: task.resultUrl,
            taskId: task.taskId,
            progress: 100,
          });
          return;
        }

        // 任务失败
        if (task.status === 'error') {
          updateNodeData({
            status: 'error',
            errorMessage: task.errorMessage || '生成失败',
          });
          return;
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('轮询视频任务失败:', error);
        updateNodeData({
          status: 'error',
          errorMessage: error.message || '查询任务失败',
        });
      }
    };

    // 立即执行一次
    pollTask();

    // 设置轮询（每10秒一次）
    const interval = setInterval(pollTask, 10000);

    // 清理
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [data.videoTaskId, data.status]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<CharacterVideoNodeData>) => {
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

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
  };

  const handleStartTimeBlur = () => {
    const numValue = parseFloat(startTime);
    const newValue = isNaN(numValue) ? 0 : Math.max(0, numValue);
    setStartTime(String(newValue));
    updateNodeData({ startTime: newValue });
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
  };

  const handleEndTimeBlur = () => {
    const numValue = parseFloat(endTime);
    const startNum = parseFloat(startTime) || 0;
    const newValue = isNaN(numValue) ? startNum + 1 : Math.max(startNum + 1, numValue);
    setEndTime(String(newValue));
    updateNodeData({ endTime: newValue });
  };

  const handleCreateCharacter = async () => {
    try {
      setIsCreating(true);

      // 解析时间值
      const startNum = parseFloat(startTime) || 0;
      const endNum = parseFloat(endTime) || 0;

      // 验证时间范围
      const duration = endNum - startNum;
      if (duration < 1) {
        showWarning('时间范围差值最小1秒');
        setIsCreating(false);
        return;
      }
      if (duration > 3) {
        showWarning('时间范围差值最大5秒');
        setIsCreating(false);
        return;
      }

      // 验证必填参数
      if (!data.videoUrl && !data.taskId) {
        showWarning('请先设置视频URL或任务ID');
        setIsCreating(false);
        return;
      }

      // 验证项目ID
      if (!currentProjectId) {
        showWarning('无法获取项目ID，请确保在项目中进行操作');
        setIsCreating(false);
        return;
      }

      // 立即创建角色展示节点（loading状态）
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const currentNode = currentNodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 确定资源类型
      const resourceCategory = isScene ? 'scene' : 'character';
      const resourceType = isScene ? 'video_scene' : 'video_character';

      const characterDisplayNodeId = `node-char-display-${Math.random().toString(36).substr(2, 9)}`;
      const displayLabel = isScene ? '场景展示' : '角色展示';
      const characterDisplayNode: Node = {
        id: characterDisplayNodeId,
        type: 'characterDisplayNode',
        position: {
          x: currentNode.position.x + 400,
          y: currentNode.position.y
        },
        data: {
          label: displayLabel,
          status: 'loading',
          progress: 0,
          characterName: data.characterName || '生成中...',
          characterType: data.characterType,
          // 新版字段
          resourceType: resourceType,
          resourceCategory: resourceCategory,
        }
      };

      // 添加节点
      setNodes([...currentNodes, characterDisplayNode]);

      // 创建连接：角色视频节点 -> 角色展示节点
      const newEdge = {
        id: `edge-${id}-${characterDisplayNodeId}`,
        source: id,
        target: characterDisplayNodeId,
        animated: true
      };

      setEdges([...currentEdges, newEdge]);

      // 异步执行创建角色任务（不阻塞UI）
      (async () => {
        try {
          // 判断是否使用新版 API
          const useNewApi = data.useNewApi || data.resourceType !== undefined;

          if (useNewApi) {
            // 新版 API：创建 ScriptResource
            const timestamps = `${startNum},${endNum}`;

            if (isScene) {
              const params: CreateVideoSceneRequest = {
                projectId: currentProjectId,
                resourceName: data.characterName || '未命名场景',
                timestamps: timestamps,
              };

              console.log('创建视频场景资源参数:', params);
              const result = await createVideoScene(params);

              if (result.code !== 200) {
                throw new Error(result.msg || '创建场景资源失败');
              }

              const resourceId = result.data.id;
              console.log('场景资源创建成功，resourceId:', resourceId);

              // 将 resourceId 保存到角色展示节点
              const updatedNodes = getNodes();
              setNodes(
                updatedNodes.map((node) =>
                  node.id === characterDisplayNodeId
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          resourceId: resourceId,
                          resourceType: 'video_scene',
                          resourceCategory: 'scene',
                        }
                      }
                    : node
                )
              );
            } else {
              const params: CreateVideoCharacterRequest = {
                projectId: currentProjectId,
                resourceName: data.characterName || '未命名角色',
                timestamps: timestamps,
              };

              console.log('创建视频角色资源参数:', params);
              const result = await createVideoCharacter(params);

              if (result.code !== 200) {
                throw new Error(result.msg || '创建角色资源失败');
              }

              const resourceId = result.data.id;
              console.log('角色资源创建成功，resourceId:', resourceId);

              // 将 resourceId 保存到角色展示节点
              const updatedNodes = getNodes();
              setNodes(
                updatedNodes.map((node) =>
                  node.id === characterDisplayNodeId
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          resourceId: resourceId,
                          resourceType: 'video_character',
                          resourceCategory: 'character',
                        }
                      }
                    : node
                )
              );
            }
          } else {
            // 旧版 API：创建 Character（兼容）
            const params: CreateCharacterFromVideoParams = {
              projectId: currentProjectId,
              timestamps: `${startNum},${endNum}`,
              characterType: isScene ? 'scene' : 'character',
              characterName: data.characterName,
            };

            // 根据数据类型设置url或fromTask
            if (data.taskId) {
              params.fromTask = data.taskId;
            } else if (data.videoUrl) {
              params.url = data.videoUrl;
            }

            console.log('创建角色参数（旧版API）:', params);

            // 调用角色生成API
            const result = await createCharacterFromVideo(params);

            if (result.code !== 200) {
              throw new Error(result.msg || '创建角色失败');
            }

            const characterId = result.data.id;
            console.log('角色创建任务已提交，characterTaskId:', characterId);

            // 将 characterTaskId 保存到角色展示节点，CharacterDisplayNode 会自动开始轮询
            const updatedNodes = getNodes();
            setNodes(
              updatedNodes.map((node) =>
                node.id === characterDisplayNodeId
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        characterTaskId: characterId,
                      }
                    }
                  : node
              )
            );
          }
        } catch (error) {
          console.error(`创建${entityType}失败:`, error);
          const errorMessage = error instanceof Error ? error.message : `创建${entityType}失败`;

          // 更新角色展示节点为失败状态
          const updatedNodes = getNodes();
          setNodes(
            updatedNodes.map((node) =>
              node.id === characterDisplayNodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: 'error',
                      errorMessage
                    }
                  }
                : node
            )
          );

          // 显示错误信息
          showWarning(errorMessage);
        }
      })();

    } catch (error) {
      console.error('创建角色展示节点失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      showWarning(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="character-video-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ff6b9d', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>🎬 {data.label}</strong>
      </div>

      <div className="node-body">
        {/* 视频显示区域 */}
        {data.status === 'loading' ? (
          <div className="video-display-wrapper aspect-9-16 loading-state">
            <div className="loading-content">
              <div className="spinner"></div>
              <p>{entityType}生成中...</p>
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
        ) : data.videoUrl ? (
          <div className="video-display-wrapper aspect-9-16">
            <video
              src={data.videoUrl}
              controls
              className="display-video"
              preload="metadata"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        ) : (
          <div className="empty-state">
            <p>等待视频...</p>
            {data.taskId && <p className="task-id">任务ID: {data.taskId}</p>}
          </div>
        )}

        {/* 参数设置区域 - loading状态时隐藏 */}
        {data.status !== 'loading' && (
          <div className="params-section">
            {/* 任务ID显示 */}
            {data.taskId && (
              <div className="param-group">
                <label className="param-label">任务ID</label>
                <input
                  type="text"
                  className="param-input"
                  value={data.taskId}
                  readOnly
                  disabled
                />
              </div>
            )}

          {/* 时间范围设置 */}
          <div className="time-range-section">
            <div className="param-group">
              <label className="param-label">开始时间(秒)</label>
              <input
                type="number"
                className="param-input"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                onBlur={handleStartTimeBlur}
                min={0}
                step={0.1}
                disabled={isCreating}
              />
            </div>

            <div className="param-group">
              <label className="param-label">结束时间(秒)</label>
              <input
                type="number"
                className="param-input"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                onBlur={handleEndTimeBlur}
                min={0}
                step={0.1}
                disabled={isCreating}
              />
            </div>
          </div>

          {/* 时间范围提示 */}
          <div className="time-hint">
            <small>
              时间范围: {((parseFloat(endTime) || 0) - (parseFloat(startTime) || 0)).toFixed(1)}秒 (限制: 1-3秒)
            </small>
          </div>

          {/* 创建角色/场景按钮 */}
          <button
            className="create-character-btn"
            onClick={handleCreateCharacter}
            disabled={isCreating || (!data.videoUrl && !data.taskId)}
          >
            {isCreating ? '创建中...' : `${entityIcon} 创建${entityType}`}
          </button>
          </div>
        )}

        {/* 错误信息 */}
        {data.status === 'error' && data.errorMessage && (
          <div className="error-message">
            <p>❌ {data.errorMessage}</p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#ff6b9d', width: 10, height: 10 }}
      />
    </div>
  );
};

export default CharacterVideoNode;
