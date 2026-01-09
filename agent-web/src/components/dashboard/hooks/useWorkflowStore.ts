import { create } from 'zustand';
import type { Edge } from 'reactflow';
import { createProject, updateProject, getProject, type WorkflowData } from '@/api/workflowProject';
import { getAllEnums, type AllEnums } from '@/api/enums';
import {
  getProjectResources,
  getScriptResources,
  type VideoResourceInfo,
} from '@/api/videoResource';

interface NodeOutputData {
  [nodeId: string]: {
    [portId: string]: any;
  };
}

// 解析出的资源类型
export interface ParsedAsset {
  id: string;
  name: string;
  type: 'character' | 'scene' | 'prop' | 'skill';
  prompt: string;
}

// 资源选择弹框状态
interface ResourceSelectionModalState {
  isOpen: boolean;
  modalType: 'video' | 'picture' | null;
  assets: ParsedAsset[];
  sourceNodeId: string | null;
  onBatchCreate: ((selectedAssets: ParsedAsset[]) => void) | null;
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

  // ========== 资源缓存管理 ==========
  resourcesCache: VideoResourceInfo[];
  isLoadingResources: boolean;

  /**
   * 加载项目资源到缓存
   */
  loadResourcesCache: (projectId: number) => Promise<void>;

  /**
   * 获取缓存的资源数据
   */
  getResourcesCache: () => VideoResourceInfo[];

  /**
   * 设置资源缓存（供外部更新）
   */
  setResourcesCache: (resources: VideoResourceInfo[]) => void;

  /**
   * 添加单个资源到缓存
   */
  addResourceToCache: (resource: VideoResourceInfo) => void;

  /**
   * 从缓存中移除资源
   */
  removeResourceFromCache: (resourceId: number) => void;

  /**
   * 更新缓存中的资源
   */
  updateResourceInCache: (resource: VideoResourceInfo) => void;

  // ========== 剧本资源缓存管理 ==========
  scriptResourcesCache: VideoResourceInfo[];
  isLoadingScriptResources: boolean;

  /**
   * 加载剧本资源到缓存
   */
  loadScriptResourcesCache: (scriptId: number) => Promise<void>;

  /**
   * 获取缓存的剧本资源数据
   */
  getScriptResourcesCache: () => VideoResourceInfo[];

  /**
   * 获取有效的资源列表（优先剧本资源，否则项目资源）
   */
  getEffectiveResources: () => VideoResourceInfo[];

  // ========== 兼容旧方法名 ==========
  /** @deprecated 使用 resourcesCache */
  charactersCache: VideoResourceInfo[];
  /** @deprecated 使用 isLoadingResources */
  isLoadingCharacters: boolean;
  /** @deprecated 使用 loadResourcesCache */
  loadCharactersCache: (projectId: number) => Promise<void>;
  /** @deprecated 使用 getResourcesCache */
  getCharactersCache: () => VideoResourceInfo[];
  /** @deprecated 使用 setResourcesCache */
  setCharactersCache: (characters: VideoResourceInfo[]) => void;
  /** @deprecated 使用 addResourceToCache */
  addCharacterToCache: (character: VideoResourceInfo) => void;
  /** @deprecated 使用 removeResourceFromCache */
  removeCharacterFromCache: (characterId: number) => void;
  /** @deprecated 使用 updateResourceInCache */
  updateCharacterInCache: (character: VideoResourceInfo) => void;
  /** @deprecated 使用 scriptResourcesCache */
  scriptCharactersCache: VideoResourceInfo[];
  /** @deprecated 使用 isLoadingScriptResources */
  isLoadingScriptCharacters: boolean;
  /** @deprecated 使用 loadScriptResourcesCache */
  loadScriptCharactersCache: (scriptId: number) => Promise<void>;
  /** @deprecated 使用 getScriptResourcesCache */
  getScriptCharactersCache: () => VideoResourceInfo[];
  /** @deprecated 使用 getEffectiveResources */
  getEffectiveCharacters: () => VideoResourceInfo[];

  // ========== 资源选择弹框管理 ==========
  resourceSelectionModal: ResourceSelectionModalState;

  /**
   * 打开资源选择弹框
   */
  openResourceSelectionModal: (
    modalType: 'video' | 'picture',
    assets: ParsedAsset[],
    sourceNodeId: string,
    onBatchCreate: (selectedAssets: ParsedAsset[]) => void
  ) => void;

  /**
   * 关闭资源选择弹框
   */
  closeResourceSelectionModal: () => void;

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
        resourcesCache: [], // 清空资源缓存
        scriptResourcesCache: [], // 清空剧本资源缓存
      });

      // 如果有绑定剧本，加载剧本资源，否则加载项目资源
      if (project.scriptId) {
        get().loadScriptResourcesCache(project.scriptId);
      } else {
        get().loadResourcesCache(project.id);
      }

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
      resourcesCache: [], // 清空资源缓存
      scriptResourcesCache: [], // 清空剧本资源缓存
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
  resourcesCache: [],
  isLoadingResources: false,

  loadResourcesCache: async (projectId: number) => {
    const state = get();

    // 如果正在加载，跳过
    if (state.isLoadingResources) {
      return;
    }

    set({ isLoadingResources: true });

    try {
      const response = await getProjectResources(projectId);
      if (response.code === 200 && response.data.resources) {
        set({ resourcesCache: response.data.resources });
        console.log('资源缓存加载成功，共', response.data.resources.length, '个资源');
      }
    } catch (error) {
      console.error('加载资源缓存失败:', error);
    } finally {
      set({ isLoadingResources: false });
    }
  },

  getResourcesCache: () => {
    return get().resourcesCache;
  },

  setResourcesCache: (resources: VideoResourceInfo[]) => {
    set({ resourcesCache: resources });
  },

  addResourceToCache: (resource: VideoResourceInfo) => {
    set((state) => ({
      resourcesCache: [...state.resourcesCache, resource],
    }));
  },

  removeResourceFromCache: (resourceId: number) => {
    set((state) => ({
      resourcesCache: state.resourcesCache.filter((r) => r.id !== resourceId),
    }));
  },

  updateResourceInCache: (resource: VideoResourceInfo) => {
    set((state) => ({
      resourcesCache: state.resourcesCache.map((r) =>
        r.id === resource.id ? resource : r
      ),
    }));
  },

  // ========== 剧本资源缓存管理 ==========
  scriptResourcesCache: [],
  isLoadingScriptResources: false,

  loadScriptResourcesCache: async (scriptId: number) => {
    const state = get();

    // 如果正在加载，跳过
    if (state.isLoadingScriptResources) {
      return;
    }

    set({ isLoadingScriptResources: true });

    try {
      const response = await getScriptResources(scriptId);
      if (response.code === 200 && response.data.resources) {
        set({ scriptResourcesCache: response.data.resources });
        console.log('剧本资源缓存加载成功，共', response.data.resources.length, '个资源');
      }
    } catch (error) {
      console.error('加载剧本资源缓存失败:', error);
    } finally {
      set({ isLoadingScriptResources: false });
    }
  },

  getScriptResourcesCache: () => {
    return get().scriptResourcesCache;
  },

  getEffectiveResources: () => {
    const state = get();
    // 优先返回剧本资源，如果没有剧本则返回项目资源
    return state.currentScriptId ? state.scriptResourcesCache : state.resourcesCache;
  },

  // ========== 兼容旧方法名（映射到新方法）==========
  get charactersCache() {
    return get().resourcesCache;
  },
  get isLoadingCharacters() {
    return get().isLoadingResources;
  },
  loadCharactersCache: async (projectId: number) => {
    return get().loadResourcesCache(projectId);
  },
  getCharactersCache: () => {
    return get().getResourcesCache();
  },
  setCharactersCache: (characters: VideoResourceInfo[]) => {
    get().setResourcesCache(characters);
  },
  addCharacterToCache: (character: VideoResourceInfo) => {
    get().addResourceToCache(character);
  },
  removeCharacterFromCache: (characterId: number) => {
    get().removeResourceFromCache(characterId);
  },
  updateCharacterInCache: (character: VideoResourceInfo) => {
    get().updateResourceInCache(character);
  },
  get scriptCharactersCache() {
    return get().scriptResourcesCache;
  },
  get isLoadingScriptCharacters() {
    return get().isLoadingScriptResources;
  },
  loadScriptCharactersCache: async (scriptId: number) => {
    return get().loadScriptResourcesCache(scriptId);
  },
  getScriptCharactersCache: () => {
    return get().getScriptResourcesCache();
  },
  getEffectiveCharacters: () => {
    return get().getEffectiveResources();
  },

  // ========== 资源选择弹框管理 ==========
  resourceSelectionModal: {
    isOpen: false,
    modalType: null,
    assets: [],
    sourceNodeId: null,
    onBatchCreate: null,
  },

  openResourceSelectionModal: (modalType, assets, sourceNodeId, onBatchCreate) => {
    set({
      resourceSelectionModal: {
        isOpen: true,
        modalType,
        assets,
        sourceNodeId,
        onBatchCreate,
      },
    });
  },

  closeResourceSelectionModal: () => {
    set({
      resourceSelectionModal: {
        isOpen: false,
        modalType: null,
        assets: [],
        sourceNodeId: null,
        onBatchCreate: null,
      },
    });
  },

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
