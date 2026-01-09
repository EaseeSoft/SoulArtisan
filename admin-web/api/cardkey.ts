import request from './request';
import { PageResult } from '../types';

/**
 * 卡密信息
 */
export interface CardKey {
  id: number;
  siteId: number;
  cardCode: string;
  points: number;
  status: number;  // 0-未使用 1-已使用 2-已禁用
  batchNo: string;
  usedBy: number | null;
  usedAt: string | null;
  remark: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 生成卡密请求
 */
export interface CardKeyGenerateRequest {
  count: number;
  points: number;
  batchNo?: string;
  remark?: string;
  expiredAt?: string;
}

/**
 * 卡密查询请求
 */
export interface CardKeyQueryRequest {
  cardCode?: string;
  batchNo?: string;
  status?: number;
}

/**
 * 批量生成卡密
 */
export const generateCardKeys = async (
  data: CardKeyGenerateRequest
): Promise<CardKey[]> => {
  return request.post('/api/admin/cardkey/generate', data);
};

/**
 * 获取卡密列表
 */
export const getCardKeyList = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: CardKeyQueryRequest
): Promise<PageResult<CardKey>> => {
  return request.get('/api/admin/cardkey/list', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 获取卡密详情
 */
export const getCardKeyDetail = async (id: number): Promise<CardKey> => {
  return request.get(`/api/admin/cardkey/${id}`);
};

/**
 * 禁用卡密
 */
export const disableCardKey = async (id: number): Promise<void> => {
  return request.put(`/api/admin/cardkey/${id}/disable`);
};

/**
 * 启用卡密
 */
export const enableCardKey = async (id: number): Promise<void> => {
  return request.put(`/api/admin/cardkey/${id}/enable`);
};

/**
 * 删除卡密
 */
export const deleteCardKey = async (id: number): Promise<void> => {
  return request.delete(`/api/admin/cardkey/${id}`);
};

/**
 * 批量删除卡密
 */
export const batchDeleteCardKeys = async (ids: number[]): Promise<void> => {
  return request.delete('/api/admin/cardkey/batch', { data: ids });
};

/**
 * 获取批次号列表
 */
export const getBatchNoList = async (): Promise<string[]> => {
  return request.get('/api/admin/cardkey/batch-list');
};
