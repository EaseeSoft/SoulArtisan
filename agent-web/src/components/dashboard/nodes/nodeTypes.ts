/**
 * 节点工作流系统 - 核心类型定义
 *
 * 这个文件定义了整个节点系统的基础类型和接口
 */

// ==================== 数据端口类型 ====================

/**
 * 端口数据类型
 */
export enum PortDataType {
  TEXT = 'text',           // 文本
  IMAGE = 'image',         // 图片URL
  VIDEO = 'video',         // 视频URL
  JSON = 'json',           // JSON数据
  NUMBER = 'number',       // 数字
  ARRAY = 'array',         // 数组
  ANY = 'any',             // 任意类型
}

/**
 * 端口定义
 */
export interface PortDefinition {
  id: string;                    // 端口ID
  name: string;                  // 端口名称
  dataType: PortDataType;        // 数据类型
  required?: boolean;            // 是否必需
  description?: string;          // 描述
}

// ==================== 右键菜单 ====================

/**
 * 菜单项类型
 */
export enum MenuItemType {
  ACTION = 'action',       // 执行动作
  SUBMENU = 'submenu',     // 子菜单
  DIVIDER = 'divider',     // 分割线
}

/**
 * 菜单项定义
 */
export interface MenuItem {
  id: string;
  label: string;
  type: MenuItemType;
  icon?: string;
  disabled?: boolean;
  children?: MenuItem[];   // 子菜单项
  onClick?: (nodeId: string, nodeData: any) => void | Promise<void>;
}

// ==================== 节点配置 ====================

/**
 * 节点分类
 */
export enum NodeCategory {
  INPUT = 'input',         // 输入节点
  PROCESS = 'process',     // 处理节点
  OUTPUT = 'output',       // 输出节点
  CONTROL = 'control',     // 控制节点
}

/**
 * 节点配置
 */
export interface NodeConfig {
  type: string;                          // 节点类型标识
  label: string;                         // 节点显示名称
  icon: string;                          // 节点图标
  category: NodeCategory;                // 节点分类
  description?: string;                  // 节点描述
  inputs: PortDefinition[];              // 输入端口定义
  outputs: PortDefinition[];             // 输出端口定义
  contextMenu?: MenuItem[];              // 右键菜单项
  defaultData?: Record<string, any>;     // 默认数据
  validate?: (data: any) => string | null; // 数据验证函数
}

// ==================== 工作流保存/加载 ====================

/**
 * 序列化的节点数据
 */
export interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

/**
 * 序列化的连接数据
 */
export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * 工作流数据
 */
export interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  metadata?: Record<string, any>;
}

// ==================== 节点数据传递 ====================

/**
 * 节点输出数据
 */
export interface NodeOutput {
  nodeId: string;
  portId: string;
  dataType: PortDataType;
  value: any;
  timestamp: number;
}

/**
 * 数据传递上下文
 */
export interface DataContext {
  getInputData(nodeId: string, portId: string): any;
  setOutputData(nodeId: string, portId: string, value: any): void;
  getConnectedInputs(nodeId: string, portId: string): NodeOutput[];
}
