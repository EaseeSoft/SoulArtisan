# AI视频生成平台 - 管理后台前端

## 项目概述

这是 AI 视频生成平台的管理后台前端项目，基于 React 19 + TypeScript + Vite 构建，使用 Ant Design 5.x 作为 UI 组件库。

## 技术栈

- **框架**: React 19.2.3
- **构建工具**: Vite 6.2.0
- **语言**: TypeScript 5.8.2
- **UI 组件**: Ant Design 5.22.6
- **路由**: React Router DOM 7.10.1
- **状态管理**: Zustand 5.0.2
- **HTTP 请求**: Axios 1.7.9
- **图标**: Lucide React 0.561.0
- **图表**: Recharts 3.6.0
- **样式**: Tailwind CSS (CDN)

## 项目结构

```
admin-web/
├── api/                    # API 请求模块
│   ├── request.ts         # Axios 封装和拦截器
│   ├── auth.ts            # 认证相关 API
│   └── site.ts            # 站点管理 API
├── components/            # 公共组件
│   └── Layout/            # 布局组件
│       ├── index.tsx      # 主布局
│       ├── Header.tsx     # 头部导航
│       └── Sidebar.tsx    # 侧边菜单
├── pages/                 # 页面组件
│   ├── Login/             # 登录页
│   ├── Dashboard/         # 仪表盘
│   ├── Site/              # 站点管理
│   ├── User/              # 用户管理
│   └── Content/           # 内容管理
├── store/                 # Zustand 状态管理
│   └── useAuthStore.ts    # 认证状态
├── types.ts               # TypeScript 类型定义
├── App.tsx                # 应用入口组件
├── index.tsx              # 应用挂载入口
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
└── package.json           # 项目依赖

```

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

## 快速开始

### 1. 安装依赖

```bash
cd admin-web
npm install
```

### 2. 配置环境变量

已创建 `.env.development` 文件，默认配置如下：

```env
VITE_API_BASE_URL=http://localhost:8080
```

如需修改后端 API 地址，请编辑此文件。

### 3. 启动开发服务器

```bash
npm run dev
```

启动后访问: http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录。

### 5. 预览生产构建

```bash
npm run preview
```

## 默认账号

### 系统管理员
- **用户名**: `admin`
- **密码**: `admin123`
- **权限**: 可管理所有站点、创建站点、查看所有数据

### 站点管理员
- **用户名**: `site_admin`
- **密码**: `site123`
- **权限**: 仅管理自己所属站点的数据

## 主要功能

### 已完成 (任务6-7)

#### 任务6: 前端项目初始化
- ✅ 技术栈配置 (React 19 + Vite + TypeScript + Ant Design)
- ✅ 路由配置 (React Router DOM)
- ✅ 状态管理 (Zustand)
- ✅ API 请求封装 (Axios + 拦截器)
  - 自动添加 Authorization 头
  - 统一错误处理
  - 401 自动跳转登录

#### 任务7: 登录与布局
- ✅ 登录页
  - 使用 Ant Design Form 组件
  - 对接后端登录 API
  - Token 存储和管理
- ✅ 主布局
  - 响应式布局
  - Header 组件 (搜索、通知、用户信息)
  - Sidebar 组件 (导航菜单、角色权限控制)
- ✅ 仪表盘页面
  - 统计卡片
  - 图表展示 (用户增长、任务完成率)

### 待开发 (任务8-12)

- ⏳ 站点管理 (系统管理员专属)
  - 站点列表、创建、编辑、删除
  - 站点状态管理
  - 重置站点管理员密码

- ⏳ 用户管理
  - 用户列表 (站点隔离)
  - 用户详情
  - 封禁/解封用户

- ⏳ 内容管理
  - 图片生成任务列表
  - 视频生成任务列表
  - 管理员备注

- ⏳ 日志管理
  - 操作日志查询
  - 登录日志查询

## API 对接说明

### 请求格式

所有 API 请求会自动添加以下 Header：

```
Authorization: Bearer {token}
Content-Type: application/json
```

### 响应格式

后端统一响应格式：

```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```

### 错误处理

- **401**: 自动清除 token 并跳转到登录页
- **403**: 显示 "权限不足" 提示
- **404**: 显示 "请求的资源不存在"
- **500**: 显示服务器错误信息
- **网络错误**: 显示 "网络错误，请检查网络连接"

## 状态管理

使用 Zustand 管理全局状态，主要包括：

### useAuthStore (认证状态)

```typescript
{
  user: AdminUser | null,        // 当前登录用户
  isLoading: boolean,            // 加载状态
  isAuthenticated: boolean,      // 是否已认证
  setUser: (user) => void,       // 设置用户
  loadUser: () => Promise<void>, // 加载用户信息
  logout: () => Promise<void>,   // 登出
  isSystemAdmin: () => boolean,  // 是否系统管理员
  isSiteAdmin: () => boolean,    // 是否站点管理员
}
```

## 路由配置

| 路径 | 组件 | 权限要求 | 说明 |
|------|------|----------|------|
| `/login` | Login | 公开 | 登录页 |
| `/dashboard` | Dashboard | 需登录 | 仪表盘 |
| `/sites` | SiteList | 系统管理员 | 站点列表 |
| `/sites/create` | CreateSite | 系统管理员 | 创建站点 |
| `/sites/edit/:id` | EditSite | 系统管理员 | 编辑站点 |
| `/users` | UserList | 需登录 | 用户列表 |
| `/tasks/images` | ImageTaskList | 需登录 | 图片任务 |
| `/tasks/videos` | VideoTaskList | 需登录 | 视频任务 |
| `/logs/operation` | - | 需登录 | 操作日志 |
| `/logs/login` | - | 需登录 | 登录日志 |

## 权限控制

### 路由级别
- Layout 组件会检查 `isAuthenticated`，未登录自动跳转到 `/login`
- 登录状态下访问 `/login` 会自动跳转到 `/dashboard`

### 菜单级别
- Sidebar 使用 `isSystemAdmin()` 判断是否显示"站点管理"菜单项
- 站点管理员只能看到用户管理和内容管理菜单

### API 级别
- 所有 API 请求自动携带 token
- 后端会验证权限，前端拦截器统一处理 403 错误

## 开发建议

### 添加新页面

1. 在 `pages/` 下创建页面组件
2. 在 `App.tsx` 中添加路由配置
3. 在 `Sidebar.tsx` 中添加菜单项（如需要）

### 添加新 API

1. 在 `api/` 下创建对应的 API 模块
2. 使用 `request` 实例发起请求
3. 定义 TypeScript 类型在 `types.ts`

### 状态管理

简单的页面状态使用 React Hooks (useState, useEffect)
跨组件共享的状态考虑使用 Zustand store

## 常见问题

### Q: 如何修改 API 地址？
A: 编辑 `.env.development` 文件中的 `VITE_API_BASE_URL`

### Q: 如何调试 API 请求？
A: 在浏览器开发者工具的 Network 标签查看请求和响应

### Q: Token 过期后如何处理？
A: 拦截器会自动捕获 401 错误，清除 token 并跳转到登录页

### Q: 如何添加新的权限角色？
A:
1. 在 `types.ts` 的 `Role` 类型中添加新角色
2. 在 `useAuthStore.ts` 中添加对应的判断方法
3. 在需要的地方使用该方法进行权限控制

## 下一步开发

根据开发计划 DEVELOPMENT_PLAN.md，接下来需要完成：

1. **站点管理页面** (Week 2)
   - 站点列表页
   - 创建站点页
   - 编辑站点页

2. **用户管理页面** (Week 3)
   - 用户列表页
   - 用户详情页

3. **内容管理页面** (Week 3-4)
   - 图片任务列表
   - 视频任务列表

4. **日志管理页面** (Week 5)
   - 操作日志页
   - 登录日志页

## 联系方式

如有问题，请查阅项目文档或联系开发团队。
