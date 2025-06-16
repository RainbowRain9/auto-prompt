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

### 🚀 快速开始

#### 1. 标准部署（推荐）

```bash
# 克隆项目
git clone https://github.com/AIDotNet/auto-prompt.git
cd auto-prompt

# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

**访问地址**: http://localhost:10426

#### 2. 自定义API端点部署

创建 `docker-compose.override.yaml` 文件：

```yaml
version: '3.8'

services:
  console-service:
    environment:
      # 自定义AI API端点
      - OpenAIEndpoint=https://your-api-endpoint.com/v1
      # 可用模型配置
      - CHAT_MODEL=gpt-4,gpt-3.5-turbo,claude-3-sonnet
      - DEFAULT_CHAT_MODEL=gpt-4
      - GenerationChatModel=gpt-4
```

```bash
# 使用自定义配置启动
docker-compose -f docker-compose.yaml -f docker-compose.override.yaml up -d
```

#### 3. 本地AI服务部署（Ollama）

创建 `docker-compose.ollama.yaml` 文件：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=http://ollama:11434/v1
      - CHAT_MODEL=qwen2.5-coder:32b,llama3.2:3b,gemma2:9b
      - DEFAULT_CHAT_MODEL=qwen2.5-coder:32b
      - GenerationChatModel=qwen2.5-coder:32b
      - ConnectionStrings:Type=sqlite
      - ConnectionStrings:Default=Data Source=/data/ConsoleService.db
    volumes:
      - ./data:/app/data
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped
    # GPU支持（如果有NVIDIA GPU）
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

volumes:
  ollama_data:
```

**启动Ollama版本**：

```bash
# 启动服务
docker-compose -f docker-compose-ollama.yaml up -d

# 拉取推荐模型
docker exec ollama ollama pull qwen3
docker exec ollama ollama pull qwen2.5:3b
docker exec ollama ollama pull llama3.2:3b

# 验证模型
docker exec ollama ollama list
docker-compose restart console-service
```

**🚀 一键启动脚本**：

为了简化部署流程，我们提供了一键启动脚本：

**Linux/macOS用户**：
```bash
# 给脚本添加执行权限
chmod +x start-ollama.sh

# 运行一键启动脚本
./start-ollama.sh
```

**Windows用户**：
```bash
# 直接运行批处理脚本
start-ollama.bat
```

**脚本功能**：
- 🚀 自动启动ollama服务和控制台服务
- ⏳ 等待服务完全启动
- 📦 自动拉取qwen3模型
- ✅ 验证模型安装状态
- 🎉 完成后显示访问地址

**推荐模型**：
- `qwen3` - 中文对话效果优秀（约5GB）
- `qwen2.5:3b` - 轻量级版本（约2GB）
- `llama3.2:3b` - 英文对话效果好（约2GB）
- `gemma2:9b` - Google开源模型（约5GB）

#### 4. PostgreSQL数据库部署

创建 `docker-compose.postgres.yaml` 文件：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=https://api.openai.com/v1
      - ConnectionStrings:Type=postgresql
      - ConnectionStrings:Default=Host=postgres;Database=auto_prompt;Username=postgres;Password=your_password
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=auto_prompt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
      - TZ=Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### 🔐 默认账户信息

- **用户名**: `admin`
- **密码**: `admin123`


### 🔧 环境变量配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OpenAIEndpoint` | AI API端点地址 | `https://api.token-ai.cn/v1` |
| `CHAT_MODEL` | 可用聊天模型列表 | `gpt-4.1,o4-mini,claude-sonnet-4-20250514` |
| `DEFAULT_CHAT_MODEL` | 默认聊天模型 | `gpt-4.1-mini` |
| `DEFAULT_USERNAME` | 默认管理员用户名 | `admin` |
| `DEFAULT_PASSWORD` | 默认管理员密码 | `admin123` |
| `ConnectionStrings:Type` | 数据库类型 | `sqlite` |

### ⚡ 常用命令

```bash
# 查看日志
docker-compose logs -f console-service

# 重启服务
docker-compose restart console-service

# 停止服务
docker-compose down

# 更新镜像
docker-compose pull && docker-compose up -d
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
│       ├── plugins/              # AI插件配置
│       └── Migrations/           # 数据库迁移
├── web/                          # 前端应用
│   ├── src/
│   └── public/                   # 静态资源
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

## 👥 贡献者

感谢所有为这个项目做出贡献的开发者！
<div align="center">
<a href="https://github.com/AIDotNet/auto-prompt/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AIDotNet/auto-prompt&max=50&columns=10" />
</a>

## 💌WeChat

![image](img/wechat.jpg)


<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐ Star！**

Made with ❤️ by [TokenAI](https://token-ai.cn)

</div> 
