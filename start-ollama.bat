@echo off
chcp 65001 >nul
title AI Prompt 优化平台 - Ollama 启动器

echo ========================================
echo    AI Prompt 优化平台 - Ollama 启动器    
echo ========================================
echo.

echo 🔍 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到Docker，请先安装Docker Desktop
    echo 下载地址：https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过

echo.
echo 🚀 启动ollama服务...
docker-compose -f docker-compose-ollama.yaml up -d

if errorlevel 1 (
    echo ❌ 启动失败，正在查看错误日志...
    docker-compose -f docker-compose-ollama.yaml logs
    pause
    exit /b 1
)

echo ✅ 服务启动成功

echo.
echo ⏳ 等待ollama服务完全启动...
timeout /t 10 /nobreak >nul

echo.
echo 📦 拉取qwen3模型...
echo （这可能需要几分钟时间，模型大小约5GB）
docker exec ollama ollama pull qwen3:0.6b

if errorlevel 1 (
    echo ⚠️  qwen3模型拉取失败，尝试拉取轻量级模型...
    docker exec ollama ollama pull qwen2.5:3b
)

echo.
echo ✅ 检查已安装的模型...
docker exec ollama ollama list

docker-compose restart console-service

echo.
echo 🎉 启动完成！
echo.
echo 📋 访问信息
echo    前端界面：http://localhost:10426
echo    API文档：http://localhost:10426/scalar/v1
echo    Ollama API：http://localhost:11434
echo.
echo 💡 使用提示：
echo    - 默认用户名：admin
echo    - 默认密码：admin123
echo    - 首次登录后请修改密码
echo.
echo 🔧 管理命令：
echo    查看日志：docker-compose -f docker-compose-ollama.yaml logs -f
echo    停止服务：docker-compose -f docker-compose-ollama.yaml down
echo    重启服务：docker-compose -f docker-compose-ollama.yaml restart
echo.
echo 按任意键打开浏览器访问系统...
pause >nul

start http://localhost:10426 