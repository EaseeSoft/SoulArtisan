import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { generateImageFromText, generateImageFromImage, getTaskStatus } from '../../../api/imageGeneration';
import type { ImageTask } from '../../../api/imageGeneration';
import type { ImageEnums, StyleEnumOption } from '../../../api/enums';
import { showWarning, showSuccess } from '../../../utils/request';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import {
  getPictureResourcesByScript,
  getPictureResourcesByProject,
  updatePictureImageUrl,
  type PictureResource,
  type PictureResourceStatus,
  RESOURCE_TYPE_LABELS,
} from '../../../api/pictureResource';
import './ImageGenerationNode.css';

interface ImageGenerationNodeProps {
  data: {
    label: string;
    prompt?: string;
    style?: string;
    size?: string;
    outputImage?: string;
    // 关联的图片资源
    resourceId?: number;
    resourceName?: string;
    resourceStatus?: PictureResourceStatus;
  };
  id: string;
}

// 最大连接数
const MAX_INPUT_CONNECTIONS = 5;

const ImageGenerationNode: React.FC<ImageGenerationNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const { getEnumsCache, currentScriptId, currentProjectId, currentProjectStyle } = useWorkflowStore();
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [style, setStyle] = useState(data.style || '');
  const [size, setSize] = useState(data.size || '1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectedImages, setConnectedImages] = useState<string[]>([]);

  // 资源选择弹框状态
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [pictureResources, setPictureResources] = useState<PictureResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResource, setSelectedResource] = useState<PictureResource | null>(null);

  // 资源名称编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  // 枚举数据
  const [enums, setEnums] = useState<ImageEnums>({
    models: [],
    aspectRatios: [],
    sizes: [],
    styles: []
  });
  const [enumsLoading, setEnumsLoading] = useState(true);

  /**
   * 从缓存加载枚举数据
   */
  useEffect(() => {
    const cachedEnums = getEnumsCache();
    if (cachedEnums) {
      setEnums({
        models: cachedEnums.imageModels || [],
        aspectRatios: cachedEnums.imageAspectRatios || [],
        sizes: cachedEnums.imageSizes || [],
        styles: cachedEnums.styles || []
      });
      setEnumsLoading(false);
    } else {
      // 如果缓存未就绪，稍后重试
      const timer = setTimeout(() => {
        const retryCache = getEnumsCache();
        if (retryCache) {
          setEnums({
            models: retryCache.imageModels || [],
            aspectRatios: retryCache.imageAspectRatios || [],
            sizes: retryCache.imageSizes || [],
            styles: retryCache.styles || []
          });
        }
        setEnumsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [getEnumsCache]);

  /**
   * 监听左边连接的图片展示节点，收集图片数据
   */
  useEffect(() => {
    const edges = getEdges();
    const nodes = getNodes();

    // 找到连接到当前节点左边的边
    const inputEdges = edges.filter(edge => edge.target === id);

    // 收集连接节点的图片
    const images: string[] = [];
    inputEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode?.data?.imageUrl) {
        images.push(sourceNode.data.imageUrl);
      }
    });

    setConnectedImages(images);
  }, [getEdges, getNodes, id]);

  // 加载图片资源列表
  const loadPictureResources = useCallback(async () => {
    setLoadingResources(true);
    try {
      let response;
      if (currentScriptId) {
        response = await getPictureResourcesByScript(currentScriptId);
      } else if (currentProjectId) {
        response = await getPictureResourcesByProject(currentProjectId);
      }
      if (response?.code === 200) {
        setPictureResources(response.data || []);
      }
    } catch (error) {
      console.error('加载图片资源失败:', error);
    } finally {
      setLoadingResources(false);
    }
  }, [currentScriptId, currentProjectId]);

  // 打开资源选择弹框
  const handleOpenResourceModal = useCallback(() => {
    setShowResourceModal(true);
    loadPictureResources();
  }, [loadPictureResources]);

  // 选择资源
  const handleSelectResource = useCallback((resource: PictureResource) => {
    setSelectedResource(resource);
    // 更新节点数据
    updateNodeData({
      resourceId: resource.id,
      resourceName: resource.name,
      resourceStatus: resource.status,
      prompt: resource.prompt || '',
    });
    // 同步提示词
    setPrompt(resource.prompt || '');
    setShowResourceModal(false);
    showSuccess(`已选择资源: ${resource.name}`);
  }, []);

  // 取消选择资源
  const handleClearResource = useCallback(() => {
    setSelectedResource(null);
    updateNodeData({
      resourceId: undefined,
      resourceName: undefined,
      resourceStatus: undefined,
    });
  }, []);

  // 开始编辑资源名称
  const handleStartEditName = useCallback(() => {
    setIsEditingName(true);
    setEditingName(data.resourceName || '');
  }, [data.resourceName]);

  // 保存资源名称
  const handleSaveName = useCallback(() => {
    if (editingName.trim()) {
      updateNodeData({ resourceName: editingName.trim() });
    }
    setIsEditingName(false);
  }, [editingName]);

  // 取消编辑名称
  const handleCancelEditName = useCallback(() => {
    setIsEditingName(false);
    setEditingName('');
  }, []);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<ImageGenerationNodeProps['data']>) => {
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

  /**
   * 点击参考图区域，创建图片展示节点并连接到当前节点左边
   */
  const handleAddImageNode = () => {
    const edges = getEdges();
    const nodes = getNodes();
    const currentNode = nodes.find(n => n.id === id);

    if (!currentNode) return;

    // 检查左边连接数是否已达上限
    const inputEdges = edges.filter(edge => edge.target === id);
    if (inputEdges.length >= MAX_INPUT_CONNECTIONS) {
      showWarning(`最多只能连接 ${MAX_INPUT_CONNECTIONS} 张参考图`);
      return;
    }

    // 创建新的图片展示节点
    const displayNodeId = `node-display-${Math.random().toString(36).substr(2, 9)}`;
    const yOffset = inputEdges.length * 120; // 每个节点垂直偏移
    const displayNode: Node = {
      id: displayNodeId,
      type: 'imageDisplayNode',
      position: {
        x: currentNode.position.x - 300,
        y: currentNode.position.y + yOffset - 60
      },
      data: {
        label: '图片展示',
        status: 'empty'
      }
    };

    // 添加节点
    setNodes([...nodes, displayNode]);

    // 创建连接边
    const newEdge = {
      id: `edge-${displayNodeId}-${id}`,
      source: displayNodeId,
      target: id,
      sourceHandle: 'output',
      targetHandle: 'input',
      animated: false
    };
    setEdges([...edges, newEdge]);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    updateNodeData({ prompt: value });
  };

  const handleStyleChange = (value: string) => {
    setStyle(value);
    updateNodeData({ style: value });
  };

  const handleSizeChange = (value: string) => {
    setSize(value);
    updateNodeData({ size: value });
  };

  const handleGenerate = async () => {
    // 防重复点击检查
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);

    // 如果关联了资源，更新资源状态为生成中
    if (data.resourceId) {
      updateNodeData({ resourceStatus: 'generating' });
    }

    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const generationNode = currentNodes.find(n => n.id === id);

      if (!generationNode) {
        throw new Error('未找到生成节点');
      }

      // 1. 先创建图片展示节点，初始状态为 loading
      const displayNodeId = `node-display-${Math.random().toString(36).substr(2, 9)}`;
      const displayNode: Node = {
        id: displayNodeId,
        type: 'imageDisplayNode',
        position: {
          x: generationNode.position.x + 400,
          y: generationNode.position.y
        },
        data: {
          label: data.resourceName || '图片展示',
          status: 'loading'
        }
      };

      // 添加展示节点
      setNodes([...currentNodes, displayNode]);

      // 创建连接
      const newEdge = {
        id: `edge-${id}-${displayNodeId}`,
        source: id,
        target: displayNodeId,
        animated: true
      };
      setEdges([...currentEdges, newEdge]);

      // 2. 执行生成任务
      try {
        let task: ImageTask;

        // 构建最终的提示词（包含风格）
        let finalPrompt = prompt.trim();

        // 从枚举中查找风格的prompt
        const getStylePrompt = (styleValue: string): string => {
          const styleOption = enums.styles.find(s => s.value === styleValue);
          return styleOption?.prompt || '';
        };

        // 优先使用项目风格
        if (currentProjectStyle) {
          const stylePrompt = getStylePrompt(currentProjectStyle);
          if (stylePrompt) {
            finalPrompt = `${stylePrompt}, ${finalPrompt}`;
          }
        } else if (style) {
          const stylePrompt = getStylePrompt(style);
          if (stylePrompt) {
            finalPrompt = `${stylePrompt}, ${finalPrompt}`;
          }
        }

        // 重新收集连接节点的图片（确保使用最新状态）
        const latestEdges = getEdges();
        const latestNodes = getNodes();
        const inputEdges = latestEdges.filter(edge => edge.target === id);
        const imageUrls: string[] = [];
        inputEdges.forEach(edge => {
          const sourceNode = latestNodes.find(n => n.id === edge.source);
          if (sourceNode?.data?.imageUrl) {
            imageUrls.push(sourceNode.data.imageUrl);
          }
        });

        // 判断是否有参考图
        if (imageUrls.length > 0) {
          // 图生图
          console.log('调用图生图接口，图片数量:', imageUrls.length);
          task = await generateImageFromImage(
            {
              prompt: finalPrompt,
              imageUrls: imageUrls,
              aspectRatio: size as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
              imageSize: imageSize as '1K' | '2K' | '4K',
            },
            (status) => {
              console.log('图生图状态:', status);
            }
          );
        } else {
          // 文生图
          console.log('调用文生图接口...');
          task = await generateImageFromText(
            {
              prompt: finalPrompt,
              aspectRatio: size as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
              imageSize: imageSize as '1K' | '2K' | '4K',
            },
            (status) => {
              console.log('文生图状态:', status);
            }
          );
        }

        console.log('任务已创建, taskId:', task.id);

        // 将 taskId 保存到展示节点
        const updatedNodes = getNodes();
        setNodes(
          updatedNodes.map((node) =>
            node.id === displayNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    taskId: task.id,
                  }
                }
              : node
          )
        );

        // 如果关联了资源，轮询任务状态并更新资源
        if (data.resourceId) {
          const pollTaskAndUpdateResource = async () => {
            try {
              const statusResult = await getTaskStatus(task.id);
              if (statusResult.code !== 200) {
                throw new Error(statusResult.msg || '查询任务状态失败');
              }

              const taskStatus = statusResult.data;

              if (taskStatus.status === 'completed' && taskStatus.resultUrl) {
                // 更新资源的图片地址
                await updatePictureImageUrl(data.resourceId!, taskStatus.resultUrl);
                // 更新节点状态
                updateNodeData({ resourceStatus: 'generated' });
                showSuccess('图片生成完成，已保存到资源');
              } else if (taskStatus.status === 'failed') {
                updateNodeData({ resourceStatus: 'pending' });
                showWarning('图片生成失败');
              } else {
                // 继续轮询
                setTimeout(pollTaskAndUpdateResource, 5000);
              }
            } catch (error) {
              console.error('轮询任务状态失败:', error);
              updateNodeData({ resourceStatus: 'pending' });
            }
          };

          // 开始轮询
          setTimeout(pollTaskAndUpdateResource, 3000);
        }
      } catch (error) {
        console.error('图片生成失败:', error);
        const errorMessage = error instanceof Error ? error.message : '图片生成失败';

        // 更新展示节点为失败状态
        const updatedNodes = getNodes();
        setNodes(
          updatedNodes.map((node) =>
            node.id === displayNodeId
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

        // 恢复资源状态
        if (data.resourceId) {
          updateNodeData({ resourceStatus: 'pending' });
        }
      }
    } catch (error) {
      console.error('创建展示节点失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      showWarning(errorMessage);

      // 恢复资源状态
      if (data.resourceId) {
        updateNodeData({ resourceStatus: 'pending' });
      }
    } finally {
      // 延迟解除禁用，防止快速重复点击
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    }
  };

  return (
    <div className="image-gen-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>🖼️ {data.label}</strong>
      </div>

      <div className="node-body">
        {/* 资源选择区域 */}
        <div className="image-gen-section resource-section">
          <label className="image-gen-label">关联资源：</label>
          {data.resourceId ? (
            <div className="resource-selected">
              {isEditingName ? (
                <input
                  type="text"
                  className="resource-name-input nodrag"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditName();
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="resource-name"
                  onClick={handleStartEditName}
                  title="点击编辑名称"
                >
                  {data.resourceName}
                </span>
              )}
              <span className={`resource-status-badge ${data.resourceStatus}`}>
                {data.resourceStatus === 'generating' ? '生成中' :
                 data.resourceStatus === 'generated' ? '已生成' : '未生成'}
              </span>
              <button
                className="resource-clear-btn"
                onClick={handleClearResource}
                title="取消关联"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              className="resource-select-btn"
              onClick={handleOpenResourceModal}
              disabled={isGenerating}
            >
              + 选择图片资源
            </button>
          )}
        </div>

        {/* 参考图区域 */}
        <div className="image-gen-section">
          <label className="image-gen-label">
            参考图（{connectedImages.length}/{MAX_INPUT_CONNECTIONS}）：
          </label>
          <div className="image-upload-wrapper">
            {connectedImages.length > 0 ? (
              <div className="connected-images-preview">
                {connectedImages.map((img, idx) => (
                  <div key={idx} className="connected-image-thumb">
                    <img src={img} alt={`参考图${idx + 1}`} />
                  </div>
                ))}
                {connectedImages.length < MAX_INPUT_CONNECTIONS && (
                  <button
                    className="add-image-btn"
                    onClick={handleAddImageNode}
                    disabled={isGenerating}
                  >
                    +
                  </button>
                )}
              </div>
            ) : (
              <button
                className="upload-btn"
                onClick={handleAddImageNode}
                disabled={isGenerating}
              >
                + 添加参考图节点
              </button>
            )}
          </div>
        </div>

        {/* 提示词 */}
        <div className="image-gen-section">
          <label className="image-gen-label">提示词：</label>
          <textarea
            className="image-gen-textarea nodrag nowheel"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="描述你想要生成的图片..."
            rows={3}
          />
        </div>

        {/* 风格和尺寸 */}
        {enumsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            加载配置中...
          </div>
        ) : (
          <>
            <div className="image-gen-section inline">
              <div>
                <label className="image-gen-label">风格</label>
                <select
                  className="image-gen-select nodrag"
                  value={style}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  disabled={isGenerating}
                >
                  {enums?.styles?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="image-gen-label">宽高比</label>
                <select
                  className="image-gen-select nodrag"
                  value={size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  disabled={isGenerating}
                >
                  {enums?.aspectRatios?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || enumsLoading}
              >
                {isGenerating ? '生成中...' : '🚀 生成图片'}
              </button>
            </div>
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      {/* 资源选择弹框 */}
      {showResourceModal && (
        <div className="resource-modal-overlay nodrag" onClick={() => setShowResourceModal(false)}>
          <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
            <div className="resource-modal-header">
              <h3>选择图片资源</h3>
              <button className="resource-modal-close" onClick={() => setShowResourceModal(false)}>
                ×
              </button>
            </div>
            <div className="resource-modal-body">
              {loadingResources ? (
                <div className="resource-loading">加载中...</div>
              ) : pictureResources.length === 0 ? (
                <div className="resource-empty">
                  <p>暂无图片资源</p>
                  <span>请先在资源管理中添加图片资源</span>
                </div>
              ) : (
                <div className="resource-list">
                  {pictureResources.map((resource) => (
                    <div
                      key={resource.id}
                      className={`resource-item ${selectedResource?.id === resource.id ? 'selected' : ''}`}
                      onClick={() => handleSelectResource(resource)}
                    >
                      <div className="resource-item-thumb">
                        {resource.imageUrl ? (
                          <img src={resource.imageUrl} alt={resource.name} />
                        ) : (
                          <div className="resource-item-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="resource-item-info">
                        <div className="resource-item-name">{resource.name}</div>
                        <div className="resource-item-meta">
                          <span className="resource-item-type">{RESOURCE_TYPE_LABELS[resource.type]}</span>
                          <span className={`resource-item-status ${resource.status}`}>
                            {resource.status === 'generating' ? '生成中' :
                             resource.status === 'generated' ? '已生成' : '未生成'}
                          </span>
                        </div>
                        {resource.prompt && (
                          <div className="resource-item-prompt" title={resource.prompt}>
                            {resource.prompt.length > 50 ? resource.prompt.slice(0, 50) + '...' : resource.prompt}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerationNode;
