import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import { getTaskList, deleteTask, getTaskStatus, type VideoTask } from '@/api/videoGeneration';
import { showSuccess, showWarning } from '@/utils/request';
import './VideoListModal.css';

interface VideoListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoListModal: React.FC<VideoListModalProps> = ({ isOpen, onClose }) => {
  const { currentProjectId, currentScriptName, currentScriptId } = useWorkflowStore();

  const [videos, setVideos] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // 用于轮询的引用
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载视频列表
  const loadVideos = useCallback(async () => {
    if (!currentProjectId) return;

    setLoading(true);
    try {
      const response = await getTaskList({
        projectId: currentProjectId,
        page: 1,
        page_size: 100
      });

      if (response.code === 200) {
        setVideos(response.data.list || []);
      }
    } catch (error) {
      console.error('加载视频列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  // 刷新进行中的任务状态
  const refreshPendingTasks = useCallback(async () => {
    const pendingVideos = videos.filter(v => v.status === 'pending' || v.status === 'running');
    if (pendingVideos.length === 0) return;

    try {
      const updates = await Promise.all(
        pendingVideos.map(async (video) => {
          const response = await getTaskStatus(video.id);
          if (response.code === 200) {
            return response.data;
          }
          return video;
        })
      );

      setVideos(prevVideos =>
        prevVideos.map(video => {
          const updated = updates.find(u => u.id === video.id);
          return updated || video;
        })
      );
    } catch (error) {
      console.error('刷新任务状态失败:', error);
    }
  }, [videos]);

  // 打开时加载视频
  useEffect(() => {
    if (isOpen && currentProjectId) {
      loadVideos();
    }
  }, [isOpen, currentProjectId, loadVideos]);

  // 轮询进行中的任务
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const hasPendingTasks = videos.some(v => v.status === 'pending' || v.status === 'running');
    if (hasPendingTasks) {
      pollingRef.current = setInterval(refreshPendingTasks, 5000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, videos, refreshPendingTasks]);

  // 删除视频
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await deleteTask(deleteTarget.id);
      if (response.code === 200) {
        setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
        showSuccess('删除成功');
        setDeleteTarget(null);
      }
    } catch (error) {
      console.error('删除失败:', error);
      showWarning('删除失败');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  // 下载视频
  const handleDownload = useCallback((video: VideoTask) => {
    if (!video.resultUrl) return;
    const link = document.createElement('a');
    link.href = video.resultUrl;
    link.download = `video_${video.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // 渲染视频卡片
  const renderVideoCard = (video: VideoTask) => {
    const statusText = {
      pending: '排队中',
      running: '生成中',
      succeeded: '已完成',
      error: '失败'
    }[video.status];

    return (
      <div key={video.id} className="video-card">
        <div className="video-thumbnail">
          {video.resultUrl ? (
            <video
              src={video.resultUrl}
              muted
              loop
              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
              onMouseLeave={(e) => {
                const vid = e.target as HTMLVideoElement;
                vid.pause();
                vid.currentTime = 0;
              }}
              onClick={() => setPreviewVideo(video.resultUrl)}
              className="clickable"
            />
          ) : (
            <div className="video-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {video.status === 'running' && (
                <div className="video-progress-bar">
                  <div className="video-progress-fill" style={{ width: `${video.progress}%` }} />
                </div>
              )}
            </div>
          )}
          <span className={`video-status ${video.status}`}>
            {statusText}
            {video.status === 'running' && ` ${video.progress}%`}
          </span>
        </div>

        <div className="video-info">
          <div className="video-prompt" title={video.prompt}>
            {video.prompt.length > 40 ? video.prompt.slice(0, 40) + '...' : video.prompt}
          </div>
          <div className="video-meta">
            <span>{video.duration}s</span>
            <span>{video.aspectRatio}</span>
          </div>

          <div className="video-actions">
            {video.resultUrl && (
              <>
                <button
                  className="btn-play"
                  onClick={() => setPreviewVideo(video.resultUrl)}
                  title="预览"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <button
                  className="btn-download"
                  onClick={() => handleDownload(video)}
                  title="下载"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </>
            )}
            <button
              className="btn-delete"
              onClick={() => setDeleteTarget(video)}
              title="删除"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            项目视频
          </h2>
          {currentScriptId && currentScriptName && (
            <span className="video-source-badge">
              剧本: {currentScriptName}
            </span>
          )}
          <button className="video-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="video-modal-body">
          {loading ? (
            <div className="video-loading">
              <div className="video-loading-spinner" />
              <p>加载中...</p>
            </div>
          ) : !currentProjectId ? (
            <div className="video-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p>请先保存项目</p>
              <span>项目保存后可以查看生成的视频</span>
            </div>
          ) : videos.length === 0 ? (
            <div className="video-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p>暂无视频</p>
              <span>使用文生视频节点生成视频后会显示在这里</span>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map(renderVideoCard)}
            </div>
          )}
        </div>

        <div className="video-modal-footer">
          <span className="video-count">共 {videos.length} 个视频</span>
          <button className="btn-refresh" onClick={loadVideos} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* 视频预览 */}
      {previewVideo && (
        <div className="video-preview-overlay" onClick={() => setPreviewVideo(null)}>
          <div className="video-preview-content" onClick={(e) => e.stopPropagation()}>
            <video src={previewVideo} controls autoPlay />
            <button className="video-preview-close" onClick={() => setPreviewVideo(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹框 */}
      {deleteTarget && (
        <div className="video-delete-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="video-delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="video-delete-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3>确认删除</h3>
            <p>
              确定要删除这个视频吗？
              <br />
              <span>此操作不可撤销</span>
            </p>
            <div className="video-delete-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                取消
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoListModal;
