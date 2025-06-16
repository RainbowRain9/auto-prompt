# AI Prompt Optimization Platform

<div align="center">

![AI Prompt Optimizer](https://img.shields.io/badge/AI-Prompt%20Optimizer-blue?style=for-the-badge&logo=openai)
![License](https://img.shields.io/badge/License-LGPL-green?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-9.0-purple?style=for-the-badge&logo=dotnet)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)

**Professional AI Prompt Optimization, Debugging, and Sharing Platform**

[🚀 Quick Start](#quick-start) • [📖 Features](#features) • [🛠️ Tech Stack](#tech-stack) • [📦 Deployment Guide](#deployment-guide) • [🤝 Contribution Guide](#contribution-guide)

</div>

---

## 📋 Project Overview

The AI Prompt Optimization Platform is a professional tool designed to help users optimize prompts for AI models, enhancing AI conversation effectiveness and response accuracy. The platform integrates intelligent optimization algorithms, deep inference analysis, visualization debugging tools, and community sharing features, providing comprehensive prompt optimization solutions for AI application developers and content creators.

### 🎯 Core Values

- **Intelligent Optimization**: Automatically analyzes and optimizes prompt structures based on advanced AI algorithms.
- **Deep Inference**: Offers multidimensional thinking analysis to deeply understand user needs.
- **Community Sharing**: Discover and share high-quality prompt templates, exchange experiences with community users.
- **Visualization Debugging**: Powerful debugging environment with real-time preview of prompt effects.

## ✨ Features

### 🧠 Intelligent Prompt Optimization

- **Automatic Structure Analysis**: In-depth analysis of the semantic structure and logical relationships of prompts.
- **Multidimensional Optimization**: Optimizes from multiple dimensions such as clarity, accuracy, and completeness.
- **Deep Inference Mode**: Enables AI deep thinking to provide detailed analysis processes.
- **Real-time Generation**: Streamlined output of optimization results, view the generation process in real-time.

### 📚 Prompt Template Management

- **Template Creation**: Save optimized prompts as reusable templates.
- **Tag Classification**: Supports multi-tag classification management for easy searching and organization.
- **Favorite Function**: Bookmark favorite templates for quick access to commonly used prompts.
- **Usage Statistics**: Track template usage and feedback on effectiveness.

### 🌐 Community Sharing Platform

- **Public Sharing**: Share high-quality templates with community users.
- **Popularity Rankings**: Display popular templates based on views, likes, etc.
- **Search Discovery**: Powerful search function to quickly find needed templates.
- **Interactive Communication**: Social features like likes, comments, and bookmarks.

### 🔧 Debugging and Testing Tools

- **Visual Interface**: Intuitive user interface simplifies operation processes.
- **Real-time Preview**: Instantly view prompt optimization effects.
- **History Records**: Save optimization history, support version comparison.
- **Export Functionality**: Support exporting optimization results in various formats.

### 🌐 Multi-language Support

- **Language Switching**: Supports switching between Chinese and English interfaces.
- **Real-time Translation**: Switch languages without refreshing the page.
- **Localized Content**: All interface elements are fully localized.
- **Browser Detection**: Automatically detects language based on browser settings.

## 🛠️ Tech Stack

### Backend Technologies

- **Framework**: .NET 9.0 + ASP.NET Core
- **AI Engine**: Microsoft Semantic Kernel 1.54.0
- **Database**: PostgreSQL + Entity Framework Core
- **Authentication**: JWT Token Authentication
- **Logging**: Serilog Structured Logging
- **API Documentation**: Scalar OpenAPI

### Frontend Technologies

- **Framework**: React 19.1.0 + TypeScript
- **UI Components**: Ant Design 5.25.3
- **Routing**: React Router DOM 7.6.1
- **State Management**: Zustand 5.0.5
- **Styling**: Styled Components 6.1.18
- **Build Tool**: Vite 6.3.5

### Core Dependencies

- **AI Model Integration**: OpenAI API Compatible Interface
- **Real-time Communication**: Server-Sent Events (SSE)
- **Data Storage**: IndexedDB (client-side cache)
- **Rich Text Editing**: TipTap Editor
- **Code Highlighting**: Prism.js + React Syntax Highlighter
- **Internationalization**: React i18next Multi-language Support

## 📦 Deployment Guide

### Environment Requirements

- Docker & Docker Compose

### 🚀 Quick Start

#### 1. Standard Deployment (Recommended)

```bash
# Clone the project
git clone https://github.com/AIDotNet/auto-prompt.git
cd auto-prompt

# Start service
docker-compose up -d

# Check service status
docker-compose ps
```

**Access URL**: http://localhost:10426

#### 2. Custom API Endpoint Deployment

Create `docker-compose.override.yaml` file:

```yaml
version: '3.8'

services:
  console-service:
    environment:
      # Custom AI API endpoint
      - OpenAIEndpoint=https://your-api-endpoint.com/v1
      # Available model configuration
      - CHAT_MODEL=gpt-4,gpt-3.5-turbo,claude-3-sonnet
      - DEFAULT_CHAT_MODEL=gpt-4
      - GenerationChatModel=gpt-4
```

```bash
# Start with custom configuration
docker-compose -f docker-compose.yaml -f docker-compose.override.yaml up -d
```

#### 3. Local AI Service Deployment (Ollama)

Create `docker-compose.ollama.yaml` file:

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
      - ConnectionStrings:Default=Data Source=/app/data/ConsoleService.db
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
    # GPU support (if NVIDIA GPU available)
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

**Start Ollama Version**:

```bash
# Start service
docker-compose -f docker-compose-ollama.yaml up -d

# Pull recommended models
docker exec ollama ollama pull qwen3
docker exec ollama ollama pull qwen2.5:3b
docker exec ollama ollama pull llama3.2:3b

# Verify models
docker exec ollama ollama list
docker-compose restart console-service
```

**🚀 One-click Start Script**:

To simplify the deployment process, we provide a one-click start script:

**Linux/macOS Users**:
```bash
# Add execution permission to script
chmod +x start-ollama.sh

# Run one-click start script
./start-ollama.sh
```

**Windows Users**:
```bash
# Directly run batch script
start-ollama.bat
```

**Script Features**:
- 🚀 Automatically start the ollama service and console service
- ⏳ Wait for services to fully start
- 📦 Automatically pull the qwen3 model
- ✅ Verify model installation status
- 🎉 Display access address upon completion

**Recommended Models**:
- `qwen3` - Excellent Chinese conversation effect (about 5GB)
- `qwen2.5:3b` - Lightweight version (about 2GB)
- `llama3.2:3b` - Good English conversation effect (about 2GB)
- `gemma2:9b` - Google open-source model (about 5GB)

#### 4. PostgreSQL Database Deployment

Create `docker-compose.postgres.yaml` file:

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

### 🔐 Default Account Information

- **Username**: `admin`
- **Password**: `admin123`

### 🔧 Environment Variable Configuration

| Variable Name | Description | Default Value |
|---------------|-------------|---------------|
| `OpenAIEndpoint` | AI API endpoint address | `https://api.token-ai.cn/v1` |
| `CHAT_MODEL` | Available chat model list | `gpt-4.1,o4-mini,claude-sonnet-4-20250514` |
| `DEFAULT_CHAT_MODEL` | Default chat model | `gpt-4.1-mini` |
| `DEFAULT_USERNAME` | Default admin username | `admin` |
| `DEFAULT_PASSWORD` | Default admin password | `admin123` |
| `ConnectionStrings:Type` | Database type | `sqlite` |

### ⚡ Common Commands

```bash
# View logs
docker-compose logs -f console-service

# Restart service
docker-compose restart console-service

# Stop service
docker-compose down

# Update image
docker-compose pull && docker-compose up -d
```

## 🏗️ Project Structure

```
auto-prompt/
├── src/
│   └── Console.Service/          # Backend service
│       ├── Controllers/          # API controllers
│       ├── Services/             # Business services
│       ├── Entities/             # Data entities
│       ├── Dto/                  # Data transfer objects
│       ├── plugins/              # AI plugin configurations
│       └── Migrations/           # Database migrations
├── web/                          # Frontend application
│   ├── src/
│   └── public/                   # Static resources
├── docker-compose.yaml           # Docker orchestration configuration
└── README.md                     # Project documentation
```

## 🎮 Usage Guide

### 1. Prompt Optimization

1. Enter the prompt you want to optimize in the workspace.
2. Describe specific needs and expected effects.
3. Choose whether to enable deep inference mode.
4. Click "Generate" to start the optimization process.
5. View optimization results and inference process.

### 2. Template Management

1. Save optimized prompts as templates.
2. Add titles, descriptions, and tags.
3. Manage personal templates in "My Prompts."
4. Supports editing, deleting, bookmarking, etc.

### 3. Community Sharing

1. Browse popular templates in the Prompt Square.
2. Use the search function to find specific types of templates.
3. Like and bookmark templates of interest.
4. Share your high-quality templates with the community.

### 4. Language Switching

1. Click the language switch button (🌐) in the top right corner or sidebar.
2. Choose your preferred language (Chinese/English).
3. The interface will switch languages immediately without refreshing the page.
4. Your language preference will be saved and automatically applied next time you visit.

## 📄 Open Source License

This project is licensed under the **LGPL (Lesser General Public License)**.

### License Terms

- ✅ **Commercial Use**: Allowed to deploy and use in commercial environments.
- ✅ **Distribution**: Allowed to distribute original code and binaries.
- ✅ **Modification**: Allowed to modify source code for personal or internal use.
- ❌ **Commercial Distribution of Modified Code**: Prohibited from distributing modified source code commercially.
- ⚠️ **Liability**: Users assume the risk of using this software.

### Important Notes

- Can directly deploy this project for commercial use.
- Can develop internal tools based on this project.
- Cannot repack and distribute modified source code.
- Must retain original copyright notice.

For detailed license terms, please refer to the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

Thanks to the following open-source projects and technologies:

- [Microsoft Semantic Kernel](https://github.com/microsoft/semantic-kernel) - AI orchestration framework
- [Ant Design](https://ant.design/) - React UI component library
- [React](https://reactjs.org/) - Frontend framework
- [.NET](https://dotnet.microsoft.com/) - Backend framework

## 📞 Contact Us

- **Project Homepage**: https://github.com/AIDotNet/auto-prompt
- **Feedback**: [GitHub Issues](https://github.com/AIDotNet/auto-prompt/issues)
- **Official Website**: https://token-ai.cn
- **Technical Support**: Submit via GitHub Issues

---
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AIDotNet/auto-prompt&type=Date)](https://www.star-history.com/#AIDotNet/auto-prompt&Date)

## 👥 Contributors

Thanks to all the developers who contributed to this project!
<div align="center">
<a href="https://github.com/AIDotNet/auto-prompt/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AIDotNet/auto-prompt&max=50&columns=10" />
</a>

## 💌WeChat

![image](img/wechat.jpg)


<div align="center">

**If this project helps you, please give us a ⭐ Star!**

Made with ❤️ by [TokenAI](https://token-ai.cn)

</div>