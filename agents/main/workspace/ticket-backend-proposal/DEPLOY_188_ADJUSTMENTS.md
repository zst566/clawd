# 茂名文旅票根模块 - 188部署脚本调整建议

## 参考对比：claw-dashboard vs 茂名文旅

### 1. 部署脚本 (deploy188.sh) 对比

| 特性 | claw-dashboard | 茂名文旅 | 建议调整 |
|------|----------------|----------|----------|
| 服务数量 | 3个 (api/ui/ws) + Redis | 5个 (backend/PC/移动/商户/nginx) + MySQL | 增加 Redis 服务 |
| 构建选项 | 无参数，全量构建 | 有--backend/--only-pc等参数 | 保留参数选项 |
| 数据库 | SQLite (本地文件) | MySQL (容器) | 票根模块需要 Redis |
| 端口暴露 | 直接暴露3000/8080/3001 | 只暴露nginx 80 | 票根backend需暴露端口供核销 |
| 错误处理 | `exit 1` 硬中断 | 继续执行 | 保持错误处理 |

### 2. Docker Compose 对比

| 特性 | claw-dashboard | 茂名文旅 | 票根模块需要 |
|------|----------------|----------|--------------|
| 数据库 | SQLite (文件) | MySQL 8.0 | MySQL + Redis |
| 缓存 | Redis | 无 | 必须添加 Redis |
| 环境变量 | 完整 (.env) | 部分硬编码 | 完善环境变量 |
| 数据卷 | ./data + redis_data | mysql/data | 增加redis_data |
| 健康检查 | 有 | 有 | 保持 |

---

## 具体调整建议

### 调整1：docker-compose.188.yml 增加 Redis

```yaml
# 在services部分添加
  redis:
    image: redis:7-alpine
    container_name: xinyi-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - wenlu-network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

# 在volumes部分添加
volumes:
  redis_data:
```

### 调整2：backend 服务增加 Redis 依赖

```yaml
  backend:
    image: xinyi-wenlu-backend:latest
    container_name: xinyi-wenlu-backend
    ports:
      - "3002:3000"  # 暴露端口供商户端核销调用
    environment:
      - NODE_ENV=development
      - DATABASE_URL=mysql://root:root123456@mysql:3306/xinyi_wenlu_dev?charset=utf8mb4
      - REDIS_URL=redis://redis:6379    # 新增：Redis连接
      - REDIS_HOST=redis                 # 新增
      - REDIS_PORT=6379                  # 新增
      - ENCRYPTION_KEY=${ENCRYPTION_KEY} # 新增：从.env读取
      - JWT_SECRET=${JWT_SECRET}         # 新增：从.env读取
      - CODE_POOL_SIZE=1000              # 新增：核销码池大小
    depends_on:
      mysql:
        condition: service_healthy
      redis:                             # 新增依赖
        condition: service_healthy
    networks:
      - wenlu-network
```

### 调整3：deploy188.sh 增加 Redis 镜像传输

```bash
# 在镜像传输步骤添加
if [ "$BUILD_REDIS" = true ]; then
    echo "  → 跳过 Redis（使用官方镜像）"
fi

# 或者如果需要用自定义Redis配置：
# echo "  → 传输 redis 配置..."
# scp redis/redis.conf $SERVER:$REMOTE_DIR/redis/
```

### 调整4：创建 .env.example 文件

```bash
# 创建文件：.env.example
# 复制到 .env 并填入实际值

# 数据库
DATABASE_URL=mysql://root:root123456@mysql:3306/xinyi_wenlu_dev

# Redis
REDIS_URL=redis://redis:6379

# 安全密钥（生产环境必须修改！）
ENCRYPTION_KEY=your-32-char-encryption-key-here!!
JWT_SECRET=your-jwt-secret-key-here-min-32-chars

# 核销码配置
CODE_POOL_SIZE=1000
VERIFY_CODE_EXPIRE_MINUTES=5

# OCR/AI服务（如有）
OCR_API_KEY=your-ocr-api-key
AI_API_KEY=your-ai-api-key
```

### 调整5：sync.sh 排除敏感文件

```bash
# 在 sync.sh 的 rsync 命令中添加：
--exclude='.env' \
--exclude='*.key' \
--exclude='*.pem' \
```

---

## 推荐的新增文件

### 1. scripts/setup-188.sh - 一键初始化

```bash
#!/bin/bash
# 188服务器首次初始化脚本
# 创建目录结构、复制配置文件

SERVER="zhou@192.168.31.188"
REMOTE_DIR="/opt/xinyi-wenlu"

echo "🚀 188服务器初始化"

ssh $SERVER "sudo mkdir -p $REMOTE_DIR/{mysql/{data,init,conf.d},redis} && sudo chown -R \$USER:\$USER $REMOTE_DIR"

# 复制配置文件
scp docker-compose.188.yml $SERVER:$REMOTE_DIR/docker-compose.yml
scp .env.example $SERVER:$REMOTE_DIR/.env

echo "✅ 初始化完成，请编辑 $REMOTE_DIR/.env 配置密钥"
```

### 2. scripts/backup-188.sh - 数据备份

```bash
#!/bin/bash
# 备份188服务器数据

SERVER="zhou@192.168.31.188"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

mkdir -p $BACKUP_DIR

# 备份MySQL
ssh $SERVER "docker exec xinyi-mysql mysqldump -uroot -proot123456 xinyi_wenlu_dev" > $BACKUP_DIR/db.sql

# 备份Redis
ssh $SERVER "docker exec xinyi-redis redis-cli BGSAVE"
ssh $SERVER "docker cp xinyi-redis:/data/dump.rdb" $BACKUP_DIR/redis.rdb

echo "✅ 备份完成: $BACKUP_DIR"
```

---

## 快速检查清单

部署票根模块前确认：

- [ ] docker-compose.188.yml 包含 redis 服务
- [ ] backend 服务有 REDIS_URL 环境变量
- [ ] backend 服务 depends_on 包含 redis
- [ ] .env 文件配置了 ENCRYPTION_KEY 和 JWT_SECRET
- [ ] sync.sh 排除了 .env 文件
- [ ] 端口 3002 (backend) 和 6379 (redis) 未被占用

---

*对比分析时间: 2026-03-06*
*参考项目: claw-dashboard*
