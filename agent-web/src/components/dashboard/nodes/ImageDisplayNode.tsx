import React, { memo, useRef, useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { createPortal } from 'react-dom';
import type { NodeProps, Node } from 'reactflow';
import { upload } from '@/utils/request';
import { showSuccess, showWarning, showError } from '@/utils/request';
import { getTaskStatus, imageToImage, type ImageTask, type ImageToImageParams } from '../../../api/imageGeneration';
import { createVideo, type CreateVideoParams } from '../../../api/videoGeneration';
import { cameraImageToVideoPrompt } from '../../../api/playbook';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import './ImageDisplayNode.css';

interface ImageDisplayNodeData {
  label: string;
  taskId?: number;
  imageUrl?: string;
  status?: 'loading' | 'success' | 'error'; // 保留用于兼容，已废弃
  imageStatus?: 'loading' | 'success' | 'error' | 'empty'; // 图片独立状态
  errorMessage?: string;
  imageErrorMessage?: string; // 图片错误信息
  prompt?: string; // 保存提示词用于转视频
  videoPrompt?: string; // 视频提示词
  videoPromptLoading?: boolean; // 视频提示词加载中
  aspectRatio?: string; // 宽高比
}

interface UploadResponse {
  id: number;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

const ImageDisplayNode = ({ data, id }: NodeProps<ImageDisplayNodeData>) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingVideoPrompt, setIsGeneratingVideoPrompt] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState(data.videoPrompt || '');
  const [previewVisible, setPreviewVisible] = useState(false);
  const { setNodes, getNodes, setEdges, getEdges } = useReactFlow();
  const currentProjectId = useWorkflowStore((state) => state.currentProjectId);
  const currentScriptId = useWorkflowStore((state) => state.currentScriptId);

  // 同步 data.videoPrompt 到本地状态
  useEffect(() => {
    if (data.videoPrompt !== undefined && data.videoPrompt !== videoPrompt) {
      setVideoPrompt(data.videoPrompt);
    }
  }, [data.videoPrompt]);

  // 下载图片
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) return;
    window.open(data.imageUrl, '_blank');
  };

  // 放大查看图片
  const handleImagePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) return;
    setPreviewVisible(true);
  };

  // 关闭预览弹窗
  const handleClosePreview = () => {
    setPreviewVisible(false);
  };

  // 更新节点数据
  const updateNodeData = (updates: Partial<ImageDisplayNodeData>) => {
    setNodes((nodes) =>
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

  // 轮询任务状态
  useEffect(() => {
    // 获取图片状态（优先使用 imageStatus，兼容旧 status）
    const imgStatus = data.imageStatus ?? data.status;
    if (!data.taskId || imgStatus === 'success' || imgStatus === 'error') {
      return;
    }

    let isCancelled = false;

    const pollTask = async () => {
      try {
        const result = await getTaskStatus(data.taskId!);

        if (isCancelled) return;

        if (result.code !== 200) {
          updateNodeData({
            imageStatus: 'error',
            imageErrorMessage: result.msg || '查询任务失败',
          });
          return;
        }

        const task: ImageTask = result.data;

        // 任务完成
        if (task.status === 'completed' && task.resultUrl) {
          updateNodeData({
            imageStatus: 'success',
            imageUrl: task.resultUrl,
          });
          return;
        }

        // 任务失败
        if (task.status === 'failed') {
          updateNodeData({
            imageStatus: 'error',
            imageErrorMessage: task.errorMessage || '生成失败',
          });
          return;
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('轮询任务失败:', error);
        updateNodeData({
          imageStatus: 'error',
          imageErrorMessage: error.message || '查询任务失败',
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
  }, [data.taskId, data.imageStatus, data.status]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showWarning('请选择图片文件');
      return;
    }

    try {
      setUploading(true);

      // 使用封装的 upload 函数，会自动添加 token
      const response = await upload<{ code: number; data: UploadResponse; message?: string }>(
        '/api/file/upload',
        file
      );

      if (response.data.code === 200 && response.data.data?.url) {
        // 更新节点数据
        updateNodeData({
          imageUrl: response.data.data.url,
          imageStatus: 'success', // 使用 imageStatus
        });
        showSuccess('图片上传成功');
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      // 错误提示已经由 request 拦截器处理
    } finally {
      setUploading(false);
      // 清空input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 处理视频提示词变更
  const handleVideoPromptChange = (value: string) => {
    setVideoPrompt(value);
    updateNodeData({ videoPrompt: value });
  };

  // 转视频功能
  const handleConvertToVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!data.imageUrl) {
      showWarning('没有可用的图片');
      return;
    }

    if (!videoPrompt.trim()) {
      showWarning('请先输入视频提示词');
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const nodes = getNodes();
      const edges = getEdges();
      const currentNode = nodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 使用视频提示词
      const finalVideoPrompt = videoPrompt.trim();

      // 获取宽高比
      const aspectRatio = data.aspectRatio === '9:16' ? '9:16' : '16:9';

      // 创建视频任务
      const params: CreateVideoParams = {
        prompt: finalVideoPrompt,
        imageUrls: [data.imageUrl],
        aspectRatio: aspectRatio,
        duration: 15,
        projectId: currentProjectId || undefined,
        scriptId: currentScriptId || undefined,
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
          x: currentNode.position.x + 350,
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

  // 获取视频提示词功能
  const handleGenerateVideoPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!data.imageUrl) {
      showWarning('没有可用的图片');
      return;
    }

    setIsGeneratingVideoPrompt(true);

    // 设置加载状态
    updateNodeData({ videoPromptLoading: true });

    try {
      // 使用原始提示词作为输入
      const promptSource = data.prompt || videoPrompt || '';
      if (!promptSource.trim()) {
        showWarning('没有可用的提示词来源');
        updateNodeData({ videoPromptLoading: false });
        return;
      }

      // 调用视频提示词 API，传递提示词和图片路径
      const result = await cameraImageToVideoPrompt({
        content: promptSource,
        mediaUrl: data.imageUrl,
      });

      if (result.code === 200) {
        const newVideoPrompt = result.data;
        // 更新节点数据
        updateNodeData({
          videoPrompt: newVideoPrompt,
          videoPromptLoading: false,
        });
        showSuccess('视频提示词生成成功');
      } else {
        console.error('视频提示词获取失败:', result);
        updateNodeData({
          videoPromptLoading: false,
        });
        showWarning('视频提示词生成失败，可手动编辑');
      }
    } catch (error: any) {
      console.error('视频提示词获取失败:', error);
      updateNodeData({
        videoPromptLoading: false,
      });
      showWarning(`获取视频提示词失败: ${error.message || '未知错误'}`);
    } finally {
      setTimeout(() => {
        setIsGeneratingVideoPrompt(false);
      }, 1000);
    }
  };

  const renderContent = () => {
    // 获取图片状态（优先使用 imageStatus，兼容旧 status）
    const imgStatus = data.imageStatus ?? data.status ?? 'empty';
    const imgErrorMessage = data.imageErrorMessage ?? data.errorMessage;

    // 渲染图片区域
    const renderImageSection = () => {
      // 如果正在上传，显示上传状态
      if (uploading) {
        return (
          <div className="image-section-loading">
            <div className="spinner"></div>
            <p>上传中...</p>
          </div>
        );
      }

      // 如果是生成加载状态
      if (imgStatus === 'loading') {
        return (
          <div className="image-section-loading">
            <div className="spinner"></div>
            <p>图片生成中...</p>
          </div>
        );
      }

      // 如果有图片（成功状态或已上传）
      if (data.imageUrl) {
        return (
          <div className="image-display-wrapper" onClick={handleImagePreview} title="点击放大查看">
            <img src={data.imageUrl} alt="图片" className="display-image clickable" />
            <div className="image-overlay">
              <span>🔍 点击放大</span>
            </div>
            <button
              className="download-btn"
              onClick={handleDownload}
              title="下载图片"
            >
              ⬇️
            </button>
          </div>
        );
      }

      // 如果是错误状态
      if (imgStatus === 'error') {
        return (
          <div className="image-section-error">
            <p>❌ 图片生成失败</p>
            {imgErrorMessage && <p className="error-message">{imgErrorMessage}</p>}
            <button className="upload-button-small" onClick={handleUploadClick}>
              📤 上传图片
            </button>
          </div>
        );
      }

      // 默认空状态
      return (
        <div className="image-section-empty">
          <p>等待图片...</p>
          <button className="upload-button-small" onClick={handleUploadClick}>
            📤 上传图片
          </button>
        </div>
      );
    };

    return (
      <div className="image-display-content">
        {/* 图片区域 */}
        {renderImageSection()}

        {/* 如果有图片，显示更换图片按钮 */}
        {data.imageUrl && !uploading && (
          <button
            className="replace-image-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
            title="更换图片"
          >
            🔄 更换图片
          </button>
        )}

        {/* 视频提示词区域 - 始终显示 */}
        <div className="video-prompt-section">
          <label className="video-prompt-label">
            提示词：
            {data.videoPromptLoading && <span className="loading-hint">生成中...</span>}
          </label>
          <textarea
            className="video-prompt-textarea nodrag nowheel"
            value={videoPrompt}
            onChange={(e) => handleVideoPromptChange(e.target.value)}
            placeholder="提示词将自动生成，也可手动编辑..."
            rows={3}
          />
        </div>

        {/* 操作按钮组 - 有图片时显示 */}
        {data.imageUrl && (
          <div className="action-buttons-row">
            <button
              className="edit-image-btn small-text-btn"
              onClick={handleGenerateVideoPrompt}
              disabled={isGeneratingVideoPrompt}
              title="获取视频提示词"
            >
              {isGeneratingVideoPrompt ? '获取中...' : '获取视频提示词'}
            </button>
            <button
              className="convert-video-btn"
              onClick={handleConvertToVideo}
              disabled={isGeneratingVideo || !videoPrompt.trim()}
              title={!videoPrompt.trim() ? '请先输入提示词' : '将图片转为视频'}
            >
              {isGeneratingVideo ? '生成中...' : '🎬 转视频'}
            </button>
          </div>
        )}
        {data.imageUrl && !videoPrompt.trim() && !isGeneratingVideoPrompt && (
          <div className="video-prompt-hint">需要获取或输入提示词</div>
        )}
      </div>
    );
  };

  return (
    <div className="image-display-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#00eeff', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>🖼️ {data.label}</strong>
      </div>

      <div className="node-body">
        {renderContent()}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#00eeff', width: 10, height: 10 }}
      />

      {/* 图片预览弹窗 - 使用 Portal 渲染到 body */}
      {previewVisible && data.imageUrl && createPortal(
        <div className="image-preview-modal" onClick={handleClosePreview}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <img src={data.imageUrl} alt="预览" className="preview-image" />
            <button className="preview-close-btn" onClick={handleClosePreview}>
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default memo(ImageDisplayNode);
