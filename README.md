# AI Prompt Optimization Platform

<div align="center">

![AI Prompt Optimizer](https://img.shields.io/badge/AI-Prompt%20Optimizer-blue?style=for-the-badge&logo=openai)
![License](https://img.shields.io/badge/License-LGPL-green?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-9.0-purple?style=for-the-badge&logo=dotnet)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)

**Professional AI prompt optimization, debugging, and sharing platform**

[🚀 Quick Start](#quick-start) • [📖 Features](#features) • [🛠️ Tech Stack](#tech-stack) • [📦 Deployment Guide](#deployment-guide) • [🤝 Contribution Guide](#contribution-guide)

</div>

---

## 📋 Project Overview

AI Prompt Optimization Platform is a professional prompt engineering tool designed to help users optimize AI model prompts, enhancing the effectiveness and accuracy of AI interactions. The platform integrates intelligent optimization algorithms, deep reasoning analysis, visualization debugging tools, and community sharing features, providing comprehensive prompt optimization solutions for AI application developers and content creators.

### 🎯 Core Values

- **Intelligent Optimization**: Automatically analyze and optimize prompt structures based on advanced AI algorithms
- **Deep Reasoning**: Provide multi-dimensional thinking analysis to deeply understand user needs
- **Community Sharing**: Discover and share high-quality prompt templates, exchange experiences with community users
- **Visualization Debugging**: Robust debugging environment with real-time preview of prompt effects

## ✨ Features

### 🧠 Intelligent Prompt Optimization

- **Automatic Structure Analysis**: Deeply analyze the semantic structure and logical relationships of prompts
- **Multi-Dimensional Optimization**: Optimize from multiple dimensions such as clarity, accuracy, and completeness
- **Deep Reasoning Mode**: Enable AI deep thinking to provide detailed analysis processes
- **Real-Time Generation**: Stream output of optimization results, view the generation process in real-time

### 📚 Prompt Template Management

- **Template Creation**: Save optimized prompts as reusable templates
- **Tag Classification**: Support multi-tag classification management for easy searching and organizing
- **Favorites Feature**: Favorite templates for quick access to commonly used prompts
- **Usage Statistics**: Track template usage and feedback on effectiveness

### 🌐 Community Sharing Platform

- **Public Sharing**: Share high-quality templates with community users
- **Popularity Ranking**: Display popular templates based on views, likes, etc.
- **Search Discovery**: Powerful search functionality to quickly find needed templates
- **Interactive Features**: Social features such as likes, comments, and favorites

### 🔧 Debugging and Testing Tools

- **Visual Interface**: Intuitive user interface to simplify operations
- **Real-Time Preview**: Instantly view prompt optimization effects
- **History Records**: Save optimization history and support version comparison
- **Export Functionality**: Support exporting optimization results in multiple formats

### 🌐 Multi-Language Support

- **Language Switching**: Support Chinese and English interface switching
- **Real-Time Translation**: Instant language switching without page refresh
- **Localized Content**: Complete localization of all interface elements
- **Browser Detection**: Automatic language detection based on browser settings

## 🛠️ Tech Stack

### Backend Technologies

- **Framework**: .NET 9.0 + ASP.NET Core
- **AI Engine**: Microsoft Semantic Kernel 1.54.0
- **Database**: PostgreSQL + Entity Framework Core
- **Authentication**: JWT Token authentication
- **Logging**: Serilog structured logging
- **API Documentation**: Scalar OpenAPI

### Frontend Technologies

- **Framework**: React 19.1.0 + TypeScript
- **UI Components**: Ant Design 5.25.3
- **Routing**: React Router DOM 7.6.1
- **State Management**: Zustand 5.0.5
- **Styling**: Styled Components 6.1.18
- **Build Tool**: Vite 6.3.5

### Core Dependencies

- **AI Model Integration**: OpenAI API compatible interface
- **Real-Time Communication**: Server-Sent Events (SSE)
- **Data Storage**: IndexedDB (client-side caching)
- **Rich Text Editing**: TipTap editor
- **Code Highlighting**: Prism.js + React Syntax Highlighter
- **Internationalization**: React i18next for multi-language support

## 📦 Deployment Guide

### Environment Requirements

- Docker & Docker Compose
- .NET 9.0 SDK (development environment)
- Node.js 18+ (development environment)

### 🚀 Quick Start

1. Clone the project
   
```bash
git clone https://github.com/AIDotNet/auto-prompt.git
cd auto-prompt
```

2. Deploy using Docker Compose

```bash
# Start services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

3. Access the application

- Frontend: http://localhost:10426
- API Documentation: http://localhost:10426/scalar/v1

### 🔧 Development Environment Setup

1. Backend Development

```bash
cd src/Console.Service
dotnet restore
dotnet run
```

2. Frontend Development

```bash
cd web
npm install
npm run dev
```

### 🌐 Environment Variable Configuration

Configure in `src/Console.Service/appsettings.json`:

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

## 🏗️ Project Structure

```
auto-prompt/
├── src/
│   └── Console.Service/          # Backend services
│       ├── Controllers/          # API controllers
│       ├── Services/             # Business services
│       ├── Entities/             # Data entities
│       ├── Dto/                  # Data transfer objects
│       ├── DbAccess/             # Data access layer
│       ├── plugins/              # AI plugin configuration
│       │   └── Generate/         # Prompt generation plugins
│       │       ├── DeepReasoning/           # Deep reasoning
│       │       ├── DeepReasoningPrompt/     # Deep reasoning prompts
│       │       └── OptimizeInitialPrompt/   # Initial optimization
│       └── Migrations/           # Database migrations
├── web/                          # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── GeneratePrompt/   # Prompt generation components
│   │   │   ├── Workbench/        # Workbench
│   │   │   ├── DashboardPage/    # Dashboard
│   │   │   └── PromptsPage/      # Prompt management
│   │   ├── stores/               # State management
│   │   ├── api/                  # API interfaces
│   │   ├── styles/               # Style files
│   │   └── utils/                # Utility functions
│   ├── public/                   # Static assets
│   └── dist/                     # Build output
├── docker-compose.yaml           # Docker orchestration configuration
└── README.md                     # Project documentation
```

## 🎮 Usage Guide

### 1. Prompt Optimization

1. Enter the prompt to be optimized in the workbench
2. Describe specific requirements and expected outcomes
3. Choose whether to enable deep reasoning mode
4. Click "Generate" to start the optimization process
5. View optimization results and reasoning process

### 2. Template Management

1. Save optimized prompts as templates
2. Add title, description, and tags
3. Manage personal templates in "My Prompts"
4. Support editing, deleting, and favoriting operations

### 3. Community Sharing

1. Browse popular templates in the prompt plaza
2. Use the search function to find specific types of templates
3. Like and favorite interesting templates
4. Share your high-quality templates with the community

### 4. Language Switching

1. Click the language switcher button (🌐) in the top-right corner or sidebar
2. Select your preferred language (Chinese/English)
3. The interface will switch languages instantly without page refresh
4. Your language preference will be saved for future visits

## 🤝 Contribution Guide

We welcome community contributions! Please follow these steps:

1. **Fork the project** to your GitHub account
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push the branch**: `git push origin feature/AmazingFeature`
5. **Create a Pull Request**

### Development Standards

- Follow existing code style and naming conventions
- Add appropriate comments and documentation
- Ensure all tests pass
- Update related documentation

## 📄 Open Source License

This project is licensed under the **LGPL (Lesser General Public License)**.

### License Terms

- ✅ **Commercial Use**: Allows deployment and use in commercial environments
- ✅ **Distribution**: Allows distribution of original code and binaries
- ✅ **Modification**: Allows modification of source code for personal or internal use
- ❌ **Commercial Distribution After Modification**: Prohibits commercial distribution of modified source code
- ⚠️ **Liability**: Use of this software is at the user's own risk

### Important Notes

- Direct deployment of this project for commercial use is allowed
- Development of internal tools based on this project is allowed
- Modified source code cannot be redistributed
- Original copyright statements must be retained

For detailed license terms, please refer to the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

Thanks to the following open source projects and technologies:

- [Microsoft Semantic Kernel](https://github.com/microsoft/semantic-kernel) - AI orchestration framework
- [Ant Design](https://ant.design/) - React UI component library
- [React](https://reactjs.org/) - Frontend framework
- [.NET](https://dotnet.microsoft.com/) - Backend framework

## 📞 Contact Us

- **Project Homepage**: https://github.com/AIDotNet/auto-prompt
- **Issue Reporting**: [GitHub Issues](https://github.com/AIDotNet/auto-prompt/issues)
- **Official Website**: https://token-ai.cn
- **Technical Support**: Submit via GitHub Issues

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AIDotNet/auto-prompt&type=Date)](https://www.star-history.com/#AIDotNet/auto-prompt&Date)

## 💌WeChat

![image](img/wechat.jpg)


<div align="center">

**If this project helps you, please give us a ⭐ Star!**

Made with ❤️ by [TokenAI](https://token-ai.cn)

</div>
