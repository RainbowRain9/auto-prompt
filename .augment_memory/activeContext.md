# 当前工作上下文

## 会话信息
- **会话开始时间**: 2025-06-28
- **当前任务**: 项目初始化 (augment_init)
- **工作状态**: 进行中
- **优先级**: 高

## 项目当前状态

### 基本信息
- **项目名称**: auto-prompt
- **项目类型**: AI提示词管理平台
- **开发阶段**: 活跃开发中
- **技术架构**: .NET Core + React 全栈应用

### 技术栈检测结果
- **后端**: ASP.NET Core Web API (.NET Core)
- **前端**: React 19 + TypeScript + Vite
- **数据库**: SQLite (开发) + PostgreSQL (生产)
- **UI框架**: Ant Design v5
- **编辑器**: TipTap富文本编辑器
- **状态管理**: Zustand
- **部署**: Docker + Docker Compose

### 项目结构分析
```
auto-prompt/
├── src/                    # .NET后端源码
│   ├── Console.Core/      # 核心业务逻辑
│   ├── Console.Service/   # Web API服务
│   └── Provider/          # 数据访问层
├── web/                   # React前端源码
│   ├── src/              # 前端源码
│   ├── public/           # 静态资源
│   └── package.json      # 前端依赖
├── data/                  # 数据文件
├── docs/                  # 项目文档
└── docker-compose*.yaml  # 多环境部署配置
```

## 当前任务进度

### ✅ 已完成
1. **环境检查**: 确认项目根目录和现有配置
2. **技术栈检测**: 识别.NET + React全栈架构
3. **记忆系统创建**: 
   - ✅ 核心架构文档 (architecture.md)
   - ✅ 开发模式文档 (patterns.md)
   - ✅ 技术决策记录 (decisions.md)
   - ✅ 最佳实践文档 (best-practices.md)
   - ✅ 技术栈详情 (tech-stack.md)
   - ✅ 工作记忆文件 (activeContext.md)

### ✅ 已完成 (新增)
4. **项目分析和上下文建立**:
   - ✅ 项目整体分析 (使用codebase-retrieval)
   - ✅ 关键文件分析 (README.md, Program.cs等)
   - ✅ 架构信息完善 (更新architecture.md)
5. **管理文件创建**:
   - ✅ 记忆索引文件 (memory-index.md)
   - ✅ 会话历史记录 (session-history.md)

### 🔄 进行中
6. **初始化验证和确认**

### ⏳ 待完成
7. **工具记忆更新**
8. **项目概览总结**

## 关键发现 (深度分析结果)

### 项目特点
- **专业AI平台**: 专注于AI提示词优化、调试和分享的专业平台
- **现代化技术栈**: .NET 9.0 + React 19.1.0，使用最新技术
- **多AI提供商支持**: 支持OpenAI、DeepSeek、Google AI、Ollama、VolcEngine
- **Semantic Kernel集成**: 使用Microsoft Semantic Kernel进行AI编排
- **社区驱动**: 完整的社区分享功能，包括点赞、评论、收藏
- **富文本编辑**: 集成TipTap编辑器，支持复杂的提示词编辑
- **类型安全**: 前后端都使用强类型语言 (C# + TypeScript)

### 核心业务功能
- **智能优化**: 自动结构分析、多维度优化、深度推理模式
- **模板管理**: 创建、分类、收藏、统计完整的模板生命周期
- **社区平台**: 公开分享、热度排行、搜索发现、互动交流
- **用户系统**: JWT认证、个人中心、API密钥管理
- **数据可视化**: 使用分析、社区统计、效果展示

### 架构优势
- **分层架构**: Console.Core (业务) + Console.Service (API) + Provider (数据)
- **多数据库支持**: Provider模式支持SQLite和PostgreSQL
- **组件化开发**: React组件化 + Ant Design组件库
- **流式通信**: Server-Sent Events (SSE) 实现实时通信
- **容器化部署**: 完整的Docker配置，支持多环境
- **性能优化**: Vite构建 + 代码分割 + 缓存策略

### 技术亮点
- **Semantic Kernel**: 使用微软AI编排框架
- **流式响应**: SSE实现实时AI响应
- **API代理**: OpenAI兼容接口代理
- **MCP集成**: Model Context Protocol支持
- **多环境配置**: 支持不同AI提供商的灵活配置

### 开发工具链
- **前端**: Vite + ESLint + TypeScript + React 19
- **后端**: .NET CLI + Entity Framework Core + Serilog
- **AI框架**: Microsoft Semantic Kernel
- **部署**: Docker + Shell脚本自动化
- **代码质量**: 严格的TypeScript配置 + ESLint规则
- **API文档**: Scalar OpenAPI文档生成

## 即时目标

### 短期目标 (当前会话)
1. 完成项目整体分析和代码库理解
2. 创建完整的记忆索引和会话历史
3. 验证初始化成功并提供项目概览
4. 为后续开发工作建立良好的上下文基础

### 中期目标 (后续会话)
1. 深入分析现有代码结构和业务逻辑
2. 识别潜在的改进点和优化机会
3. 建立完整的开发工作流和最佳实践
4. 支持新功能开发和代码重构

## 注意事项

### 技术约束
- React 19相对较新，需要注意兼容性问题
- 多AI提供商集成需要统一的接口设计
- 容器化部署需要考虑环境变量管理

### 开发重点
- 保持前后端类型安全
- 优化富文本编辑器性能
- 确保多数据库兼容性
- 维护良好的代码质量

### 安全考虑
- API密钥安全管理
- 用户输入验证和XSS防护
- 数据库访问权限控制

---

*最后更新: 2025-06-28 (初始化过程中)*  
*状态: 活跃工作中*
