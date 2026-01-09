/**
 * 工作流上下文
 * 为工作流组件提供全局状态和配置
 */
import React, { createContext, useContext, useMemo, type ReactNode, type ComponentType } from 'react';
import type { WorkflowConfig, WorkflowContextValue, ToolbarItem } from './types';

// 创建上下文
const WorkflowContext = createContext<WorkflowContextValue | null>(null);

interface WorkflowProviderProps {
  config: WorkflowConfig;
  projectId: number | null;
  projectName: string;
  scriptId: number | null;
  scriptName: string | null;
  projectStyle?: string | null;
  children: ReactNode;
}

/**
 * 工作流 Provider
 */
export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  config,
  projectId,
  projectName,
  scriptId,
  scriptName,
  projectStyle,
  children,
}) => {
  // 生成 nodeTypes 映射
  const nodeTypes = useMemo(() => {
    return config.nodes.reduce((acc, node) => {
      acc[node.type] = node.component;
      return acc;
    }, {} as Record<string, ComponentType<any>>);
  }, [config.nodes]);

  // 工具栏项
  const toolbarItems = useMemo(() => {
    return config.toolbar;
  }, [config.toolbar]);

  const value = useMemo<WorkflowContextValue>(
    () => ({
      config,
      nodeTypes,
      toolbarItems,
      projectId,
      projectName,
      scriptId,
      scriptName,
      projectStyle,
    }),
    [config, nodeTypes, toolbarItems, projectId, projectName, scriptId, scriptName, projectStyle]
  );

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
};

/**
 * 使用工作流上下文的 Hook
 */
export function useWorkflowContext(): WorkflowContextValue | null {
  return useContext(WorkflowContext);
}

/**
 * 获取当前工作流配置
 * 注意：可能返回 null，调用方需要处理
 */
export function useWorkflowConfig(): WorkflowConfig | null {
  const context = useContext(WorkflowContext);
  return context?.config || null;
}

/**
 * 获取当前工作流的节点类型映射
 */
export function useNodeTypes(): Record<string, ComponentType<any>> | null {
  const context = useContext(WorkflowContext);
  return context?.nodeTypes || null;
}

/**
 * 获取工具栏项
 */
export function useToolbarItems(): ToolbarItem[] | null {
  const context = useContext(WorkflowContext);
  return context?.toolbarItems || null;
}

/**
 * 获取当前项目信息
 */
export function useProjectInfo() {
  const context = useContext(WorkflowContext);
  return context ? {
    projectId: context.projectId,
    projectName: context.projectName,
    scriptId: context.scriptId,
    scriptName: context.scriptName,
    projectStyle: context.projectStyle,
  } : null;
}

export { WorkflowContext };
