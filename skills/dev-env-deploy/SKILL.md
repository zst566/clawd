---
name: dev-env-deploy
description: 测试环境部署及维护技能。基于本地构建 + Docker 挂载模式，支持前端代码变更自动构建、后端代码变更自动重启。使用 sync.sh + docker-compose 实现开发/测试环境的自动化部署。
---

# 测试环境部署及维护技能

基于 **本地构建 + Docker 挂载模式** 的测试环境部署方案。

## 核心特点

| 特性 | 实现方式 |
|------|----------|
| **前端变更** | 本地构建 → 同步 dist → Nginx 服务 |
| **后端变更** | 同步源码 → nodemon 自动重启 → 服务生效 |
| **构建保护** | 构建失败时不同步，问题本地发现 |
| **权限修复** | 自动修复 Mac→Linux 的文件权限差异 |

## 工作流程

```
本地修改代码
     ↓
fswatch 检测变更
     ↓
┌─────────────┴─────────────┐
│        按项目类型处理       │
├─────────────┬─────────────┤
│   前端项目   │   后端项目   │
│  (pc-admin) │  (backend)  │
├─────────────┼─────────────┤
│ npm run     │ 直接同步    │
│   build     │ 源码        │
│  (本地)     │             │
├─────────────┼─────────────┤
│ 构建成功?   │             │
│ 否 → 停止   │             │
│ 是 → 继续   │             │
└──────┬──────┴──────┬──────┘
       │             │
       └──────┬──────┘
              ↓
       rsync 同步到服务器
              ↓
       ┌──────┴──────┐
       │             │
   修复权限    nodemon 自动重启
   (chmod 755)   (backend)
       │             │
       └──────┬──────┘
              ↓
        浏览器访问生效
```

## 配置文件

### 1. sync.sh（核心脚本）

```bash
#!/bin/bash

LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_HOST="user@server"
REMOTE_DIR="~/projects/$(basename $LOCAL_DIR)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 修复权限
fix_permissions() {
  ssh $REMOTE_HOST "chmod -R 755 $REMOTE_DIR/apps/*/dist/ 2>/dev/null || true"
}

# 后端使用 nodemon 热重载，无需手动重启
# 如需强制重启容器，使用：
# ssh $REMOTE_HOST "cd $REMOTE_DIR && docker compose restart backend"

# 构建前端
build_frontend() {
  local app_name=$1
  cd "$LOCAL_DIR/apps/$app_name" || return 1
  
  echo -e "${YELLOW}🔨 构建 $app_name...${NC}"
  if ! npm run build; then
    echo -e "${RED}❌ $app_name 构建失败！${NC}"
    return 1
  fi
  echo -e "${GREEN}✅ $app_name 构建成功${NC}"
}

# 检测源码变更
has_source_change() {
  local changed_files=$1
  local app_name=$2
  echo "$changed_files" | grep -q "apps/$app_name/src/"
}

# 首次同步
echo -e "${YELLOW}📦 首次同步...${NC}"
rsync -avz --delete \
  --exclude='.git' --exclude='node_modules' \
  "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"
fix_permissions

echo -e "${GREEN}✅ 开始监听文件变化...${NC}"

# 实时监听
fswatch -o "$LOCAL_DIR" | while read f; do
  echo -e "${YELLOW}📝 检测到变更 $(date '+%H:%M:%S')${NC}"
  
  CHANGED_FILES=$(find "$LOCAL_DIR/apps" -type f -mmin -0.1 2>/dev/null)
  
  # 前端：构建
  if has_source_change "$CHANGED_FILES" "pc-admin"; then
    build_frontend "pc-admin" || continue
  fi
  
  # 检查后端变更
  BACKEND_CHANGED=false
  if echo "$CHANGED_FILES" | grep -q "apps/backend/src/"; then
    BACKEND_CHANGED=true
  fi
  
  # 同步到服务器
  rsync -avz --delete \
    --exclude='.git' --exclude='node_modules' \
    "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"
  
  fix_permissions
  
  # 后端：重启容器
  if [ "$BACKEND_CHANGED" = true ]; then
    restart_backend
  fi
  
  echo -e "${GREEN}✅ 同步完成 $(date '+%H:%M:%S')${NC}"
done
```

### 2. docker-compose.yml

```yaml
services:
  # 后端 API
  backend:
    image: node:20
    container_name: xinyi-backend
    volumes:
      - ./apps/backend:/app
      - backend-node-modules:/app/node_modules
    command: >
      sh -c "npm install && 
             npx prisma generate && 
             npm start"
    restart: always

  # PC 管理端（Nginx 挂载 dist）
  pc-admin:
    image: nginx:alpine
    container_name: xinyi-pc-admin
    volumes:
      - ./apps/pc-admin/dist:/usr/share/nginx/html:ro
      - ./docker/nginx/pc-admin.conf:/etc/nginx/conf.d/default.conf:ro
    restart: always

  # 移动端 H5（Nginx 挂载 dist）
  mobile-h5:
    image: nginx:alpine
    container_name: xinyi-mobile-h5
    volumes:
      - ./apps/mobile-h5/dist:/usr/share/nginx/html:ro
      - ./docker/nginx/mobile-h5.conf:/etc/nginx/conf.d/default.conf:ro
    restart: always

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - pc-admin
      - mobile-h5

volumes:
  backend-node-modules:
```

## 使用说明

### 启动同步

```bash
./sync.sh
```

### 工作流程说明

| 操作 | 触发条件 | 执行动作 | 生效时间 |
|------|----------|----------|----------|
| **修改前端代码** | `apps/pc-admin/src/**` | 本地 `npm run build` → 同步 | 10-30s |
| **修改后端代码** | `apps/backend/src/**` | 同步 → `docker restart backend` | 5-10s |
| **修改配置文件** | `docker/nginx/**` | 同步 → 手动重启 nginx | 手动 |

### 关键行为

1. **前端构建失败保护**
   - 构建错误在本地捕获
   - 错误信息直接显示在终端
   - **不会同步到服务器**

2. **后端自动重启**
   - API 代码变更后自动重启容器
   - 使用 `docker restart` 而非重建容器
   - 保留容器状态（如数据库连接池）

3. **权限自动修复**
   - Mac 本地构建的文件权限为 644
   - 自动执行 `chmod 755` 修复
   - 避免 Nginx 403 错误

## 故障排查

### Q: 前端修改后页面没有更新？

```bash
# 检查清单
1. 查看 sync.sh 输出是否有构建错误
2. 检查 dist 是否同步：ssh server "ls -la ~/projects/xxx/apps/pc-admin/dist/"
3. 检查权限：ssh server "ls -la ~/projects/xxx/apps/pc-admin/dist/ | head"
4. 强制刷新浏览器：Ctrl+Shift+R
```

### Q: 后端 API 修改没有生效？

```bash
# 手动重启后端
ssh server "cd ~/projects/xxx && docker compose restart backend"

# 查看后端日志
ssh server "docker logs -f xinyi-backend"
```

### Q: 如何跳过某个项目的自动构建？

编辑 `sync.sh`，注释掉对应项目的构建调用：

```bash
# if has_source_change "$CHANGED_FILES" "mobile-h5"; then
#   build_frontend "mobile-h5" || continue
# fi
```

### Q: 后端如何实现真正的热重载（不重启容器）？

使用 `nodemon` 替代 `node`：

```yaml
backend:
  command: >
    sh -c "npm install && 
           npx prisma generate && 
           npm run dev"  # 使用 nodemon
```

然后在 `package.json` 中：
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

这样后端代码变更后，nodemon 会自动重启 Node 进程，无需重启容器。

## 配置检查清单

- [ ] `sync.sh` 配置了正确的远程服务器和目录
- [ ] `docker-compose.yml` 使用 `nginx:alpine` 服务前端
- [ ] `docker-compose.yml` 使用 `node:20` 服务后端
- [ ] 前端挂载 `dist` 目录，后端挂载源码目录
- [ ] 后端 `package.json` 有 `start` 脚本
- [ ] SSH 免密登录已配置
- [ ] `fswatch` 已安装（`brew install fswatch`）

## 相关工具

- `fswatch` - 文件系统监控（`brew install fswatch`）
- `rsync` - 增量文件同步
- `docker-compose` - 容器编排
- `nginx` - 静态文件服务器
