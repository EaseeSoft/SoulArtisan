import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { generateVideo } from '../../../api/videoGeneration';
import type { CreateVideoParams } from '../../../api/videoGeneration';
import type { VideoEnums } from '../../../api/enums';
import { showWarning, showSuccess, upload } from '../../../utils/request';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import './VideoGenerationNode.css';

interface VideoGenerationNodeProps {
  data: {
    label: string;
    prompt?: string;
    duration?: number;
    aspectRatio?: string;
    style?: string;
    outputVideo?: string;
    referenceImages?: string[];
  };
  id: string;
}

const VideoGenerationNode: React.FC<VideoGenerationNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const { getEnumsCache, currentProjectId, currentScriptId } = useWorkflowStore();
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [style, setStyle] = useState<string>(''); // 风格选择
  const [duration, setDuration] = useState(data.duration || 10);
  const [aspectRatio, setAspectRatio] = useState(data.aspectRatio || '16:9');
  const [referenceImages, setReferenceImages] = useState<string[]>(data.referenceImages || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGES = 5;

  // 枚举数据
  const [enums, setEnums] = useState<VideoEnums>({
    models: [],
    aspectRatios: [],
    durations: [],
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
        models: cachedEnums.videoModels || [],
        aspectRatios: cachedEnums.videoAspectRatios || [],
        durations: cachedEnums.videoDurations || [],
        styles: cachedEnums.styles || []
      });
      setEnumsLoading(false);
    } else {
      // 如果缓存未就绪，稍后重试
      const timer = setTimeout(() => {
        const retryCache = getEnumsCache();
        if (retryCache) {
          setEnums({
            models: retryCache.videoModels || [],
            aspectRatios: retryCache.videoAspectRatios || [],
            durations: retryCache.videoDurations || [],
            styles: retryCache.styles || []
          });
        }
        setEnumsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [getEnumsCache]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<VideoGenerationNodeProps['data']>) => {
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

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    updateNodeData({ prompt: value });
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    updateNodeData({ duration: value });
  };

  const handleAspectRatioChange = (value: string) => {
    setAspectRatio(value);
    updateNodeData({ aspectRatio: value });
  };

  const handleStyleChange = (value: string) => {
    setStyle(value);
    updateNodeData({ style: value });
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查是否已达到最大数量
    if (referenceImages.length >= MAX_IMAGES) {
      showWarning(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showWarning('请选择图片文件');
      return;
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showWarning('图片大小不能超过 10MB');
      return;
    }

    try {
      setUploading(true);

      const response = await upload<{ code: number; data: { url: string } }>(
        '/api/file/upload',
        file
      );

      if (response.data.code === 200 && response.data.data?.url) {
        const newImages = [...referenceImages, response.data.data.url];
        setReferenceImages(newImages);
        updateNodeData({ referenceImages: newImages });
        showSuccess('图片上传成功');
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      showWarning(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
      // 清空 input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * 删除指定索引的图片
   */
  const handleRemoveImage = (index: number) => {
    const newImages = referenceImages.filter((_, i) => i !== index);
    setReferenceImages(newImages);
    updateNodeData({ referenceImages: newImages });
  };

  /**
   * 构建最终的提示词（包含风格）
   */
  const buildFinalPrompt = (): string => {
    let finalPrompt = prompt.trim();

    // 如果选择了风格，添加到提示词开头
    if (style) {
      finalPrompt = `${style} style, ${finalPrompt}`;
    }

    return finalPrompt;
  };

  const handleGenerate = async () => {
    // 防重复点击检查
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const generationNode = currentNodes.find(n => n.id === id);

      if (!generationNode) {
        throw new Error('未找到生成节点');
      }

      // 1. 先创建视频展示节点，初始状态为 loading
      const displayNodeId = `node-display-${Math.random().toString(36).substr(2, 9)}`;
      const displayNode: Node = {
        id: displayNodeId,
        type: 'videoDisplayNode',
        position: {
          x: generationNode.position.x + 450,
          y: generationNode.position.y
        },
        data: {
          label: '视频展示',
          status: 'loading',
          progress: 0
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
        // 构建视频生成参数（使用包含风格的提示词）
        const params: CreateVideoParams = {
          prompt: buildFinalPrompt(),
          aspectRatio: aspectRatio as '16:9' | '9:16',
          duration: duration as 10 | 15 | 25,
          projectId: currentProjectId || undefined,
          scriptId: currentScriptId || undefined
        };

        // 添加参考图
        if (referenceImages.length > 0) {
          params.imageUrls = referenceImages;
        }

        console.log('调用视频生成接口...', params);

        // 创建视频生成任务
        const task = await generateVideo(params, (status) => {
          console.log('视频生成状态:', status);
        });

        console.log('任务已创建, taskId:', task.id);

        // 将 taskId 保存到展示节点，VideoDisplayNode 会自动开始轮询
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
      } catch (error) {
        console.error('视频生成失败:', error);
        const errorMessage = error instanceof Error ? error.message : '视频生成失败';

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
      }
    } catch (error) {
      console.error('创建展示节点失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      showWarning(errorMessage);
    } finally {
      // 延迟解除禁用，防止快速重复点击
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    }
  };

  return (
    <div className="video-gen-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>🎬 {data.label}</strong>
      </div>

      <div className="node-body">
        {enumsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            加载配置中...
          </div>
        ) : (
          <>
            {/* 提示词 */}
            <div className="video-gen-section">
              <label className="video-gen-label">提示词</label>
              <textarea
                className="video-gen-textarea nodrag nowheel"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="描述你想要生成的视频..."
                rows={3}
                disabled={isGenerating}
              />
            </div>

            {/* 风格选择 */}
            <div className="video-gen-section">
              <label className="video-gen-label">风格</label>
              <select
                className="video-gen-select full-width nodrag"
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
              {style && (
                <small style={{ color: '#00d4ff', fontSize: '10px', display: 'block', marginTop: '4px' }}>
                  将在提示词开头添加 "{style} style"
                </small>
              )}
            </div>

            {/* 参考图上传 */}
            <div className="video-gen-section">
              <label className="video-gen-label">
                参考图 ({referenceImages.length}/{MAX_IMAGES})
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || isGenerating || referenceImages.length >= MAX_IMAGES}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || isGenerating || referenceImages.length >= MAX_IMAGES}
                className="upload-btn nodrag"
              >
                {uploading ? '上传中...' : '+ 添加图片'}
              </button>

              {/* 图片预览 */}
              {referenceImages.length > 0 && (
                <div className="reference-images-grid">
                  {referenceImages.map((url, index) => (
                    <div key={index} className="reference-image-item">
                      <img src={url} alt={`参考图${index + 1}`} />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        disabled={isGenerating}
                        className="remove-image-btn nodrag"
                        title="删除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {referenceImages.length < MAX_IMAGES && (
                <small style={{ color: '#888', fontSize: '9px', display: 'block', marginTop: '4px' }}>
                  支持 JPG、PNG 等图片格式，大小不超过 10MB
                </small>
              )}
            </div>

            {/* 控制栏 */}
            <div className="controls-row">
              <div className="control-item">
                <label className="control-item-label">时长(秒)</label>
                <select
                  className="video-gen-select nodrag"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  disabled={isGenerating}
                >
                  {enums?.durations?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-item">
                <label className="control-item-label">宽高比</label>
                <select
                  className="video-gen-select nodrag"
                  value={aspectRatio}
                  onChange={(e) => handleAspectRatioChange(e.target.value)}
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
                🎬 生成
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
    </div>
  );
};

export default VideoGenerationNode;
