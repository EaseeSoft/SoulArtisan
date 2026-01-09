import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { generateImageFromText, generateImageFromImage, getTaskStatus } from '../../../api/imageGeneration';
import { cameraImageToVideoPrompt, extractVideoResource } from '../../../api/playbook';
import { createVideo, type CreateVideoParams } from '../../../api/videoGeneration';
import { getPictureResourcesByScript, getPictureResourcesByProject, type PictureResource } from '../../../api/pictureResource';
import { getProjectResources, type VideoResourceInfo } from '../../../api/videoResource';
import type { ImageTask } from '../../../api/imageGeneration';
import type { ImageEnums } from '../../../api/enums';
import { showWarning, showSuccess, showError } from '../../../utils/request';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import ReferenceImageSelectionModal from '../ReferenceImageSelectionModal';
import './StoryboardImageNode.css';

type TabType = 'original' | 'storyboard' | 'video' | 'reference' | 'videoResource';

// 匹配的视频资源信息（用于持久化）
interface MatchedResourceData {
  id: number;
  characterId: string;
  resourceName: string;
  resourceType: string;
  videoResultUrl?: string;
}

interface StoryboardImageNodeProps {
  data: {
    label: string;
    scriptScript?: string; // 分镜脚本文案（从分镜列表传递过来的原始文本）
    prompt?: string; // 提示词（gemini 获取的）
    videoPrompt?: string; // 视频提示词
    style?: string;
    size?: string;
    // 单张分镜图
    imageUrl?: string;
    imageStatus?: 'loading' | 'success' | 'error';
    imageErrorMessage?: string;
    // 视频宽高比
    videoAspectRatio?: '16:9' | '9:16';
    // 参考图列表（保存图片URL）
    referenceImages?: string[];
    // 匹配的视频资源列表（持久化）
    matchedResources?: MatchedResourceData[];
  };
  id: string;
}

// 最大参考图数量
const MAX_REFERENCE_IMAGES = 5;

const StoryboardImageNode: React.FC<StoryboardImageNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const { getEnumsCache } = useWorkflowStore();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('original');

  // 内容状态
  const [originalText, setOriginalText] = useState(data.scriptScript || ''); // 原文本
  const [prompt, setPrompt] = useState(data.prompt || ''); // 分镜规划/提示词
  const [videoPrompt, setVideoPrompt] = useState(data.videoPrompt || ''); // 视频提示词

  const [style, setStyle] = useState(data.style || '');
  const [size, setSize] = useState(data.size || '16:9');
  const [imageSize] = useState('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // 参考图状态（从 data 初始化）
  const [referenceImages, setReferenceImages] = useState<string[]>(data.referenceImages || []);

  // 资源选择弹窗状态
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceList, setResourceList] = useState<PictureResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // 单张分镜图状态
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [imageStatus, setImageStatus] = useState<'loading' | 'success' | 'error' | ''>(data.imageStatus || '');
  const [imageErrorMessage, setImageErrorMessage] = useState(data.imageErrorMessage || '');

  // 从 store 获取全局图片预览方法
  const openImagePreview = useWorkflowStore((state) => state.openImagePreview);

  // 获取视频提示词状态
  const [isGettingVideoPrompt, setIsGettingVideoPrompt] = useState(false);

  // 转视频相关状态
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>(data.videoAspectRatio || '16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // 视频资源相关状态
  const [isExtractingResource, setIsExtractingResource] = useState(false);
  const [videoResources, setVideoResources] = useState<VideoResourceInfo[]>([]);
  // 从 data 初始化匹配的视频资源
  const [matchedResources, setMatchedResources] = useState<VideoResourceInfo[]>(
    (data.matchedResources || []).map(r => ({
      id: r.id,
      characterId: r.characterId,
      resourceName: r.resourceName,
      resourceType: r.resourceType,
      videoResultUrl: r.videoResultUrl,
      status: 'completed',
    } as VideoResourceInfo))
  );

  // 从 store 获取项目信息
  const currentProjectId = useWorkflowStore((state) => state.currentProjectId);
  const currentScriptId = useWorkflowStore((state) => state.currentScriptId);

  // 枚举数据
  const [enums, setEnums] = useState<ImageEnums>({
    models: [],
    aspectRatios: [],
    sizes: [],
    styles: []
  });
  const [enumsLoading, setEnumsLoading] = useState(true);

  // 同步 data 到本地状态（当从分镜列表创建节点时）
  useEffect(() => {
    if (data.scriptScript && data.scriptScript !== originalText) {
      setOriginalText(data.scriptScript);
    }
    if (data.prompt && data.prompt !== prompt) {
      setPrompt(data.prompt);
    }
    if (data.videoPrompt && data.videoPrompt !== videoPrompt) {
      setVideoPrompt(data.videoPrompt);
    }
    if (data.imageUrl !== undefined && data.imageUrl !== imageUrl) {
      setImageUrl(data.imageUrl);
    }
    if (data.imageStatus !== undefined && data.imageStatus !== imageStatus) {
      setImageStatus(data.imageStatus);
    }
  }, [data.scriptScript, data.prompt, data.videoPrompt, data.imageUrl, data.imageStatus]);

  // 从 data 恢复 matchedResources（项目重新加载时）
  useEffect(() => {
    if (data.matchedResources && data.matchedResources.length > 0 && matchedResources.length === 0) {
      const restored = data.matchedResources.map(r => ({
        id: r.id,
        characterId: r.characterId,
        resourceName: r.resourceName,
        resourceType: r.resourceType,
        videoResultUrl: r.videoResultUrl,
        status: 'completed',
      } as VideoResourceInfo));
      setMatchedResources(restored);
    }
  }, [data.matchedResources]);

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
   * 同步 referenceImages 到节点数据
   */
  useEffect(() => {
    if (JSON.stringify(referenceImages) !== JSON.stringify(data.referenceImages)) {
      updateNodeData({ referenceImages });
    }
  }, [referenceImages]);

  /**
   * 同步 matchedResources 到节点数据（持久化）
   */
  useEffect(() => {
    const dataToSave: MatchedResourceData[] = matchedResources.map(r => ({
      id: r.id,
      characterId: r.characterId || '',
      resourceName: r.resourceName,
      resourceType: r.resourceType,
      videoResultUrl: r.videoResultUrl || undefined,
    }));
    const currentData = data.matchedResources || [];
    if (JSON.stringify(dataToSave) !== JSON.stringify(currentData)) {
      updateNodeData({ matchedResources: dataToSave });
    }
  }, [matchedResources]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<StoryboardImageNodeProps['data']>) => {
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
   * 打开资源选择弹窗
   */
  const handleOpenResourceModal = async () => {
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      showWarning(`最多只能选择 ${MAX_REFERENCE_IMAGES} 张参考图`);
      return;
    }

    if (!currentScriptId && !currentProjectId) {
      showWarning('请先保存项目');
      return;
    }

    setShowResourceModal(true);
    setLoadingResources(true);

    try {
      let result;
      if (currentScriptId) {
        result = await getPictureResourcesByScript(currentScriptId);
      } else if (currentProjectId) {
        result = await getPictureResourcesByProject(currentProjectId);
      }

      if (result && result.code === 200) {
        // 过滤出已生成的图片资源
        const generatedResources = (result.data || []).filter(r => r.status === 'generated' && r.imageUrl);
        setResourceList(generatedResources);
      } else {
        showWarning('加载图片资源失败');
      }
    } catch (error) {
      console.error('加载图片资源失败:', error);
      showWarning('加载图片资源失败');
    } finally {
      setLoadingResources(false);
    }
  };

  /**
   * 关闭资源选择弹窗
   */
  const handleCloseResourceModal = () => {
    setShowResourceModal(false);
  };

  /**
   * 确认选择参考图
   */
  const handleConfirmSelectImages = (selectedImages: string[]) => {
    setReferenceImages(prev => [...prev, ...selectedImages]);
    showSuccess(`已添加 ${selectedImages.length} 张参考图`);
  };

  /**
   * 上传图片回调
   */
  const handleUploadImage = (imageUrl: string) => {
    setReferenceImages(prev => [...prev, imageUrl]);
  };

  /**
   * 删除参考图
   */
  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    showSuccess('已删除参考图');
  };

  const handleOriginalTextChange = (value: string) => {
    setOriginalText(value);
    updateNodeData({ scriptScript: value });
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    updateNodeData({ prompt: value });
  };

  const handleVideoPromptChange = (value: string) => {
    setVideoPrompt(value);
    updateNodeData({ videoPrompt: value });
  };

  const handleStyleChange = (value: string) => {
    setStyle(value);
    updateNodeData({ style: value });
  };

  const handleSizeChange = (value: string) => {
    setSize(value);
    updateNodeData({ size: value });
  };

  /**
   * 生成分镜图 - 单张图片，重新生成时覆盖
   */
  const handleGenerateImage = async () => {
    if (isGeneratingImage) {
      return;
    }

    // 生图使用 prompt（分镜规划提示词）
    const imagePrompt = prompt.trim();

    if (!imagePrompt) {
      showWarning('请输入分镜规划提示词');
      return;
    }

    setIsGeneratingImage(true);
    setImageStatus('loading');
    setImageUrl('');
    setImageErrorMessage('');
    updateNodeData({ imageStatus: 'loading', imageUrl: '', imageErrorMessage: '' });

    try {
      // 构建生图的最终提示词（包含风格）
      let finalImagePrompt = imagePrompt;
      if (style) {
        // 找到风格对应的标签作为提示词
        const styleOption = enums.styles?.find(s => s.value === style);
        const stylePrompt = styleOption?.label || style;
        finalImagePrompt = `${stylePrompt}, ${finalImagePrompt}`;
      }

      // 使用参考图列表
      let task: ImageTask;
      // 判断是否有参考图
      if (referenceImages.length > 0) {
        task = await generateImageFromImage(
          {
            prompt: finalImagePrompt,
            imageUrls: referenceImages,
            aspectRatio: size as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
            imageSize: imageSize as '1K' | '2K' | '4K',
          },
          (status) => {
            console.log('图生图状态:', status);
          }
        );
      } else {
        task = await generateImageFromText(
          {
            prompt: finalImagePrompt,
            aspectRatio: size as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
            imageSize: imageSize as '1K' | '2K' | '4K',
          },
          (status) => {
            console.log('文生图状态:', status);
          }
        );
      }

      // 开始轮询任务状态
      const pollTaskStatus = async () => {
        try {
          const result = await getTaskStatus(task.id);
          if (result.code !== 200) {
            throw new Error(result.msg || '查询任务失败');
          }
          const taskResult = result.data;

          if (taskResult.status === 'completed' && taskResult.resultUrl) {
            setImageUrl(taskResult.resultUrl);
            setImageStatus('success');
            updateNodeData({ imageUrl: taskResult.resultUrl, imageStatus: 'success' });
            showSuccess('分镜图生成成功');
            setIsGeneratingImage(false);
          } else if (taskResult.status === 'failed') {
            const errMsg = taskResult.errorMessage || '生成失败';
            setImageStatus('error');
            setImageErrorMessage(errMsg);
            updateNodeData({ imageStatus: 'error', imageErrorMessage: errMsg });
            showWarning(errMsg);
            setIsGeneratingImage(false);
          } else {
            // 继续轮询
            setTimeout(pollTaskStatus, 2000);
          }
        } catch (err) {
          console.error('轮询任务状态失败:', err);
          setImageStatus('error');
          setImageErrorMessage('获取任务状态失败');
          updateNodeData({ imageStatus: 'error', imageErrorMessage: '获取任务状态失败' });
          setIsGeneratingImage(false);
        }
      };

      // 开始轮询
      setTimeout(pollTaskStatus, 2000);

    } catch (error) {
      console.error('图片生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片生成失败';
      setImageStatus('error');
      setImageErrorMessage(errorMessage);
      updateNodeData({ imageStatus: 'error', imageErrorMessage: errorMessage });
      showWarning(errorMessage);
      setIsGeneratingImage(false);
    }
  };

  /**
   * 获取视频提示词
   */
  const handleGetVideoPrompt = async () => {
    if (isGettingVideoPrompt) {
      return;
    }

    // 需要有文案内容
    const content = originalText.trim();
    if (!content) {
      showWarning('请先输入文案内容');
      return;
    }

    setIsGettingVideoPrompt(true);

    try {
      // 调用 API，传入文案内容，如果有图片则传入图片 URL
      const result = await cameraImageToVideoPrompt({
        content,
        mediaUrl: imageUrl || undefined,
      });

      if (result.code === 200 && result.data) {
        setVideoPrompt(result.data);
        updateNodeData({ videoPrompt: result.data });
        setActiveTab('video'); // 切换到视频提示词 tab
        showSuccess('视频提示词获取成功');
      } else {
        showWarning(result.msg || '获取视频提示词失败');
      }
    } catch (error) {
      console.error('获取视频提示词失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取视频提示词失败';
      showWarning(errorMessage);
    } finally {
      setIsGettingVideoPrompt(false);
    }
  };

  /**
   * 切换视频宽高比
   */
  const handleVideoAspectRatioChange = (ratio: '16:9' | '9:16') => {
    setVideoAspectRatio(ratio);
    updateNodeData({ videoAspectRatio: ratio });
  };

  /**
   * 解析视频提示词中的 @characterId 引用，匹配视频资源
   */
  const parseVideoResourceReferences = (text: string, resources: VideoResourceInfo[]) => {
    // 匹配 @xxx.xxx 格式，支持字母、数字、下划线、中划线，多段用小数点分隔
    const regex = /@([a-zA-Z0-9_\-]+(?:\.[a-zA-Z0-9_\-]+)*)/g;
    let match;
    const ids: string[] = [];

    while ((match = regex.exec(text)) !== null) {
      ids.push(match[1]);
    }

    console.log('解析到的 IDs:', ids);
    console.log('可用资源:', resources.map(r => ({ characterId: r.characterId, name: r.resourceName })));

    if (ids.length === 0) {
      setMatchedResources([]);
      return;
    }

    const matched = resources.filter(r => r.characterId && ids.includes(r.characterId));
    console.log('匹配到的资源:', matched);
    setMatchedResources(matched);
  };

  /**
   * 提取视频资源
   */
  const handleExtractVideoResource = async () => {
    if (isExtractingResource) {
      return;
    }

    const currentVideoPrompt = videoPrompt.trim();
    if (!currentVideoPrompt) {
      showWarning('请先获取视频提示词');
      return;
    }

    if (!currentProjectId) {
      showWarning('请先保存项目');
      return;
    }

    setIsExtractingResource(true);

    try {
      // 1. 获取项目的视频资源列表
      const resourceResult = await getProjectResources(currentProjectId);
      if (resourceResult.code !== 200) {
        showWarning('获取视频资源失败');
        return;
      }

      // 过滤出已完成的视频资源（必须有 characterId）
      const completedResources = (resourceResult.data?.resources || []).filter(
        r => r.status === 'completed' && r.videoResultUrl && r.characterId
      );
      setVideoResources(completedResources);

      console.log('完成的视频资源:', completedResources.map(r => ({
        characterId: r.characterId,
        name: r.resourceName,
        videoUrl: r.videoResultUrl
      })));

      if (completedResources.length === 0) {
        showWarning('暂无可用的视频资源（需要有角色ID）');
        return;
      }

      // 2. 调用 AI 接口提取资源
      const extractResult = await extractVideoResource({
        videoPrompt: currentVideoPrompt,
        resources: completedResources.map(r => ({
          characterId: r.characterId!,
          name: r.resourceName,
          type: r.resourceType,
          videoUrl: r.videoResultUrl || undefined,
        })),
      });

      if (extractResult.code !== 200) {
        showWarning(extractResult.msg || '提取资源失败');
        return;
      }

      // 3. 更新视频提示词
      const newVideoPrompt = extractResult.data;
      console.log('AI 返回的新视频提示词:', newVideoPrompt);
      setVideoPrompt(newVideoPrompt);
      updateNodeData({ videoPrompt: newVideoPrompt });

      // 4. 解析并匹配资源
      parseVideoResourceReferences(newVideoPrompt, completedResources);

      showSuccess('提取资源成功');
      setActiveTab('videoResource'); // 切换到视频资源 tab

    } catch (error) {
      console.error('提取视频资源失败:', error);
      const errorMessage = error instanceof Error ? error.message : '提取视频资源失败';
      showWarning(errorMessage);
    } finally {
      setIsExtractingResource(false);
    }
  };

  // 当视频提示词变化时，重新解析匹配的资源
  useEffect(() => {
    if (videoPrompt && videoResources.length > 0) {
      parseVideoResourceReferences(videoPrompt, videoResources);
    }
  }, [videoPrompt, videoResources]);

  /**
   * 转视频功能 - 传递分镜图和视频提示词
   */
  const handleConvertToVideo = async () => {
    if (isGeneratingVideo) {
      return;
    }

    // 分镜图片和提示词必须有一个不为空
    const currentImageUrl = imageUrl?.trim();
    const currentVideoPrompt = videoPrompt.trim();
    if (!currentImageUrl && !currentVideoPrompt) {
      showWarning('请先生成分镜图或获取视频提示词');
      return;
    }

    // 构建最终的视频提示词
    let finalVideoPrompt = currentVideoPrompt;

    // 将风格对应的提示词加到视频提示词开头（使用 prompt 而不是 label）
    if (style && finalVideoPrompt) {
      const styleOption = enums.styles?.find(s => s.value === style);
      const stylePrompt = styleOption?.prompt || style;
      finalVideoPrompt = `${stylePrompt}, ${finalVideoPrompt}`;
    }

    setIsGeneratingVideo(true);

    try {
      const nodes = getNodes();
      const edges = getEdges();
      const currentNode = nodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 创建视频任务 - 传递分镜图和视频提示词
      const params: CreateVideoParams = {
        prompt: finalVideoPrompt || '', // 如果没有提示词，传空字符串
        aspectRatio: videoAspectRatio,
        duration: 15,
        projectId: currentProjectId || undefined,
        scriptId: currentScriptId || undefined,
        // 如果有分镜图，添加到 imageUrls
        imageUrls: currentImageUrl ? [currentImageUrl] : undefined,
      };

      const result = await createVideo(params);

      if (result.code !== 200) {
        showError(`视频生成失败: ${result.msg}`);
        return;
      }

      const task = result.data;

      // 创建视频展示节点
      const videoNodeId = `video-${task.taskId}-${Date.now()}`;
      const videoNode: Node = {
        id: videoNodeId,
        type: 'videoDisplayNode',
        position: {
          x: currentNode.position.x + 450,
          y: currentNode.position.y,
        },
        data: {
          label: '视频',
          taskId: task.id,
          status: 'loading',
          progress: 0,
        },
      };

      const edge = {
        id: `edge-${id}-${videoNodeId}`,
        source: id,
        target: videoNodeId,
        animated: true,
      };

      setNodes([...nodes, videoNode]);
      setEdges([...edges, edge]);
      showSuccess('视频生成任务已创建');
    } catch (error: any) {
      showError(`转视频失败: ${error.message || '未知错误'}`);
      console.error('转视频失败:', error);
    } finally {
      setIsGeneratingVideo(false);
    }
  };


  return (
    <div className="storyboard-image-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ff9f43', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>{data.label}</strong>
      </div>

      {/* 单张分镜图展示区域 */}
      <div className="si-image-section">
        {imageStatus === 'loading' ? (
          <div className="si-image-loading-box">
            <div className="si-spinner"></div>
            <span>生成中...</span>
          </div>
        ) : imageStatus === 'error' ? (
          <div className="si-image-error-box">
            <span>生成失败</span>
            <span className="si-error-msg">{imageErrorMessage}</span>
          </div>
        ) : imageUrl ? (
          <div className="si-image-box" onClick={() => openImagePreview(imageUrl, '分镜图预览')}>
            <img src={imageUrl} alt="分镜图" />
            <div className="si-image-overlay">
              <span>点击放大</span>
            </div>
            {/* 角标按钮 */}
            <div className="si-image-actions">
              <label className="si-image-action-btn si-upload-replace-btn" title="上传替换" onClick={(e) => e.stopPropagation()}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // TODO: 实现上传替换逻辑
                      showWarning('上传替换功能开发中');
                    }
                    e.target.value = '';
                  }}
                />
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15V3M12 3l-4 4M12 3l4 4M5 21h14" />
                </svg>
              </label>
              <button
                className="si-image-action-btn si-download-btn"
                title="下载"
                onClick={(e) => {
                  e.stopPropagation();
                  // 下载图片
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = `storyboard-${Date.now()}.png`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12M12 15l-4-4M12 15l4-4M5 21h14" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="si-image-empty">
            <span>暂无分镜图</span>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="si-tabs">
        <button
          className={`si-tab ${activeTab === 'original' ? 'active' : ''}`}
          onClick={() => setActiveTab('original')}
        >
          文案
        </button>
        <button
          className={`si-tab ${activeTab === 'storyboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('storyboard')}
        >
          分镜规划
        </button>
        <button
          className={`si-tab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          视频提示词
        </button>
        <button
          className={`si-tab ${activeTab === 'reference' ? 'active' : ''}`}
          onClick={() => setActiveTab('reference')}
        >
          参考图
        </button>
        <button
          className={`si-tab ${activeTab === 'videoResource' ? 'active' : ''}`}
          onClick={() => setActiveTab('videoResource')}
        >
          视频资源
        </button>
      </div>

      <div className="node-body">
        {/* Tab 内容区域 */}
        <div className="si-tab-content">
          {activeTab === 'original' && (
            <div className="si-section">
              <textarea
                className="si-textarea nodrag nowheel"
                value={originalText}
                onChange={(e) => handleOriginalTextChange(e.target.value)}
                placeholder="原文本内容..."
                rows={6}
              />
            </div>
          )}

          {activeTab === 'storyboard' && (
            <div className="si-section">
              <textarea
                className="si-textarea nodrag nowheel"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="描述分镜画面..."
                rows={6}
              />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="si-section">
              <textarea
                className="si-textarea nodrag nowheel"
                value={videoPrompt}
                onChange={(e) => handleVideoPromptChange(e.target.value)}
                placeholder="视频生成提示词..."
                rows={6}
              />
            </div>
          )}

          {activeTab === 'reference' && (
            <div className="si-section">
              {referenceImages.length === 0 ? (
                <div className="si-reference-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>暂无参考图</span>
                </div>
              ) : (
                <div className="si-reference-grid">
                  {referenceImages.map((img, idx) => (
                    <div key={idx} className="si-reference-item">
                      <img
                        src={img}
                        alt={`参考图${idx + 1}`}
                        onClick={() => openImagePreview(img, `参考图${idx + 1}`)}
                      />
                      <button
                        className="si-reference-remove-btn"
                        onClick={() => handleRemoveReferenceImage(idx)}
                        title="删除"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'videoResource' && (
            <div className="si-section">
              <div className="si-video-resource-content">
                <button
                  className="si-extract-resource-btn"
                  onClick={handleExtractVideoResource}
                  disabled={isExtractingResource || !videoPrompt}
                >
                  {isExtractingResource ? '提取中...' : '提取资源'}
                </button>

                {/* 匹配的视频资源列表 */}
                {matchedResources.length > 0 && (
                  <div className="si-matched-resources">
                    <div className="si-matched-resources-title">已匹配资源：</div>
                    <div className="si-matched-resources-list">
                      {matchedResources.map((resource) => (
                        <div key={resource.characterId || resource.id} className="si-matched-resource-item">
                          <div className="si-resource-video-thumb">
                            {resource.videoResultUrl ? (
                              <video src={resource.videoResultUrl} muted />
                            ) : (
                              <div className="si-resource-no-video">无视频</div>
                            )}
                          </div>
                          <div className="si-resource-info">
                            <span className="si-resource-id">@{resource.characterId}</span>
                            <span className="si-resource-name">{resource.resourceName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedResources.length === 0 && videoPrompt && (
                  <div className="si-no-matched-resources">
                    <span>暂无匹配的视频资源</span>
                    <span className="si-hint">点击"提取资源"自动识别</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 参考图区域 */}
        <div className="si-section">
          <div className="si-label-row">
            <label className="si-label">
              参考图（{referenceImages.length}/{MAX_REFERENCE_IMAGES}）：
            </label>
          </div>
          <div className="si-upload-wrapper">
            {referenceImages.length > 0 ? (
              <div className="si-connected-images">
                {referenceImages.map((img, idx) => (
                  <div key={idx} className="si-image-thumb">
                    <img src={img} alt={`参考图${idx + 1}`} />
                    <button
                      className="si-remove-thumb-btn"
                      onClick={() => handleRemoveReferenceImage(idx)}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {referenceImages.length < MAX_REFERENCE_IMAGES && (
                  <button
                    className="si-add-btn"
                    onClick={handleOpenResourceModal}
                    disabled={isGeneratingImage}
                  >
                    +
                  </button>
                )}
              </div>
            ) : (
              <button
                className="si-upload-btn"
                onClick={handleOpenResourceModal}
                disabled={isGeneratingImage}
              >
                + 添加参考图
              </button>
            )}
          </div>
        </div>

        {/* 风格和尺寸 */}
        {enumsLoading ? (
          <div style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
            加载配置中...
          </div>
        ) : (
          <>
            <div className="si-section si-inline">
              <div className="si-option">
                <label className="si-label">风格</label>
                <select
                  className="si-select nodrag"
                  value={style}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  disabled={isGeneratingImage}
                >
                  <option value="">默认</option>
                  {enums?.styles?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="si-option">
                <label className="si-label">宽高比</label>
                <select
                  className="si-select nodrag"
                  value={size}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  disabled={isGeneratingImage}
                >
                  {enums?.aspectRatios?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="si-action-buttons-row">
              <button
                className="si-generate-btn si-half-btn"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !prompt || enumsLoading}
              >
                {isGeneratingImage ? '生成中...' : (imageUrl ? '重新生成' : '生成分镜图')}
              </button>
              <button
                className="si-video-prompt-btn si-half-btn"
                onClick={handleGetVideoPrompt}
                disabled={isGettingVideoPrompt || !originalText}
              >
                {isGettingVideoPrompt ? '获取中...' : '视频提示词'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 视频转换操作区 - 始终显示，分镜图片和提示词必须有一个才允许提交 */}
      <div className="si-video-action-section">
        <div className="si-video-ratio-selector">
          <button
            className={`si-ratio-btn ${videoAspectRatio === '16:9' ? 'active' : ''}`}
            onClick={() => handleVideoAspectRatioChange('16:9')}
            disabled={isGeneratingVideo}
          >
            横版
          </button>
          <button
            className={`si-ratio-btn ${videoAspectRatio === '9:16' ? 'active' : ''}`}
            onClick={() => handleVideoAspectRatioChange('9:16')}
            disabled={isGeneratingVideo}
          >
            竖版
          </button>
        </div>
        <button
          className="si-convert-video-btn"
          onClick={handleConvertToVideo}
          disabled={isGeneratingVideo || (!imageUrl && !videoPrompt)}
        >
          {isGeneratingVideo ? '生成中...' : '转视频'}
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#ff9f43', width: 10, height: 10 }}
      />

      {/* 参考图选择弹窗 */}
      <ReferenceImageSelectionModal
        isOpen={showResourceModal}
        onClose={handleCloseResourceModal}
        resourceList={resourceList}
        loading={loadingResources}
        maxImages={MAX_REFERENCE_IMAGES}
        currentCount={referenceImages.length}
        onConfirm={handleConfirmSelectImages}
        onUpload={handleUploadImage}
      />
    </div>
  );
};

export default StoryboardImageNode;
