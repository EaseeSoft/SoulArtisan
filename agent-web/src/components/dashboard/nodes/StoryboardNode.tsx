import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { VideoResourceInfo } from '../../../api/videoResource';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { showWarning, showSuccess, showError } from '@/utils/request';
import { createVideo, type CreateVideoParams } from '../../../api/videoGeneration';
import './StoryboardNode.css';

interface StoryboardNodeProps {
  data: {
    label: string;
    mentionedCharacters?: VideoResourceInfo[]; // 分镜描述中提及的角色
    copywriting?: string; // 文案
    storyboard?: string; // 分镜文本
    generateCount?: number; // 生成数量
    aspectRatio?: string; // 尺寸比例
    style?: string; // 风格
  };
  id: string;
}

const StoryboardNode: React.FC<StoryboardNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [copywriting, setCopywriting] = useState(data.copywriting || '');
  const [storyboard, setStoryboard] = useState(data.storyboard || '');
  const [generateCount, setGenerateCount] = useState(data.generateCount || 1);
  const [countInputValue, setCountInputValue] = useState(String(data.generateCount || 1));
  const [aspectRatio, setAspectRatio] = useState(data.aspectRatio || '16:9');
  const [style, setStyle] = useState(data.style || '');
  const storyboardTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 从工作流缓存获取项目角色列表
  const projectCharacters = useWorkflowStore((state) => state.charactersCache);
  const isLoadingCharacters = useWorkflowStore((state) => state.isLoadingCharacters);
  const currentProjectId = useWorkflowStore((state) => state.currentProjectId);
  const currentScriptId = useWorkflowStore((state) => state.currentScriptId);
  const getEnumsCache = useWorkflowStore((state) => state.getEnumsCache);

  // 枚举数据
  const [enums, setEnums] = useState<{
    aspectRatios: { value: string | number; label: string }[];
    styles: { value: string | number; label: string }[];
  }>({
    aspectRatios: [],
    styles: []
  });

  /**
   * 从缓存加载枚举数据
   */
  useEffect(() => {
    const cachedEnums = getEnumsCache();
    if (cachedEnums) {
      setEnums({
        aspectRatios: cachedEnums.videoAspectRatios || [],
        styles: cachedEnums.styles || []
      });
    } else {
      // 如果缓存未就绪，稍后重试
      const timer = setTimeout(() => {
        const retryCache = getEnumsCache();
        if (retryCache) {
          setEnums({
            aspectRatios: retryCache.videoAspectRatios || [],
            styles: retryCache.styles || []
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [getEnumsCache]);

  /**
   * 同步外部数据变化
   */
  useEffect(() => {
    if (data.generateCount !== undefined && data.generateCount !== generateCount) {
      setGenerateCount(data.generateCount);
      setCountInputValue(String(data.generateCount));
    }
    if (data.aspectRatio !== undefined && data.aspectRatio !== aspectRatio) {
      setAspectRatio(data.aspectRatio);
    }
    if (data.style !== undefined && data.style !== style) {
      setStyle(data.style);
    }
  }, [data.generateCount, data.aspectRatio, data.style]);

  // 从分镜描述中提取@提及的角色
  const extractMentionedCharacters = (text: string): VideoResourceInfo[] => {
    // 匹配格式: [@characterId  ]（后面可能有空格）
    const mentionPattern = /\[@([^\]]+?)\s*\]/g;
    const matches = text.matchAll(mentionPattern);
    const mentionedIds = new Set<string>();

    for (const match of matches) {
      // 去除尾部空格，获取 characterId
      mentionedIds.add(match[1].trim());
    }

    // 根据 characterId 匹配角色
    return projectCharacters.filter(char => char.characterId && mentionedIds.has(char.characterId));
  };

  // 获取提及的角色列表
  const mentionedCharacters = data.mentionedCharacters || extractMentionedCharacters(storyboard);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<StoryboardNodeProps['data']>) => {
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

  // 点击角色，插入@提及到分镜描述
  const insertMention = (character: VideoResourceInfo) => {
    const textarea = storyboardTextareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = storyboard.substring(0, cursorPos);
    const textAfter = storyboard.substring(cursorPos);

    // 插入 [@characterId  ] 格式（后面两个空格）
    const mention = `[@${character.characterId || character.id}  ]`;
    const newText = textBefore + mention + textAfter;

    setStoryboard(newText);

    // 设置光标位置到插入内容之后
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPos + mention.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    // 提取分镜描述中提及的角色
    const mentioned = extractMentionedCharacters(storyboard);

    updateNodeData({
      copywriting,
      storyboard,
      generateCount,
      mentionedCharacters: mentioned,
    });
    setIsEditing(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 恢复原始数据
    setCopywriting(data.copywriting || '');
    setStoryboard(data.storyboard || '');
    setGenerateCount(data.generateCount || 1);
    setIsEditing(false);
  };

  // 处理参考图按钮点击
  const handleReferenceImage = () => {
    const nodes = getNodes();
    const edges = getEdges();

    // 检查是否已经有参考图节点连接到当前节点的 reference-input
    const existingReferenceEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'reference-input'
    );

    if (existingReferenceEdge) {
      showWarning('已存在参考图节点');
      return;
    }

    // 获取当前节点位置
    const currentNode = nodes.find((node) => node.id === id);
    if (!currentNode) return;

    // 创建新的图片展示节点（在左侧）
    const newImageNodeId = `image-${Date.now()}`;
    const newImageNode = {
      id: newImageNodeId,
      type: 'imageDisplayNode',
      position: {
        x: currentNode.position.x - 230, // 在左侧 230px（调整后的节点宽度）
        y: currentNode.position.y,
      },
      data: {
        label: '参考图',
      },
    };

    // 创建连接边
    const newEdge = {
      id: `edge-${newImageNodeId}-${id}`,
      source: newImageNodeId,
      sourceHandle: 'output',
      target: id,
      targetHandle: 'reference-input',
      animated: true,
    };

    // 添加节点和边
    setNodes([...nodes, newImageNode]);
    setEdges([...edges, newEdge]);
  };

  // 处理场景描述按钮点击
  const handleSceneDescription = () => {
    const nodes = getNodes();
    const edges = getEdges();

    // 检查是否已经有场景描述节点连接到当前节点的 scene-input
    const existingSceneEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'scene-input'
    );

    if (existingSceneEdge) {
      showWarning('已存在场景描述节点');
      return;
    }

    // 获取当前节点位置
    const currentNode = nodes.find((node) => node.id === id);
    if (!currentNode) return;

    // 创建新的场景描述节点（在左侧）
    const newSceneNodeId = `scene-${Date.now()}`;
    const newSceneNode = {
      id: newSceneNodeId,
      type: 'sceneDescriptionNode',
      position: {
        x: currentNode.position.x - 280, // 在左侧
        y: currentNode.position.y + 150, // 稍微往下偏移，避免与参考图重叠
      },
      data: {
        label: '场景描述',
      },
    };

    // 创建连接边
    const newEdge = {
      id: `edge-${newSceneNodeId}-${id}`,
      source: newSceneNodeId,
      sourceHandle: 'output',
      target: id,
      targetHandle: 'scene-input',
      animated: true,
    };

    // 添加节点和边
    setNodes([...nodes, newSceneNode]);
    setEdges([...edges, newEdge]);
  };

  // 处理生成按钮点击
  const handleGenerate = async () => {
    if (!storyboard || storyboard.trim() === '') {
      showWarning('请输入分镜描述');
      return;
    }

    const nodes = getNodes();
    const edges = getEdges();

    // 获取场景描述节点数据
    const sceneEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'scene-input'
    );
    let sceneDescription = '';
    if (sceneEdge) {
      const sceneNode = nodes.find((node) => node.id === sceneEdge.source);
      if (sceneNode && sceneNode.data.description) {
        sceneDescription = sceneNode.data.description;
      }
    }

    // 获取参考图节点数据
    const referenceEdge = edges.find(
      (edge) => edge.target === id && edge.targetHandle === 'reference-input'
    );
    let imageUrls: string[] = [];
    if (referenceEdge) {
      const imageNode = nodes.find((node) => node.id === referenceEdge.source);
      if (imageNode && imageNode.data.imageUrl) {
        imageUrls = [imageNode.data.imageUrl];
      }
    }

    // 构建完整的prompt（风格 + 场景描述 + 分镜描述）
    let fullPrompt = sceneDescription
      ? `${sceneDescription}\n${storyboard}`
      : storyboard;

    // 如果选择了风格，添加到提示词开头
    if (style) {
      fullPrompt = `${style} style, ${fullPrompt}`;
    }

    // 获取当前节点位置
    const currentNode = nodes.find((node) => node.id === id);
    if (!currentNode) return;

    try {
      // 根据生成数量循环生成
      const videoNodeIds: string[] = [];
      const newNodes: any[] = [];
      const newEdges: any[] = [];

      for (let i = 0; i < generateCount; i++) {
        // 创建视频生成参数
        const params: CreateVideoParams = {
          prompt: fullPrompt,
          aspectRatio: aspectRatio as '16:9' | '9:16',
          duration: 15,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          projectId: currentProjectId || undefined,
          scriptId: currentScriptId || undefined,
        };

        // 调用视频生成接口
        const result = await createVideo(params);

        if (result.code !== 200) {
          showError(`视频${i + 1}生成失败: ${result.msg}`);
          continue;
        }

        const task = result.data;

        // 创建视频展示节点
        const videoNodeId = `video-${task.taskId}-${Date.now()}`;
        const videoNode = {
          id: videoNodeId,
          type: 'videoDisplayNode',
          position: {
            x: currentNode.position.x + 480, // 在右侧
            y: currentNode.position.y + i * 180, // 垂直排列
          },
          data: {
            label: `视频 ${i + 1}`,
            taskId: task.id,
            status: 'loading',
            progress: 0,
          },
        };

        // 创建连接边
        const edge = {
          id: `edge-${id}-${videoNodeId}`,
          source: id,
          sourceHandle: 'output',
          target: videoNodeId,
          targetHandle: 'input',
          animated: true,
        };

        videoNodeIds.push(videoNodeId);
        newNodes.push(videoNode);
        newEdges.push(edge);
      }

      // 批量添加节点和边
      if (newNodes.length > 0) {
        setNodes([...nodes, ...newNodes]);
        setEdges([...edges, ...newEdges]);
        showSuccess(`已创建${newNodes.length}个视频生成任务`);
      }
    } catch (error: any) {
      showError(`生成失败: ${error.message || '未知错误'}`);
      console.error('视频生成失败:', error);
    }
  };

  return (
    <div className="storyboard-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10, top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="reference-input"
        style={{ background: '#00eeff', width: 10, height: 10, top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="scene-input"
        style={{ background: '#ffa500', width: 10, height: 10, top: '75%' }}
      />

      {/* 节点头部 */}
      <div className="node-header">
        <strong>🎬 {data.label}</strong>
        <button
          className="edit-btn-small"
          onClick={() => setIsEditing(!isEditing)}
          title={isEditing ? '取消编辑' : '编辑'}
        >
          {isEditing ? '✕' : '✎'}
        </button>
      </div>

      <div className="node-body">
        {/* 编辑模式：显示项目角色列表 */}
        {isEditing && (
          <div className="character-selector-section">
            <label className="section-label">项目资源（点击插入）</label>
            {isLoadingCharacters ? (
              <div className="characters-loading">加载资源中...</div>
            ) : projectCharacters.length === 0 ? (
              <div className="characters-empty">暂无资源，请先创建资源</div>
            ) : (
              <div className="character-tags">
                {projectCharacters.map((char) => (
                  <button
                    key={char.id}
                    className="character-tag"
                    onClick={() => insertMention(char)}
                    title={`插入 @${char.resourceName}`}
                  >
                    <div className="character-tag-avatar">
                      {char.characterImageUrl ? (
                        <img src={char.characterImageUrl} alt={char.resourceName} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {char.resourceName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span>{char.resourceName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 非编辑模式：显示分镜角色列表（从描述中提取） */}
        {!isEditing && mentionedCharacters.length > 0 && (
          <div className="storyboard-characters-section">
            <label className="section-label">分镜资源</label>
            <div className="characters-list">
              {mentionedCharacters.map((char) => (
                <div key={char.id} className="character-item">
                  <div className="character-avatar">
                    {char.characterImageUrl ? (
                      <img src={char.characterImageUrl} alt={char.resourceName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {char.resourceName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="character-name">{char.resourceName}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 文案展示 */}
        <div className="input-section">
          {isEditing ? (
            <div className="textarea-wrapper">
              <label className="corner-label">文案</label>
              <textarea
                className="copywriting-textarea nodrag nowheel"
                value={copywriting}
                onChange={(e) => setCopywriting(e.target.value)}
                placeholder="输入文案..."
                rows={2}
              />
            </div>
          ) : (
            <div className="display-wrapper">
              <label className="corner-label">文案</label>
              <div className="copywriting-display">
                {copywriting || '暂无文案'}
              </div>
            </div>
          )}
        </div>

        {/* 分镜文本框 */}
        <div className="input-section">
          {isEditing ? (
            <div className="textarea-wrapper">
              <label className="corner-label">分镜描述</label>
              <textarea
                ref={storyboardTextareaRef}
                className="storyboard-textarea nodrag nowheel"
                value={storyboard}
                onChange={(e) => setStoryboard(e.target.value)}
                placeholder="输入分镜描述，可以使用 @ 来引用资源..."
                rows={4}
              />
            </div>
          ) : (
            <div className="display-wrapper">
              <label className="corner-label">分镜描述</label>
              <div className="storyboard-display">
                {storyboard || '暂无分镜描述'}
              </div>
            </div>
          )}
        </div>

        {/* 编辑模式下的保存/取消按钮 */}
        {isEditing && (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSaveEdit}>
              ✓ 保存
            </button>
            <button className="cancel-btn" onClick={handleCancelEdit}>
              ✕ 取消
            </button>
          </div>
        )}

        {/* 底部操作栏 */}
        {!isEditing && (
          <div className="bottom-actions">
            <div className="action-buttons">
              <button
                className="icon-btn"
                onClick={handleReferenceImage}
                title="参考图"
              >
                🖼️ 参考图
              </button>
              <div className="scene-with-count">
                <button
                  className="icon-btn"
                  onClick={handleSceneDescription}
                  title="场景描述"
                >
                  📝 场景描述
                </button>
                <div className="count-input-wrapper">
                  <input
                    type="number"
                    className="count-input nodrag"
                    value={countInputValue}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // 允许空值或任意输入（用户正在编辑）
                      setCountInputValue(inputValue);

                      // 如果是有效数字，更新实际的generateCount
                      if (inputValue !== '') {
                        const value = parseInt(inputValue);
                        if (!isNaN(value) && value >= 1 && value <= 3) {
                          setGenerateCount(value);
                          updateNodeData({ generateCount: value });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // 失焦时确保有有效值
                      const value = parseInt(e.target.value);
                      let finalValue = generateCount;

                      if (isNaN(value) || value < 1) {
                        finalValue = 1;
                      } else if (value > 3) {
                        finalValue = 3;
                      } else {
                        finalValue = value;
                      }

                      setGenerateCount(finalValue);
                      setCountInputValue(String(finalValue));
                      updateNodeData({ generateCount: finalValue });
                    }}
                    min="1"
                    max="3"
                    title="生成数量"
                  />
                  <span className="count-label">条</span>
                </div>
              </div>
              <select
                className="aspect-ratio-select nodrag"
                value={aspectRatio}
                onChange={(e) => {
                  const value = e.target.value;
                  setAspectRatio(value);
                  updateNodeData({ aspectRatio: value });
                }}
                title="视频格式"
              >
                <option value="16:9">横版 16:9</option>
                <option value="9:16">竖版 9:16</option>
              </select>
            </div>
            <button className="generate-btn" onClick={handleGenerate}>
              ⚡ 生成
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />
    </div>
  );
};

export default StoryboardNode;
