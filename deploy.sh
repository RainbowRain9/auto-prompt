#!/bin/bash

# AI Prompt Optimization Platform 快速部署脚本
# 
# 使用方法：
# chmod +x deploy.sh
# ./deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_success "系统依赖检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    
    mkdir -p data
    mkdir -p logs
    
    # 设置权限
    chmod 755 data
    chmod 755 logs
    
    print_success "目录创建完成"
}

# 配置选择菜单
show_config_menu() {
    echo ""
    echo "请选择部署配置："
    echo "1) 基础配置 (SQLite + 默认API端点)"
    echo "2) PostgreSQL配置 (PostgreSQL + 自定义API端点)"
    echo "3) 本地AI配置 (SQLite + Ollama)"
    echo "4) 完整配置 (PostgreSQL + Ollama + Redis)"
    echo "5) 自定义配置"
    echo ""
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1) setup_basic_config ;;
        2) setup_postgresql_config ;;
        3) setup_ollama_config ;;
        4) setup_full_config ;;
        5) setup_custom_config ;;
        *) print_error "无效选择"; exit 1 ;;
    esac
}

# 基础配置
setup_basic_config() {
    print_info "设置基础配置..."
    
    read -p "请输入AI API端点 (默认: https://api.token-ai.cn/v1): " api_endpoint
    api_endpoint=${api_endpoint:-"https://api.token-ai.cn/v1"}
    
    cat > docker-compose.yaml << EOF
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=${api_endpoint}
      - ConnectionStrings:Type=sqlite
      - ConnectionStrings:Default=Data Source=/data/ConsoleService.db
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF
    
    print_success "基础配置完成"
}

# PostgreSQL配置
setup_postgresql_config() {
    print_info "设置PostgreSQL配置..."
    
    read -p "请输入AI API端点 (默认: https://api.token-ai.cn/v1): " api_endpoint
    api_endpoint=${api_endpoint:-"https://api.token-ai.cn/v1"}
    
    read -p "请输入数据库密码: " db_password
    if [ -z "$db_password" ]; then
        print_error "数据库密码不能为空"
        exit 1
    fi
    
    cat > docker-compose.yaml << EOF
version: '3.8'

services:
  console-service:
    image: registry.cn-shenzhen.aliyuncs.com/tokengo/console
    container_name: auto-prompt
    ports:
      - "10426:8080"
    environment:
      - TZ=Asia/Shanghai
      - OpenAIEndpoint=${api_endpoint}
      - ConnectionStrings:Type=postgresql
      - ConnectionStrings:Default=Host=postgres;Database=auto_prompt;Username=postgres;Password=${db_password}
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    container_name: auto-prompt-db
    environment:
      - POSTGRES_DB=auto_prompt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${db_password}
      - TZ=Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF
    
    print_success "PostgreSQL配置完成"
}

# Ollama配置
setup_ollama_config() {
    print_info "设置Ollama配置..."
    
    cat > docker-compose.yaml << EOF
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
      - ConnectionStrings:Type=sqlite
      - ConnectionStrings:Default=Data Source=/data/ConsoleService.db
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    depends_on:
      - ollama
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ollama_data:
EOF
    
    print_success "Ollama配置完成"
    print_info "部署完成后，请运行以下命令下载AI模型："
    print_info "docker exec -it ollama ollama pull llama2"
}

# 完整配置
setup_full_config() {
    print_info "设置完整配置..."
    
    read -p "请输入数据库密码: " db_password
    if [ -z "$db_password" ]; then
        print_error "数据库密码不能为空"
        exit 1
    fi
    
    cat > docker-compose.yaml << EOF
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
      - ConnectionStrings:Type=postgresql
      - ConnectionStrings:Default=Host=postgres;Database=auto_prompt;Username=postgres;Password=${db_password}
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    depends_on:
      - postgres
      - ollama
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:16-alpine
    container_name: auto-prompt-db
    environment:
      - POSTGRES_DB=auto_prompt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${db_password}
      - TZ=Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: auto-prompt-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - TZ=Asia/Shanghai
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  ollama_data:
  redis_data:
EOF
    
    print_success "完整配置完成"
}

# 自定义配置
setup_custom_config() {
    print_info "设置自定义配置..."
    
    if [ ! -f "docker-compose.example.yaml" ]; then
        print_error "docker-compose.example.yaml 文件不存在"
        exit 1
    fi
    
    cp docker-compose.example.yaml docker-compose.yaml
    print_info "已复制示例配置文件，请手动编辑 docker-compose.yaml"
    print_info "编辑完成后重新运行此脚本选择部署"
    exit 0
}

# 部署服务
deploy_services() {
    print_info "开始部署服务..."
    
    # 拉取镜像
    print_info "拉取Docker镜像..."
    if command -v docker-compose &> /dev/null; then
        docker-compose pull
    else
        docker compose pull
    fi
    
    # 启动服务
    print_info "启动服务..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    print_success "服务部署完成！"
}

# 检查服务状态
check_services() {
    print_info "检查服务状态..."
    
    sleep 10
    
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        docker compose ps
    fi
    
    # 检查健康状态
    print_info "等待服务启动..."
    for i in {1..30}; do
        if curl -f http://localhost:10426/health &> /dev/null; then
            print_success "服务启动成功！"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_warning "服务启动超时，请检查日志"
            show_logs
            exit 1
        fi
        
        sleep 2
    done
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "=========================================="
    echo "🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址："
    echo "  前端界面: http://localhost:10426"
    echo "  API文档:  http://localhost:10426/scalar/v1"
    echo ""
    echo "管理命令："
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo ""
    echo "数据目录："
    echo "  应用数据: ./data"
    echo "  日志文件: ./logs"
    echo ""
}

# 显示日志
show_logs() {
    print_info "显示服务日志..."
    if command -v docker-compose &> /dev/null; then
        docker-compose logs --tail=50
    else
        docker compose logs --tail=50
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "🚀 AI Prompt Optimization Platform"
    echo "   快速部署脚本"
    echo "=========================================="
    echo ""
    
    check_dependencies
    create_directories
    show_config_menu
    deploy_services
    check_services
    show_access_info
}

# 运行主函数
main "$@" 