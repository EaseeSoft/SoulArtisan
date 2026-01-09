import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface OutputNodeData {
  label: string;
  status: 'idle' | 'processing' | 'completed';
}

const OutputNode = ({ data }: NodeProps<OutputNodeData>) => {
  const getStatusText = () => {
    switch (data.status) {
      case 'processing':
        return '⏳ 生成中...';
      case 'completed':
        return '✅ 已完成';
      default:
        return '⏸️ 待生成';
    }
  };

  const getStatusClass = () => {
    switch (data.status) {
      case 'processing':
        return 'status-processing';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-idle';
    }
  };

  const getIcon = () => {
    if (data.label.includes('引擎')) return '🤖';
    if (data.label.includes('输出')) return '🎬';
    return '📦';
  };

  return (
    <div className="react-flow__node-custom">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />
      <div className="node-header">
        <strong>{getIcon()} {data.label}</strong>
      </div>
      <div className="node-body">
        <div className={`status-indicator ${getStatusClass()}`}>
          {getStatusText()}
        </div>
        {data.status === 'completed' && (
          <button className="generate-button">💾 下载视频</button>
        )}
        {data.status === 'idle' && (
          <button className="generate-button">▶️ 开始处理</button>
        )}
        {data.status === 'processing' && (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div className="spinner" style={{
              width: '30px',
              height: '30px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
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

export default memo(OutputNode);