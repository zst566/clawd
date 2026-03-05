#!/bin/bash

# 智能体任务看板启动脚本

set -e

echo "🚀 启动智能体任务看板系统..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

# 创建数据目录
mkdir -p data

# 检查是否存在 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置创建..."
    cat > .env << EOF
# Telegram 配置 (可选，用于任务通知)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF
fi

# 构建并启动服务
echo "📦 构建 Docker 镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "✅ 智能体任务看板系统已启动!"
echo ""
echo "📱 访问地址:"
echo "   - 前端界面: http://localhost:8080"
echo "   - API 服务: http://localhost:3000"
echo ""
echo "📝 查看日志:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务:"
echo "   docker-compose down"
