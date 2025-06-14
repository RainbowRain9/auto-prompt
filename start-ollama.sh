#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "  AI Prompt 优化平台 - Ollama 启动器    "
echo "========================================"
echo

# 检查Docker环境
echo -e "${BLUE}🔍 检查Docker环境...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到Docker，请先安装Docker${NC}"
    echo "安装指南：https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"

echo
echo -e "${BLUE}🚀 启动ollama服务...${NC}"
if ! docker-compose -f docker-compose-ollama.yaml up -d; then
    echo -e "${RED}❌ 启动失败，正在查看错误日志...${NC}"
    docker-compose -f docker-compose-ollama.yaml logs
    exit 1
fi

echo -e "${GREEN}✅ 服务启动成功${NC}"

echo
echo -e "${YELLOW}⏳ 等待ollama服务完全启动...${NC}"
sleep 15

echo
echo -e "${BLUE}📦 拉取qwen3模型...${NC}"
echo -e "${YELLOW}（这可能需要几分钟时间，模型大小约5GB）${NC}"
if ! docker exec ollama ollama pull qwen3; then
    echo -e "${YELLOW}⚠️  qwen3模型拉取失败，尝试拉取轻量级模型...${NC}"
    docker exec ollama ollama pull qwen2.5:3b
fi

echo
echo -e "${GREEN}✅ 检查已安装的模型...${NC}"
docker exec ollama ollama list

echo
echo -e "${GREEN}🎉 启动完成！${NC}"
echo
echo -e "${BLUE}📋 访问信息：${NC}"
echo "   前端界面：http://localhost:10426"
echo "   API文档：http://localhost:10426/scalar/v1"
echo "   Ollama API：http://localhost:11434"
echo
echo -e "${BLUE}💡 使用提示：${NC}"
echo "   - 默认用户名：admin"
echo "   - 默认密码：admin123"
echo "   - 首次登录后请修改密码"
echo
echo -e "${BLUE}🔧 管理命令：${NC}"
echo "   查看日志：docker-compose -f docker-compose-ollama.yaml logs -f"
echo "   停止服务：docker-compose -f docker-compose-ollama.yaml down"
echo "   重启服务：docker-compose -f docker-compose-ollama.yaml restart"
echo

# 尝试打开浏览器（如果是桌面环境）
if command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}正在打开默认浏览器...${NC}"
    xdg-open http://localhost:10426 2>/dev/null
elif command -v open &> /dev/null; then
    echo -e "${YELLOW}正在打开默认浏览器...${NC}"
    open http://localhost:10426 2>/dev/null
else
    echo -e "${YELLOW}请手动打开浏览器访问：http://localhost:10426${NC}"
fi 