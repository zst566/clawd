# 部署检查清单

## 部署前准备

- [ ] 确认项目名（用于远程目录命名）
- [ ] 确认远程服务器地址
- [ ] 确认远程服务器上有 Docker 和 Docker Compose
- [ ] 确认本地已安装 fswatch（`brew install fswatch`）
- [ ] 确认本地可以 SSH 免密登录到远程服务器

## 文件配置检查

### sync.sh
- [ ] `REMOTE_HOST` 设置为正确的服务器地址（如 `user@server`）
- [ ] `REMOTE_DIR` 设置为 `~/projects/<项目名>`
- [ ] 排除项包含 `.git`, `node_modules`, `.DS_Store`
- [ ] 文件可执行：`chmod +x sync.sh`

### docker-compose.yml
- [ ] 前端服务使用 `image: nginx:alpine`
- [ ] 前端服务挂载 `dist` 目录：`./apps/<name>/dist:/usr/share/nginx/html:ro`
- [ ] 前端服务挂载 Nginx 配置：`./docker/nginx/<name>.conf:/etc/nginx/conf.d/default.conf:ro`
- [ ] 后端服务使用 `image: node:20`
- [ ] 后端服务挂载源码目录：`./apps/backend:/app`
- [ ] 后端服务使用命名卷：`backend-node-modules:/app/node_modules`
- [ ] 后端 `command` 包含 `npm install && npx prisma generate && npm start`

### nginx 配置
- [ ] 监听端口为 80
- [ ] `proxy_pass` 指向正确的后端服务（如 `http://backend:3000/`）
- [ ] API 代理路径正确（如 `/api/` → `http://backend:3000/`）

## 部署步骤

1. **本地准备**
   ```bash
   # 确保 sync.sh 可执行
   chmod +x sync.sh
   
   # 测试 SSH 连接
   ssh user@server "echo 'SSH OK'"
   ```

2. **首次同步**
   ```bash
   ./sync.sh
   # 等待首次同步完成，然后按 Ctrl+C 停止
   ```

3. **远程服务器启动**
   ```bash
   ssh user@server
   cd ~/projects/<项目名>
   docker compose up -d
   ```

4. **本地前端构建**
   ```bash
   # 在本地构建前端（sync.sh 会自动处理）
   cd apps/pc-admin && npm run build
   cd apps/mobile-h5 && npm run build
   ```

5. **再次同步（包含 dist）**
   ```bash
   ./sync.sh
   ```

6. **验证部署**
   - [ ] 所有容器状态为 `Up`：`docker ps | grep <项目名>`
   - [ ] Nginx 无 403/502 错误日志
   - [ ] 浏览器访问 `http://<server>` 正常

7. **测试热重载**
   - [ ] 修改本地前端代码，观察自动构建
   - [ ] 观察 sync.sh 输出，确认同步完成
   - [ ] 浏览器刷新，看到变更生效
   - [ ] 修改后端代码，观察自动重启

## 端口检查

部署前检查以下端口是否被占用：

| 端口 | 用途 | 检查命令 |
|------|------|----------|
| 80 | Nginx 统一入口 | `lsof -i :80` |
| 3000 | Backend API | `lsof -i :3000` |
| 3306 | MySQL | `lsof -i :3306` |

## 常见问题预防

### 1. Nginx 403 错误
**预防**: 
- 确保 Mac 本地构建的文件权限正确
- sync.sh 中的 `fix_permissions` 函数会自动修复权限
- 手动检查：`ssh server "ls -la ~/projects/xxx/apps/pc-admin/dist/"`

### 2. 前端修改不生效
**预防**: 
- 确认 sync.sh 正在运行
- 确认本地构建成功（无报错）
- 确认 dist 目录已同步到远程

### 3. 后端修改不生效
**预防**: 
- 确认 sync.sh 检测到后端变更
- 确认容器自动重启（或手动重启）
- 查看后端日志：`docker logs -f <project>-backend`

### 4. 构建失败保护
**预防**: 
- 本地构建失败时 sync.sh 会停止，不会同步错误代码
- 观察终端输出，修复构建错误后继续
