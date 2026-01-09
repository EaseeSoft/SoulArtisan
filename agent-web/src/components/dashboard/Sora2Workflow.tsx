import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import TextNode from './nodes/TextNode';
import ParameterNode from './nodes/ParameterNode';
import OutputNode from './nodes/OutputNode';
import ImageGenerationNode from './nodes/ImageGenerationNode';
import ImageDisplayNode from './nodes/ImageDisplayNode';
import VideoGenerationNode from './nodes/VideoGenerationNode';
import VideoDisplayNode from './nodes/VideoDisplayNode';
import RoleAnalysisNode from './nodes/RoleAnalysisNode';
import CharacterGenerationNode from './nodes/CharacterGenerationNode';
import CharacterVideoNode from './nodes/CharacterVideoNode';
import CharacterDisplayNode from './nodes/CharacterDisplayNode';
import StoryDescriptionNode from './nodes/StoryDescriptionNode';
import SceneDescriptionNode from './nodes/SceneDescriptionNode';
import StoryboardNode from './nodes/StoryboardNode';
import StoryboardListNode from './nodes/StoryboardListNode';
import StoryboardImageNode from './nodes/StoryboardImageNode';
import StoryboardDisplayNode from './nodes/StoryboardDisplayNode';
import ResourcePromptNode from './nodes/ResourcePromptNode';
import ScriptSelector from './ScriptSelector';
import UnifiedResourceModal from './UnifiedResourceModal';
import ResourceSelectionModal from './ResourceSelectionModal';
import PictureResourceSelectionModal from './PictureResourceSelectionModal';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import { useHistory } from './hooks/useHistory';
import { updateProject } from '@/api/workflowProject';
import { showSuccess, showWarning } from '@/utils/request';
import './Sora2Workflow.css';

const nodeTypes = {
  textNode: TextNode,
  parameterNode: ParameterNode,
  outputNode: OutputNode,
  imageGenerationNode: ImageGenerationNode,
  imageDisplayNode: ImageDisplayNode,
  videoGenerationNode: VideoGenerationNode,
  videoDisplayNode: VideoDisplayNode,
  roleAnalysisNode: RoleAnalysisNode,
  characterGenerationNode: CharacterGenerationNode,
  characterVideoNode: CharacterVideoNode,
  characterDisplayNode: CharacterDisplayNode,
  storyDescriptionNode: StoryDescriptionNode,
  sceneDescriptionNode: SceneDescriptionNode,
  storyboardSceneNode: StoryboardNode,
  storyboardListNode: StoryboardListNode,
  storyboardImageNode: StoryboardImageNode,
  storyboardDisplayNode: StoryboardDisplayNode,
  resourcePromptNode: ResourcePromptNode,
};

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

interface ToolNode {
  type: string;
  label: string;
}

const toolNodes = [
  { type: 'imageGenerationNode', label: '文生图' },
  { type: 'videoGenerationNode', label: '文生视频' },
  { type: 'roleAnalysisNode', label: '小说输入' },
  { type: 'characterGenerationNode', label: '角色生成' },
  { type: 'storyDescriptionNode', label: '剧情描述' },
  { type: 'sceneDescriptionNode', label: '场景描述' },
  { type: 'storyboardSceneNode', label: '分镜' },
];

interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  type: 'node' | 'canvas' | 'edge';
}

// 内部组件，可以使用 useReactFlow hook
const WorkflowContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const reactFlowInstance = useReactFlow();

  // ========== 项目管理 ==========
  const {
    saveProject,
    loadProject,
    currentProjectName,
    isSaving,
    currentProjectId,
    currentScriptId,
    currentScriptName,
    loadEnumsCache,
    createNewProject,
    loadScriptCharactersCache,
    loadCharactersCache,
    resourceSelectionModal,
    closeResourceSelectionModal,
    imagePreview,
    closeImagePreview,
  } = useWorkflowStore();

  // 剧本选择弹窗
  const [showScriptModal, setShowScriptModal] = useState(false);

  // 资源列表弹窗（统一管理图片和视频）
  const [showResourceModal, setShowResourceModal] = useState(false);

  // 返回确认弹窗
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // ========== 历史记录管理（撤销/重做） ==========
  const {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
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

  const onConnect = useCallback(
    (connection: Connection) => {
      saveToHistory();
      setEdges((eds) => addEdge({...connection, animated: true}, eds));
    },
    [saveToHistory]
  );

  // 处理节点点击，关闭右键菜单
  const onNodeClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // 处理节点右键菜单
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
      type: 'node'
    });
  }, []);

  // 处理画布空白处右键菜单
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'canvas'
    });
  }, []);

  // 处理画布空白处左键点击，关闭右键菜单
  const onPaneClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // 处理连接线右键菜单
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
      type: 'edge'
    });
  }, []);

  // ========== 加载枚举缓存 ==========
  useEffect(() => {
    loadEnumsCache();
  }, [loadEnumsCache]);

  // ========== 从URL参数加载项目 ==========
  // 自动保存相关的 ref（需要在加载项目前声明）
  const isInitialLoadRef = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef<string>(''); // 上次保存的关键数据签名

  // 提取节点的关键数据（用于比较是否需要保存）
  const getKeyDataSignature = useCallback((nodes: Node[], edges: Edge[]): string => {
    // 提取节点关键数据，排除进度、状态等临时数据
    const keyNodes = nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      // 只保留关键配置数据，排除临时数据
      data: {
        label: node.data?.label,
        prompt: node.data?.prompt,
        content: node.data?.content,
        style: node.data?.style,
        size: node.data?.size,
        duration: node.data?.duration,
        aspectRatio: node.data?.aspectRatio,
        referenceImage: node.data?.referenceImage,
        characterId: node.data?.characterId,
        // 排除: progress, status, taskId, outputImage, outputVideo, generatedImages 等临时/结果数据
      }
    }));

    const keyEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

    return JSON.stringify({ nodes: keyNodes, edges: keyEdges });
  }, []);

  // ========== 从URL参数加载项目 ==========
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    // 标记为初始加载，避免加载后立即触发自动保存
    isInitialLoadRef.current = true;

    if (projectId) {
      const numericProjectId = Number(projectId);
      // 加载已有项目
      loadProject(numericProjectId)
        .then(({ nodes: loadedNodes, edges: loadedEdges }) => {
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          console.log('项目加载成功');
          // 初始化已保存的签名，避免加载后立即触发自动保存
          lastSavedSignatureRef.current = getKeyDataSignature(loadedNodes, loadedEdges);
          // 延迟重置标记，确保 useEffect 不会立即触发保存
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 100);
        })
        .catch((error) => {
          console.error('加载项目失败:', error);
          isInitialLoadRef.current = false;
        });
    } else {
      // 新建项目：重置 store 状态
      createNewProject('未命名项目');
      setNodes([]);
      setEdges([]);
      console.log('创建新项目');
      isInitialLoadRef.current = false;
    }
  }, [searchParams]); // 移除 loadProject 依赖，仅依赖 searchParams

  // ========== 自动保存到服务器（防抖3秒，只在关键数据变化时） ==========
  useEffect(() => {
    // 跳过初始加载（由加载项目的 useEffect 控制）
    if (isInitialLoadRef.current) {
      return;
    }

    // 没有项目ID时不保存（新项目需要先手动保存）
    if (!currentProjectId) {
      return;
    }

    // 检查关键数据是否变化
    const currentSignature = getKeyDataSignature(nodes, edges);
    if (currentSignature === lastSavedSignatureRef.current) {
      // 关键数据没有变化，跳过保存
      return;
    }

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的防抖定时器
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 });
        // 更新已保存的签名
        lastSavedSignatureRef.current = getKeyDataSignature(nodes, edges);
        console.log('自动保存成功');
      } catch (error) {
        console.error('自动保存失败:', error);
      }
    }, 3000); // 3秒防抖

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, currentProjectId, saveProject, getKeyDataSignature]);

  // 删除选中的节点和边
  const deleteSelectedElements = useCallback(() => {
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      saveToHistory();
      const selectedNodeIds = selectedNodes.map(n => n.id);
      // 删除选中的节点
      setNodes(nds => nds.filter(node => !node.selected));
      // 删除选中的边以及与删除节点相连的边
      setEdges(eds => eds.filter(edge =>
        !edge.selected &&
        !selectedNodeIds.includes(edge.source) &&
        !selectedNodeIds.includes(edge.target)
      ));
    }
  }, [nodes, edges, saveToHistory]);

  // ========== 键盘快捷键（撤销/重做/删除） ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑输入框，不处理快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Delete 或 Backspace 删除选中节点
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, deleteSelectedElements]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Element)) {
        setContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 删除节点
  const deleteNode = useCallback((nodeId: string) => {
    saveToHistory();
    setNodes(nds => nds.filter(node => node.id !== nodeId));
    setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    setContextMenu(null);
  }, [saveToHistory]);

  // 删除连接线
  const deleteEdge = useCallback((edgeId: string) => {
    saveToHistory();
    setEdges(eds => eds.filter(edge => edge.id !== edgeId));
    setContextMenu(null);
  }, [saveToHistory]);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!currentProjectId) return false;
    const currentSignature = getKeyDataSignature(nodes, edges);
    return currentSignature !== lastSavedSignatureRef.current;
  }, [currentProjectId, nodes, edges, getKeyDataSignature]);

  // 点击返回按钮
  const handleBack = useCallback(() => {
    setShowBackConfirm(true);
  }, []);

  // 确认保存后返回
  const handleConfirmSaveAndBack = useCallback(async () => {
    try {
      await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 });
      setShowBackConfirm(false);
      navigate('/workflow-projects');
    } catch (error) {
      console.error('保存失败:', error);
      setSaveMessage({ type: 'error', text: '保存失败' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [nodes, edges, saveProject, navigate]);

  // 不保存直接返回
  const handleDiscardAndBack = useCallback(() => {
    setShowBackConfirm(false);
    navigate('/workflow-projects');
  }, [navigate]);

  // 取消返回
  const handleCancelBack = useCallback(() => {
    setShowBackConfirm(false);
  }, []);

  // ========== 浏览器返回/关闭提示 ==========
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // ========== 手动保存 ==========
  const handleSave = useCallback(async () => {
    try {
      await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 });
      setSaveMessage({ type: 'success', text: '保存成功' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveMessage({ type: 'error', text: '保存失败' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [nodes, edges, saveProject]);

  // ========== 项目名称编辑 ==========
  const handleNameDoubleClick = useCallback(() => {
    setIsEditingName(true);
    setEditingName(currentProjectName);
  }, [currentProjectName]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  }, []);

  const handleNameBlur = useCallback(async () => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== currentProjectName) {
      try {
        // 保存新名称
        await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 }, trimmedName);
        setSaveMessage({ type: 'success', text: '名称已更新' });
        setTimeout(() => setSaveMessage(null), 2000);
      } catch (error) {
        console.error('更新项目名称失败:', error);
        setSaveMessage({ type: 'error', text: '更新失败' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    }
    setIsEditingName(false);
  }, [editingName, currentProjectName, nodes, edges, saveProject]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  }, []);

  // ========== 剧本切换 ==========
  const handleScriptChange = useCallback(async (scriptId: number | null, scriptName: string | null, style?: string) => {
    if (!currentProjectId) {
      showWarning('请先保存项目');
      return;
    }

    try {
      // 如果剧本有风格，则同步更新项目风格
      await updateProject(currentProjectId, {
        scriptId: scriptId || undefined,
        style: scriptId && style ? style : undefined,
      });

      // 更新 store 中的剧本信息和项目风格
      useWorkflowStore.setState({
        currentScriptId: scriptId,
        currentScriptName: scriptName,
        currentProjectStyle: scriptId && style ? style : null,
        scriptCharactersCache: [],
        charactersCache: [],
      });

      // 加载新剧本的角色
      if (scriptId) {
        loadScriptCharactersCache(scriptId);
      } else {
        loadCharactersCache(currentProjectId);
      }

      setShowScriptModal(false);
      const styleMsg = scriptId && style ? `，风格：${style}` : '';
      showSuccess(scriptId ? `已绑定剧本: ${scriptName}${styleMsg}` : '已解除剧本绑定');
    } catch (error) {
      console.error('更新剧本绑定失败:', error);
      showWarning('更新剧本绑定失败');
    }
  }, [currentProjectId, loadScriptCharactersCache, loadCharactersCache]);

  const addNode = useCallback((type: string, label: string) => {
    let posX = 0;
    let posY = 0;

    // 如果是从右键菜单添加，使用右键点击的位置
    if (contextMenu?.type === 'canvas') {
      const canvasPosition = reactFlowInstance.project({ x: contextMenu.x, y: contextMenu.y });
      posX = canvasPosition.x;
      posY = canvasPosition.y;
    } else {
      // 工具栏按钮：使用视图中心位置
      const { innerWidth, innerHeight } = window;
      const centerX = innerWidth / 2;
      const centerY = innerHeight / 2;
      const centerPosition = reactFlowInstance.project({ x: centerX, y: centerY });
      posX = centerPosition.x;
      posY = centerPosition.y;
    }

    const getNodeData = () => {
      const baseData = { label };

      if (type === 'textNode') {
        return { ...baseData, value: '' };
      } else if (type === 'parameterNode') {
        return { ...baseData, duration: 5, aspectRatio: '16:9' };
      } else if (type === 'outputNode') {
        return { ...baseData, status: 'idle' };
      } else if (type === 'imageGenerationNode') {
        return {
          ...baseData,
          referenceImage: null,
          prompt: '',
          style: '无',
          size: '1:1',
          outputImage: null,
        };
      } else if (type === 'imageDisplayNode') {
        return {
          ...baseData,
          imageUrl: undefined,
          status: undefined,
        };
      } else if (type === 'videoGenerationNode') {
        return {
          ...baseData,
          prompt: '',
          duration: 5,
          aspectRatio: '16:9',
          referenceImages: [],
          outputVideo: null,
        };
      } else if (type === 'characterGenerationNode') {
        return {
          ...baseData,
          prompt: '',
          duration: 10,
          style: '',
          referenceImage: '',
          outputCharacter: null,
        };
      } else if (type === 'roleAnalysisNode') {
        return {
          ...baseData,
          content: '',
          extractedRoles: null,
        };
      }
      return baseData;
    };

    const newNode: Node = {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      position: { x: posX, y: posY },
      data: getNodeData(),
    };
    saveToHistory();
    setNodes([...nodes, newNode]);
    setContextMenu(null);
  }, [nodes, contextMenu, reactFlowInstance, saveToHistory]);

  return (
    <div className="wf-page">
      {/* 顶部导航 */}
      <header className="wf-header">
        <button onClick={handleBack} className="wf-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <div className="wf-header-center">
          {isEditingName ? (
            <input
              type="text"
              className="wf-name-input"
              value={editingName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              autoFocus
            />
          ) : (
            <h1 onClick={handleNameDoubleClick} title="点击编辑项目名称">
              {currentProjectName}
            </h1>
          )}
          {/* 剧本信息 */}
          <button
            className="wf-script-badge"
            onClick={() => currentProjectId && setShowScriptModal(true)}
            title={currentProjectId ? '点击更换剧本' : '保存项目后可绑定剧本'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>{currentScriptName || '未绑定剧本'}</span>
          </button>
        </div>

        <div className="wf-header-right">
          {saveMessage && (
            <span className={`wf-save-msg ${saveMessage.type}`}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={() => setShowResourceModal(true)}
            className="wf-resource-btn"
            title="资源管理"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            资源
          </button>
          <button
            onClick={handleSave}
            className="wf-save-btn"
            disabled={isSaving || !currentProjectId}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="wf-main">
        <div className="wf-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={4}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            style={{ background: '#0a0a0b' }}
            panOnDrag={[0]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
            <Controls className="wf-controls" />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              style={{
                backgroundColor: '#141416',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              maskColor="rgba(99,102,241,0.1)"
            />
          </ReactFlow>

          {/* 右键菜单 */}
          {contextMenu && (
            <div
              ref={contextMenuRef}
              className="wf-context-menu"
              style={{
                position: 'fixed',
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
                zIndex: 1000
              }}
            >
              {contextMenu.type === 'node' && contextMenu.nodeId && (
                <div className="wf-menu-item danger" onClick={() => deleteNode(contextMenu.nodeId!)}>
                  删除节点
                </div>
              )}
              {contextMenu.type === 'edge' && contextMenu.edgeId && (
                <div className="wf-menu-item danger" onClick={() => deleteEdge(contextMenu.edgeId!)}>
                  删除连线
                </div>
              )}
              {contextMenu.type === 'canvas' && (
                <>
                  <div className="wf-menu-title">添加节点</div>
                  {toolNodes.map((tool) => (
                    <div
                      key={tool.type}
                      className="wf-menu-item"
                      onClick={() => addNode(tool.type, tool.label)}
                    >
                      {tool.label}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部工具栏 */}
        <div className="wf-toolbar">
          {/* 撤销/重做按钮 */}
          <button
            onClick={handleUndo}
            className="wf-tool-btn"
            disabled={!canUndo}
            title="撤销 (Ctrl+Z)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M3 10h10a5 5 0 0 1 5 5v2" />
              <path d="M3 10l4-4" />
              <path d="M3 10l4 4" />
            </svg>
            撤销
          </button>
          <button
            onClick={handleRedo}
            className="wf-tool-btn"
            disabled={!canRedo}
            title="重做 (Ctrl+Shift+Z)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 10H11a5 5 0 0 0-5 5v2" />
              <path d="M21 10l-4-4" />
              <path d="M21 10l-4 4" />
            </svg>
            重做
          </button>
          <div className="wf-toolbar-divider"></div>
          {toolNodes.map((tool) => (
            <button
              key={tool.type}
              onClick={() => addNode(tool.type, tool.label)}
              className="wf-tool-btn"
            >
              {tool.label}
            </button>
          ))}
          <div className="wf-toolbar-divider"></div>
          <button
            onClick={() => {setNodes(initialNodes); setEdges(initialEdges);}}
            className="wf-tool-btn"
          >
            重置
          </button>
          <button
            onClick={() => setNodes([])}
            className="wf-tool-btn danger"
          >
            清空
          </button>
        </div>
      </main>

      {/* 剧本选择模态框 */}
      {showScriptModal && (
        <div className="wf-script-modal-overlay" onClick={() => setShowScriptModal(false)}>
          <div className="wf-script-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wf-script-modal-header">
              <h2>选择剧本</h2>
              <button className="wf-script-modal-close" onClick={() => setShowScriptModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="wf-script-modal-body">
              <p className="wf-script-modal-hint">
                绑定剧本后，项目将使用剧本中的角色和场景资源
              </p>
              <ScriptSelector
                value={currentScriptId}
                onChange={handleScriptChange}
                placeholder="选择一个剧本"
                allowClear={true}
                allowCreate={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* 资源管理模态框（统一管理图片和视频） */}
      <UnifiedResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
      />

      {/* 返回确认弹窗 */}
      {showBackConfirm && (
        <div className="wf-confirm-modal-overlay" onClick={handleCancelBack}>
          <div className="wf-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wf-confirm-modal-header">
              <h2>{hasUnsavedChanges() ? '保存更改？' : '确认返回'}</h2>
            </div>
            <div className="wf-confirm-modal-body">
              <p>{hasUnsavedChanges() ? '您有未保存的更改，是否在离开前保存？' : '确认返回到项目列表页？'}</p>
            </div>
            <div className="wf-confirm-modal-footer">
              <button className="wf-confirm-btn cancel" onClick={handleCancelBack}>
                取消
              </button>
              {hasUnsavedChanges() ? (
                <>
                  <button className="wf-confirm-btn discard" onClick={handleDiscardAndBack}>
                    不保存
                  </button>
                  <button className="wf-confirm-btn save" onClick={handleConfirmSaveAndBack}>
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </>
              ) : (
                <button className="wf-confirm-btn save" onClick={handleDiscardAndBack}>
                  确认
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 视频资源选择弹窗（从节点触发，在画布层级渲染） */}
      {currentProjectId && resourceSelectionModal.modalType === 'video' && (
        <ResourceSelectionModal
          isOpen={resourceSelectionModal.isOpen}
          onClose={closeResourceSelectionModal}
          assets={resourceSelectionModal.assets}
          projectId={currentProjectId}
          scriptId={currentScriptId ?? undefined}
          onBatchCreate={(selectedAssets) => {
            resourceSelectionModal.onBatchCreate?.(selectedAssets);
            closeResourceSelectionModal();
          }}
        />
      )}

      {/* 图片资源选择弹窗（从节点触发，在画布层级渲染） */}
      {currentProjectId && resourceSelectionModal.modalType === 'picture' && (
        <PictureResourceSelectionModal
          isOpen={resourceSelectionModal.isOpen}
          onClose={closeResourceSelectionModal}
          assets={resourceSelectionModal.assets}
          projectId={currentProjectId}
          scriptId={currentScriptId ?? undefined}
          onBatchCreate={(selectedAssets) => {
            resourceSelectionModal.onBatchCreate?.(selectedAssets);
            closeResourceSelectionModal();
          }}
        />
      )}

      {/* 全局图片预览弹窗（从节点触发，在画布层级渲染） */}
      {imagePreview.isOpen && imagePreview.imageUrl && (
        <div className="wf-image-preview-overlay" onClick={closeImagePreview}>
          <div className="wf-image-preview-content" onClick={(e) => e.stopPropagation()}>
            {imagePreview.title && (
              <div className="wf-image-preview-title">{imagePreview.title}</div>
            )}
            <img src={imagePreview.imageUrl} alt={imagePreview.title || '图片预览'} />
            <button className="wf-image-preview-close" onClick={closeImagePreview}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 包装组件，提供 ReactFlowProvider
const Sora2Workflow: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowContent />
    </ReactFlowProvider>
  );
};

export default Sora2Workflow;
