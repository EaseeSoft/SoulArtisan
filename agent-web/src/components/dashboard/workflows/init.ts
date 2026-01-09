/**
 * 工作流注册初始化
 * 在应用启动时调用此函数注册所有工作流
 */
import { workflowRegistry } from './core/workflowRegistry';
import { characterResourceConfig } from './character-resource/config';
import { storyboardConfig } from './storyboard/config';

let initialized = false;

/**
 * 初始化并注册所有工作流
 */
export function initializeWorkflows(): void {
  if (initialized) {
    console.log('工作流已初始化，跳过重复初始化');
    return;
  }

  // 注册角色资源工作流
  workflowRegistry.register(characterResourceConfig);

  // 注册分镜图工作流
  workflowRegistry.register(storyboardConfig);

  initialized = true;
  console.log('工作流初始化完成，已注册工作流:', workflowRegistry.getAllIds());
}

/**
 * 获取所有已注册的工作流列表
 */
export function getRegisteredWorkflows() {
  return workflowRegistry.getAll();
}

/**
 * 根据 ID 获取工作流配置
 */
export function getWorkflowById(id: string) {
  return workflowRegistry.get(id);
}
