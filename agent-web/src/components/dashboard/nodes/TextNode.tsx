import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface TextNodeData {
  label: string;
  value: string;
}

const TextNode = ({ data }: NodeProps<TextNodeData>) => {
  const [text, setText] = useState(data.value);

  return (
    <div className="react-flow__node-custom">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />
      <div className="node-header">
        <strong>📝 {data.label}</strong>
      </div>
      <div className="node-body">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文本描述..."
          className="node-textarea nodrag nowheel"
        />
        <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
          {text.length} 字符
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

export default memo(TextNode);