# 项目架构文档

## 项目概述

**项目名称**: auto-prompt (AI Prompt Optimization Platform)
**项目类型**: 专业AI提示词优化、调试和分享平台
**技术架构**: 全栈Web应用 (.NET 9.0 + React 19.1.0)
**开发状态**: 活跃开发中
**许可证**: LGPL
**官方网站**: https://token-ai.cn

### 核心价值
- **智能优化**: 基于先进AI算法自动分析和优化提示词结构
- **深度推理**: 提供多维度思考分析，深度理解用户需求
- **社区分享**: 发现和分享高质量提示词模板，与社区用户交流经验
- **可视化调试**: 强大的调试环境，实时预览提示词效果

## 技术栈架构

### 后端架构 (.NET Core)
- **框架**: ASP.NET Core
- **语言**: C# (.NET)
- **项目结构**:
  - `Console.Service` - 主要服务层
  - `Console.Core` - 核心业务逻辑
  - `Console.Provider.Sqlite` - SQLite数据提供者
  - `Console.Provider.PostgreSQL` - PostgreSQL数据提供者

### 前端架构 (React + TypeScript)
- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design v5
- **编辑器**: TipTap (富文本编辑)
- **状态管理**: Zustand
- **路由**: React Router v7
- **样式**: Tailwind CSS + Styled Components

### 数据层
- **主数据库**: SQLite (开发) / PostgreSQL (生产)
- **数据文件**: `data/ConsoleService.db`
- **ORM/数据访问**: Entity Framework Core (推测)

### 部署架构
- **容器化**: Docker + Docker Compose
- **多环境支持**:
  - DeepSeek AI
  - Google AI
  - Ollama (本地)
  - VolcEngine (火山引擎)

## 核心功能模块

### 1. 智能提示词优化
- **自动结构分析**: 深度分析提示词的语义结构和逻辑关系
- **多维度优化**: 从清晰度、准确性、完整性等多个维度进行优化
- **深度推理模式**: 启用AI深度思考，提供详细的分析过程
- **实时生成**: 流式输出优化结果，实时查看生成过程

### 2. 提示词模板管理
- **模板创建**: 将优化后的提示词保存为可复用的模板
- **标签分类**: 支持多标签分类管理，便于搜索和整理
- **收藏功能**: 收藏喜爱的模板，快速访问常用提示词
- **使用统计**: 跟踪模板使用情况和效果反馈

### 3. 社区分享平台
- **公开分享**: 与社区用户分享高质量模板
- **热度排行**: 根据浏览量、点赞数等展示热门模板
- **搜索发现**: 强大的搜索功能，快速找到所需模板
- **互动交流**: 点赞、评论、收藏等社交功能

### 4. AI集成服务
- **多AI提供商支持**: OpenAI、DeepSeek、Google AI、Ollama、VolcEngine
- **Semantic Kernel集成**: 使用Microsoft Semantic Kernel进行AI编排
- **API密钥管理**: 支持自定义API密钥和端点配置
- **流式响应**: Server-Sent Events (SSE) 实现实时通信

### 5. 用户管理系统
- **用户认证**: JWT Token认证和授权控制
- **个人中心**: 用户资料管理和偏好设置
- **API Key管理**: 个人API密钥创建和管理
- **使用统计**: 个人使用数据和历史记录

### 6. 数据可视化
- **Ant Design Charts**: 丰富的图表组件
- **使用分析**: 提示词使用情况和效果分析
- **社区统计**: 社区活跃度和内容统计

## 开发工具链

### 构建和开发
- **后端**: dotnet CLI
- **前端**: npm/yarn + Vite
- **代码质量**: ESLint + TypeScript
- **包管理**: NuGet + npm

### 部署工具
- Docker容器化
- Shell脚本自动化
- 多环境配置管理

## 项目特点

### 技术优势
- 现代化技术栈
- 微服务架构设计
- 多数据库支持
- 容器化部署

### 业务特点
- AI提示词管理
- 多AI提供商集成
- 用户友好界面
- 可扩展架构

## 开发规范

### 代码组织
- 清晰的项目分层
- 模块化设计
- 依赖注入模式
- 配置外部化

### 最佳实践
- TypeScript严格模式
- 组件化开发
- 响应式设计
- 性能优化

---

*最后更新: 2025-06-28*  
*架构版本: v1.0*
