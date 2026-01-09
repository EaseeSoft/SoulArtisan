import { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useWorkflowStore } from './useWorkflowStore';

/**
 * 自动订阅节点输入数据变化的Hook
 *
 * @param nodeId - 当前节点ID
 * @param portId - 输入端口ID
 * @returns 输入数据（自动更新）
 *
 * @example
 * ```tsx
 * const ImageDisplayNode = ({ id }) => {
 *   // 自动订阅上游节点的图片数据
 *   const imageUrl = useNodeInput(id, 'image');
 *
 *   return <img src={imageUrl} />;
 * };
 * ```
 */
export function useNodeInput(nodeId: string, portId: string) {
  const { getEdges } = useReactFlow();
  const getInputData = useWorkflowStore((state) => state.getInputData);
  const nodeOutputs = useWorkflowStore((state) => state.nodeOutputs);

  const [inputData, setInputData] = useState<any>(null);

  useEffect(() => {
    const data = getInputData(nodeId, portId, getEdges());
    setInputData(data);
  }, [nodeOutputs, nodeId, portId, getInputData, getEdges]);

  return inputData;
}
