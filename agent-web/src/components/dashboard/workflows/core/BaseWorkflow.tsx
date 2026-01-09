/**
 * 基础工作流组件
 * 提供工作流编辑器的通用 UI 和功能
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowCore } from './useWorkflowCore';
import { WorkflowProvider } from './WorkflowContext';
import { workflowRegistry } from './workflowRegistry';
import { useWorkflowStore } from '../../hooks/useWorkflowStore';
import { updateProject } from '@/api/workflowProject';
import { showSuccess, showWarning } from '@/utils/request';
import ScriptSelector from '../../ScriptSelector';
import UnifiedResourceModal from '../../UnifiedResourceModal';
import '../../Sora2Workflow.css';

interface BaseWorkflowProps {
  workflowId: string;
  // 返回路径（默认返回项目列表）
  backPath?: string;
}

// 内部工作流内容组件
const WorkflowContent: React.FC<BaseWorkflowProps> = ({ workflowId, backPath = '/workflow-projects' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 获取工作流配置
  const config = workflowRegistry.get(workflowId);
  const features = config?.features ?? {};

  // 工作流核心操作
  const {
    nodes,
    edges,
    contextMenu,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    deleteEdge,
    onNodeContextMenu,
    onEdgeContextMenu,
    onPaneContextMenu,
    onPaneClick,
    onNodeClick,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    setContextMenu,
    nodeTypes,
  } = useWorkflowCore({ workflowId });

  // 项目管理
  const {
    saveProject,
    loadProject,
    currentProjectName,
    isSaving,
    currentProjectId,
    currentScriptId,
    currentScriptName,
    currentProjectStyle,
    loadEnumsCache,
    createNewProject,
    loadScriptCharactersCache,
    loadCharactersCache,
  } = useWorkflowStore();

  // UI 状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // 自动保存相关
  const isInitialLoadRef = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef<string>('');

  // 提取节点的关键数据签名
  const getKeyDataSignature = useCallback((nodes: Node[], edges: Edge[]): string => {
    const keyNodes = nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
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
      },
    }));

    const keyEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

    return JSON.stringify({ nodes: keyNodes, edges: keyEdges });
  }, []);

  // 加载枚举缓存
  useEffect(() => {
    loadEnumsCache();
  }, [loadEnumsCache]);

  // 从 URL 参数加载项目
  useEffect(() => {
    const projectId = searchParams.get('projectId');
    isInitialLoadRef.current = true;

    if (projectId) {
      const numericProjectId = Number(projectId);
      loadProject(numericProjectId)
        .then(({ nodes: loadedNodes, edges: loadedEdges }) => {
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          console.log('项目加载成功');
          lastSavedSignatureRef.current = getKeyDataSignature(loadedNodes, loadedEdges);
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 100);
        })
        .catch((error) => {
          console.error('加载项目失败:', error);
          isInitialLoadRef.current = false;
        });
    } else {
      createNewProject('未命名项目');
      setNodes([]);
      setEdges([]);
      console.log('创建新项目');
      isInitialLoadRef.current = false;
    }
  }, [searchParams]);

  // 自动保存
  useEffect(() => {
    if (isInitialLoadRef.current || !currentProjectId) {
      return;
    }

    const currentSignature = getKeyDataSignature(nodes, edges);
    if (currentSignature === lastSavedSignatureRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 });
        lastSavedSignatureRef.current = getKeyDataSignature(nodes, edges);
        console.log('自动保存成功');
      } catch (error) {
        console.error('自动保存失败:', error);
      }
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [nodes, edges, currentProjectId, saveProject, getKeyDataSignature]);

  // 点击外部关闭右键菜单
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
  }, [setContextMenu]);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!currentProjectId) return false;
    const currentSignature = getKeyDataSignature(nodes, edges);
    return currentSignature !== lastSavedSignatureRef.current;
  }, [currentProjectId, nodes, edges, getKeyDataSignature]);

  // 浏览器关闭/返回提示
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

  // 返回按钮处理
  const handleBack = useCallback(() => {
    setShowBackConfirm(true);
  }, []);

  const handleConfirmSaveAndBack = useCallback(async () => {
    try {
      await saveProject(nodes, edges, { x: 0, y: 0, zoom: 1 });
      setShowBackConfirm(false);
      navigate(backPath);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveMessage({ type: 'error', text: '保存失败' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [nodes, edges, saveProject, navigate, backPath]);

  const handleDiscardAndBack = useCallback(() => {
    setShowBackConfirm(false);
    navigate(backPath);
  }, [navigate, backPath]);

  const handleCancelBack = useCallback(() => {
    setShowBackConfirm(false);
  }, []);

  // 手动保存
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

  // 项目名称编辑
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

  // 剧本切换
  const handleScriptChange = useCallback(
    async (scriptId: number | null, scriptName: string | null, style?: string) => {
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

        useWorkflowStore.setState({
          currentScriptId: scriptId,
          currentScriptName: scriptName,
          currentProjectStyle: scriptId && style ? style : null,
          scriptCharactersCache: [],
          charactersCache: [],
        });

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
    },
    [currentProjectId, loadScriptCharactersCache, loadCharactersCache]
  );

  // 工具栏节点列表
  const toolbarNodes = config?.toolbar ?? [];

  if (!config) {
    return <div className="wf-error">未找到工作流配置: {workflowId}</div>;
  }

  return (
    <WorkflowProvider
      config={config}
      projectId={currentProjectId}
      projectName={currentProjectName}
      scriptId={currentScriptId}
      scriptName={currentScriptName}
      projectStyle={currentProjectStyle}
    >
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
            {/* 剧本信息（如果启用） */}
            {features.scriptBinding && (
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
            )}
          </div>

          <div className="wf-header-right">
            {saveMessage && (
              <span className={`wf-save-msg ${saveMessage.type}`}>{saveMessage.text}</span>
            )}
            {/* 资源按钮（如果启用） */}
            {features.resourceLibrary && (
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
            )}
            <button onClick={handleSave} className="wf-save-btn" disabled={isSaving || !currentProjectId}>
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
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
              <Controls className="wf-controls" />
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                style={{
                  backgroundColor: '#141416',
                  border: '1px solid rgba(255,255,255,0.1)',
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
                  zIndex: 1000,
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
                    {toolbarNodes.map((tool) => (
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
            {features.undoRedo !== false && (
              <>
                <button onClick={handleUndo} className="wf-tool-btn" disabled={!canUndo} title="撤销 (Ctrl+Z)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M3 10h10a5 5 0 0 1 5 5v2" />
                    <path d="M3 10l4-4" />
                    <path d="M3 10l4 4" />
                  </svg>
                  撤销
                </button>
                <button onClick={handleRedo} className="wf-tool-btn" disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M21 10H11a5 5 0 0 0-5 5v2" />
                    <path d="M21 10l-4-4" />
                    <path d="M21 10l-4 4" />
                  </svg>
                  重做
                </button>
                <div className="wf-toolbar-divider"></div>
              </>
            )}
            {/* 工具栏节点按钮 */}
            {toolbarNodes.map((tool, index) => (
              <React.Fragment key={tool.type}>
                <button onClick={() => addNode(tool.type, tool.label)} className="wf-tool-btn">
                  {tool.label}
                </button>
                {tool.dividerAfter && <div className="wf-toolbar-divider"></div>}
              </React.Fragment>
            ))}
            <div className="wf-toolbar-divider"></div>
            <button onClick={() => setNodes([])} className="wf-tool-btn danger">
              清空
            </button>
          </div>
        </main>

        {/* 剧本选择模态框 */}
        {features.scriptBinding && showScriptModal && (
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
                <p className="wf-script-modal-hint">绑定剧本后，项目将使用剧本中的角色和场景资源</p>
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
        {features.resourceLibrary && (
          <UnifiedResourceModal isOpen={showResourceModal} onClose={() => setShowResourceModal(false)} />
        )}

        {/* 返回确认弹窗 */}
        {showBackConfirm && (
          <div className="wf-confirm-modal-overlay" onClick={handleCancelBack}>
            <div className="wf-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="wf-confirm-modal-header">
                <h2>{hasUnsavedChanges() ? '保存更改？' : '确认返回'}</h2>
              </div>
              <div className="wf-confirm-modal-body">
                <p>
                  {hasUnsavedChanges() ? '您有未保存的更改，是否在离开前保存？' : '确认返回到项目列表页？'}
                </p>
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
      </div>
    </WorkflowProvider>
  );
};

// 包装组件，提供 ReactFlowProvider
const BaseWorkflow: React.FC<BaseWorkflowProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowContent {...props} />
    </ReactFlowProvider>
  );
};

export default BaseWorkflow;
