/**
 * 站点配置 API
 */
import { get } from '../utils/request';

/**
 * 站点公开配置响应
 */
export interface SitePublicConfig {
  siteId: number;
  siteCode: string;
  siteName: string;
  displayName: string;
  domain: string;
  logo?: string;
  favicon?: string;
  themeColor?: string;
  description?: string;
  footerText?: string;
  copyright?: string;
}

/**
 * API 响应格式
 */
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 根据域名获取站点公开配置
 */
export const getSiteConfigByDomain = async (domain: string): Promise<SitePublicConfig> => {
  const response = await get<ApiResponse<SitePublicConfig>>(`/api/site/config?domain=${encodeURIComponent(domain)}`);
  return response.data.data;
};

/**
 * 根据站点编码获取站点公开配置
 */
export const getSiteConfigByCode = async (siteCode: string): Promise<SitePublicConfig> => {
  const response = await get<ApiResponse<SitePublicConfig>>(`/api/site/config/code/${siteCode}`);
  return response.data.data;
};

/**
 * 根据站点ID获取站点公开配置
 */
export const getSiteConfigById = async (siteId: number): Promise<SitePublicConfig> => {
  const response = await get<ApiResponse<SitePublicConfig>>(`/api/site/config/id/${siteId}`);
  return response.data.data;
};
