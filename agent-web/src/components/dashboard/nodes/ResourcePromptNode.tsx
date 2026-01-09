import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { createPortal } from 'react-dom';
import { generateImageFromText, getTaskStatus } from '../../../api/imageGeneration';
import type { ImageTask } from '../../../api/imageGeneration';
import type { ImageEnums } from '../../../api/enums';
import { createPictureResource } from '../../../api/pictureResource';
import type { PictureResourceType } from '../../../api/pictureResource';
import { showWarning, showSuccess, showError } from '../../../utils/request';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import './ResourcePromptNode.css';

interface ResourcePromptNodeProps {
  data: {
    label: string;
    roleName?: string;
    prompt?: string;
    style?: string;
    size?: string;
    outputImage?: string;
    taskId?: number;
    imageUrl?: string;
    imageStatus?: 'loading' | 'success' | 'error' | 'empty';
    imageErrorMessage?: string;
  };
  id: string;
}

const ResourcePromptNode: React.FC<ResourcePromptNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const { getEnumsCache, currentScriptId, currentProjectId } = useWorkflowStore();
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [style, setStyle] = useState(data.style || '');
  const [size, setSize] = useState(data.size || '1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // 保存资源弹窗状态
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveType, setSaveType] = useState<PictureResourceType>('character');

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

  // 轮询任务状态
  useEffect(() => {
    const imgStatus = data.imageStatus ?? 'empty';
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
  }, [data.taskId, data.imageStatus]);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<ResourcePromptNodeProps['data']>) => {
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

    if (!prompt.trim()) {
      showWarning('请输入提示词');
      return;
    }

    setIsGenerating(true);

    try {
      // 构建最终的提示词（包含风格）
      let finalPrompt = prompt.trim();
      if (style) {
        finalPrompt = `${style} style, ${finalPrompt}`;
      }

      // 设置加载状态
      updateNodeData({
        imageStatus: 'loading',
        imageUrl: undefined,
        imageErrorMessage: undefined
      });

      // 文生图
      console.log('调用文生图接口...');
      const task = await generateImageFromText(
        {
          prompt: finalPrompt,
          aspectRatio: size as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
          imageSize: '1K',
        },
        (status) => {
          console.log('文生图状态:', status);
        }
      );

      console.log('任务已创建, taskId:', task.id);

      // 保存 taskId 到节点数据，轮询会自动开始
      updateNodeData({ taskId: task.id });
    } catch (error) {
      console.error('图片生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : '图片生成失败';
      updateNodeData({
        imageStatus: 'error',
        imageErrorMessage: errorMessage
      });
      showError(errorMessage);
    } finally {
      // 延迟解除禁用，防止快速重复点击
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    }
  };

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

  // 打开保存对话框
  const handleOpenSaveDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) {
      showWarning('没有可保存的图片');
      return;
    }

    if (!currentProjectId) {
      showWarning('请先保存项目');
      return;
    }

    // 重置保存表单
    setSaveType('character');
    setShowSaveDialog(true);
  };

  // 保存图片资源
  const handleSaveResource = async () => {
    if (!data.imageUrl) {
      showWarning('没有可保存的图片');
      return;
    }

    if (!currentProjectId) {
      showWarning('请先保存项目');
      return;
    }

    // 使用 roleName 或 label 作为资源名称
    const resourceName = data.roleName || data.label || '未命名资源';

    setIsSaving(true);

    try {
      const result = await createPictureResource({
        projectId: currentProjectId,
        scriptId: currentScriptId || undefined,
        name: resourceName,
        type: saveType,
        imageUrl: data.imageUrl,
        prompt: prompt
      });

      if (result.code === 200) {
        showSuccess('资源保存成功');
        setShowSaveDialog(false);
      } else {
        showError(result.msg || '保存失败');
      }
    } catch (error: any) {
      console.error('保存资源失败:', error);
      showError(error.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="resource-prompt-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ff9f43', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>{data.roleName ? `${data.label} - ${data.roleName}` : data.label}</strong>
      </div>

      <div className="node-body">
        {enumsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            加载配置中...
          </div>
        ) : (
          <>
            {/* 提示词 */}
            <div className="resource-prompt-section">
              <label className="resource-prompt-label">提示词：</label>
              <textarea
                className="resource-prompt-textarea nodrag nowheel"
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="描述你想要生成的图片..."
                rows={4}
                disabled={isGenerating}
              />
            </div>

            {/* 风格和尺寸 */}
            <div className="resource-prompt-section inline">
              <div>
                <label className="resource-prompt-label">风格</label>
                <select
                  className="resource-prompt-select nodrag"
                  value={style}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="">无</option>
                  {enums?.styles?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="resource-prompt-label">宽高比</label>
                <select
                  className="resource-prompt-select nodrag"
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
            </div>

            {/* 生成按钮 */}
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt || enumsLoading}
            >
              {isGenerating ? '生成中...' : '生成图片'}
            </button>

            {/* 图片展示区域 */}
            {renderImageSection()}

            {/* 操作按钮 - 有图片时显示 */}
            {data.imageUrl && data.imageStatus === 'success' && (
              <div className="resource-action-buttons">
                <button
                  className="resource-download-btn"
                  onClick={handleDownload}
                  title="下载图片"
                >
                  ⬇️ 下载
                </button>
                <button
                  className="resource-save-btn"
                  onClick={handleOpenSaveDialog}
                  disabled={isSaving || !currentProjectId}
                  title={!currentProjectId ? '请先保存项目' : '保存到资源库'}
                >
                  💾 保存
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#ff9f43', width: 10, height: 10 }}
      />

      {/* 图片预览弹窗 */}
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

      {/* 保存资源对话框 */}
      {showSaveDialog && createPortal(
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="save-dialog-header">
              <h3>保存图片资源</h3>
              <button className="save-dialog-close" onClick={() => setShowSaveDialog(false)}>
                ✕
              </button>
            </div>
            <div className="save-dialog-body">
              <div className="save-form-group">
                <label>资源名称：</label>
                <div className="save-info">{data.roleName || data.label || '未命名资源'}</div>
              </div>
              <div className="save-form-group">
                <label>资源类型：</label>
                <select
                  className="save-select"
                  value={saveType}
                  onChange={(e) => setSaveType(e.target.value as PictureResourceType)}
                  autoFocus
                >
                  <option value="character">角色</option>
                  <option value="scene">场景</option>
                  <option value="prop">道具</option>
                  <option value="skill">技能</option>
                </select>
              </div>
              <div className="save-form-group">
                <label>提示词：</label>
                <div className="save-info">{prompt}</div>
              </div>
            </div>
            <div className="save-dialog-footer">
              <button
                className="save-cancel-btn"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                取消
              </button>
              <button
                className="save-confirm-btn"
                onClick={handleSaveResource}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '确认保存'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

  // 渲染图片区域
  function renderImageSection() {
    const imgStatus = data.imageStatus ?? 'empty';
    const imgErrorMessage = data.imageErrorMessage;

    // 如果是生成加载状态
    if (imgStatus === 'loading') {
      return (
        <div className="resource-image-section loading">
          <div className="spinner"></div>
          <p>图片生成中...</p>
        </div>
      );
    }

    // 如果有图片（成功状态）
    if (data.imageUrl && imgStatus === 'success') {
      return (
        <div className="resource-image-section success">
          <div className="image-display-wrapper" onClick={handleImagePreview} title="点击放大查看">
            <img src={data.imageUrl} alt="生成的图片" className="display-image clickable" />
            <div className="image-overlay">
              <span>🔍 点击放大</span>
            </div>
          </div>
        </div>
      );
    }

    // 如果是错误状态
    if (imgStatus === 'error') {
      return (
        <div className="resource-image-section error">
          <p>❌ 图片生成失败</p>
          {imgErrorMessage && <p className="error-message">{imgErrorMessage}</p>}
        </div>
      );
    }

    // 默认空状态 - 不显示
    return null;
  }
};

export default ResourcePromptNode;
