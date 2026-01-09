/**
 * 视频生成 API 封装
 */

import {del, get, post} from '../utils/request';

// 类型定义
export interface CreateVideoParams {
    prompt: string;
    aspectRatio?: '16:9' | '9:16';
    duration?: 10 | 15 | 25;
    imageUrls?: string[];
    characters?: string;
    callbackUrl?: string;
    projectId?: number;
    scriptId?: number;
}

export interface VideoTask {
    id: number;
    taskId: string;
    model: string;
    projectId: number | null;
    scriptId: number | null;
    prompt: string;
    imageUrls: string[] | null;
    aspectRatio: string;
    duration: number;
    characters: string | null;
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
 * 创建视频生成任务
 */
export const createVideo = async (params: CreateVideoParams): Promise<ApiResponse<VideoTask>> => {
    const response = await post<ApiResponse<VideoTask>>('/api/video/create', params);
    return response.data;
};

/**
 * 查询任务状态（根据数据库ID）
 */
export const getTaskStatus = async (taskId: number): Promise<ApiResponse<VideoTask>> => {
    const response = await get<ApiResponse<VideoTask>>(`/api/video/task/${taskId}`);
    return response.data;
};

/**
 * 查询任务状态（根据外部任务ID）
 */
export const getTaskStatusByTaskId = async (taskId: string): Promise<ApiResponse<VideoTask>> => {
    const response = await get<ApiResponse<VideoTask>>(`/api/video/task/by-task-id/${taskId}`);
    return response.data;
};

/**
 * 获取任务列表
 */
export const getTaskList = async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    projectId?: number;
}): Promise<ApiResponse<{
    list: VideoTask[];
    total: number;
    page: number;
    page_size: number;
}>> => {
    const response = await get<ApiResponse<{
        list: VideoTask[];
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
    onProgress?: (task: VideoTask) => void,
    options: {
        interval?: number;      // 轮询间隔（毫秒），默认 5000（视频生成较慢）
    } = {}
): Promise<VideoTask> => {
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
 * 完整的视频生成流程（创建任务，不等待完成）
 *
 * @param params 视频生成参数
 * @param onProgress 进度回调
 * @returns 创建的任务信息
 */
export const generateVideo = async (
    params: CreateVideoParams,
    onProgress?: (status: string, task?: VideoTask) => void
): Promise<VideoTask> => {
    try {
        // 1. 验证参数
        if (!params.prompt || params.prompt.trim() === '') {
            throw new Error('请输入提示词');
        }

        if (params.imageUrls && params.imageUrls.length > 5) {
            throw new Error('参考图最多 5 张');
        }

        // 2. 创建任务
        onProgress?.('创建视频生成任务中...');
        const createResult = await createVideo(params);

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
    createVideo,
    getTaskStatus,
    getTaskStatusByTaskId,
    getTaskList,
    deleteTask,
    pollTaskUntilComplete,
    generateVideo,
};
