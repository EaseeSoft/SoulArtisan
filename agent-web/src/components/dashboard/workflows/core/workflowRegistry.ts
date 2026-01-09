/**
 * 工作流注册中心
 * 管理所有工作流配置的注册和获取
 */
import type { ComponentType } from 'react';
import type { WorkflowConfig, NodeConfig } from './types';

class WorkflowRegistry {
  private workflows = new Map<string, WorkflowConfig>();
  // 缓存 nodeTypes 对象，避免每次调用都创建新对象
  private nodeTypesCache = new Map<string, Record<string, ComponentType<any>>>();

  /**
   * 注册工作流配置
   */
  register(config: WorkflowConfig): void {
    if (this.workflows.has(config.id)) {
      console.warn(`工作流 "${config.id}" 已存在，将被覆盖`);
    }
    this.workflows.set(config.id, config);
    // 清除缓存，下次获取时重新生成
    this.nodeTypesCache.delete(config.id);
    console.log(`工作流 "${config.name}" (${config.id}) 已注册`);
  }

  /**
   * 获取工作流配置
   */
  get(id: string): WorkflowConfig | undefined {
    return this.workflows.get(id);
  }

  /**
   * 获取所有工作流配置
   */
  getAll(): WorkflowConfig[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 获取所有工作流 ID
   */
  getAllIds(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * 检查工作流是否存在
   */
  has(id: string): boolean {
    return this.workflows.has(id);
  }

  /**
   * 根据工作流配置生成 nodeTypes 对象（用于 ReactFlow）
   * 使用缓存避免每次调用都创建新对象
   */
  getNodeTypes(id: string): Record<string, ComponentType<any>> {
    // 先检查缓存
    const cached = this.nodeTypesCache.get(id);
    if (cached) {
      return cached;
    }

    const config = this.get(id);
    if (!config) {
      console.warn(`工作流 "${id}" 不存在`);
      return {};
    }

    const nodeTypes = config.nodes.reduce((acc, node) => {
      acc[node.type] = node.component;
      return acc;
    }, {} as Record<string, ComponentType<any>>);

    // 存入缓存
    this.nodeTypesCache.set(id, nodeTypes);
    return nodeTypes;
  }

  /**
   * 获取工作流的工具栏节点列表
   */
  getToolbarNodes(id: string): NodeConfig[] {
    const config = this.get(id);
    if (!config) return [];

    // 获取在工具栏中显示的节点配置
    const toolbarTypes = new Set(config.toolbar.map((t) => t.type));
    return config.nodes.filter((node) => toolbarTypes.has(node.type));
  }

  /**
   * 获取节点的默认数据
   */
  getNodeDefaultData(workflowId: string, nodeType: string): Record<string, any> {
    const config = this.get(workflowId);
    if (!config) return { label: nodeType };

    const nodeConfig = config.nodes.find((n) => n.type === nodeType);
    if (!nodeConfig) return { label: nodeType };

    return {
      label: nodeConfig.label,
      ...nodeConfig.defaultData,
    };
  }

  /**
   * 注销工作流
   */
  unregister(id: string): boolean {
    this.nodeTypesCache.delete(id);
    return this.workflows.delete(id);
  }

  /**
   * 清空所有工作流
   */
  clear(): void {
    this.workflows.clear();
    this.nodeTypesCache.clear();
  }
}

// 导出单例
export const workflowRegistry = new WorkflowRegistry();

// 导出类型（用于扩展）
export { WorkflowRegistry };
