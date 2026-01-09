/**
 * 工作流核心 Hook
 * 提供工作流的核心操作逻辑：节点管理、边管理、右键菜单等
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import type { WorkflowConfig, ContextMenuState } from './types';
import { workflowRegistry } from './workflowRegistry';
import { useHistory } from '../../hooks/useHistory';
import { useWorkflowContext } from './WorkflowContext';

interface UseWorkflowCoreOptions {
  workflowId: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

interface UseWorkflowCoreReturn {
  // 状态
  nodes: Node[];
  edges: Edge[];
  contextMenu: ContextMenuState | null;

  // 节点操作
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // 节点 CRUD
  addNode: (type: string, label: string, position?: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  updateNodeData: (nodeId: string, updates: Record<string, any>) => void;

  // 右键菜单
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void;
  onPaneContextMenu: (event: React.MouseEvent) => void;
  onPaneClick: () => void;
  onNodeClick: () => void;

  // 历史记录
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveToHistory: () => void;

  // 工作流配置
  config: WorkflowConfig | undefined;
  nodeTypes: Record<string, React.ComponentType<any>>;
}

export function useWorkflowCore({
  workflowId,
  initialNodes = [],
  initialEdges = [],
}: UseWorkflowCoreOptions): UseWorkflowCoreReturn {
  // 获取工作流配置
  const config = workflowRegistry.get(workflowId);
  const nodeTypes = workflowRegistry.getNodeTypes(workflowId);

  // ReactFlow 实例
  const reactFlowInstance = useReactFlow();

  // 状态
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // 获取工作流上下文（包含项目风格）
  const workflowContext = useWorkflowContext();

  // 历史记录
  const {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({ maxHistory: 50, debounceMs: 300 });

  // 保存当前状态到历史记录
  const saveToHistory = useCallback(() => {
    pushHistory({ nodes, edges });
  }, [pushHistory, nodes, edges]);

  // 执行撤销
  const handleUndo = useCallback(() => {
    const previousState = undo({ nodes, edges });
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
    }
  }, [undo, nodes, edges]);

  // 执行重做
  const handleRedo = useCallback(() => {
    const nextState = redo({ nodes, edges });
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  }, [redo, nodes, edges]);

  // 节点变化处理
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // 只对有实际意义的变化保存历史（排除选中状态变化）
      const hasSignificantChange = changes.some(
        (change) => change.type === 'remove' || change.type === 'position'
      );
      if (hasSignificantChange) {
        saveToHistory();
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [saveToHistory]
  );

  // 边变化处理
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // 只对删除操作保存历史
      const hasRemove = changes.some((change) => change.type === 'remove');
      if (hasRemove) {
        saveToHistory();
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [saveToHistory]
  );

  // 连接处理
  const onConnect = useCallback(
    (connection: Connection) => {
      saveToHistory();
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [saveToHistory]
  );

  // 添加节点
  const addNode = useCallback(
    (type: string, label: string, position?: { x: number; y: number }) => {
      let posX = position?.x ?? 0;
      let posY = position?.y ?? 0;

      // 如果没有指定位置，使用右键菜单位置或视图中心
      if (!position) {
        if (contextMenu?.type === 'canvas') {
          const canvasPosition = reactFlowInstance.project({
            x: contextMenu.x,
            y: contextMenu.y,
          });
          posX = canvasPosition.x;
          posY = canvasPosition.y;
        } else {
          // 使用视图中心位置
          const { innerWidth, innerHeight } = window;
          const centerX = innerWidth / 2;
          const centerY = innerHeight / 2;
          const centerPosition = reactFlowInstance.project({ x: centerX, y: centerY });
          posX = centerPosition.x;
          posY = centerPosition.y;
        }
      }

      // 获取节点默认数据
      const defaultData = workflowRegistry.getNodeDefaultData(workflowId, type);

      // 如果项目有设置风格，并且节点有style字段，则自动应用项目风格
      const nodeData: Record<string, any> = { ...defaultData, label };
      if (workflowContext?.projectStyle && 'style' in nodeData) {
        nodeData.style = workflowContext.projectStyle;
      }

      const newNode: Node = {
        id: `node-${Math.random().toString(36).substr(2, 9)}`,
        type,
        position: { x: posX, y: posY },
        data: nodeData,
      };

      saveToHistory();
      setNodes((nds) => [...nds, newNode]);
      setContextMenu(null);
    },
    [contextMenu, reactFlowInstance, workflowId, saveToHistory, workflowContext]
  );

  // 删除节点
  const deleteNode = useCallback(
    (nodeId: string) => {
      saveToHistory();
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setContextMenu(null);
    },
    [saveToHistory]
  );

  // 删除边
  const deleteEdge = useCallback(
    (edgeId: string) => {
      saveToHistory();
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      setContextMenu(null);
    },
    [saveToHistory]
  );

  // 更新节点数据
  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      );
    },
    []
  );

  // 右键菜单处理
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      type: 'node',
    });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
      type: 'edge',
    });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'canvas',
    });
  }, []);

  const onPaneClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  const onNodeClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑输入框，不处理快捷键
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return {
    // 状态
    nodes,
    edges,
    contextMenu,

    // 节点操作
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // 节点 CRUD
    addNode,
    deleteNode,
    deleteEdge,
    updateNodeData,

    // 右键菜单
    setContextMenu,
    onNodeContextMenu,
    onEdgeContextMenu,
    onPaneContextMenu,
    onPaneClick,
    onNodeClick,

    // 历史记录
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    saveToHistory,

    // 工作流配置
    config,
    nodeTypes,
  };
}
