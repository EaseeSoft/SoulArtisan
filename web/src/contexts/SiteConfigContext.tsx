/**
 * 站点配置 Context
 * 用于全局管理和访问站点配置信息
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SitePublicConfig, getSiteConfigByDomain, getSiteConfigByCode } from '../api/site';
import SiteClosed from '../components/pages/SiteClosed';

interface SiteConfigContextType {
  config: SitePublicConfig | null;
  loading: boolean;
  error: string | null;
  siteClosed: boolean;
  refresh: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

interface SiteConfigProviderProps {
  children: ReactNode;
  siteCode?: string;
}

/**
 * 获取当前站点域名
 */
const getCurrentDomain = (): string => {
  return window.location.hostname;
};

/**
 * 应用主题色到页面
 */
const applyThemeColor = (color: string | undefined) => {
  if (color) {
    document.documentElement.style.setProperty('--primary-color', color);
    // 计算浅色版本用于 hover 效果
    document.documentElement.style.setProperty('--primary-color-light', `${color}20`);
  }
};

/**
 * 应用 favicon 到页面
 */
const applyFavicon = (faviconUrl: string | undefined) => {
  if (faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }
};

/**
 * 应用站点标题到页面
 */
const applySiteTitle = (title: string | undefined) => {
  if (title) {
    document.title = title;
  }
};

export const SiteConfigProvider: React.FC<SiteConfigProviderProps> = ({ children, siteCode }) => {
  const [config, setConfig] = useState<SitePublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteClosed, setSiteClosed] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      setSiteClosed(false);

      let siteConfig: SitePublicConfig;

      if (siteCode) {
        // 如果指定了站点编码，使用编码获取
        siteConfig = await getSiteConfigByCode(siteCode);
      } else {
        // 否则使用当前域名获取
        const domain = getCurrentDomain();
        siteConfig = await getSiteConfigByDomain(domain);
      }

      setConfig(siteConfig);

      // 应用站点配置到页面
      applyThemeColor(siteConfig.themeColor);
      applyFavicon(siteConfig.favicon);
      applySiteTitle(siteConfig.displayName);
    } catch (err: any) {
      console.error('Failed to load site config:', err);

      // 检测500错误：检查HTTP状态码或业务状态码
      const httpStatus = err?.response?.status;
      const businessCode = err?.response?.data?.code || err?.code;
      const is500Error = httpStatus === 500 || businessCode === 500 || String(businessCode) === '500';

      if (is500Error) {
        // 站点关闭，设置标记
        setSiteClosed(true);
        setError('站点已关闭');
      } else {
        setError(err instanceof Error ? err.message : '加载站点配置失败');

        // 使用默认配置（非500错误时）
        setConfig({
          siteId: 0,
          siteCode: 'default',
          siteName: 'AI Agent Video',
          displayName: 'AI Agent Video',
          domain: getCurrentDomain(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [siteCode]);

  // 如果站点已关闭，渲染站点关闭页面
  if (siteClosed) {
    return <SiteClosed />;
  }

  return (
    <SiteConfigContext.Provider value={{ config, loading, error, siteClosed, refresh: fetchConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

/**
 * 使用站点配置的 Hook
 */
export const useSiteConfig = (): SiteConfigContextType => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};

export default SiteConfigContext;
