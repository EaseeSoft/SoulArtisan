import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface ParameterNodeData {
  label: string;
  duration: number;
  aspectRatio: string;
}

const ParameterNode = ({ data }: NodeProps<ParameterNodeData>) => {
  const [duration, setDuration] = useState(data.duration);
  const [aspectRatio, setAspectRatio] = useState(data.aspectRatio);

  return (
    <div className="react-flow__node-custom">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />
      <div className="node-header">
        <strong>⚙️ {data.label}</strong>
      </div>
      <div className="node-body">
        <div className="param-row">
          <label>时长:</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
            className="param-select"
          >
            <option value={3}>3秒</option>
            <option value={5}>5秒</option>
            <option value={10}>10秒</option>
            <option value={15}>15秒</option>
            <option value={20}>20秒</option>
            <option value={30}>30秒</option>
          </select>
        </div>
        <div className="param-row">
          <label>比例:</label>
          <select 
            value={aspectRatio} 
            onChange={(e) => setAspectRatio(e.target.value)}
            className="param-select"
          >
            <option value="16:9">16:9 (横向)</option>
            <option value="9:16">9:16 (纵向)</option>
            <option value="1:1">1:1 (正方形)</option>
            <option value="4:3">4:3 (标准)</option>
            <option value="21:9">21:9 (电影)</option>
          </select>
        </div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
          {duration}秒 · {aspectRatio}
        </div>
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

export default memo(ParameterNode);