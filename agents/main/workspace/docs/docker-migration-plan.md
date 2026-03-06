# Docker 开发环境迁移方案

## 🎯 目标

将本机 Docker Desktop 容器迁移到局域网服务器（192.168.31.188），实现：
1. 减轻本机内存压力（释放 3GB+）
2. 代码变更实时同步到服务器
3. 保持开发体验（热重载、调试等）

---

## 🏗️ 推荐方案：VSCode Remote + Docker 远程开发

### 方案优势
- ✅ 代码留在本机，无需手动同步
- ✅ 容器在远程服务器运行
- ✅ 热重载正常工作
- ✅ 调试体验一致
- ✅ 无需复杂同步脚本

---

## 📋 实施步骤

### Step 1: 配置 SSH 免密登录（已完成 ✅）

```bash
# 验证连接
ssh zhou@192.168.31.188
docker ps
```

### Step 2: 安装 VSCode Remote - SSH 插件

1. 在 VSCode 中安装插件：**Remote - SSH**
2. 配置 SSH 连接：

```json
// ~/.ssh/config
Host docker-server
    HostName 192.168.31.188
    User zhou
    ForwardAgent yes
```

### Step 3: 配置 Docker 远程访问

在服务器上配置 Docker 允许远程访问：

```bash
ssh zhou@192.168.31.188

# 编辑 Docker 配置
sudo nano /etc/docker/daemon.json
```

添加：
```json
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker：
```bash
sudo systemctl restart docker
```

### Step 4: 配置本机 Docker 客户端

在本机配置 Docker 使用远程服务器：

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export DOCKER_HOST=tcp://192.168.31.188:2375

# 验证
source ~/.zshrc
docker ps  # 应该显示服务器上的容器
```

### Step 5: 项目迁移

#### 5.1 复制项目到服务器

```bash
# 将本机项目代码同步到服务器
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  /Volumes/SanDisk2T/dv-codeBase/ \
  zhou@192.168.31.188:~/projects/
```

#### 5.2 使用 VSCode Remote 打开

1. 在 VSCode 中按 `Cmd+Shift+P`
2. 选择 `Remote-SSH: Connect to Host...`
3. 输入 `docker-server`
4. 打开项目文件夹：`~/projects/claw-dashboard`

#### 5.3 启动容器

```bash
# 在 VSCode Remote 终端中
cd ~/projects/claw-dashboard
docker-compose up -d
```

---

## 🔄 代码同步方案对比

### 方案 A: VSCode Remote SSH (推荐 ⭐)

**工作原理**：
- 代码保存在服务器
- 通过 VSCode Remote SSH 直接编辑
- 容器在服务器运行

**优点**：
- 最简单，无需同步
- 热重载完美支持
- 调试体验好

**缺点**：
- 需要网络连接
- 代码不在本机

### 方案 B: SSHFS 挂载 + 本地开发

**工作原理**：
- 将服务器目录挂载到本机
- 本机编辑，服务器运行

```bash
# 本机挂载服务器目录
mkdir -p ~/remote-projects
sshfs zhou@192.168.31.188:~/projects ~/remote-projects

# 在挂载目录中开发
cd ~/remote-projects/claw-dashboard
docker-compose up -d
```

**优点**：
- 代码在服务器，本机编辑
- 不需要改工作流

**缺点**：
- 文件操作可能慢
- 大文件同步有延迟

### 方案 C: rsync 自动同步 (备用)

**工作原理**：
- 本机开发，自动同步到服务器
- 容器在服务器运行

```bash
# 创建同步脚本 ~/bin/sync-to-server.sh
#!/bin/bash
PROJECT=$1
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
  /Volumes/SanDisk2T/dv-codeBase/$PROJECT/ \
  zhou@192.168.31.188:~/projects/$PROJECT/
```

配置自动同步（使用 fswatch）：
```bash
# 安装 fswatch
brew install fswatch

# 自动同步
fswatch -o /Volumes/SanDisk2T/dv-codeBase/claw-dashboard | while read f; do
  sync-to-server.sh claw-dashboard
  ssh zhou@192.168.31.188 "cd ~/projects/claw-dashboard && docker-compose restart"
done
```

**优点**：
- 代码在本机
- 灵活可控

**缺点**：
- 配置复杂
- 同步有延迟

---

## 🚀 推荐实施计划

### 阶段 1: 快速迁移（今天）

1. 配置 Docker 远程访问
2. 使用 rsync 复制项目到服务器
3. 通过 SSH 启动容器
4. 验证服务可访问

### 阶段 2: 优化开发体验（本周）

1. 安装 VSCode Remote SSH
2. 配置免密登录
3. 测试热重载
4. 迁移所有项目

### 阶段 3: 停用 Docker Desktop（下周）

1. 确认所有项目运行正常
2. 备份本机 Docker 数据
3. 卸载 Docker Desktop
4. 享受释放的 3GB 内存！

---

## 📊 迁移检查清单

### 项目迁移
- [ ] claw-dashboard（龙虾任务看板）
- [ ] 润德教育项目
- [ ] 茂名文旅项目
- [ ] 商场促销项目
- [ ] 鹿状元项目
- [ ] DV 项目

### 数据迁移
- [ ] MySQL 数据备份
- [ ] Redis 数据备份
- [ ] 上传文件迁移

### 验证测试
- [ ] 容器正常启动
- [ ] 服务可访问
- [ ] 热重载工作
- [ ] 日志正常输出

---

## 💡 常见问题

### Q: 热重载还能工作吗？
A: 可以！使用 VSCode Remote SSH 时，文件变更直接发生在服务器，容器能立即检测到。

### Q: 数据库数据怎么办？
A: 可以：
1. 导出本机数据：`docker exec mysql mysqldump ...`
2. 复制到服务器并导入
3. 或者使用挂载卷持久化数据在服务器

### Q: 端口映射怎么配置？
A: 在服务器防火墙上开放端口，或修改 docker-compose.yml 使用不同端口避免冲突。

### Q: 网络访问问题？
A: 确保局域网内可以访问 192.168.31.188，必要时配置路由器端口转发。

---

## 🔧 快速命令参考

```bash
# 连接到服务器
ssh zhou@192.168.31.188

# 查看容器状态
docker ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 进入容器
docker exec -it <container> bash

# 复制文件到服务器
rsync -avz ./dist zhou@192.168.31.188:~/projects/myapp/
```

---

*方案设计时间: 2026-03-05*
