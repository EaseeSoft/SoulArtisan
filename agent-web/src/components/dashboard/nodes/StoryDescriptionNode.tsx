import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { getCameraList } from '../../../api/playbook';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { showWarning, showSuccess } from '../../../utils/request';
import './StoryDescriptionNode.css';

interface StoryDescriptionNodeProps {
  data: {
    label: string;
    storyContent?: string;
  };
  id: string;
}

const StoryDescriptionNode: React.FC<StoryDescriptionNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, setEdges, getEdges } = useReactFlow();
  const currentProjectId = useWorkflowStore((state) => state.currentProjectId);
  const currentProjectStyle = useWorkflowStore((state) => state.currentProjectStyle);

  const [storyContent, setStoryContent] = useState(data.storyContent || '');
  const [isGenerating, setIsGenerating] = useState(false);

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<StoryDescriptionNodeProps['data']>) => {
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

  const handleStoryContentChange = (value: string) => {
    // 限制2000字
    if (value.length <= 2000) {
      setStoryContent(value);
      updateNodeData({ storyContent: value });
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!storyContent.trim()) {
      showWarning('请输入剧情描述');
      return;
    }

    if (!currentProjectId) {
      showWarning('请先选择或创建项目');
      return;
    }

    setIsGenerating(true);

    try {
      // 调用获取分镜列表 API，使用项目风格
      const response = await getCameraList({
        content: storyContent,
        characterProjectId: currentProjectId,
        style: currentProjectStyle || undefined,
      });

      if (response.code !== 200) {
        showWarning(response.msg || '获取分镜列表失败');
        return;
      }

      // 获取当前节点的位置
      const currentNodes = getNodes();
      const currentNode = currentNodes.find(n => n.id === id);
      const startX = currentNode ? currentNode.position.x + 600 : 600;
      const startY = currentNode ? currentNode.position.y : 100;

      // 创建分镜列表节点
      const listNodeId = `storyboard-list-${Date.now()}`;
      const newNode = {
        id: listNodeId,
        type: 'storyboardListNode',
        position: {
          x: startX,
          y: startY,
        },
        data: {
          label: '分镜列表',
          cameraList: response.data,
        },
      };

      // 添加节点到画布
      setNodes([...currentNodes, newNode]);

      // 创建连接：当前节点 -> 分镜列表节点
      const currentEdges = getEdges();
      const newEdge = {
        id: `edge-${id}-${listNodeId}`,
        source: id,
        target: listNodeId,
        animated: true,
      };

      setEdges([...currentEdges, newEdge]);

      showSuccess('成功生成分镜列表');
    } catch (error) {
      console.error('获取分镜列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取分镜列表失败';
      showWarning(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="story-desc-node">
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
        {/* 剧情描述 */}
        <div className="story-section">
          <label className="story-label">
            剧情描述 ({storyContent.length}/2000)
          </label>
          <textarea
            className="story-textarea nodrag nowheel"
            value={storyContent}
            onChange={(e) => handleStoryContentChange(e.target.value)}
            placeholder="输入剧情描述，最多2000字..."
            rows={6}
            disabled={isGenerating}
          />
        </div>

        {/* 生成按钮 */}
        <div className="story-actions">
          <button
            className="action-btn primary"
            onClick={handleGenerateStoryboard}
            disabled={isGenerating || !storyContent.trim()}
          >
            📋 生成分镜列表
          </button>
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

export default StoryDescriptionNode;
