import { create } from 'zustand';
import { SystemConfig } from '../types';
import { getPublicSystemConfig } from '../api/system';

// 默认配置
const DEFAULT_CONFIG: SystemConfig = {
  systemTitle: '易企漫剧平台',
  systemLogo: '',
  systemFavicon: '',
  copyright: '© 2025 易企漫剧平台',
  footerText: '',
  icpBeian: '',
  loginBgImage: '',
  loginTitle: '易企漫剧平台',
  loginSubtitle: '登录以继续使用系统',
  primaryColor: '#6366f1',
};

interface SystemConfigState {
  config: SystemConfig;
  isLoading: boolean;
  isLoaded: boolean;
  setConfig: (config: SystemConfig) => void;
  loadConfig: () => Promise<void>;
  updateFavicon: (faviconUrl: string) => void;
  updateTitle: (title: string) => void;
}

export const useSystemConfigStore = create<SystemConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoading: false,
  isLoaded: false,

  setConfig: (config) => {
    set({ config: { ...DEFAULT_CONFIG, ...config } });
    // 更新页面 favicon 和 title
    get().updateFavicon(config.systemFavicon || '');
    get().updateTitle(config.systemTitle || DEFAULT_CONFIG.systemTitle);
  },

  loadConfig: async () => {
    const { isLoaded, isLoading } = get();
    if (isLoaded || isLoading) return;

    set({ isLoading: true });
    try {
      const config = await getPublicSystemConfig();
      set({
        config: { ...DEFAULT_CONFIG, ...config },
        isLoading: false,
        isLoaded: true,
      });
      // 更新页面 favicon 和 title
      get().updateFavicon(config.systemFavicon || '');
      get().updateTitle(config.systemTitle || DEFAULT_CONFIG.systemTitle);
    } catch (error) {
      // 加载失败使用默认配置
      set({
        config: DEFAULT_CONFIG,
        isLoading: false,
        isLoaded: true,
      });
      console.error('加载系统配置失败:', error);
    }
  },

  updateFavicon: (faviconUrl: string) => {
    if (!faviconUrl) return;

    // 更新或创建 favicon link 标签
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  },

  updateTitle: (title: string) => {
    document.title = title;
  },
}));
