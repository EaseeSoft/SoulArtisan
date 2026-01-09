/**
 * 角色生成 API 封装
 */

import {del, get, post} from '../utils/request';

// 类型定义
export interface CreateCharacterParams {
    prompt: string;
    style?: string;
    duration?: 10 | 15 | 25;
    referenceImage?: string;
    aspectRatio?: '16:9' | '9:16';
    callbackUrl?: string;
    projectId?: number;
    scriptId?: number;
    characterType?: 'scene' | 'character';
}

export interface CharacterTask {
    id: number;
    taskId: string;
    prompt: string;
    style: string | null;
    duration: number;
    referenceImage: string | null;
    aspectRatio: string;
    status: 'pending' | 'running' | 'succeeded' | 'error';
    progress: number;
    resultUrl: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
}

export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

// API 方法

/**
 * 创建角色生成任务
 */
export const createCharacter = async (params: CreateCharacterParams): Promise<ApiResponse<CharacterTask>> => {
    const response = await post<ApiResponse<CharacterTask>>('/api/video/create', params);
    return response.data;
};

/**
 * 查询任务状态
 */
export const getTaskStatus = async (taskId: number): Promise<ApiResponse<CharacterTask>> => {
    const response = await get<ApiResponse<CharacterTask>>(`/api/video/task/${taskId}`);
    return response.data;
};

/**
 * 获取任务列表
 */
export const getTaskList = async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
}): Promise<ApiResponse<{
    list: CharacterTask[];
    total: number;
    page: number;
    page_size: number;
}>> => {
    const response = await get<ApiResponse<{
        list: CharacterTask[];
        total: number;
        page: number;
        page_size: number;
    }>>('/api/video/tasks', {params});
    return response.data;
};

/**
 * 删除任务
 */
export const deleteTask = async (taskId: number): Promise<ApiResponse> => {
    const response = await del<ApiResponse>(`/api/video/task/${taskId}`);
    return response.data;
};

/**
 * 轮询任务直到完成
 *
 * @param taskId 任务 ID
 * @param onProgress 进度回调
 * @param options 配置选项
 * @returns 完成的任务信息
 */
export const pollTaskUntilComplete = async (
    taskId: number,
    onProgress?: (task: CharacterTask) => void,
    options: {
        interval?: number;      // 轮询间隔（毫秒），默认 5000
    } = {}
): Promise<CharacterTask> => {
    const {interval = 10000} = options;

    while (true) {
        const result = await getTaskStatus(taskId);

        if (result.code !== 200) {
            throw new Error(result.msg || '查询任务失败');
        }

        const task = result.data;

        // 调用进度回调
        if (onProgress) {
            onProgress(task);
        }

        // 任务完成
        if (task.status === 'succeeded') {
            return task;
        }

        // 任务失败
        if (task.status === 'error') {
            throw new Error(task.errorMessage || '任务失败');
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));
    }
};

/**
 * 完整的角色生成流程（创建任务，不等待完成）
 *
 * @param params 角色生成参数
 * @param onProgress 进度回调
 * @returns 创建的任务信息
 */
export const generateCharacter = async (
    params: CreateCharacterParams,
    onProgress?: (status: string, task?: CharacterTask) => void
): Promise<CharacterTask> => {
    try {
        // 1. 验证参数
        if (!params.prompt || params.prompt.trim() === '') {
            throw new Error('请输入角色描述');
        }

        // 2. 创建任务
        onProgress?.('创建角色生成任务中...');
        const createResult = await createCharacter(params);

        if (createResult.code !== 200) {
            throw new Error(createResult.msg || '创建任务失败');
        }

        onProgress?.('任务已创建，请在历史记录中查看进度', createResult.data);
        return createResult.data;

    } catch (error: any) {
        onProgress?.('错误: ' + (error.message || '未知错误'));
        throw error;
    }
};

// 导出默认对象
export default {
    createCharacter,
    getTaskStatus,
    getTaskList,
    deleteTask,
    pollTaskUntilComplete,
    generateCharacter,
};
