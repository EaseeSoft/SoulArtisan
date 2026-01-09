import request from './request';
import { ImageTask, VideoTask, TaskQueryRequest, TaskStats, PageResult } from '../types';

/**
 * 获取图片任务列表
 */
export const getImageTaskList = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: TaskQueryRequest
): Promise<PageResult<ImageTask>> => {
  return request.get('/api/admin/task/image/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取视频任务列表
 */
export const getVideoTaskList = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: TaskQueryRequest
): Promise<PageResult<VideoTask>> => {
  return request.get('/api/admin/task/video/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取图片任务��情
 */
export const getImageTaskDetail = async (taskId: number): Promise<ImageTask> => {
  return request.get(`/api/admin/task/image/${taskId}`);
};

/**
 * 获取视频任务详情
 */
export const getVideoTaskDetail = async (taskId: number): Promise<VideoTask> => {
  return request.get(`/api/admin/task/video/${taskId}`);
};

/**
 * 添加图片任务备注
 */
export const addImageTaskRemark = async (taskId: number, remark: string): Promise<void> => {
  return request.put(`/api/admin/task/image/${taskId}/remark`, null, {
    params: { remark },
  });
};

/**
 * 添加视频任务备注
 */
export const addVideoTaskRemark = async (taskId: number, remark: string): Promise<void> => {
  return request.put(`/api/admin/task/video/${taskId}/remark`, null, {
    params: { remark },
  });
};

/**
 * 获取任务统计数据
 */
export const getTaskStats = async (): Promise<TaskStats> => {
  return request.get('/api/admin/task/stats');
};
