import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { getTaskStatus, type VideoTask } from '../../../api/videoGeneration';
import './VideoDisplayNode.css';

interface VideoDisplayNodeData {
  label: string;
  taskId?: number;
  videoUrl?: string;
  status?: 'loading' | 'success' | 'error';
  errorMessage?: string;
  progress?: number;
}

const VideoDisplayNode = ({ data, id }: NodeProps<VideoDisplayNodeData>) => {
  const { setNodes } = useReactFlow();
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // 下载视频
  const handleDownload = () => {
    if (!data.videoUrl) return;
    window.open(data.videoUrl, '_blank');
  };

  // 更新节点数据
  const updateNodeData = (updates: Partial<VideoDisplayNodeData>) => {
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
    if (!data.taskId || data.status === 'success' || data.status === 'error') {
      return;
    }

    const pollTask = async () => {
      try {
        const result = await getTaskStatus(data.taskId!);

        if (result.code !== 200) {
          updateNodeData({
            status: 'error',
            errorMessage: result.msg || '查询任务失败',
          });
          return;
        }

        const task: VideoTask = result.data;

        // 更新进度
        updateNodeData({
          progress: task.progress,
        });

        // 任务完成
        if (task.status === 'succeeded' && task.resultUrl) {
          updateNodeData({
            status: 'success',
            videoUrl: task.resultUrl,
            progress: 100,
          });
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }

        // 任务失败
        if (task.status === 'error') {
          updateNodeData({
            status: 'error',
            errorMessage: task.errorMessage || '生成失败',
          });
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      } catch (error: any) {
        console.error('轮询任务失败:', error);
        updateNodeData({
          status: 'error',
          errorMessage: error.message || '查询任务失败',
        });
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    };

    // 立即执行一次
    pollTask();

    // 设置轮询（每5秒一次）
    const interval = setInterval(pollTask, 5000);
    setPollingInterval(interval);

    // 清理
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [data.taskId, data.status]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);
  return (
    <div className="video-display-node">
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
        {data.status === 'loading' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>视频生成中...</p>
            {data.progress !== undefined && data.progress > 0 && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${data.progress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
        
        {data.status === 'success' && data.videoUrl && (
          <div className="video-display-wrapper">
            <video
              src={data.videoUrl}
              controls
              className="display-video"
              preload="metadata"
            >
              您的浏览器不支持视频播放
            </video>
            <button
              className="download-btn"
              onClick={handleDownload}
              title="下载视频"
            >
              ⬇️
            </button>
          </div>
        )}
        
        {data.status === 'error' && (
          <div className="error-state">
            <p>❌ 生成失败</p>
            {data.errorMessage && <p className="error-message">{data.errorMessage}</p>}
          </div>
        )}
        
        {!data.status && (
          <div className="empty-state">
            <p>等待视频...</p>
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

export default memo(VideoDisplayNode);
