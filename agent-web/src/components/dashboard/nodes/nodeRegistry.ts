/**
 * 节点注册表
 *
 * 管理所有节点类型的配置、注册和查询
 */

import { NodeConfig, NodeCategory, PortDataType, MenuItemType } from './nodeTypes';

class NodeRegistry {
  private configs: Map<string, NodeConfig> = new Map();

  /**
   * 注册节点类型
   */
  register(config: NodeConfig): void {
    if (this.configs.has(config.type)) {
      console.warn(`节点类型 "${config.type}" 已存在,将被覆盖`);
    }
    this.configs.set(config.type, config);
  }

  /**
   * 批量注册节点
   */
  registerBatch(configs: NodeConfig[]): void {
    configs.forEach(config => this.register(config));
  }

  /**
   * 获取节点配置
   */
  getConfig(type: string): NodeConfig | undefined {
    return this.configs.get(type);
  }

  /**
   * 获取所有节点配置
   */
  getAllConfigs(): NodeConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 按分类获取节点
   */
  getConfigsByCategory(category: NodeCategory): NodeConfig[] {
    return this.getAllConfigs().filter(config => config.category === category);
  }

  /**
   * 获取节点默认数据
   */
  getDefaultData(type: string): Record<string, any> {
    const config = this.getConfig(type);
    return config?.defaultData || {};
  }

  /**
   * 验证节点数据
   */
  validateNodeData(type: string, data: any): string | null {
    const config = this.getConfig(type);
    if (!config) {
      return `未知的节点类型: ${type}`;
    }
    if (config.validate) {
      return config.validate(data);
    }
    return null;
  }

  /**
   * 检查端口连接是否兼容
   */
  arePortsCompatible(
    sourceType: string,
    sourcePort: string,
    targetType: string,
    targetPort: string
  ): boolean {
    const sourceConfig = this.getConfig(sourceType);
    const targetConfig = this.getConfig(targetType);

    if (!sourceConfig || !targetConfig) {
      return false;
    }

    const outputPort = sourceConfig.outputs.find(p => p.id === sourcePort);
    const inputPort = targetConfig.inputs.find(p => p.id === targetPort);

    if (!outputPort || !inputPort) {
      return false;
    }

    // ANY 类型可以连接任何类型
    if (outputPort.dataType === PortDataType.ANY || inputPort.dataType === PortDataType.ANY) {
      return true;
    }

    // 类型必须匹配
    return outputPort.dataType === inputPort.dataType;
  }
}

// 创建全局单例
export const nodeRegistry = new NodeRegistry();

// ==================== 内置节点配置 ====================

/**
 * 图片生成节点配置
 */
export const imageGenerationNodeConfig: NodeConfig = {
  type: 'imageGenerationNode',
  label: '文生图',
  icon: '🖼️',
  category: NodeCategory.PROCESS,
  description: '根据文本描述生成图片',
  inputs: [
    {
      id: 'referenceImage',
      name: '参考图',
      dataType: PortDataType.IMAGE,
      required: false,
      description: '可选的参考图片'
    }
  ],
  outputs: [
    {
      id: 'image',
      name: '生成的图片',
      dataType: PortDataType.IMAGE,
      description: '生成的图片URL'
    }
  ],
  defaultData: {
    label: '文生图',
    prompt: '',
    style: '无',
    size: '1:1',
    referenceImage: null,
    outputImage: null,
  },
  contextMenu: [
    {
      id: 'regenerate',
      label: '重新生成',
      type: MenuItemType.ACTION,
      icon: '🔄',
      onClick: async (nodeId, nodeData) => {
        console.log('重新生成图片', nodeId, nodeData);
      }
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 图片展示节点配置
 */
export const imageDisplayNodeConfig: NodeConfig = {
  type: 'imageDisplayNode',
  label: '图片展示',
  icon: '🖼️',
  category: NodeCategory.OUTPUT,
  description: '展示图片',
  inputs: [
    {
      id: 'image',
      name: '图片',
      dataType: PortDataType.IMAGE,
      required: true,
      description: '要展示的图片'
    }
  ],
  outputs: [
    {
      id: 'image',
      name: '图片',
      dataType: PortDataType.IMAGE,
      description: '传递图片给下游节点'
    }
  ],
  defaultData: {
    label: '图片展示',
    imageUrl: undefined,
    status: undefined,
  },
  contextMenu: [
    {
      id: 'imageActions',
      label: '图片操作',
      type: MenuItemType.SUBMENU,
      icon: '✨',
      children: [
        {
          id: 'editImage',
          label: '改图',
          type: MenuItemType.ACTION,
          icon: '✏️',
          onClick: async (nodeId, nodeData) => {
            console.log('改图', nodeId, nodeData);
            // TODO: 创建图片编辑节点
          }
        },
        {
          id: 'imageToVideo',
          label: '图生视频',
          type: MenuItemType.ACTION,
          icon: '🎬',
          onClick: async (nodeId, nodeData) => {
            console.log('图生视频', nodeId, nodeData);
            // TODO: 创建图生视频节点并连接
          }
        },
        {
          id: 'upscale',
          label: '高清放大',
          type: MenuItemType.ACTION,
          icon: '🔍',
          onClick: async (nodeId, nodeData) => {
            console.log('高清放大', nodeId, nodeData);
          }
        }
      ]
    },
    {
      id: 'download',
      label: '下载图片',
      type: MenuItemType.ACTION,
      icon: '💾',
      onClick: async (nodeId, nodeData) => {
        if (nodeData.imageUrl) {
          const link = document.createElement('a');
          link.href = nodeData.imageUrl;
          link.download = `image-${nodeId}.png`;
          link.click();
        }
      }
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 视频生成节点配置
 */
export const videoGenerationNodeConfig: NodeConfig = {
  type: 'videoGenerationNode',
  label: '文生视频',
  icon: '🎬',
  category: NodeCategory.PROCESS,
  description: '根据文本或图片生成视频',
  inputs: [
    {
      id: 'referenceImage',
      name: '参考图',
      dataType: PortDataType.IMAGE,
      required: false,
      description: '可选的参考图片'
    }
  ],
  outputs: [
    {
      id: 'video',
      name: '生成的视频',
      dataType: PortDataType.VIDEO,
      description: '生成的视频URL'
    }
  ],
  defaultData: {
    label: '文生视频',
    prompt: '',
    duration: 10,
    aspectRatio: '16:9',
    outputVideo: null,
  },
  contextMenu: [
    {
      id: 'regenerate',
      label: '重新生成',
      type: MenuItemType.ACTION,
      icon: '🔄',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 视频展示节点配置
 */
export const videoDisplayNodeConfig: NodeConfig = {
  type: 'videoDisplayNode',
  label: '视频展示',
  icon: '🎬',
  category: NodeCategory.OUTPUT,
  description: '展示视频',
  inputs: [
    {
      id: 'video',
      name: '视频',
      dataType: PortDataType.VIDEO,
      required: true,
      description: '要展示的视频'
    }
  ],
  outputs: [
    {
      id: 'video',
      name: '视频',
      dataType: PortDataType.VIDEO,
      description: '传递视频给下游节点'
    }
  ],
  defaultData: {
    label: '视频展示',
    videoUrl: undefined,
    status: undefined,
    progress: 0,
  },
  contextMenu: [
    {
      id: 'download',
      label: '下载视频',
      type: MenuItemType.ACTION,
      icon: '💾',
      onClick: async (nodeId, nodeData) => {
        if (nodeData.videoUrl) {
          const link = document.createElement('a');
          link.href = nodeData.videoUrl;
          link.download = `video-${nodeId}.mp4`;
          link.click();
        }
      }
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 角色生成节点配置
 */
export const characterGenerationNodeConfig: NodeConfig = {
  type: 'characterGenerationNode',
  label: '角色生成',
  icon: '🎭',
  category: NodeCategory.PROCESS,
  description: '生成角色视频',
  inputs: [],
  outputs: [
    {
      id: 'character',
      name: '角色视频',
      dataType: PortDataType.VIDEO,
      description: '生成的角色视频'
    }
  ],
  defaultData: {
    label: '角色生成',
    prompt: '',
    duration: 10,
    style: '',
    referenceImage: '',
    outputCharacter: null,
  },
  contextMenu: [
    {
      id: 'regenerate',
      label: '重新生成',
      type: MenuItemType.ACTION,
      icon: '🔄',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 分镜脚本节点配置
 */
export const storyboardNodeConfig: NodeConfig = {
  type: 'storyboardNode',
  label: '生成分镜',
  icon: '📋',
  category: NodeCategory.PROCESS,
  description: '生成分镜脚本',
  inputs: [
    {
      id: 'character',
      name: '角色',
      dataType: PortDataType.JSON,
      required: false,
      description: '可选的角色数据'
    }
  ],
  outputs: [
    {
      id: 'storyboard',
      name: '分镜数据',
      dataType: PortDataType.ARRAY,
      description: '分镜列表'
    }
  ],
  defaultData: {
    label: '生成分镜',
    story: '',
    scenes: [],
  },
  contextMenu: [
    {
      id: 'regenerate',
      label: '重新生成',
      type: MenuItemType.ACTION,
      icon: '🔄',
    },
    {
      id: 'batchGenerate',
      label: '批量生成图片',
      type: MenuItemType.ACTION,
      icon: '🖼️',
      onClick: async (nodeId, nodeData) => {
        console.log('批量生成分镜图片', nodeId, nodeData);
      }
    },
    {
      id: 'export',
      label: '导出脚本',
      type: MenuItemType.ACTION,
      icon: '💾',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 剧情描述节点配置
 */
export const storyDescriptionNodeConfig: NodeConfig = {
  type: 'storyDescriptionNode',
  label: '剧情描述',
  icon: '📝',
  category: NodeCategory.PROCESS,
  description: '编写剧情描述并生成分镜',
  inputs: [],
  outputs: [
    {
      id: 'storyboard',
      name: '分镜数据',
      dataType: PortDataType.ARRAY,
      description: '生成的分镜列表'
    }
  ],
  defaultData: {
    label: '剧情描述',
    storyContent: '',
    style: '',
    duration: 10,
  },
  contextMenu: [
    {
      id: 'regenerate',
      label: '重新生成分镜',
      type: MenuItemType.ACTION,
      icon: '🔄',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 小说输入节点配置
 */
export const roleAnalysisNodeConfig: NodeConfig = {
  type: 'roleAnalysisNode',
  label: '小说输入',
  icon: '📚',
  category: NodeCategory.PROCESS,
  description: '使用AI分析文本并提取角色信息',
  inputs: [
    {
      id: 'text',
      name: '文本',
      dataType: PortDataType.TEXT,
      required: false,
      description: '可选的文本输入'
    }
  ],
  outputs: [
    {
      id: 'roles',
      name: '角色数据',
      dataType: PortDataType.JSON,
      description: '提取的角色信息'
    }
  ],
  defaultData: {
    label: '角色解析',
    content: '',
    extractedRoles: null,
  },
  contextMenu: [
    {
      id: 'extract',
      label: '提取角色',
      type: MenuItemType.ACTION,
      icon: '🔍',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 角色视频节点配置
 */
export const characterVideoNodeConfig: NodeConfig = {
  type: 'characterVideoNode',
  label: '角色视频',
  icon: '🎬',
  category: NodeCategory.PROCESS,
  description: '用于选择视频片段并创建角色',
  inputs: [
    {
      id: 'video',
      name: '视频',
      dataType: PortDataType.VIDEO,
      required: false,
      description: '视频URL或任务ID'
    }
  ],
  outputs: [
    {
      id: 'character',
      name: '角色',
      dataType: PortDataType.JSON,
      description: '创建的角色数据'
    }
  ],
  defaultData: {
    label: '角色视频',
    videoUrl: undefined,
    taskId: undefined,
    startTime: 0,
    endTime: 3,
    status: 'idle',
  },
  contextMenu: [
    {
      id: 'createCharacter',
      label: '创建角色',
      type: MenuItemType.ACTION,
      icon: '🎭',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 角色展示节点配置
 */
export const characterDisplayNodeConfig: NodeConfig = {
  type: 'characterDisplayNode',
  label: '角色展示',
  icon: '👤',
  category: NodeCategory.OUTPUT,
  description: '展示创建的角色信息',
  inputs: [
    {
      id: 'character',
      name: '角色',
      dataType: PortDataType.JSON,
      required: true,
      description: '角色数据'
    }
  ],
  outputs: [
    {
      id: 'character',
      name: '角色',
      dataType: PortDataType.JSON,
      description: '传递角色给下游节点'
    }
  ],
  defaultData: {
    label: '角色展示',
    characterId: undefined,
    characterName: undefined,
    characterImageUrl: undefined,
    id: undefined,
  },
  contextMenu: [
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 分镜场景节点配置
 */
export const storyboardSceneNodeConfig: NodeConfig = {
  type: 'storyboardSceneNode',
  label: '分镜',
  icon: '🎬',
  category: NodeCategory.PROCESS,
  description: '创建和编辑分镜场景',
  inputs: [
    {
      id: 'characters',
      name: '角色列表',
      dataType: PortDataType.JSON,
      required: false,
      description: '项目角色数据'
    }
  ],
  outputs: [
    {
      id: 'scene',
      name: '分镜场景',
      dataType: PortDataType.JSON,
      description: '分镜场景数据'
    }
  ],
  defaultData: {
    label: '分镜',
    projectCharacters: [],
    selectedCharacterIds: [],
    copywriting: '',
    storyboard: '',
  },
  contextMenu: [
    {
      id: 'generate',
      label: '生成分镜',
      type: MenuItemType.ACTION,
      icon: '⚡',
    },
    {
      id: 'divider1',
      label: '',
      type: MenuItemType.DIVIDER,
    },
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 场景描述节点配置
 */
export const sceneDescriptionNodeConfig: NodeConfig = {
  type: 'sceneDescriptionNode',
  label: '场景描述',
  icon: '🎬',
  category: NodeCategory.PROCESS,
  description: '描述场景的各种元素',
  inputs: [
    {
      id: 'input',
      name: '输入',
      dataType: PortDataType.TEXT,
      required: false,
      description: '场景描述输入'
    }
  ],
  outputs: [
    {
      id: 'output',
      name: '输出',
      dataType: PortDataType.TEXT,
      description: '场景描述输出'
    }
  ],
  defaultData: {
    label: '场景描述',
    description: '',
  },
  contextMenu: [
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

/**
 * 分镜列表节点配置
 */
export const storyboardListNodeConfig: NodeConfig = {
  type: 'storyboardListNode',
  label: '分镜列表',
  icon: '📋',
  category: NodeCategory.OUTPUT,
  description: '展示分镜列表并可创建分镜节点',
  inputs: [
    {
      id: 'input',
      name: '输入',
      dataType: PortDataType.ARRAY,
      required: false,
      description: '分镜数据输入'
    }
  ],
  outputs: [
    {
      id: 'output',
      name: '输出',
      dataType: PortDataType.ARRAY,
      description: '分镜数据输出'
    }
  ],
  defaultData: {
    label: '分镜列表',
    cameraList: null,
  },
  contextMenu: [
    {
      id: 'delete',
      label: '删除节点',
      type: MenuItemType.ACTION,
      icon: '🗑️',
    }
  ]
};

// 注册所有内置节点
nodeRegistry.registerBatch([
  imageGenerationNodeConfig,
  imageDisplayNodeConfig,
  videoGenerationNodeConfig,
  videoDisplayNodeConfig,
  characterGenerationNodeConfig,
  characterVideoNodeConfig,
  characterDisplayNodeConfig,
  storyboardNodeConfig,
  storyboardSceneNodeConfig,
  storyboardListNodeConfig,
  storyDescriptionNodeConfig,
  sceneDescriptionNodeConfig,
  roleAnalysisNodeConfig,
]);
