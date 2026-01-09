import request from './request';
import { DashboardStatsData, DashboardTrend } from '../types';

/**
 * 获取 Dashboard 统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStatsData> => {
  return request.get('/api/admin/dashboard/stats');
};

/**
 * 获取 Dashboard 趋势数据
 */
export const getDashboardTrend = async (days: number = 7): Promise<DashboardTrend> => {
  return request.get('/api/admin/dashboard/trend', {
    params: { days },
  });
};
