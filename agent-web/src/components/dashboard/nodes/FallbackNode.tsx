import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface FallbackNodeData {
  label?: string;
  originalType?: string;
  [key: string]: any;
}

/**
 * 回退节点组件
 * 用于处理当前工作流中未注册的节点类型
 */
const FallbackNode = ({ data, type }: NodeProps<FallbackNodeData>) => {
  const nodeType = data?.originalType || type || '未知';

  return (
    <div
      className="react-flow__node-custom"
      style={{
        background: '#fff3cd',
        border: '2px dashed #ffc107',
        borderRadius: '8px',
        minWidth: '180px',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#ffc107', width: 10, height: 10 }}
      />
      <div
        className="node-header"
        style={{
          background: '#ffc107',
          color: '#856404',
          padding: '8px 12px',
          borderRadius: '6px 6px 0 0',
        }}
      >
        <strong>⚠️ 不兼容节点</strong>
      </div>
      <div
        className="node-body"
        style={{
          padding: '12px',
          fontSize: '12px',
          color: '#856404',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          <strong>节点类型:</strong> {nodeType}
        </div>
        <div style={{ fontSize: '11px', color: '#997a00' }}>
          此节点不属于当前工作流，请在对应的工作流中编辑。
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#ffc107', width: 10, height: 10 }}
      />
    </div>
  );
};

export default memo(FallbackNode);
