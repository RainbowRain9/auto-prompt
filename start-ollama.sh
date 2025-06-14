#!/bin/bash

# 设置字符编码和颜色
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 清屏
clear

echo -e "${CYAN}========================================"
echo -e "   AI Prompt 优化平台 - Ollama 启动器    "
echo -e "========================================${NC}"
echo ""

echo -e "${BLUE}🔍 检查Docker环境...${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到Docker，请先安装Docker${NC}"
    echo -e "${YELLOW}安装指南：https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ 错误：Docker未运行，请启动Docker服务${NC}"
    echo -e "${YELLOW}提示：请确保Docker Desktop已启动${NC}"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"

echo ""
echo -e "${BLUE}🚀 启动ollama服务...${NC}"
docker-compose -f docker-compose-ollama.yaml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 启动失败，正在查看错误日志...${NC}"
    docker-compose -f docker-compose-ollama.yaml logs
    read -n 1 -s -r -p "按任意键继续..."
    exit 1
fi

echo -e "${GREEN}✅ 服务启动成功${NC}"

echo ""
echo -e "${YELLOW}⏳ 等待ollama服务完全启动...${NC}"
sleep 10

echo ""
echo -e "${BLUE}📦 拉取qwen3模型...${NC}"
echo -e "${YELLOW}（这可能需要几分钟时间，模型大小约5GB）${NC}"
docker exec ollama ollama pull qwen3:1.7b

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  qwen3模型拉取失败，尝试拉取轻量级模型...${NC}"
    docker exec ollama ollama pull qwen2.5:3b
fi

echo ""
echo -e "${GREEN}✅ 检查已安装的模型...${NC}"
docker exec ollama ollama list

echo ""
echo -e "${BLUE}🔄 重启console-service...${NC}"
docker-compose restart console-service

echo ""
echo -e "${GREEN}🎉 启动完成！${NC}"
echo ""
echo -e "${CYAN}📋 访问信息${NC}"
echo -e "${WHITE}   前端界面：http://localhost:10426${NC}"
echo -e "${WHITE}   API文档：http://localhost:10426/scalar/v1${NC}"
echo -e "${WHITE}   Ollama API：http://localhost:11434${NC}"
echo ""
echo -e "${PURPLE}💡 使用提示：${NC}"
echo -e "${WHITE}   - 默认用户名：admin${NC}"
echo -e "${WHITE}   - 默认密码：admin123${NC}"
echo -e "${WHITE}   - 首次登录后请修改密码${NC}"
echo ""
echo -e "${CYAN}🔧 管理命令：${NC}"
echo -e "${WHITE}   查看日志：docker-compose -f docker-compose-ollama.yaml logs -f${NC}"
echo -e "${WHITE}   停止服务：docker-compose -f docker-compose-ollama.yaml down${NC}"
echo -e "${WHITE}   重启服务：docker-compose -f docker-compose-ollama.yaml restart${NC}"
echo ""
echo -e "${YELLOW}按任意键打开浏览器访问系统...${NC}"
read -n 1 -s -r

# 检测操作系统并打开浏览器
case "$(uname -s)" in
    Darwin*)
        open http://localhost:10426
        ;;
    Linux*)
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:10426
        elif command -v gnome-open &> /dev/null; then
            gnome-open http://localhost:10426
        else
            echo -e "${YELLOW}请手动打开浏览器访问：http://localhost:10426${NC}"
        fi
        ;;
    *)
        echo -e "${YELLOW}请手动打开浏览器访问：http://localhost:10426${NC}"
        ;;
esac 