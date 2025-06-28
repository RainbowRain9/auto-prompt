# 技术栈详细信息

## 项目技术栈概览

**项目类型**: 全栈Web应用 - AI提示词管理平台  
**架构模式**: 前后端分离 + 微服务架构  
**部署方式**: Docker容器化 + 多环境支持  

## 后端技术栈 (.NET Core)

### 核心框架
- **运行时**: .NET Core (最新LTS版本)
- **Web框架**: ASP.NET Core Web API
- **语言**: C# (最新版本)
- **架构模式**: 分层架构 + 依赖注入

### 项目结构
```
src/
├── Console.Core/                    # 核心业务逻辑层
│   ├── Entities/                   # 实体模型
│   ├── Interfaces/                 # 接口定义
│   ├── Services/                   # 业务服务
│   └── DTOs/                       # 数据传输对象
├── Console.Service/                 # Web API服务层
│   ├── Controllers/                # API控制器
│   ├── Middleware/                 # 中间件
│   └── Program.cs                  # 应用入口
└── Console.Provider.*/              # 数据访问层
    ├── Console.Provider.Sqlite/    # SQLite提供者
    └── Console.Provider.PostgreSQL/ # PostgreSQL提供者
```

### 数据访问
- **ORM**: Entity Framework Core
- **数据库**: 
  - SQLite (开发环境)
  - PostgreSQL (生产环境)
- **模式**: Repository + Unit of Work
- **迁移**: EF Core Migrations

### 关键特性
- **依赖注入**: 内置DI容器
- **配置管理**: appsettings.json + 环境变量
- **日志记录**: ILogger + Serilog (推荐)
- **异常处理**: 全局异常中间件
- **API文档**: Swagger/OpenAPI

## 前端技术栈 (React)

### 核心框架
- **框架**: React 19
- **语言**: TypeScript
- **构建工具**: Vite
- **包管理器**: npm

### UI和样式
- **UI组件库**: Ant Design v5
- **图标**: @ant-design/icons + Lucide React
- **样式方案**: 
  - Tailwind CSS (原子化CSS)
  - Styled Components (CSS-in-JS)
- **图表库**: 
  - @ant-design/charts
  - Recharts

### 状态管理和路由
- **状态管理**: Zustand
- **路由**: React Router v7
- **表单处理**: Ant Design Form
- **数据获取**: 原生fetch + 自定义hooks

### 编辑器和工具
- **富文本编辑**: TipTap
  - @tiptap/react
  - @tiptap/starter-kit
  - @tiptap/extension-*
- **代码高亮**: 
  - Prism.js
  - react-syntax-highlighter
- **Markdown**: react-markdown

### 国际化和工具
- **国际化**: i18next + react-i18next
- **语言检测**: i18next-browser-languagedetector
- **时间处理**: dayjs
- **本地存储**: idb (IndexedDB)

### 开发工具
- **代码检查**: ESLint
- **类型检查**: TypeScript
- **构建优化**: Vite + Terser
- **热重载**: Vite HMR

## 开发工具链

### 代码质量
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### TypeScript配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Vite配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          editor: ['@tiptap/react', '@tiptap/starter-kit']
        }
      }
    }
  }
})
```

## 部署和运维

### 容器化
- **容器**: Docker
- **编排**: Docker Compose
- **多环境**: 
  - docker-compose.yaml (默认)
  - docker-compose-deepseek.yaml
  - docker-compose-google.yaml
  - docker-compose-ollama.yaml
  - docker-compose-volcengine.yaml

### 环境配置
```yaml
# docker-compose.yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=${DB_CONNECTION}
      - AI__ApiKey=${AI_API_KEY}
    volumes:
      - ./data:/app/data
```

### 部署脚本
- **Linux**: `deploy.sh`
- **Windows**: `start-ollama.bat`
- **跨平台**: `start-ollama.sh`

## AI集成支持

### 支持的AI提供商
1. **OpenAI**: GPT系列模型
2. **DeepSeek**: 国产AI模型
3. **Google AI**: Gemini系列
4. **Ollama**: 本地AI模型
5. **VolcEngine**: 火山引擎AI

### 集成方式
```typescript
// 前端AI客户端
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
  dangerouslyAllowBrowser: true
});
```

## 性能特性

### 前端优化
- **代码分割**: 动态导入 + React.lazy
- **缓存策略**: Service Worker + 浏览器缓存
- **包体积优化**: Tree shaking + 代码压缩
- **渲染优化**: React.memo + useMemo + useCallback

### 后端优化
- **异步编程**: async/await 模式
- **数据库优化**: 查询优化 + 索引策略
- **缓存**: 内存缓存 + 分布式缓存
- **API性能**: 分页 + 过滤 + 排序

## 安全特性

### 前端安全
- **XSS防护**: 内容过滤 + CSP策略
- **CSRF防护**: Token验证
- **输入验证**: 客户端 + 服务端双重验证

### 后端安全
- **身份验证**: JWT Token
- **授权控制**: 基于角色的访问控制
- **数据验证**: 模型验证 + 自定义验证器
- **HTTPS**: SSL/TLS加密传输

## 监控和日志

### 日志系统
- **结构化日志**: JSON格式
- **日志级别**: Debug/Info/Warning/Error
- **日志存储**: 文件 + 数据库
- **日志分析**: 可集成ELK Stack

### 性能监控
- **应用性能**: APM工具集成
- **数据库性能**: 查询分析
- **前端性能**: Web Vitals监控

---

*最后更新: 2025-06-28*  
*技术栈版本: v1.0*
