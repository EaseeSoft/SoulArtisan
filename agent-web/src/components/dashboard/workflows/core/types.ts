/**
 * 工作流核心类型定义
 */
import type { ComponentType } from 'react';
import type { Node, Edge } from 'reactflow';

// 端口数据类型
export type PortDataType = 'text' | 'image' | 'video' | 'json' | 'array' | 'character' | 'scene' | 'any';

// 端口定义
export interface PortDefinition {
  id: string;
  name: string;
  type: PortDataType;
  required?: boolean;
  multiple?: boolean; // 是否支持多个连接
}

// 节点配置
export interface NodeConfig {
  type: string;
  label: string;
  description?: string;
  // 节点来源
  source: 'shared' | 'workflow-specific';
  // 节点组件
  component: ComponentType<any>;
  // 输入输出端口
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  // 默认数据
  defaultData?: Record<string, any>;
  // 节点分组（用于工具栏分组）
  group?: string;
  // 图标
  icon?: string;
}

// 工具栏项
export interface ToolbarItem {
  type: string;
  label: string;
  icon?: string;
  group?: string;
  dividerAfter?: boolean;
}

// 工作流功能特性
export interface WorkflowFeatures {
  // 是否支持剧本绑定
  scriptBinding?: boolean;
  // 是否支持角色管理
  characterManagement?: boolean;
  // 是否支持资源库
  resourceLibrary?: boolean;
  // 是否支持视频列表
  videoList?: boolean;
  // 是否支持撤销/重做
  undoRedo?: boolean;
}

// 工作流配置
export interface WorkflowConfig {
  // 工作流唯一标识
  id: string;
  // 工作流名称
  name: string;
  // 工作流描述
  description?: string;
  // 工作流图标
  icon?: string;
  // 节点配置列表
  nodes: NodeConfig[];
  // 工具栏配置
  toolbar: ToolbarItem[];
  // 功能特性
  features?: WorkflowFeatures;
  // 默认视口
  defaultViewport?: { x: number; y: number; zoom: number };
}

// 工作流状态
export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

// 右键菜单状态
export interface ContextMenuState {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
  type: 'node' | 'canvas' | 'edge';
}

// 工作流实例上下文
export interface WorkflowContextValue {
  // 工作流配置
  config: WorkflowConfig;
  // 节点类型映射
  nodeTypes: Record<string, ComponentType<any>>;
  // 工具栏项
  toolbarItems: ToolbarItem[];
  // 当前项目信息
  projectId: number | null;
  projectName: string;
  scriptId: number | null;
  scriptName: string | null;
  // 项目风格
  projectStyle?: string | null;
}

// 节点组件 Props 基础类型
export interface BaseNodeProps {
  id: string;
  data: Record<string, any>;
  selected?: boolean;
}

// 节点更新数据函数类型
export type UpdateNodeDataFn = (nodeId: string, updates: Record<string, any>) => void;
