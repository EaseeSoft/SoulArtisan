import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { createVideo, getTaskStatus as getVideoTaskStatus } from '../../../api/videoGeneration';
import type { CreateVideoParams } from '../../../api/videoGeneration';
import type { CharacterEnums } from '../../../api/enums';
import {
  createVideoResource,
  generateCharacter as generateVideoResource,
  updateVideoResource,
  pollVideoResourceUntilComplete,
  type VideoResourceInfo
} from '../../../api/videoResource';
import { showSuccess, showWarning } from '../../../utils/request';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import './CharacterGenerationNode.css';

interface CharacterGenerationNodeProps {
  data: {
    label: string;
    characterName?: string;
    prompt?: string;
    duration?: number;
    style?: string;
    referenceImage?: string;
    outputCharacter?: string;
    characterType?: 'character' | 'scene'; // 人物角色或场景角色
    imageTaskId?: number; // 图片生成任务ID
    imageUrl?: string; // 图片URL
    videoTaskId?: string; // 视频生成任务ID
    characterId?: number; // 角色资源ID
    startTime?: number; // 角色生成的开始时间
    endTime?: number; // 角色生成的结束时间
  };
  id: string;
}

const CharacterGenerationNode: React.FC<CharacterGenerationNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const { getEnumsCache, currentProjectId, currentScriptId, currentProjectStyle } = useWorkflowStore();
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [style, setStyle] = useState<string>(data.style || currentProjectStyle || '');
  const [duration, setDuration] = useState(data.duration || 10);
  const [referenceImage, setReferenceImage] = useState(data.referenceImage || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'video' | 'info'>('prompt');

  // 图片生成状态
  const [imageTaskId, setImageTaskId] = useState<number | undefined>(data.imageTaskId);
  const [imageUrl, setImageUrl] = useState<string | undefined>(data.imageUrl);
  const [imageStatus, setImageStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [imageError, setImageError] = useState<string>('');

  // 视频生成状态
  const [videoTaskId, setVideoTaskId] = useState<string | undefined>(data.videoTaskId);
  const [videoTaskDbId, setVideoTaskDbId] = useState<number | undefined>(undefined); // 任务数据库ID，用于轮询
  const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'completed' | 'failed'>('idle');

  // 角色资源状态
  const [resourceId, setResourceId] = useState<number | undefined>(data.characterId);
  const [resourceData, setResourceData] = useState<VideoResourceInfo | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);

  // 时间戳输入状态
  const [startTime, setStartTime] = useState<number>(data.startTime || 0);
  const [endTime, setEndTime] = useState<number>(data.endTime || 3);

  // 根据类型确定显示文本
  const isScene = data.characterType === 'scene';
  const entityType = isScene ? '场景' : '角色';
  const entityIcon = isScene ? '🏞️' : '🎭';

  // 枚举数据
  const [enums, setEnums] = useState<CharacterEnums>({
    aspectRatios: [],
    durations: [],
    styles: []
  });
  const [enumsLoading, setEnumsLoading] = useState(true);

  /**
   * 从缓存加载枚举数据（角色使用视频的枚举）
   */
  useEffect(() => {
    const cachedEnums = getEnumsCache();
    if (cachedEnums) {
      setEnums({
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

  // 初始化风格为项目风格
  useEffect(() => {
    if (!data.style && currentProjectStyle) {
      setStyle(currentProjectStyle);
      updateNodeData({ style: currentProjectStyle });
    }
  }, [currentProjectStyle]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<CharacterGenerationNodeProps['data']>) => {
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

  const handleStyleChange = (value: string) => {
    setStyle(value);
    updateNodeData({ style: value });
  };

  const handleReferenceImageChange = (value: string) => {
    setReferenceImage(value);
    updateNodeData({ referenceImage: value });
  };

  /**
   * 构建最终的提示词（包含风格）
   */
  const buildFinalPrompt = (): string => {
    let finalPrompt = prompt.trim();

    if (style) {
      finalPrompt = `${style} style, No subtitles, no text, no speech,${finalPrompt}`;
    }

    return finalPrompt;
  };

  /**
   * 开始生成视频资源
   */
  const handleStartGeneration = () => {
    if (!prompt.trim()) {
      showWarning('请输入资源描述');
      return;
    }

    // 切换到视频资源tab并开始生成
    setActiveTab('video');

    // 使用 setTimeout 确保 tab 切换完成后再开始生成
    setTimeout(() => {
      handleGenerateCharacter();
    }, 100);
  };

  /**
   * 生成视频资源（创建资源记录并生成视频，使用正确的轮询方式）
   */
  const handleGenerateCharacter = async () => {
    // 防重复点击检查
    if (isGenerating || isCreatingResource) {
      return;
    }

    if (!currentProjectId) {
      showWarning('未找到项目ID');
      return;
    }

    // 使用参考图或已有的图片URL（可选）
    const finalImageUrl = imageUrl || referenceImage;

    setIsGenerating(true);
    setIsCreatingResource(true);
    setVideoStatus('loading');

    try {
      // 根据类型确定尺寸：场景用 16:9，角色用 9:16
      const aspectRatio = isScene ? '16:9' : '9:16';
      const resourceType = isScene ? 'scene' : 'character';

      // Step 1: 创建视频资源记录
      console.log('创建视频资源记录...');
      const createResult = await createVideoResource({
        projectId: currentProjectId,
        scriptId: currentScriptId || undefined,
        resourceName: data.characterName || '未命名资源',
        resourceType: resourceType as any,
        prompt: buildFinalPrompt(),
        imageUrl: finalImageUrl || undefined
      });

      if (createResult.code !== 200) {
        throw new Error(createResult.msg || '创建资源失败');
      }

      const resource = createResult.data;
      console.log('资源创建成功, ID:', resource.id);

      // 保存资源ID到节点数据和状态
      setResourceId(resource.id);
      setResourceData(resource);
      updateNodeData({ characterId: resource.id });

      // Step 2: 更新数据库状态为 video_generating
      console.log('更新资源状态为视频生成中...');
      await updateVideoResource(resource.id, {
        status: 'video_generating',
        aspectRatio
      });

      // 更新本地状态
      setResourceData(prev => prev ? { ...prev, status: 'video_generating' } : null);

      // 构建视频生成参数
      const params: CreateVideoParams = {
        prompt: buildFinalPrompt(),
        aspectRatio: aspectRatio as '16:9' | '9:16',
        duration: duration as 10 | 15 | 25,
        imageUrls: finalImageUrl ? [finalImageUrl] : undefined,
        projectId: currentProjectId,
        scriptId: currentScriptId || undefined,
      };

      console.log('调用视频生成接口...', params);

      // Step 3: 创建视频生成任务
      const videoCreateResult = await createVideo(params);

      if (videoCreateResult.code !== 200) {
        throw new Error(videoCreateResult.msg || '创建视频任务失败');
      }

      const task = videoCreateResult.data;
      const taskDbId = task.id; // 任务数据库ID，用于轮询
      const taskId = task.taskId; // 任务ID字符串

      console.log('视频任务已创建, videoTaskId:', taskId, 'dbId:', taskDbId);

      // 保存到当前节点
      setVideoTaskId(taskId);
      setVideoTaskDbId(taskDbId);
      updateNodeData({ videoTaskId: taskId });

      // Step 4: 更新数据库，保存 videoTaskId
      await updateVideoResource(resource.id, {
        videoTaskId: taskId,
        status: 'video_generating',
      });

      showSuccess('视频生成任务已创建，正在生成中...');

      // Step 5: 轮询任务状态（使用 getVideoTaskStatus）
      const pollTask = async () => {
        try {
          const statusResult = await getVideoTaskStatus(taskDbId);
          if (statusResult.code !== 200) {
            throw new Error(statusResult.msg || '查询任务状态失败');
          }

          const taskStatus = statusResult.data;
          console.log('视频任务状态:', taskStatus.status, taskStatus.progress);

          if (taskStatus.status === 'succeeded' && taskStatus.resultUrl) {
            // 视频生成完成
            console.log('视频生成完成:', taskStatus.resultUrl);

            // 更新数据库 - 视频生成完成，状态变为 video_generated
            await updateVideoResource(resource.id, {
              videoUrl: taskStatus.resultUrl,
              videoResultUrl: taskStatus.resultUrl,
              status: 'video_generated',
            });

            // 更新本地状态
            setResourceData(prev => prev ? {
              ...prev,
              videoUrl: taskStatus.resultUrl,
              videoResultUrl: taskStatus.resultUrl,
              status: 'video_generated'
            } : null);

            setVideoStatus('completed');
            showSuccess('视频生成完成，请填写时间区间并生成角色');

            // 更新到资源缓存
            const { addResourceToCache } = useWorkflowStore.getState();
            addResourceToCache({
              ...resource,
              videoUrl: taskStatus.resultUrl,
              videoResultUrl: taskStatus.resultUrl,
              status: 'video_generated'
            });

            // 解除禁用
            setIsGenerating(false);
            setIsCreatingResource(false);

          } else if (taskStatus.status === 'error') {
            // 视频生成失败
            console.error('视频生成失败:', taskStatus.errorMessage);

            // 更新数据库状态为失败
            await updateVideoResource(resource.id, {
              status: 'failed',
              errorMessage: taskStatus.errorMessage || '视频生成失败',
            });

            setResourceData(prev => prev ? {
              ...prev,
              status: 'failed',
              errorMessage: taskStatus.errorMessage
            } : null);

            setVideoStatus('failed');
            showWarning('视频生成失败: ' + (taskStatus.errorMessage || '未知错误'));

            // 解除禁用
            setIsGenerating(false);
            setIsCreatingResource(false);

          } else {
            // 继续轮询（pending 或 running 状态）
            setTimeout(pollTask, 10000); // 每10秒轮询一次
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error);
          // 更新数据库状态为失败
          await updateVideoResource(resource.id, { status: 'failed' });
          setVideoStatus('failed');
          setIsGenerating(false);
          setIsCreatingResource(false);
        }
      };

      // 开始轮询（5秒后开始第一次轮询）
      setTimeout(pollTask, 5000);

    } catch (error) {
      console.error('资源创建失败:', error);
      const errorMessage = error instanceof Error ? error.message : '资源创建失败';
      setVideoStatus('failed');
      showWarning(errorMessage);
      // 延迟解除禁用，防止快速重复点击
      setTimeout(() => {
        setIsGenerating(false);
        setIsCreatingResource(false);
      }, 1000);
    }
  };

  /**
   * 从视频生成角色
   */
  const handleGenerateFromVideo = async () => {
    // 验证时间输入
    if (isNaN(startTime) || isNaN(endTime)) {
      showWarning('请输入有效的时间');
      return;
    }
    if (startTime >= endTime) {
      showWarning('开始时间必须小于结束时间');
      return;
    }

    if (!resourceId || !videoTaskId) {
      showWarning('资源信息不完整');
      return;
    }

    setIsCreatingResource(true);

    try {
      const timestamps = `${startTime},${endTime}`;

      console.log('调用角色生成接口...', {
        resourceId,
        videoTaskId,
        timestamps
      });

      // 调用角色生成接口
      const generateResult = await generateVideoResource({
        resourceId: resourceId,
        videoTaskId: videoTaskId,
        timestamps: timestamps
      });

      if (generateResult.code !== 200) {
        throw new Error(generateResult.msg || '生成角色失败');
      }

      console.log('角色生成任务已创建，开始轮询状态...');

      // 保存时间区间到节点数据
      updateNodeData({
        startTime,
        endTime
      });

      showSuccess('角色生成任务已创建');

      // 开始轮询资源状态，直到角色生成完成
      const completedResource = await pollVideoResourceUntilComplete(
        resourceId,
        (currentResource) => {
          console.log('资源状态:', currentResource.status);
          setResourceData(currentResource);

          // 如果角色已生成，切换到资源信息tab
          if (currentResource.characterId) {
            setActiveTab('info');
          }
        },
        { interval: 5000, maxAttempts: 120 }
      );

      console.log('角色生成完成:', completedResource);
      setResourceData(completedResource);

      // 更新节点数据
      updateNodeData({
        characterId: completedResource.id
      });

      showSuccess('角色创作完成');

      // 更新到资源缓存
      const { addResourceToCache } = useWorkflowStore.getState();
      addResourceToCache(completedResource);

    } catch (error) {
      console.error('角色创作失败:', error);
      showWarning(error instanceof Error ? error.message : '角色创作失败');
    } finally {
      setIsCreatingResource(false);
    }
  };

  return (
    <div className="character-gen-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>{entityIcon} {data.characterName ? `${data.label} - ${data.characterName}` : data.label}</strong>
      </div>

      {/* Tab 导航 */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
          资源提示词
        </button>
        <button
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          资源视频
        </button>
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          资源信息
        </button>
      </div>

      <div className="node-body">
        {enumsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            加载配置中...
          </div>
        ) : (
          <>
            {/* 资源提示词 Tab */}
            {activeTab === 'prompt' && (
              <div className="tab-content">
                {/* 角色/场景描述 */}
                <div className="character-gen-section">
                  <label className="character-gen-label">{entityType}描述</label>
                  <textarea
                    className="character-gen-textarea nodrag nowheel"
                    value={prompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder={`描述你想要生成的${entityType}...`}
                    rows={3}
                    disabled={isGenerating || imageStatus === 'generating'}
                  />
                </div>

                {/* 风格选择 */}
                <div className="character-gen-section">
                  <label className="character-gen-label">风格</label>
                  <select
                    className="character-gen-select full-width nodrag"
                    value={style}
                    onChange={(e) => handleStyleChange(e.target.value)}
                    disabled={isGenerating || imageStatus === 'generating'}
                  >
                    <option value="">无</option>
                    {enums?.styles?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {style && (
                    <small style={{ color: '#00d4ff', fontSize: '10px', display: 'block', marginTop: '4px' }}>
                      将在描述开头添加 "{style} style"
                    </small>
                  )}
                </div>

                {/* 参考图 */}
                <div className="character-gen-section">
                  <label className="character-gen-label">参考图 URL（可选）</label>
                  <input
                    type="text"
                    className="character-gen-input nodrag"
                    value={referenceImage}
                    onChange={(e) => handleReferenceImageChange(e.target.value)}
                    placeholder="输入参考图片URL..."
                    disabled={isGenerating || imageStatus === 'generating'}
                  />
                </div>

                {/* 时长选择 */}
                <div className="character-gen-section">
                  <label className="character-gen-label">时长(秒)</label>
                  <select
                    className="character-gen-select full-width nodrag"
                    value={duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                    disabled={isGenerating || imageStatus === 'generating'}
                  >
                    {enums?.durations?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 生成资源按钮 */}
                <button
                  className="generate-btn"
                  onClick={handleStartGeneration}
                  disabled={isGenerating || !prompt || enumsLoading}
                  style={{ marginTop: '8px' }}
                >
                  {isGenerating ? (
                    <>
                      <span className="btn-spinner"></span>
                      生成中...
                    </>
                  ) : '🎬 生成资源'}
                </button>

                {imageError && (
                  <div style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px' }}>
                    {imageError}
                  </div>
                )}
              </div>
            )}

            {/* 资源视频 Tab */}
            {activeTab === 'video' && (
              <div className="tab-content">
                {/* 显示参考图 */}
                {referenceImage && (
                  <div className="character-gen-section">
                    <label className="character-gen-label">参考图</label>
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <img
                        src={referenceImage}
                        alt="参考图"
                        style={{ maxWidth: '100%', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                )}

                {/* 视频生成状态 */}
                {videoStatus === 'idle' && (
                  <div className="character-gen-section">
                    <button
                      className="generate-btn"
                      onClick={handleGenerateCharacter}
                      disabled={isGenerating}
                      style={{ marginTop: '8px', width: '100%' }}
                    >
                      {entityIcon} 生成资源
                    </button>
                  </div>
                )}

                {videoStatus === 'loading' && (
                  <div className="video-loading-container">
                    <div className="video-loading-spinner"></div>
                    <div className="video-loading-text">视频生成中...</div>
                    <div className="video-loading-hint">预计需要2-5分钟，请耐心等待</div>
                  </div>
                )}

                {videoStatus === 'completed' && resourceData && (
                  <>
                    {/* 显示视频预览 */}
                    {resourceData.videoUrl && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">生成的视频</label>
                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                          <video
                            src={resourceData.videoUrl}
                            controls
                            style={{ maxWidth: '100%', borderRadius: '4px', maxHeight: '200px' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 时间区间输入 */}
                    <div className="character-gen-section">
                      <label className="character-gen-label">时间区间(秒)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          className="character-gen-input nodrag"
                          value={startTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStartTime(val);
                            updateNodeData({ startTime: val });
                          }}
                          placeholder="开始"
                          step="0.1"
                          min="0"
                          style={{ flex: 1 }}
                        />
                        <span style={{ color: '#999' }}>至</span>
                        <input
                          type="number"
                          className="character-gen-input nodrag"
                          value={endTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEndTime(val);
                            updateNodeData({ endTime: val });
                          }}
                          placeholder="结束"
                          step="0.1"
                          min="0"
                          style={{ flex: 1 }}
                        />
                      </div>
                      <small style={{ color: '#999', fontSize: '10px', display: 'block', marginTop: '4px' }}>
                        默认区间为 0-3 秒
                      </small>
                    </div>

                    {/* 角色创作按钮 */}
                    {!resourceData.characterId && (
                      <div className="character-gen-section">
                        <button
                          className="generate-btn"
                          onClick={handleGenerateFromVideo}
                          disabled={isCreatingResource}
                          style={{ marginTop: '8px', width: '100%' }}
                        >
                          {isCreatingResource ? '生成中...' : `${entityIcon} 角色创作`}
                        </button>
                      </div>
                    )}

                    {/* 角色创作成功提示 */}
                    {resourceData.characterId && (
                      <div style={{ color: '#00ff88', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                        ✓ 角色已生成，请查看资源信息
                      </div>
                    )}
                  </>
                )}

                {videoStatus === 'failed' && (
                  <div style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                    视频生成失败
                  </div>
                )}
              </div>
            )}

            {/* 资源信息 Tab */}
            {activeTab === 'info' && (
              <div className="tab-content">
                {resourceData ? (
                  <>
                    <div className="character-gen-section">
                      <label className="character-gen-label">资源ID</label>
                      <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#00d4ff' }}>
                        {resourceData.id}
                      </div>
                    </div>

                    <div className="character-gen-section">
                      <label className="character-gen-label">资源名称</label>
                      <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#ddd' }}>
                        {resourceData.resourceName}
                      </div>
                    </div>

                    <div className="character-gen-section">
                      <label className="character-gen-label">资源类型</label>
                      <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#ddd' }}>
                        {resourceData.resourceType === 'character' ? '角色' : '场景'}
                      </div>
                    </div>

                    <div className="character-gen-section">
                      <label className="character-gen-label">状态</label>
                      <div style={{
                        padding: '8px',
                        background: '#1a1a2e',
                        borderRadius: '4px',
                        color: resourceData.status === 'completed' ? '#00ff88' :
                               resourceData.status === 'failed' ? '#ff4444' : '#ffaa00'
                      }}>
                        {resourceData.status === 'completed' ? '✓ 已完成' :
                         resourceData.status === 'failed' ? '✗ 失败' :
                         resourceData.status === 'character_generating' ? '⏳ 角色生成中' :
                         resourceData.status === 'video_generating' ? '⏳ 视频生成中' :
                         resourceData.status === 'video_generated' ? '✓ 视频已生成' : '待生成'}
                      </div>
                    </div>

                    {resourceData.characterImageUrl && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">角色图片</label>
                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                          <img
                            src={resourceData.characterImageUrl}
                            alt="角色图片"
                            style={{ maxWidth: '100%', borderRadius: '4px', maxHeight: '150px' }}
                          />
                        </div>
                      </div>
                    )}

                    {resourceData.characterVideoUrl && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">角色视频</label>
                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                          <video
                            src={resourceData.characterVideoUrl}
                            controls
                            style={{ maxWidth: '100%', borderRadius: '4px', maxHeight: '200px' }}
                          />
                        </div>
                      </div>
                    )}

                    {resourceData.characterId && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">角色ID</label>
                        <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#00d4ff', fontSize: '11px', wordBreak: 'break-all' }}>
                          {resourceData.characterId}
                        </div>
                      </div>
                    )}

                    {resourceData.errorMessage && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">错误信息</label>
                        <div style={{ padding: '8px', background: '#2a1a1a', borderRadius: '4px', color: '#ff4444' }}>
                          {resourceData.errorMessage}
                        </div>
                      </div>
                    )}

                    <div className="character-gen-section">
                      <label className="character-gen-label">创建时间</label>
                      <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#999', fontSize: '11px' }}>
                        {new Date(resourceData.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {resourceData.completedAt && (
                      <div className="character-gen-section">
                        <label className="character-gen-label">完成时间</label>
                        <div style={{ padding: '8px', background: '#1a1a2e', borderRadius: '4px', color: '#999', fontSize: '11px' }}>
                          {new Date(resourceData.completedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </>
                ) : resourceId ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#00d4ff' }}>
                    资源加载中...
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无资源信息
                  </div>
                )}
              </div>
            )}
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

export default CharacterGenerationNode;
