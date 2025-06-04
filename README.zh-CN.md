# AI 提示词优化平台

<div align="center">

![AI Prompt Optimizer](https://img.shields.io/badge/AI-Prompt%20Optimizer-blue?style=for-the-badge&logo=openai)
![License](https://img.shields.io/badge/License-LGPL-green?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-9.0-purple?style=for-the-badge&logo=dotnet)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)

**专业的AI提示词优化、调试和分享平台**

[🚀 快速开始](#快速开始) • [📖 功能特性](#功能特性) • [🛠️ 技术栈](#技术栈) • [📦 部署指南](#部署指南) • [🤝 贡献指南](#贡献指南)

</div>

---

## 📋 项目简介

AI 提示词优化平台是一个专业的提示词工程工具，旨在帮助用户优化AI模型的提示词，提升AI对话效果和响应准确性。平台集成了智能优化算法、深度推理分析、可视化调试工具和社区分享功能，为AI应用开发者和内容创作者提供全方位的提示词优化解决方案。

### 🎯 核心价值

- **智能优化**: 基于先进的AI算法，自动分析和优化提示词结构
- **深度推理**: 提供多维度思考分析，深入理解用户需求
- **社区分享**: 发现和分享优质提示词模板，与社区用户交流经验
- **可视化调试**: 强大的调试环境，实时预览提示词效果

## ✨ 功能特性

### 🧠 智能提示词优化

- **自动结构分析**: 深度分析提示词的语义结构和逻辑关系
- **多维度优化**: 从清晰度、准确性、完整性等多个维度进行优化
- **深度推理模式**: 启用AI深度思考，提供详细的分析过程
- **实时生成**: 流式输出优化结果，实时查看生成过程

### 📚 提示词模板管理

- **模板创建**: 将优化后的提示词保存为可复用模板
- **标签分类**: 支持多标签分类管理，便于查找和组织
- **收藏功能**: 收藏喜欢的模板，快速访问常用提示词
- **使用统计**: 跟踪模板使用情况和效果反馈

### 🌐 社区分享平台

- **公开分享**: 将优质模板分享给社区用户
- **热度排行**: 按查看数、点赞数等维度展示热门模板
- **搜索发现**: 强大的搜索功能，快速找到需要的模板
- **互动交流**: 点赞、评论、收藏等社交功能

### 🔧 调试与测试工具

- **可视化界面**: 直观的用户界面，简化操作流程
- **实时预览**: 即时查看提示词优化效果
- **历史记录**: 保存优化历史，支持版本对比
- **导出功能**: 支持多种格式导出优化结果

### 🌐 多语言支持

- **语言切换**: 支持中英文界面切换
- **实时翻译**: 无需刷新页面即可切换语言
- **本地化内容**: 所有界面元素完全本地化
- **浏览器检测**: 根据浏览器设置自动检测语言

## 🛠️ 技术栈

### 后端技术

- **框架**: .NET 9.0 + ASP.NET Core
- **AI引擎**: Microsoft Semantic Kernel 1.54.0
- **数据库**: PostgreSQL + Entity Framework Core
- **认证**: JWT Token 认证
- **日志**: Serilog 结构化日志
- **API文档**: Scalar OpenAPI

### 前端技术

- **框架**: React 19.1.0 + TypeScript
- **UI组件**: Ant Design 5.25.3
- **路由**: React Router DOM 7.6.1
- **状态管理**: Zustand 5.0.5
- **样式**: Styled Components 6.1.18
- **构建工具**: Vite 6.3.5

### 核心依赖

- **AI模型集成**: OpenAI API 兼容接口
- **实时通信**: Server-Sent Events (SSE)
- **数据存储**: IndexedDB (客户端缓存)
- **富文本编辑**: TipTap 编辑器
- **代码高亮**: Prism.js + React Syntax Highlighter
- **国际化**: React i18next 多语言支持

## 📦 部署指南

### 环境要求

- Docker & Docker Compose
- .NET 9.0 SDK (开发环境)
- Node.js 18+ (开发环境)

### 🚀 快速开始

1. 克隆项目
   
```bash
git clone https://github.com/AIDotNet/auto-prompt.git
cd auto-prompt
```

2. 使用 Docker Compose 部署

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

3. 访问应用

- 前端界面: http://localhost:10426
- API文档: http://localhost:10426/scalar/v1

### 🔧 开发环境配置

1. 后端开发

```bash
cd src/Console.Service
dotnet restore
dotnet run
```

2. 前端开发

```bash
cd web
npm install
npm run dev
```

### 🌐 环境变量配置

在 `src/Console.Service/appsettings.json` 中配置：

```json
{
  "GenerateModel": "gpt-4o",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=prompt_db;Username=postgres;Password=your_password"
  },
  "Jwt": {
    "Key": "your_jwt_secret_key",
    "Issuer": "auto-prompt",
    "Audience": "auto-prompt-users"
  }
}
```

## 🏗️ 项目结构

```
auto-prompt/
├── src/
│   └── Console.Service/          # 后端服务
│       ├── Controllers/          # API控制器
│       ├── Services/             # 业务服务
│       ├── Entities/             # 数据实体
│       ├── Dto/                  # 数据传输对象
│       ├── DbAccess/             # 数据访问层
│       ├── plugins/              # AI插件配置
│       │   └── Generate/         # 提示词生成插件
│       │       ├── DeepReasoning/           # 深度推理
│       │       ├── DeepReasoningPrompt/     # 深度推理提示词
│       │       └── OptimizeInitialPrompt/   # 初始优化
│       └── Migrations/           # 数据库迁移
├── web/                          # 前端应用
│   ├── src/
│   │   ├── components/           # React组件
│   │   │   ├── GeneratePrompt/   # 提示词生成组件
│   │   │   ├── Workbench/        # 工作台
│   │   │   ├── DashboardPage/    # 仪表板
│   │   │   └── PromptsPage/      # 提示词管理
│   │   ├── stores/               # 状态管理
│   │   ├── api/                  # API接口
│   │   ├── styles/               # 样式文件
│   │   └── utils/                # 工具函数
│   ├── public/                   # 静态资源
│   └── dist/                     # 构建输出
├── docker-compose.yaml           # Docker编排配置
└── README.md                     # 项目文档
```

## 🎮 使用指南

### 1. 提示词优化

1. 在工作台中输入需要优化的提示词
2. 描述具体需求和期望效果
3. 选择是否启用深度推理模式
4. 点击"生成"开始优化过程
5. 查看优化结果和推理过程

### 2. 模板管理

1. 将优化后的提示词保存为模板
2. 添加标题、描述和标签
3. 在"我的提示词"中管理个人模板
4. 支持编辑、删除、收藏等操作

### 3. 社区分享

1. 在提示词广场浏览热门模板
2. 使用搜索功能查找特定类型模板
3. 点赞、收藏感兴趣的模板
4. 分享自己的优质模板给社区

### 4. 语言切换

1. 点击右上角或侧边栏的语言切换按钮（🌐）
2. 选择您偏好的语言（中文/英文）
3. 界面将立即切换语言，无需刷新页面
4. 您的语言偏好将被保存，下次访问时自动应用

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. **Fork 项目**到你的GitHub账户
2. **创建功能分支**: `git checkout -b feature/AmazingFeature`
3. **提交更改**: `git commit -m 'Add some AmazingFeature'`
4. **推送分支**: `git push origin feature/AmazingFeature`
5. **创建 Pull Request**

### 开发规范

- 遵循现有代码风格和命名约定
- 添加适当的注释和文档
- 确保所有测试通过
- 更新相关文档

## 📄 开源协议

本项目采用 **LGPL (Lesser General Public License)** 开源协议。

### 许可条款

- ✅ **商业使用**: 允许在商业环境中部署和使用
- ✅ **分发**: 允许分发原始代码和二进制文件
- ✅ **修改**: 允许修改源代码用于个人或内部使用
- ❌ **修改后商用**: 禁止修改源代码后用于商业分发
- ⚠️ **责任**: 使用本软件的风险由用户自行承担

### 重要说明

- 可以直接部署本项目用于商业用途
- 可以基于本项目开发内部工具
- 不得修改源代码后重新打包分发
- 必须保留原始版权声明

详细协议条款请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目和技术：

- [Microsoft Semantic Kernel](https://github.com/microsoft/semantic-kernel) - AI编排框架
- [Ant Design](https://ant.design/) - React UI组件库
- [React](https://reactjs.org/) - 前端框架
- [.NET](https://dotnet.microsoft.com/) - 后端框架

## 📞 联系我们

- **项目主页**: https://github.com/AIDotNet/auto-prompt
- **问题反馈**: [GitHub Issues](https://github.com/AIDotNet/auto-prompt/issues)
- **官方网站**: https://token-ai.cn
- **技术支持**: 通过GitHub Issues提交

---
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AIDotNet/auto-prompt&type=Date)](https://www.star-history.com/#AIDotNet/auto-prompt&Date)


## 💌WeChat

![image](https://github.com/user-attachments/assets/1b1b9153-a563-496d-a1cb-c14a0d5a1bba)


<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [TokenAI](https://token-ai.cn)

</div> 
