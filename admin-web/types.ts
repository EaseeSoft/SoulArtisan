export type Role = 'SYSTEM_ADMIN' | 'SITE_ADMIN';

export interface AdminUser {
  id: number;
  username: string;
  realName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: Role;
  siteId?: number;
  siteName?: string;
  status: number; // 0-禁用, 1-启用
  lastLoginTime?: string;
  lastLoginIp?: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  adminId: number;
  username: string;
  realName: string;
  role: Role;
  siteId?: number;
  siteName?: string;
}

export interface Site {
  id: number;
  siteName: string;
  siteCode: string;
  domain: string;
  logo?: string;
  description?: string;
  adminUsername: string;
  adminId?: number;
  adminRealName?: string;
  userCount?: number;
  projectCount?: number;
  status: number; // 0-禁用, 1-启用
  sort: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  resultUrl?: string;
  createdAt: string;
  userId: string;
  userName: string;
  note?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  totalTasks: number;
  storageUsed: string;
  userGrowth: { date: string; count: number }[];
  taskCompletion: { name: string; value: number }[];
}

export interface SiteConfig {
  siteId: number;
  // API 配置
  duomiApiKey?: string;
  duomiApiUrl?: string;
  geminiApiKey?: string;
  geminiApiUrl?: string;
  // 回调地址配置
  videoCallbackUrl?: string;
  characterCallbackUrl?: string;
  // COS 配置
  cosSecretId?: string;
  cosSecretKey?: string;
  cosBucket?: string;
  cosRegion?: string;
  cosCdnDomain?: string;
  // 系统配置
  maxUsers?: number;
  maxStorage?: number;
  // 站点展示配置
  displayName?: string;
  favicon?: string;
  themeColor?: string;
  footerText?: string;
  copyright?: string;
}

export interface SiteConfigRequest {
  // API 配置
  duomiApiKey?: string;
  duomiApiUrl?: string;
  geminiApiKey?: string;
  geminiApiUrl?: string;
  // 回调地址配置
  videoCallbackUrl?: string;
  characterCallbackUrl?: string;
  // COS 配置
  cosSecretId?: string;
  cosSecretKey?: string;
  cosBucket?: string;
  cosRegion?: string;
  cosCdnDomain?: string;
  // 系统配置
  maxUsers?: number;
  maxStorage?: number;
  // 站点展示配置
  displayName?: string;
  favicon?: string;
  themeColor?: string;
  footerText?: string;
  copyright?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SiteCreateRequest {
  siteName: string;
  siteCode: string;
  domain: string;
  logo?: string;
  description?: string;
  adminUsername: string;
  adminPassword: string;
  adminRealName: string;
  sort?: number;
}

export interface SiteUpdateRequest {
  siteName: string;
  domain: string;
  logo?: string;
  description?: string;
  sort?: number;
}

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  points?: number;
  role?: string;
  siteId?: number;
  siteName?: string;
  status: number; // 0-禁用, 1-启用
  createdAt: string;
  updatedAt?: string;
  projectCount?: number;
  imageTaskCount?: number;
  videoTaskCount?: number;
}

export interface UserQueryRequest {
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  status?: number;
  siteId?: number;
}

export interface UserStats {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  todayNewUsers: number;
  weekNewUsers: number;
  monthNewUsers: number;
}

// 任务管理相关类型
export interface ImageTask {
  id: number;
  userId: number;
  username: string;
  siteId: number;
  siteName: string;
  taskId: string;
  type: string;
  model: string;
  prompt: string;
  imageUrls: string[];
  aspectRatio: string;
  imageSize: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
  adminRemark?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface VideoTask {
  id: number;
  userId: number;
  username: string;
  siteId: number;
  siteName: string;
  taskId: string;
  prompt: string;
  imageUrls: string[];
  aspectRatio: string;
  duration: number;
  characters?: string;
  callbackUrl?: string;
  status: string;
  resultUrl?: string;
  errorMessage?: string;
  adminRemark?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskQueryRequest {
  userId?: number;
  status?: string;
  type?: string;
  model?: string;
  siteId?: number;
  startTime?: string;
  endTime?: string;
}

export interface TaskStats {
  totalImageTasks: number;
  totalVideoTasks: number;
  pendingImageTasks: number;
  pendingVideoTasks: number;
  processingImageTasks: number;
  runningVideoTasks: number;
  completedImageTasks: number;
  succeededVideoTasks: number;
  failedImageTasks: number;
  errorVideoTasks: number;
  todayNewImageTasks: number;
  todayNewVideoTasks: number;
  weekNewImageTasks: number;
  weekNewVideoTasks: number;
  monthNewImageTasks: number;
  monthNewVideoTasks: number;
}

// Dashboard 相关类型
export interface DashboardStatsData {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  todayNewUsers: number;
  weekNewUsers: number;
  monthNewUsers: number;
  totalImageTasks: number;
  totalVideoTasks: number;
  todayNewImageTasks: number;
  todayNewVideoTasks: number;
  imageTaskCompletionRate: number;
  videoTaskCompletionRate: number;
  totalProjects: number;
  todayNewProjects: number;
  totalCharacters: number;
  todayNewCharacters: number;
}

export interface DashboardTrend {
  dates: string[];
  userGrowth: number[];
  imageTasks: number[];
  videoTasks: number[];
  projects: number[];
}

// 日志管理相关类型
export interface AdminOperationLog {
  id: number;
  adminId: number;
  adminName: string;
  siteId?: number;
  module: string;
  operation: string;
  method: string;
  requestUrl?: string;
  requestParams?: string;
  params?: string;
  result?: string;
  responseResult?: string;
  ip: string;
  location?: string;
  userAgent?: string;
  status: number; // 0-失败, 1-成功
  errorMsg?: string;
  costTime: number;
  createdAt: string;
}

export interface AdminLoginLog {
  id: number;
  adminId?: number;
  username: string;
  ip: string;
  location?: string;
  browser?: string;
  os?: string;
  status: number; // 0-失败, 1-成功
  message?: string;
  createdAt: string;
}

export interface LogQueryRequest {
  adminId?: number;
  adminName?: string;
  siteId?: number;
  module?: string;
  operation?: string;
  status?: number;
  ip?: string;
  startTime?: string;
  endTime?: string;
}

// 增强统计相关类型
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  todayNewUsers: number;
  weekNewUsers: number;
  monthNewUsers: number;
  userGrowthTrend: TrendData[];
  userDistributionBySite?: SiteDistribution[];
}

export interface ContentStatistics {
  imageTaskStats: TaskStatistics;
  videoTaskStats: TaskStatistics;
  projectStats: ProjectStatistics;
  characterStats: CharacterStatistics;
}

export interface TaskStatistics {
  totalTasks: number;
  todayNewTasks: number;
  weekNewTasks: number;
  monthNewTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  completionRate: number;
  failureRate: number;
  creationTrend: TrendData[];
  popularModels: ModelStats[];
  errorAnalysis: ErrorStats[];
}

export interface ProjectStatistics {
  totalProjects: number;
  todayNewProjects: number;
  weekNewProjects: number;
  monthNewProjects: number;
}

export interface CharacterStatistics {
  totalCharacters: number;
  todayNewCharacters: number;
  weekNewCharacters: number;
  monthNewCharacters: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface SiteDistribution {
  siteId: number;
  siteName: string;
  userCount: number;
  [key: string]: any; // 为 recharts 兼容性添加索引签名
}

export interface ModelStats {
  model: string;
  count: number;
  percentage: number;
  [key: string]: any; // 为 recharts 兼容性添加索引签名
}

export interface ErrorStats {
  errorMessage: string;
  count: number;
  percentage: number;
}

// 系统配置相关类型
export interface SystemConfig {
  id?: number;
  // 基础展示配置
  systemTitle: string;        // 系统标题，显示在侧边栏/浏览器标题
  systemLogo?: string;        // 系统 Logo URL
  systemFavicon?: string;     // 浏览器 Favicon
  // 版权信息
  copyright?: string;         // 版权信息
  footerText?: string;        // 页脚附加文字
  icpBeian?: string;          // ICP备案号
  // 登录页配置
  loginBgImage?: string;      // 登录页背景图
  loginTitle?: string;        // 登录页标题
  loginSubtitle?: string;     // 登录页副标题
  // 主题配置
  primaryColor?: string;      // 主题色
  // 并发限制配置
  imageConcurrencyLimit?: number;   // 图片生成并发限制（0表示不限制）
  videoConcurrencyLimit?: number;   // 视频生成并发限制（0表示不限制）
  updatedAt?: string;
}

export interface SystemConfigRequest {
  systemTitle?: string;
  systemLogo?: string;
  systemFavicon?: string;
  copyright?: string;
  footerText?: string;
  icpBeian?: string;
  loginBgImage?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  primaryColor?: string;
  imageConcurrencyLimit?: number;
  videoConcurrencyLimit?: number;
}