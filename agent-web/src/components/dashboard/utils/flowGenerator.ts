import { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

/**
 * 节点配置模板
 */
export interface NodeConfig {
  type: string;
  offsetX: number;
  getData: (item: any) => any;
}

/**
 * 生成并行流程链
 *
 * 根据数据数组，为每个数据项生成一条完整的处理流程链
 *
 * @param sourceNode - 源节点（触发生成的节点）
 * @param items - 数据数组（如角色列表）
 * @param nodeConfigs - 流程链的节点配置
 * @param options - 可选配置
 * @returns 生成的节点和边
 *
 * @example
 * ```ts
 * const { nodes, edges } = generateParallelFlows(
 *   sourceNode,
 *   characters, // [{name: '方医', ...}, {name: '陆子遥', ...}]
 *   [
 *     {
 *       type: 'characterInfoNode',
 *       offsetX: 0,
 *       getData: (character) => ({ label: character.name, characterData: character }),
 *     },
 *     {
 *       type: 'imageGenerationNode',
 *       offsetX: 280,
 *       getData: (character) => ({ label: `生成${character.name}`, prompt: character.description }),
 *     },
 *   ]
 * );
 * ```
 */
export function generateParallelFlows(
  sourceNode: Node,
  items: any[],
  nodeConfigs: NodeConfig[],
  options?: {
    startX?: number;
    startY?: number;
    chainGap?: number; // 每条链之间的垂直间距
  }
): { nodes: Node[]; edges: Edge[] } {
  const {
    startX = sourceNode.position.x + 400,
    startY = sourceNode.position.y + 100,
    chainGap = 180,
  } = options || {};

  const newNodes: Node[] = [];
  const newEdges: Edge[] = [];

  items.forEach((item, chainIndex) => {
    const chainY = startY + chainIndex * chainGap;
    let prevNodeId = sourceNode.id;

    nodeConfigs.forEach((config, nodeIndex) => {
      const nodeId = `${config.type}_${chainIndex}_${uuidv4()}`;

      // 创建节点
      newNodes.push({
        id: nodeId,
        type: config.type,
        position: {
          x: startX + config.offsetX,
          y: chainY,
        },
        data: config.getData(item),
      });

      // 创建连接
      newEdges.push({
        id: `edge_${prevNodeId}_${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        animated: true,
      });

      prevNodeId = nodeId;
    });
  });

  return { nodes: newNodes, edges: newEdges };
}

/**
 * 流程模板：角色生成流程
 */
export const CHARACTER_GENERATION_TEMPLATE: NodeConfig[] = [
  {
    type: 'characterInfoNode',
    offsetX: 0,
    getData: (character) => ({
      label: character.name,
      characterData: character,
    }),
  },
  {
    type: 'imageGenerationNode',
    offsetX: 280,
    getData: (character) => ({
      label: `生成${character.name}`,
      prompt: character.description || `生成角色：${character.name}`,
    }),
  },
  {
    type: 'imageDisplayNode',
    offsetX: 560,
    getData: (character) => ({
      label: `${character.name}图片`,
    }),
  },
];

/**
 * 流程模板：分镜生成流程
 */
export const STORYBOARD_GENERATION_TEMPLATE: NodeConfig[] = [
  {
    type: 'storyboardInfoNode',
    offsetX: 0,
    getData: (storyboard) => ({
      label: `分镜${storyboard.index}`,
      storyboardData: storyboard,
    }),
  },
  {
    type: 'imageGenerationNode',
    offsetX: 280,
    getData: (storyboard) => ({
      label: `生成分镜${storyboard.index}`,
      prompt: storyboard.description,
    }),
  },
  {
    type: 'videoGenerationNode',
    offsetX: 560,
    getData: (storyboard) => ({
      label: `生成视频${storyboard.index}`,
    }),
  },
];
