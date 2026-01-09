/**
 * 图像生成 API 封装
 */

import {del, get, post} from '../utils/request';

// 类型定义
export interface TextToImageParams {
    prompt: string;
    aspectRatio?: 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
    imageSize?: '1K' | '2K' | '4K';
}

export interface ImageToImageParams extends TextToImageParams {
    imageUrls: string[];
}

export interface ImageTask {
    id: number;
    taskId: string;
    type: 'text2image' | 'image2image';
    model: string;
    prompt: string;
    imageUrls: string[] | null;
    aspectRatio: string;
    imageSize: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
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
 * 文生图
 */
export const textToImage = async (params: TextToImageParams): Promise<ApiResponse<ImageTask>> => {
    const response = await post<ApiResponse<ImageTask>>('/api/image/text-to-image', params);
    return response.data;
};

/**
 * 图生图
 */
export const imageToImage = async (params: ImageToImageParams): Promise<ApiResponse<ImageTask>> => {
    const response = await post<ApiResponse<ImageTask>>('/api/image/image-to-image', params);
    return response.data;
};

/**
 * 查询任务状态
 */
export const getTaskStatus = async (taskId: number): Promise<ApiResponse<ImageTask>> => {
    const response = await get<ApiResponse<ImageTask>>(`/api/image/task/${taskId}`);
    return response.data;
};

/**
 * 获取任务列表
 */
export const getTaskList = async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
}): Promise<ApiResponse<{
    list: ImageTask[];
    total: number;
    page: number;
    page_size: number;
}>> => {
    const response = await get<ApiResponse<{
        list: ImageTask[];
        total: number;
        page: number;
        page_size: number;
    }>>('/api/image/tasks', {params});
    return response.data;
};

/**
 * 删除任务
 */
export const deleteTask = async (taskId: number): Promise<ApiResponse> => {
    const response = await del<ApiResponse>(`/api/image/task/${taskId}`);
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
    onProgress?: (task: ImageTask) => void,
    options: {
        interval?: number;      // 轮询间隔（毫秒），默认 3000
        maxAttempts?: number;   // 最大尝试次数，默认无限
    } = {}
): Promise<ImageTask> => {
    const {interval = 5000, maxAttempts} = options;
    let attempts = 0;

    while (true) {
        if (maxAttempts !== undefined && attempts >= maxAttempts) {
            throw new Error('任务超时：超过最大轮询次数');
        }
        attempts++;

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
        if (task.status === 'completed') {
            return task;
        }

        // 任务失败
        if (task.status === 'failed') {
            throw new Error(task.errorMessage || '任务失败');
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, interval));
    }
};

/**
 * 完整的文生图流程（创建任务，不等待完成）
 *
 * @param params 文生图参数
 * @param onProgress 进度回调
 * @returns 创建的任务信息
 */
export const generateImageFromText = async (
    params: TextToImageParams,
    onProgress?: (status: string, task?: ImageTask) => void
): Promise<ImageTask> => {
    try {
        // 创建任务
        onProgress?.('创建任务中...');
        const createResult = await textToImage(params);

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

/**
 * 完整的图生图流程（创建任务，不等待完成）
 *
 * @param params 图生图参数
 * @param onProgress 进度回调
 * @returns 创建的任务信息
 */
export const generateImageFromImage = async (
    params: ImageToImageParams,
    onProgress?: (status: string, task?: ImageTask) => void
): Promise<ImageTask> => {
    try {
        // 1. 验证参数
        if (!params.imageUrls || params.imageUrls.length === 0) {
            throw new Error('请提供至少一张参考图');
        }

        if (params.imageUrls.length > 5) {
            throw new Error('参考图最多 5 张');
        }

        // 2. 创建任务
        onProgress?.('创建任务中...');
        const createResult = await imageToImage(params);

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
    textToImage,
    imageToImage,
    getTaskStatus,
    getTaskList,
    deleteTask,
    pollTaskUntilComplete,
    generateImageFromText,
    generateImageFromImage,
};
