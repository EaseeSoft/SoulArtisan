import { create } from 'zustand';
import type { Edge } from 'reactflow';
import { createProject, updateProject, getProject, type WorkflowData } from '@/api/workflowProject';
import { getAllEnums, type AllEnums } from '@/api/enums';

interface NodeOutputData {
  [nodeId: string]: {
    [portId: string]: any;
  };
}

// 图片预览状态
interface ImagePreviewState {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
}

interface WorkflowStore {
  // ========== 节点数据管理 ==========
  nodeOutputs: NodeOutputData;

  /**
   * 设置节点输出数据
   */
  setNodeOutput: (nodeId: string, portId: string, data: any) => void;

  /**
   * 获取节点输出数据
   */
  getNodeOutput: (nodeId: string, portId: string) => any;

  /**
   * 根据连接获取输入数据
   */
  getInputData: (targetNodeId: string, targetPortId: string, edges: Edge[]) => any;

  // ========== 项目管理 ==========
  currentProjectId: number | null;
  currentProjectName: string;
  currentScriptId: number | null;
  currentScriptName: string | null;
  currentProjectStyle: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;

  /**
   * 保存项目（创建或更新）
   */
  saveProject: (
    nodes: any[],
    edges: Edge[],
    viewport: any,
    name?: string,
    description?: string
  ) => Promise<void>;

  /**
   * 加载项目
   */
  loadProject: (projectId: number) => Promise<{ nodes: any[]; edges: Edge[] }>;

  /**
   * 自动保存
   */
  autoSave: (nodes: any[], edges: Edge[], viewport: any) => Promise<void>;

  /**
   * 创建新项目
   */
  createNewProject: (name: string) => void;

  /**
   * 清空节点输出数据
   */
  clearNodeOutputs: () => void;

  // ========== 枚举缓存管理 ==========
  enumsCache: AllEnums | null;
  isLoadingEnums: boolean;

  /**
   * 加载所有枚举到缓存
   */
  loadEnumsCache: () => Promise<void>;

  /**
   * 获取缓存的枚举数据
   */
  getEnumsCache: () => AllEnums | null;

  // ========== 图片预览管理 ==========
  imagePreview: ImagePreviewState;

  /**
   * 打开图片预览
   */
  openImagePreview: (imageUrl: string, title?: string) => void;

  /**
   * 关闭图片预览
   */
  closeImagePreview: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  // ========== 节点数据管理 ==========
  nodeOutputs: {},

  setNodeOutput: (nodeId, portId, data) => {
    set((state) => ({
      nodeOutputs: {
        ...state.nodeOutputs,
        [nodeId]: {
          ...state.nodeOutputs[nodeId],
          [portId]: data,
        },
      },
    }));
  },

  getNodeOutput: (nodeId, portId) => {
    return get().nodeOutputs[nodeId]?.[portId];
  },

  getInputData: (targetNodeId, targetPortId, edges) => {
    const connectedEdge = edges.find(
      (edge) => edge.target === targetNodeId && edge.targetHandle === targetPortId
    );

    if (!connectedEdge) return null;

    return get().nodeOutputs[connectedEdge.source]?.[connectedEdge.sourceHandle || 'output'];
  },

  // ========== 项目管理 ==========
  currentProjectId: null,
  currentProjectName: '未命名项目',
  currentScriptId: null,
  currentScriptName: null,
  currentProjectStyle: null,
  isSaving: false,
  lastSavedAt: null,

  saveProject: async (nodes, edges, viewport, name, description) => {
    const state = get();
    set({ isSaving: true });

    try {
      const workflowData: WorkflowData = {
        nodes,
        edges,
        nodeOutputs: state.nodeOutputs,
        viewport,
      };

      if (state.currentProjectId) {
        // 更新现有项目
        await updateProject(state.currentProjectId, {
          name: name || state.currentProjectName,
          description,
          workflowData,
        });
      } else {
        // 创建新项目
        const result = await createProject({
          name: name || state.currentProjectName,
          description,
          workflowData,
        });
        set({ currentProjectId: result.data.id as number });
      }

      set({
        lastSavedAt: new Date(),
        currentProjectName: name || state.currentProjectName,
      });

      console.log('项目保存成功');
    } catch (error) {
      console.error('保存项目失败:', error);
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },

  loadProject: async (projectId) => {
    try {
      const project = await getProject(projectId);

      set({
        currentProjectId: project.id,
        currentProjectName: project.name,
        currentScriptId: project.scriptId || null,
        currentScriptName: project.scriptName || null,
        currentProjectStyle: project.style || null,
        nodeOutputs: (project.workflowData?.nodeOutputs as NodeOutputData) || {},
        lastSavedAt: new Date(project.updatedAt),
      });

      return {
        nodes: project.workflowData?.nodes || [],
        edges: project.workflowData?.edges || [],
      };
    } catch (error) {
      console.error('加载项目失败:', error);
      throw error;
    }
  },

  autoSave: async (nodes, edges, viewport) => {
    const state = get();
    if (!state.currentProjectId || state.isSaving) {
      return;
    }

    try {
      await state.saveProject(nodes, edges, viewport);
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  },

  createNewProject: (name) => {
    set({
      currentProjectId: null,
      currentProjectName: name,
      currentScriptId: null,
      currentScriptName: null,
      currentProjectStyle: null,
      nodeOutputs: {},
      lastSavedAt: null,

    });
  },

  clearNodeOutputs: () => {
    set({ nodeOutputs: {} });
  },

  // ========== 枚举缓存管理 ==========
  enumsCache: null,
  isLoadingEnums: false,

  loadEnumsCache: async () => {
    const state = get();

    // 如果已经有缓存或正在加载，跳过
    if (state.enumsCache || state.isLoadingEnums) {
      return;
    }

    set({ isLoadingEnums: true });

    try {
      const enums = await getAllEnums();
      set({ enumsCache: enums });
      console.log('枚举缓存加载成功');
    } catch (error) {
      console.error('加载枚举缓存失败:', error);
    } finally {
      set({ isLoadingEnums: false });
    }
  },

  getEnumsCache: () => {
    return get().enumsCache;
  },

  // ========== 资源缓存管理 ==========


  

  

  

  // ========== 图片预览管理 ==========
  imagePreview: {
    isOpen: false,
    imageUrl: '',
    title: undefined,
  },

  openImagePreview: (imageUrl: string, title?: string) => {
    set({
      imagePreview: {
        isOpen: true,
        imageUrl,
        title,
      },
    });
  },

  closeImagePreview: () => {
    set({
      imagePreview: {
        isOpen: false,
        imageUrl: '',
        title: undefined,
      },
    });
  },
}));
