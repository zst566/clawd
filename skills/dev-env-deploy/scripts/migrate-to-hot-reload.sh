#!/bin/bash
# ============================================
# 迁移脚本: 其他模式 → 本地构建 + Docker 挂载模式
# ============================================

set -e

echo "🚀 开始迁移到本地构建 + Docker 挂载模式..."
echo ""

# 检查文件是否存在
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.188.yml" ]; then
    echo "❌ 错误: 未找到 docker-compose.yml 文件"
    exit 1
fi

COMPOSE_FILE="${1:-docker-compose.yml}"

echo "📄 使用配置文件: $COMPOSE_FILE"
echo ""

# 1. 备份原配置
echo "1️⃣  备份原配置..."
cp "$COMPOSE_FILE" "$COMPOSE_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ 已备份到 $COMPOSE_FILE.backup.*"

# 2. 更新 docker-compose.yml
echo ""
echo "2️⃣  更新 docker-compose 配置..."
echo "   ⚠️  需要手动修改以下配置:"
echo ""
echo "   前端服务 (如 pc-admin, mobile-h5):"
echo "     - image: xxx:latest → image: nginx:alpine"
echo "     - expose/ports: 修改为 80 或不暴露（通过 nginx 反向代理）"
echo "     - 添加 volumes:"
echo "       - ./apps/<name>/dist:/usr/share/nginx/html:ro"
echo "       - ./docker/nginx/<name>.conf:/etc/nginx/conf.d/default.conf:ro"
echo "     - 移除 build 相关配置"
echo ""
echo "   后端服务:"
echo "     - image: node:20"
echo "     - 添加 volumes:"
echo "       - ./apps/backend:/app"
echo "       - backend-node-modules:/app/node_modules"
echo "     - command: >"
echo "         sh -c \"npm install && \\"
echo "                npx prisma generate && \\"
echo "                npm start\""
echo ""
echo "   更多详情请参考 SKILL.md"

# 3. 检查并提示更新 nginx
echo ""
echo "3️⃣  更新 Nginx 配置..."
if [ -d "docker/nginx" ] || [ -d "nginx/conf.d" ]; then
    NGINX_DIR=$(ls -d docker/nginx nginx/conf.d 2>/dev/null | head -1)
    echo "   找到 Nginx 配置目录: $NGINX_DIR"
    echo "   ⚠️  需要为每个前端服务创建独立的 Nginx 配置文件:"
    echo "     - pc-admin.conf: 服务 pc-admin 的 dist 目录"
    echo "     - mobile-h5.conf: 服务 mobile-h5 的 dist 目录"
else
    echo "   ⚠️  未找到 Nginx 配置目录，请手动创建 docker/nginx/"
fi

# 4. 检查 sync.sh
echo ""
echo "4️⃣  检查 sync.sh..."
if [ -f "sync.sh" ]; then
    echo "   ✅ 找到 sync.sh"
    if grep -q "REMOTE_DIR=" ~/projects/" sync.sh; then
        echo "   ✅ 同步目录已正确配置"
    else
        echo "   ⚠️  请确保 REMOTE_DIR 设置为 ~/projects/\$PROJECT_NAME"
    fi
    
    if grep -q "build_frontend" sync.sh; then
        echo "   ✅ 已配置前端自动构建"
    else
        echo "   ⚠️  请确保 sync.sh 包含 build_frontend 函数"
    fi
else
    echo "   ⚠️  未找到 sync.sh，请从模板创建"
    echo "   cp /path/to/sync.sh.template ./sync.sh"
fi

# 5. 本地构建检查
echo ""
echo "5️⃣  本地构建检查..."
echo "   ⚠️  迁移后前端需要在本地构建:"
echo "     cd apps/pc-admin && npm run build"
echo "     cd apps/mobile-h5 && npm run build"
echo "   ⚠️  确保 .gitignore 不包含 dist 目录（或按需配置）"

echo ""
echo "📋 迁移检查清单:"
echo "   ☐ 更新 docker-compose.yml 中的前端服务（nginx:alpine + 挂载 dist）"
echo "   ☐ 更新 docker-compose.yml 中的后端服务（node:20 + 挂载源码）"
echo "   ☐ 创建 docker/nginx/*.conf 配置文件"
echo "   ☐ 确认 sync.sh 配置正确（含 build_frontend 函数）"
echo "   ☐ 在远程服务器停止旧容器"
echo "   ☐ 本地构建前端: npm run build"
echo "   ☐ 同步代码到远程服务器: ./sync.sh"
echo "   ☐ 在远程服务器启动新容器: docker compose up -d"
echo "   ☐ 验证 http://<server> 可访问"
echo ""
echo "🎉 迁移准备完成！请按照上述清单手动修改配置。"
