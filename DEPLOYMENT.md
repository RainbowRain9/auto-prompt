# AI Prompt Optimization Platform 部署指南

本文档详细介绍如何使用 Docker Compose 部署 AI Prompt Optimization Platform，包括自定义端点配置。

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [自定义端点配置](#自定义端点配置)
- [部署配置选项](#部署配置选项)
- [常见问题](#常见问题)
- [维护管理](#维护管理)

## 🔧 环境要求

### 系统要求
- **操作系统**: Linux, macOS, Windows (支持 Docker)
- **内存**: 最少 2GB，推荐 4GB+
- **存储**: 最少 10GB 可用空间
- **网络**: 能够访问 Docker Hub 和 AI API 端点

### 软件依赖
- **Docker**: 版本 20.10+
- **Docker Compose**: 版本 2.0+ 或 docker-compose 1.29+

### 安装 Docker 和 Docker Compose

#### Ubuntu/Debian
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

#### CentOS/RHEL
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### macOS
```bash
# 使用 Homebrew
brew install docker docker-compose
```

#### Windows
下载并安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

## 🚀 快速开始

### 方法一：使用自动部署脚本（推荐）

1. **克隆项目**
   ```bash
   git clone https://github.com/AIDotNet/auto-prompt.git
   cd auto-prompt
   ```

2. **运行部署脚本**
   ```bash
   # Linux/macOS
   chmod +x deploy.sh
   ./deploy.sh
   
   # Windows (使用 Git Bash 或 WSL)
   bash deploy.sh
   ```

3. **选择配置**
   脚本会提供以下选项：
   - 基础配置 (SQLite + 默认API端点)
   - PostgreSQL配置 (PostgreSQL + 自定义API端点)
   - 本地AI配置 (SQLite + Ollama)
   - 完整配置 (PostgreSQL + Ollama + Redis)
   - 自定义配置

### 方法二：手动配置部署

1. **复制配置文件**
   ```bash
   cp docker-compose.example.yaml docker-compose.yaml
   ```

2. **编辑配置文件**
   ```bash
   nano docker-compose.yaml
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

## 🔧 自定义端点配置

### 支持的 AI API 端点

平台支持所有兼容 OpenAI API 格式的服务：

| 服务提供商 | API 端点 | 说明 |
|-----------|----------|------|
| OpenAI 官方 | `https://api.openai.com/v1` | 需要 OpenAI API Key |
| Azure OpenAI | `https://your-resource.openai.azure.com/openai/deployments/your-deployment` | 需要 Azure 订阅 |
| 国内代理服务 | `https://api.token-ai.cn/v1` | 默认配置 |
| DeepSeek | `https://api.deepseek.com/v1` | 需要 DeepSeek API Key |
| 月之暗面 | `https://api.moonshot.cn/v1` | 需要 Moonshot API Key |
| 本地 Ollama | `http://ollama:11434/v1` | 本地部署，无需 API Key |
| LocalAI | `http://localhost:8080/v1` | 本地部署 |
| vLLM | `http://localhost:8000/v1` | 本地部署 |

### 配置方式

#### 1. 环境变量配置（推荐）

在 `docker-compose.yaml` 中设置：

```yaml
services:
  console-service:
    environment:
      - OpenAIEndpoint=https://your-custom-api.com/v1
      - ConnectionStrings__Type=sqlite
      - ConnectionStrings__Default=Data Source=/data/ConsoleService.db
```

#### 2. 配置文件配置

创建自定义 `appsettings.json`：

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "OpenAIEndpoint": "https://your-custom-api.com/v1",
  "ConnectionStrings": {
    "Type": "sqlite",
    "Default": "Data Source=/data/ConsoleService.db"
  }
}
```

然后在 docker-compose.yaml 中挂载：

```yaml
volumes:
  - ./appsettings.json:/app/appsettings.json:ro
```

## 📦 部署配置选项

### 基础配置（SQLite）

适合个人使用或小团队：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=https://api.openai.com/v1
      - ConnectionStrings__Type=sqlite
      - ConnectionStrings__Default=Data Source=/data/ConsoleService.db
    volumes:
      - ./data:/data
    restart: unless-stopped
```

### PostgreSQL 配置

适合生产环境：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=https://your-custom-api.com/v1
      - ConnectionStrings__Type=postgresql
      - ConnectionStrings__Default=Host=postgres;Database=auto_prompt;Username=postgres;Password=your_password
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: auto-prompt-db
    environment:
      - POSTGRES_DB=auto_prompt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
      - TZ=Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 本地 AI 配置（Ollama）

无需外部 API，完全本地化：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=http://ollama:11434/v1
      - ConnectionStrings__Type=sqlite
      - ConnectionStrings__Default=Data Source=/data/ConsoleService.db
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

volumes:
  ollama_data:
```

部署后下载模型：
```bash
docker exec -it ollama ollama pull llama2
docker exec -it ollama ollama pull qwen:7b
```

### 高可用配置

包含数据库、缓存和负载均衡：

```yaml
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=https://your-custom-api.com/v1
      - ConnectionStrings__Type=postgresql
      - ConnectionStrings__Default=Host=postgres;Database=auto_prompt;Username=postgres;Password=your_password
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  postgres:
    image: postgres:16-alpine
    container_name: auto-prompt-db
    environment:
      - POSTGRES_DB=auto_prompt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: auto-prompt-redis
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 🔧 环境变量详解

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `OpenAIEndpoint` | string | `https://api.token-ai.cn/v1` | AI API 端点地址 |
| `ConnectionStrings__Type` | string | `sqlite` | 数据库类型 (`sqlite`, `postgresql`) |
| `ConnectionStrings__Default` | string | `Data Source=/data/ConsoleService.db` | 数据库连接字符串 |
| `TZ` | string | `Asia/Shanghai` | 时区设置 |
| `Jwt__Key` | string | - | JWT 密钥（可选） |
| `Jwt__Issuer` | string | `auto-prompt` | JWT 发行者（可选） |
| `Jwt__Audience` | string | `auto-prompt-users` | JWT 受众（可选） |
| `Logging__LogLevel__Default` | string | `Information` | 日志级别 |

## 🚀 部署步骤

### 1. 准备环境

```bash
# 创建项目目录
mkdir auto-prompt && cd auto-prompt

# 创建数据目录
mkdir -p data logs

# 设置权限
chmod 755 data logs
```

### 2. 创建配置文件

选择合适的配置模板，保存为 `docker-compose.yaml`

### 3. 启动服务

```bash
# 拉取镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 4. 验证部署

```bash
# 检查服务健康状态
curl http://localhost:10426/health

# 访问前端界面
open http://localhost:10426

# 查看 API 文档
open http://localhost:10426/scalar/v1
```

## ❓ 常见问题

### Q1: 服务启动失败

**检查步骤：**
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs console-service

# 检查端口占用
netstat -tlnp | grep 10426
```

**常见原因：**
- 端口被占用
- 配置文件格式错误
- 数据库连接失败
- API 端点不可访问

### Q2: API 端点连接失败

**检查步骤：**
```bash
# 测试端点连通性
curl -I https://your-api-endpoint.com/v1/models

# 检查容器网络
docker-compose exec console-service curl -I http://ollama:11434/v1/models
```

**解决方案：**
- 确认 API 端点地址正确
- 检查网络连接
- 验证 API 密钥有效性

### Q3: 数据库连接问题

**PostgreSQL 连接失败：**
```bash
# 检查数据库容器状态
docker-compose logs postgres

# 测试数据库连接
docker-compose exec postgres psql -U postgres -d auto_prompt -c "SELECT 1;"
```

**SQLite 权限问题：**
```bash
# 检查数据目录权限
ls -la data/

# 修复权限
sudo chown -R 1000:1000 data/
chmod 755 data/
```

### Q4: 内存不足

**优化配置：**
```yaml
services:
  console-service:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### Q5: Ollama 模型下载慢

**使用国内镜像：**
```bash
# 设置镜像源
docker exec -it ollama sh -c "echo 'export OLLAMA_HOST=0.0.0.0' >> ~/.bashrc"

# 手动下载模型
docker exec -it ollama ollama pull qwen:7b
```

## 🔧 维护管理

### 日常管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新镜像
docker-compose pull && docker-compose up -d
```

### 数据备份

#### SQLite 备份
```bash
# 备份数据库
cp data/ConsoleService.db backup/ConsoleService_$(date +%Y%m%d).db

# 恢复数据库
cp backup/ConsoleService_20240101.db data/ConsoleService.db
```

#### PostgreSQL 备份
```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres auto_prompt > backup/auto_prompt_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres auto_prompt < backup/auto_prompt_20240101.sql
```

### 监控和日志

#### 查看资源使用情况
```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
df -h
du -sh data/
```

#### 日志管理
```bash
# 查看最近日志
docker-compose logs --tail=100 console-service

# 清理日志
docker-compose logs --no-log-prefix console-service > /dev/null
```

### 性能优化

#### 数据库优化
```yaml
# PostgreSQL 性能优化
postgres:
  command: >
    postgres
    -c shared_buffers=256MB
    -c effective_cache_size=1GB
    -c work_mem=4MB
    -c maintenance_work_mem=64MB
```

#### 应用优化
```yaml
# 应用资源限制
console-service:
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '1.0'
      reservations:
        memory: 512M
        cpus: '0.5'
```

## 🔒 安全建议

### 1. 网络安全
- 使用防火墙限制访问端口
- 配置 HTTPS（推荐使用 Nginx 反向代理）
- 定期更新 Docker 镜像

### 2. 数据安全
- 定期备份数据
- 使用强密码
- 限制数据库访问权限

### 3. API 安全
- 保护 API 密钥安全
- 使用环境变量而非硬编码
- 定期轮换密钥

## 📞 技术支持

如果遇到问题，可以通过以下方式获取帮助：

- **GitHub Issues**: [提交问题](https://github.com/AIDotNet/auto-prompt/issues)
- **官方文档**: [查看文档](https://github.com/AIDotNet/auto-prompt)
- **社区讨论**: [参与讨论](https://github.com/AIDotNet/auto-prompt/discussions)

---

**祝您部署顺利！** 🎉 