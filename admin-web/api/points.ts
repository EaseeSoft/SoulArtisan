import request from './request';
import { PageResult } from '../types';

/**
 * 积分记录信息
 */
export interface PointsRecord {
  id: number;
  siteId: number;
  userId: number;
  username?: string;
  nickname?: string;
  type: number;  // 1-收入 2-支出
  points: number;
  balance: number;
  source: string;
  sourceId: number | null;
  remark: string | null;
  operatorId: number | null;
  operatorName: string | null;
  createdAt: string;
}

/**
 * 积分配置信息
 */
export interface PointsConfig {
  id: number;
  siteId: number;
  configKey: string;
  configValue: number;
  configName: string;
  description: string | null;
  isEnabled: number;  // 0-禁用 1-启用
  createdAt: string;
  updatedAt: string;
}

/**
 * 积分记录查询请求
 */
export interface PointsRecordQueryRequest {
  userId?: number;
  username?: string;
  type?: number;
  source?: string;
}

/**
 * 积分调整请求
 */
export interface PointsAdjustRequest {
  userId: number;
  type: number;  // 1-增加 2-扣减
  points: number;
  remark?: string;
}

/**
 * 获取积分记录列表
 */
export const getPointsRecordList = async (
  pageNum: number = 1,
  pageSize: number = 10,
  query?: PointsRecordQueryRequest
): Promise<PageResult<PointsRecord>> => {
  return request.get('/api/admin/points/records', {
    params: { pageNum, pageSize, ...query },
  });
};

/**
 * 调整用户积分
 */
export const adjustPoints = async (data: PointsAdjustRequest): Promise<void> => {
  return request.post('/api/admin/points/adjust', data);
};

/**
 * 积分来源映射
 */
export const sourceLabels: Record<string, string> = {
  card_key: '卡密兑换',
  admin_adjust: '管理员调整',
  task_consume: '任务消耗',
  register: '注册赠送',
};

/**
 * 积分类型映射
 */
export const typeLabels: Record<number, string> = {
  1: '收入',
  2: '支出',
};

/**
 * 积分配置键映射
 */
export const configKeyLabels: Record<string, string> = {
  image_generation: '生成图片',
  video_10s: '生成10秒视频',
  video_15s: '生成15秒视频',
  video_25s: '生成25秒视频',
  gemini_chat: 'AI对话(每次)',
};

/**
 * 获取积分配置列表
 */
export const getPointsConfigList = async (): Promise<PointsConfig[]> => {
  return request.get('/api/admin/points/config/list');
};

/**
 * 更新积分配置
 */
export const updatePointsConfigs = async (configs: PointsConfig[]): Promise<void> => {
  return request.put('/api/admin/points/config/update', configs);
};

/**
 * 初始化积分配置
 */
export const initPointsConfigs = async (): Promise<PointsConfig[]> => {
  return request.post('/api/admin/points/config/init');
};
