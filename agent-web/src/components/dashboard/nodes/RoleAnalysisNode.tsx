import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { parseRoleList, parseSceneList, parseSceneImagePrompt, parsePlaybookAsset } from '../../../api/chat';
import { analysisAssetVideo, type AssetItem } from '../../../api/playbook';
import { useWorkflowStore, type ParsedAsset } from '../hooks/useWorkflowStore';
import './RoleAnalysisNode.css';

interface RoleAnalysisNodeProps {
  data: {
    label: string;
    content?: string;
    extractedRoles?: string;
  };
  id: string;
}

const RoleAnalysisNode: React.FC<RoleAnalysisNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const { currentProjectId, currentScriptId, openResourceSelectionModal } = useWorkflowStore();
  const [content, setContent] = useState(data.content || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 两个按钮都显示：解析图片资源、解析视频资源

  // 字符限制
  const MAX_CHARS = 10000;

  // 同步状态到节点数据
  const updateNodeData = (updates: Partial<RoleAnalysisNodeProps['data']>) => {
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

  const handleContentChange = (value: string) => {
    // 限制字符数
    if (value.length <= MAX_CHARS) {
      setContent(value);
      updateNodeData({ content: value });
      setError(null);
    } else {
      setError(`内容超出限制，最多${MAX_CHARS}字`);
    }
  };

  const handleExtractRoles = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('调用角色列表解析接口...', { content: content.substring(0, 50) });

      // 调用角色列表解析接口
      const response = await parseRoleList(content);

      console.log('角色列表解析响应:', response);

      // 检查响应
      if (response.code !== 200 || !response.data || response.data.length === 0) {
        throw new Error(response.msg || '角色解析失败或未找到角色');
      }

      const characterList = response.data;
      console.log('解析成功，角色数量:', characterList.length);

      // 更新节点数据
      updateNodeData({
        extractedRoles: JSON.stringify(characterList, null, 2),
        content: content
      });

      // 获取当前节点信息
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const currentNode = currentNodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 创建角色生成节点
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // 节点间距配置
      const NODE_SPACING = 200; // 垂直间距
      const HORIZONTAL_OFFSET = 450; // 水平偏移

      // 为每个角色创建节点
      characterList.forEach((character, index) => {
        const nodeId = `node-character-gen-${Date.now()}-${index}`;

        // 资源类型统一使用视频资源
        const resourceType = 'video';
        const resourceCategory = 'character';

        // 创建角色生成节点
        const characterNode: Node = {
          id: nodeId,
          type: 'characterGenerationNode',
          position: {
            x: currentNode.position.x + HORIZONTAL_OFFSET,
            y: currentNode.position.y + (index * NODE_SPACING)
          },
          data: {
            label: '角色生成',
            characterName: character.name,
            prompt: character.prompt,
            duration: 10,
            style: '',
            referenceImage: '',
            characterType: 'character', // 人物角色（兼容旧版）
            // 新增：资源类型标识
            resourceType: resourceType,
            resourceCategory: resourceCategory
          }
        };

        newNodes.push(characterNode);

        // 创建连接边
        const edge: Edge = {
          id: `edge-${id}-${nodeId}`,
          source: id,
          target: nodeId,
          animated: true,
          style: { stroke: '#667eea' }
        };

        newEdges.push(edge);
      });

      // 更新节点和边
      setNodes([...currentNodes, ...newNodes]);
      setEdges([...currentEdges, ...newEdges]);

      console.log(`成功创建 ${newNodes.length} 个角色生成节点`);
    } catch (err) {
      console.error('角色解析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '角色解析失败';
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractScenes = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('调用场景列表解析接口...', { content: content.substring(0, 50) });

      // 调用场景列表解析接口
      const response = await parseSceneList(content);

      console.log('场景列表解析响应:', response);

      // 检查响应
      if (response.code !== 200 || !response.data || response.data.length === 0) {
        throw new Error(response.msg || '场景解析失败或未找到场景');
      }

      const sceneList = response.data;
      console.log('解析成功，场景数量:', sceneList.length);

      // 更新节点数据
      updateNodeData({
        extractedRoles: JSON.stringify(sceneList, null, 2),
        content: content
      });

      // 获取当前节点信息
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const currentNode = currentNodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 创建场景生成节点
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // 节点间距配置
      const NODE_SPACING = 200; // 垂直间距
      const HORIZONTAL_OFFSET = 450; // 水平偏移

      // 为每个场景创建节点
      sceneList.forEach((scene, index) => {
        const nodeId = `node-scene-gen-${Date.now()}-${index}`;

        // 资源类型统一使用视频资源
        const resourceType = 'video_scene';
        const resourceCategory = 'scene';

        // 创建场景生成节点
        const sceneNode: Node = {
          id: nodeId,
          type: 'characterGenerationNode',
          position: {
            x: currentNode.position.x + HORIZONTAL_OFFSET,
            y: currentNode.position.y + (index * NODE_SPACING)
          },
          data: {
            label: '场景生成',
            characterName: scene.name,
            prompt: scene.prompt,
            duration: 10,
            style: '',
            referenceImage: '',
            characterType: 'scene', // 场景角色（兼容旧版）
            // 新增：资源类型标识
            resourceType: resourceType,
            resourceCategory: resourceCategory
          }
        };

        newNodes.push(sceneNode);

        // 创建连接边
        const edge: Edge = {
          id: `edge-${id}-${nodeId}`,
          source: id,
          target: nodeId,
          animated: true,
          style: { stroke: '#667eea' }
        };

        newEdges.push(edge);
      });

      // 更新节点和边
      setNodes([...currentNodes, ...newNodes]);
      setEdges([...currentEdges, ...newEdges]);

      console.log(`成功创建 ${newNodes.length} 个场景生成节点`);
    } catch (err) {
      console.error('场景解析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '场景解析失败';
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  // 解析视频资源（角色、场景、道具、技能）
  const handleExtractVideoAssets = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('调用视频资源解析接口...', { content: content.substring(0, 50) });

      // 调用视频资源解析接口
      const result = await analysisAssetVideo(content);

      console.log('视频资源解析响应:', result);

      // 检查响应
      if (result.code !== 200) {
        throw new Error(result.msg || '解析失败');
      }

      // 兼容两种返回格式：{ data: [...] } 或直接 { characters: [], scenes: [] }
      const responseData = result.data as any;
      const data = responseData.data ?? responseData;
      const assets: ParsedAsset[] = [];

      // API返回的是数组格式，每个元素有 type, name, content 字段
      if (Array.isArray(data)) {
        // 按类型分组处理
        const typeCounters: Record<string, number> = {};
        data.forEach((item: { type: string; name: string; content: string }) => {
          const type = item.type as 'character' | 'scene' | 'prop' | 'skill';
          if (!typeCounters[type]) {
            typeCounters[type] = 0;
          }
          assets.push({
            id: `${type}_${typeCounters[type]++}`,
            name: item.name,
            type: type,
            prompt: item.content || '',
          });
        });
      } else {
        // 兼容旧的对象格式
        // 处理角色
        if (data.characters && Array.isArray(data.characters)) {
          data.characters.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `character_${index}`,
              name: item.name,
              type: 'character',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理场景
        if (data.scenes && Array.isArray(data.scenes)) {
          data.scenes.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `scene_${index}`,
              name: item.name,
              type: 'scene',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理道具
        if (data.props && Array.isArray(data.props)) {
          data.props.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `prop_${index}`,
              name: item.name,
              type: 'prop',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理技能
        if (data.skills && Array.isArray(data.skills)) {
          data.skills.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `skill_${index}`,
              name: item.name,
              type: 'skill',
              prompt: item.prompt || item.content || '',
            });
          });
        }
      }

      if (assets.length === 0) {
        throw new Error('未识别到任何资源');
      }

      console.log('解析成功，资源数量:', assets.length);

      // 更新节点数据
      updateNodeData({
        extractedRoles: JSON.stringify(assets, null, 2),
        content: content
      });

      // 通过 store 打开资源选择弹窗（在工作流画布层级）
      openResourceSelectionModal('video', assets, id, handleBatchCreate);

    } catch (err) {
      console.error('视频资源解析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '视频资源解析失败';
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  // 批量创建节点的回调
  const handleBatchCreate = (selectedAssets: ParsedAsset[]) => {
    // 获取当前节点信息
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const currentNode = currentNodes.find(n => n.id === id);

    if (!currentNode) {
      console.error('未找到当前节点');
      return;
    }

    // 创建资源生成节点
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 节点间距配置
    const NODE_SPACING = 200; // 垂直间距
    const HORIZONTAL_OFFSET = 450; // 水平偏移

    // 为每个选中的资源创建节点
    selectedAssets.forEach((asset, index) => {
      const nodeId = `node-asset-gen-${Date.now()}-${index}`;

      // 根据资源类型确定标签和颜色
      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'character': return '角色生成';
          case 'scene': return '场景生成';
          case 'prop': return '道具生成';
          case 'skill': return '技能生成';
          default: return '资源生成';
        }
      };

      const getStrokeColor = (type: string) => {
        switch (type) {
          case 'character': return '#ff9f43';
          case 'scene': return '#10b981';
          case 'prop': return '#667eea';
          case 'skill': return '#f368e0';
          default: return '#667eea';
        }
      };

      // 创建资源生成节点
      const assetNode: Node = {
        id: nodeId,
        type: 'characterGenerationNode',
        position: {
          x: currentNode.position.x + HORIZONTAL_OFFSET,
          y: currentNode.position.y + (index * NODE_SPACING)
        },
        data: {
          label: getTypeLabel(asset.type),
          characterName: asset.name,
          prompt: asset.prompt,
          duration: 10,
          style: '',
          referenceImage: '',
          characterType: asset.type, // 资源类型
          // 新增：资源类型标识
          resourceType: `video_${asset.type}`,
          resourceCategory: asset.type
        }
      };

      newNodes.push(assetNode);

      // 创建连接边
      const edge: Edge = {
        id: `edge-${id}-${nodeId}`,
        source: id,
        target: nodeId,
        animated: true,
        style: { stroke: getStrokeColor(asset.type) }
      };

      newEdges.push(edge);
    });

    // 更新节点和边
    setNodes([...currentNodes, ...newNodes]);
    setEdges([...currentEdges, ...newEdges]);

    console.log(`成功创建 ${newNodes.length} 个资源生成节点`);
  };

  const handleExtractSceneImagePrompt = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('调用场景图片提示词解析接口...', { content: content.substring(0, 50) });

      // 调用场景图片提示词解析接口
      const response = await parseSceneImagePrompt(content);

      console.log('场景图片提示词解析响应:', response);

      // 检查响应
      if (response.code !== 200 || !response.data || response.data.length === 0) {
        throw new Error(response.msg || '场景图片提示词解析失败或未找到场景');
      }

      const sceneList = response.data;
      console.log('解析成功，场景数量:', sceneList.length);

      // 更新节点数据
      updateNodeData({
        extractedRoles: JSON.stringify(sceneList, null, 2),
        content: content
      });

      // 获取当前节点信息
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const currentNode = currentNodes.find(n => n.id === id);

      if (!currentNode) {
        throw new Error('未找到当前节点');
      }

      // 创建资源提示词节点
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      // 节点间距配置
      const NODE_SPACING = 200; // 垂直间距
      const HORIZONTAL_OFFSET = 450; // 水平偏移

      // 为每个场景创建节点
      sceneList.forEach((scene, index) => {
        const nodeId = `node-scene-prompt-${Date.now()}-${index}`;

        // 创建资源提示词节点
        const resourceNode: Node = {
          id: nodeId,
          type: 'resourcePromptNode',
          position: {
            x: currentNode.position.x + HORIZONTAL_OFFSET,
            y: currentNode.position.y + (index * NODE_SPACING)
          },
          data: {
            label: '资源提示词',
            roleName: scene.name,
            prompt: scene.prompt,
            style: '',
            size: '1:1'
          }
        };

        newNodes.push(resourceNode);

        // 创建连接边
        const edge: Edge = {
          id: `edge-${id}-${nodeId}`,
          source: id,
          target: nodeId,
          animated: true,
          style: { stroke: '#10b981' }
        };

        newEdges.push(edge);
      });

      // 更新节点和边
      setNodes([...currentNodes, ...newNodes]);
      setEdges([...currentEdges, ...newEdges]);

      console.log(`成功创建 ${newNodes.length} 个场景资源提示词节点`);
    } catch (err) {
      console.error('场景图片提示词解析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '场景图片提示词解析失败';
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractAsset = async () => {
    if (!content.trim()) {
      setError('请先输入内容');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      console.log('调用剧本资源解析接口...', { content: content.substring(0, 50) });

      // 调用剧本资源解析接口
      const response = await parsePlaybookAsset(content);

      console.log('剧本资源解析响应:', response);

      // 检查响应
      if (response.code !== 200 || !response.data || response.data.length === 0) {
        throw new Error(response.msg || '剧本资源解析失败或未找到资源');
      }

      const assetList = response.data;
      console.log('解析成功，资源数量:', assetList.length);

      // 更新节点数据
      updateNodeData({
        extractedRoles: JSON.stringify(assetList, null, 2),
        content: content
      });

      // 转换为 ParsedAsset 格式
      const assets: ParsedAsset[] = assetList.map((asset, index) => ({
        id: `${asset.type}_${index}`,
        name: asset.name,
        type: asset.type as 'character' | 'scene' | 'prop' | 'skill',
        prompt: asset.content || '',
      }));

      // 通过 store 打开图片资源选择弹窗（在工作流画布层级）
      openResourceSelectionModal('picture', assets, id, handlePictureBatchCreate);

    } catch (err) {
      console.error('剧本资源解析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '剧本资源解析失败';
      setError(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  // 图片资源批量创建节点的回调
  const handlePictureBatchCreate = (selectedAssets: ParsedAsset[]) => {
    // 获取当前节点信息
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const currentNode = currentNodes.find(n => n.id === id);

    if (!currentNode) {
      console.error('未找到当前节点');
      return;
    }

    // 创建资源提示词节点
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 节点间距配置
    const NODE_SPACING = 280; // 垂直间距
    const HORIZONTAL_OFFSET = 450; // 水平偏移
    const TYPE_GROUP_GAP = 80; // 不同类型组之间的额外间距

    // 先按类型分组
    const typeGroups = new Map<string, ParsedAsset[]>();
    selectedAssets.forEach((asset) => {
      if (!typeGroups.has(asset.type)) {
        typeGroups.set(asset.type, []);
      }
      typeGroups.get(asset.type)!.push(asset);
    });

    // 计算每个类型组的起始 Y 位置
    const typeStartY = new Map<string, number>();
    let currentY = 0;
    typeGroups.forEach((assets, type) => {
      typeStartY.set(type, currentY);
      currentY += assets.length * NODE_SPACING + TYPE_GROUP_GAP;
    });

    // 用于跟踪每个类型当前的索引
    const typeIndexMap = new Map<string, number>();

    // 根据类型选择颜色
    const getStrokeColor = (type: string) => {
      switch (type) {
        case 'character': return '#ff9f43';
        case 'scene': return '#10b981';
        case 'prop': return '#667eea';
        case 'skill': return '#f368e0';
        default: return '#667eea';
      }
    };

    // 根据类型获取标签前缀
    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'character': return '角色';
        case 'scene': return '场景';
        case 'prop': return '道具';
        case 'skill': return '技能';
        default: return '资源';
      }
    };

    // 为每个选中的资源创建节点
    selectedAssets.forEach((asset, index) => {
      const nodeId = `node-asset-prompt-${Date.now()}-${index}`;

      // 计算该类型的索引
      if (!typeIndexMap.has(asset.type)) {
        typeIndexMap.set(asset.type, 0);
      }
      const typeIndex = typeIndexMap.get(asset.type)!;
      typeIndexMap.set(asset.type, typeIndex + 1);

      // 获取该类型组的起始 Y 位置
      const groupStartY = typeStartY.get(asset.type) || 0;

      // 创建资源提示词节点
      const resourceNode: Node = {
        id: nodeId,
        type: 'resourcePromptNode',
        position: {
          x: currentNode.position.x + HORIZONTAL_OFFSET,
          y: currentNode.position.y + groupStartY + (typeIndex * NODE_SPACING)
        },
        data: {
          label: `${getTypeLabel(asset.type)}提示词`,
          roleName: asset.name,
          prompt: asset.prompt,
          style: '',
          size: '1:1',
          assetType: asset.type
        }
      };

      newNodes.push(resourceNode);

      // 创建连接边
      const edge: Edge = {
        id: `edge-${id}-${nodeId}`,
        source: id,
        target: nodeId,
        animated: true,
        style: { stroke: getStrokeColor(asset.type) }
      };

      newEdges.push(edge);
    });

    // 更新节点和边
    setNodes([...currentNodes, ...newNodes]);
    setEdges([...currentEdges, ...newEdges]);

    console.log(`成功创建 ${newNodes.length} 个资源提示词节点`);
  };

  return (
    <div className="role-analysis-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>📖 小说输入</strong>
      </div>

      <div className="node-body">
        {/* 富文本输入框 */}
        <div className="role-analysis-section">
          <textarea
            className="role-analysis-textarea nodrag nowheel"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="请输入小说内容，可提取其中的角色或场景信息..."
            rows={8}
            disabled={isExtracting}
          />
          <div className="char-count">
            {content.length} / {MAX_CHARS} 字
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* 提取按钮 */}
        <div className="extract-buttons">
          <button
            className="extract-btn asset-prompt-btn"
            onClick={handleExtractAsset}
            disabled={isExtracting || !content.trim()}
          >
            {isExtracting ? '解析中...' : '解析图片资源'}
          </button>
          <button
            className="extract-btn"
            onClick={handleExtractVideoAssets}
            disabled={isExtracting || !content.trim()}
          >
            {isExtracting ? '解析中...' : '解析视频资源'}
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

export default RoleAnalysisNode;
