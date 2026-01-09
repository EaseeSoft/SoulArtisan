import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import './SceneDescriptionNode.css';

interface SceneDescriptionNodeProps {
  data: {
    label: string;
    description?: string;
  };
  id: string;
}

const SceneDescriptionNode: React.FC<SceneDescriptionNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes } = useReactFlow();
  const [description, setDescription] = useState(data.description || '');

  // 快速标签列表
  const quickTags = [
    '室内', '乡村', '街道', '室外', '森林', '公园',
    '白天', '海边', '家中', '夜晚', '山区', '晴天',
    '雨天', '城市', '咖啡厅', '办公室'
  ];

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<SceneDescriptionNodeProps['data']>) => {
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

  const handleDescriptionChange = (value: string) => {
    // 限制500字
    if (value.length <= 500) {
      setDescription(value);
      updateNodeData({ description: value });
    }
  };

  // 点击标签，添加到文本框中
  const handleTagClick = (tag: string) => {
    let newDescription = description;

    // 如果文本框为空，直接添加标签
    if (!newDescription.trim()) {
      newDescription = tag;
    } else {
      // 如果文本框不为空，在前面加逗号
      newDescription = `${newDescription},${tag}`;
    }

    // 检查长度限制
    if (newDescription.length <= 500) {
      setDescription(newDescription);
      updateNodeData({ description: newDescription });
    }
  };

  return (
    <div className="scene-description-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>🎬 {data.label}</strong>
      </div>

      <div className="node-body">
        {/* 场景描述文本框 */}
        <div className="scene-section">
          <label className="scene-label">
            场景描述
            <span className="char-count">
              {description.length}/500
            </span>
          </label>
          <textarea
            className="scene-textarea nodrag nowheel"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="描述场景的各种元素..."
            rows={4}
          />
        </div>

        {/* 快速标签组 */}
        <div className="scene-section">
          <label className="scene-label">快速标签</label>
          <div className="quick-tags">
            {quickTags.map((tag) => (
              <button
                key={tag}
                className="tag-button"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
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

export default SceneDescriptionNode;
