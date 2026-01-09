import request from './request';
import { AdminOperationLog, AdminLoginLog, LogQueryRequest, PageResult } from '../types';

/**
 * 获取操作日志列表
 */
export const getOperationLogs = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: LogQueryRequest
): Promise<PageResult<AdminOperationLog>> => {
  return request.get('/api/admin/log/operation/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取登录日志列表
 */
export const getLoginLogs = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: LogQueryRequest
): Promise<PageResult<AdminLoginLog>> => {
  return request.get('/api/admin/log/login/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取操作日志详情
 */
export const getOperationLogDetail = async (logId: number): Promise<AdminOperationLog> => {
  return request.get(`/api/admin/log/operation/${logId}`);
};

/**
 * 获取登录日志详情
 */
export const getLoginLogDetail = async (logId: number): Promise<AdminLoginLog> => {
  return request.get(`/api/admin/log/login/${logId}`);
};
