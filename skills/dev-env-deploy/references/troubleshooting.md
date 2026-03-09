# 故障排查指南

## 403 Forbidden

### 现象
访问页面返回 403 错误

### 原因: 文件权限问题（Mac → Linux）
**诊断**:
```bash
# 在远程服务器检查权限
ssh user@server "ls -la ~/projects/<项目名>/apps/pc-admin/dist/ | head"

# 如果显示 644 权限，需要修复为 755
```

**解决**:
1. sync.sh 中的 `fix_permissions` 函数会自动修复
2. 手动修复：
   ```bash
   ssh user@server "chmod -R 755 ~/projects/<项目名>/apps/*/dist/"
   ```
3. 重启 Nginx：
   ```bash
   ssh user@server "docker restart <项目名>-nginx"
   ```

---

## 502 Bad Gateway

### 现象
访问页面返回 502 错误

### 原因 1: 后端服务未启动
**诊断**:
```bash
# 检查容器状态
docker ps | grep <项目名>-backend

# 查看后端日志
docker logs <项目名>-backend --tail 50
```

**解决**:
1. 检查 docker-compose 配置是否正确
2. 重启后端容器：
   ```bash
   ssh user@server "cd ~/projects/<项目名> && docker compose restart backend"
   ```

### 原因 2: Nginx 代理配置错误
**诊断**:
```bash
# 检查 nginx 配置
grep "proxy_pass" docker/nginx/*.conf
```

**解决**:
确保 `proxy_pass` 指向正确的后端地址和端口（如 `http://backend:3000/`）

---

## 前端修改后页面没有更新

### 现象
修改本地前端代码后，浏览器看到的内容没有变化

### 原因 1: 构建失败
**诊断**:
```bash
# 查看 sync.sh 终端输出
# 如果有红色错误信息，表示构建失败
```

**解决**:
1. 修复代码中的错误
2. 重新保存文件触发构建

### 原因 2: 未同步到远程
**诊断**:
```bash
# 在远程服务器检查 dist 目录时间戳
ssh user@server "ls -la ~/projects/<项目名>/apps/pc-admin/dist/"

# 对比本地 dist 目录时间戳
ls -la apps/pc-admin/dist/
```

**解决**:
1. 检查 sync.sh 是否运行：`ps aux | grep sync.sh`
2. 手动执行一次同步
3. 重启 sync.sh

### 原因 3: 浏览器缓存
**解决**:
- 强制刷新：Ctrl+Shift+R（Windows/Linux）或 Cmd+Shift+R（Mac）
- 或清空浏览器缓存后刷新

---

## 后端 API 修改没有生效

### 现象
修改后端代码后，API 行为没有变化

### 原因 1: 容器未重启
**诊断**:
```bash
# 检查后端容器是否重启过
docker ps | grep <项目名>-backend
# 查看启动时间
```

**解决**:
1. 确认 sync.sh 检测到后端变更（查看终端输出）
2. 手动重启后端：
   ```bash
   ssh user@server "cd ~/projects/<项目名> && docker compose restart backend"
   ```

### 原因 2: nodemon 未生效
如果使用 nodemon 热重载：

**诊断**:
```bash
# 查看后端日志
docker logs -f <项目名>-backend

# 应该看到 nodemon 检测到变更并重启
```

**解决**:
1. 确认 `package.json` 中有 dev 脚本：
   ```json
   "scripts": {
     "start": "node src/index.js",
     "dev": "nodemon src/index.js"
   }
   ```
2. 确认 docker-compose 中使用 `npm run dev`

---

## 端口冲突

### 现象
启动容器时报错：`Bind for 0.0.0.0:xxxx failed`

### 诊断
```bash
# 查看占用端口的进程
lsof -i :80
lsof -i :3000
lsof -i :3306

# 或查看 Docker 容器
docker ps | grep 80
docker ps | grep 3000
```

### 解决
1. 停止占用端口的容器：
   ```bash
   docker stop <container-id>
   ```
2. 或修改 docker-compose 使用其他端口：
   ```yaml
   ports:
     - "8080:80"  # 改为 8080
   ```

---

## MySQL 启动失败

### 现象
MySQL 容器状态为 unhealthy 或反复重启

### 原因 1: 数据目录权限
**诊断**:
```bash
docker logs <项目名>-mysql --tail 50
# 查看是否有权限错误
```

**解决**:
```bash
# 修复权限
chmod -R 777 mysql/data 2>/dev/null || true

# 或使用命名卷（推荐）
volumes:
  mysql-data:/var/lib/mysql
```

### 原因 2: 端口被占用
**解决**:
修改 docker-compose 中的 MySQL 端口映射：
```yaml
ports:
  - "13306:3306"  # 使用 13306 代替 3306
```

---

## sync.sh 相关问题

### fswatch 未安装
```bash
# 安装 fswatch
brew install fswatch
```

### SSH 连接失败
```bash
# 配置免密登录
ssh-copy-id user@server

# 测试连接
ssh user@server "echo 'OK'"
```

### 同步速度慢
**优化**:
1. 确保 `rsync` 排除项正确：
   ```bash
   --exclude='.git' \
   --exclude='node_modules' \
   --exclude='.DS_Store'
   ```
2. 避免同步大文件或日志文件

---

## 通用排查命令

```bash
# 查看所有容器状态
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# 查看容器日志
docker logs <container-name> --tail 100

# 实时查看日志
docker logs -f <container-name>

# 进入容器调试
docker exec -it <container-name> sh

# 重启服务
docker restart <container-name>

# 重启所有服务
docker compose restart

# 查看网络
docker network ls
docker network inspect <project>-network
```
