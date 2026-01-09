import request from './request';
import { UserStatistics, ContentStatistics } from '../types';

/**
 * 获取用户统计数据
 */
export const getUserStatistics = async (): Promise<UserStatistics> => {
  return request.get('/api/admin/stats/user');
};

/**
 * 获取内容统计数据
 */
export const getContentStatistics = async (): Promise<ContentStatistics> => {
  return request.get('/api/admin/stats/content');
};
