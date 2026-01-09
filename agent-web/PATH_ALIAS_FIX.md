# 路径别名配置修复说明

## 问题
```
[plugin:vite:import-analysis] Failed to resolve import "@/api/workflowProject" from "src/components/dashboard/hooks/useWorkflowStore.ts"
```

## 原因
项目缺少路径别名 `@` 的配置，导致无法解析 `@/api/workflowProject` 这样的导入路径。

## 解决方案

### 1. 更新 `vite.config.ts`
添加路径别名配置：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'  // ← 新增

export default defineConfig({
  plugins: [react()],
  resolve: {              // ← 新增
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ...
})
```

### 2. 更新 `tsconfig.app.json`
添加 TypeScript 路径映射：

```json
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    // ...
  }
}
```

### 3. 安装依赖（如果需要）
```bash
npm install --save-dev @types/node
```

### 4. 重启开发服务器
```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm run dev
```

## 验证
现在可以使用以下导入方式：

```typescript
// ✅ 使用别名（推荐）
import { createProject } from '@/api/workflowProject';
import { useWorkflowStore } from '@/components/dashboard/hooks/useWorkflowStore';

// ✅ 使用相对路径（也可以）
import { createProject } from '../../../api/workflowProject';
```

## 其他修改

### `workflowProject.ts` 使用 request 工具类
参考 `auth.ts` 的写法，现在使用统一的 request 工具类：

```typescript
// ❌ 旧写法
import axios from 'axios';
const response = await axios.post('/api/workflow/project', data);

// ✅ 新写法
import { post } from '../utils/request';
const response = await post<ApiResponse>('/api/workflow/project', data);
```

**优点**：
- 自动添加 JWT Token
- 统一错误处理
- 统一的请求/响应拦截
- 401 自动跳转登录页

## 注意事项

1. **导入路径一致性**：项目中建议统一使用 `@/` 别名
2. **重启服务器**：修改配置文件后必须重启开发服务器
3. **IDE 重启**：如果 VSCode 还报错，尝试重启 VSCode
