# SSL 证书管理指南

> 本文档记录鹿状元项目的 SSL 证书自动检查与更新方案

---

## 📋 概述

项目配置了自动化的 SSL 证书管理方案，使用 Let's Encrypt 通配符证书，确保证书在到期前自动续期。

---

## 🌐 服务器信息

| 环境 | IP 地址 | 域名 | 证书类型 | 状态 |
|------|---------|------|----------|------|
| 准生产环境 | 8.138.192.106 | lantel.net | Let's Encrypt 通配符证书 (*.lantel.net) | 自动更新 |
| 生产环境 | 8.138.187.106 | xiaolu.lantel.net | Let's Encrypt 通配符证书 | 需手动同步 |

**当前证书有效期**: 89 天（下次自动检查：每天上午 9:00）

---

## 🔧 管理脚本

### 1. check-ssl-expiry.sh - 证书有效期检查

**脚本位置**: 项目根目录 `/Volumes/SanDisk2T/dv-codeBase/鹿状元/check-ssl-expiry.sh`

**功能**: 自动检查准生产环境 SSL 证书有效期

**工作原理**:
```
1. 连接准生产服务器 (8.138.192.106:443)
2. 获取 lantel.net 证书的到期日期
3. 计算剩余有效期
4. 如果剩余天数 ≤ 30 天，自动调用更新脚本
5. 记录检查结果到日志
```

**手动运行**:
```bash
cd /Volumes/SanDisk2T/dv-codeBase/鹿状元
./check-ssl-expiry.sh
```

**输出示例**:
```
========================================
开始检查 SSL 证书有效期
服务器: 8.138.192.106
域名: lantel.net
警告阈值: 30 天
========================================
正在获取证书信息...
证书到期日期: May 30 11:08:38 2026 GMT
证书剩余有效期: 89 天
✅ 证书有效期充足 (89 天)，无需更新
```

---

### 2. update-ssl-cert.sh - 证书更新

**脚本位置**: 项目根目录 `/Volumes/SanDisk2T/dv-codeBase/鹿状元/update-ssl-cert.sh`

**功能**: 申请新的 SSL 证书并部署到服务器

**更新流程**:
```
1. 使用 acme.sh 申请新证书 (支持 *.lantel.net 通配符)
2. 上传证书到准生产服务器 (8.138.192.106)
3. 在服务器上安装证书到 Docker 卷
4. Reload Nginx 容器加载新证书
5. 验证 HTTPS 访问正常
6. 清理临时文件
```

**手动更新**:
```bash
cd /Volumes/SanDisk2T/dv-codeBase/鹿状元
./update-ssl-cert.sh
```

**配置参数** (在脚本内修改):
```bash
SERVER_IP="8.138.192.106"        # 目标服务器 IP
DOMAIN="lantel.net"               # 域名
# 阿里云凭证请从环境变量获取，不要硬编码在脚本中:
# ALI_KEY="${ALIYUN_ACCESS_KEY_ID}"
# ALI_SECRET="${ALIYUN_ACCESS_KEY_SECRET}"
```

> ⚠️ **安全提醒**: 阿里云 AccessKey 等敏感信息请通过环境变量配置，不要直接写在脚本或文档中！

---

## ⏰ 定时任务

### 自动检查任务

**执行时间**: 每天上午 9:00

**Cron 配置**:
```cron
# 鹿状元SSL证书自动检查 - 每天9点执行
0 9 * * * cd /Volumes/SanDisk2T/dv-codeBase/鹿状元 && ./check-ssl-expiry.sh
```

**管理命令**:
```bash
# 查看当前 cron 任务
crontab -l | grep 鹿状元

# 编辑 cron 任务
crontab -e

# 查看检查日志
cat $HOME/.local/log/lzy-ssl-check-*.log
```

---

## 🔄 生产环境证书同步

### ⚠️ 重要提示

当前的自动更新脚本 **只更新准生产环境** (8.138.192.106)

如需更新生产环境 (8.138.187.106)，请使用以下方法：

### 方法1: 修改脚本后执行（推荐）

```bash
cd /Volumes/SanDisk2T/dv-codeBase/鹿状元

# 临时修改目标服务器并执行
sed -i '' 's/SERVER_IP="8.138.192.106"/SERVER_IP="8.138.187.106"/' update-ssl-cert.sh
./update-ssl-cert.sh

# 恢复原来的配置
sed -i '' 's/SERVER_IP="8.138.187.106"/SERVER_IP="8.138.192.106"/' update-ssl-cert.sh
```

### 方法2: 手动复制证书文件

```bash
# 1. 复制证书到生产服务器
scp ~/.acme.sh/lantel.net_ecc/fullchain.cer root@8.138.187.106:/root/lantel.net.crt
scp ~/.acme.sh/lantel.net_ecc/lantel.net.key root@8.138.187.106:/root/lantel.net.key

# 2. SSH 到生产服务器执行安装
ssh root@8.138.187.106

# 3. 在生产服务器上执行安装（参考 update-ssl-cert.sh 中的 install_cert 函数）
# - 复制证书到 /data/nginx-ssl-config/ssl/
# - reload nginx 容器
```

### 方法3: 创建生产环境专用脚本

创建 `update-ssl-cert-production.sh`，将 `SERVER_IP` 改为 `8.138.187.106`，其他逻辑相同。

---

## 📝 日志位置

| 日志类型 | 位置 | 说明 |
|----------|------|------|
| 证书检查日志 | `$HOME/.local/log/lzy-ssl-check-YYYYMMDD.log` | 本地检查记录 |
| 证书更新日志 | `/tmp/ssl-update-YYYYMMDD-HHMMSS.log` | 本地更新详情 |
| 服务器安装日志 | `/var/log/ssl-update.log` | 远程服务器安装记录 |

**查看日志**:
```bash
# 查看最新检查日志
ls -lt $HOME/.local/log/lzy-ssl-check-* | head -1

# 查看最新更新日志
ls -lt /tmp/ssl-update-* | head -1
```

---

## 🔍 故障排除

### 问题1: 检查脚本无法获取证书信息

**症状**: 显示 "无法获取证书信息"

**排查**:
```bash
# 手动测试证书获取
echo | openssl s_client -servername lantel.net -connect 8.138.192.106:443 2>/dev/null | openssl x509 -noout -enddate

# 检查网络连通性
ping 8.138.192.106
telnet 8.138.192.106 443
```

---

### 问题2: 证书申请失败

**症状**: acme.sh 返回错误

**排查**:
1. 检查阿里云 AccessKey 是否有效
2. 检查域名 DNS 解析是否正确
3. 查看详细日志: `cat /tmp/ssl-update-*.log`

---

### 问题3: Nginx 无法加载新证书

**症状**: 更新后 HTTPS 仍显示旧证书

**排查**:
```bash
# SSH 到服务器
ssh root@8.138.192.106

# 测试 nginx 配置
docker exec lzy_nginx nginx -t

# 手动 reload nginx
docker exec lzy_nginx nginx -s reload

# 检查证书文件
ls -la /data/nginx-ssl-config/ssl/
openssl x509 -in /data/nginx-ssl-config/ssl/lantel.net.crt -noout -dates
```

---

### 问题4: 生产环境证书未同步

**症状**: 准生产环境已更新，但生产环境仍是旧证书

**解决方案**:
- 参考上面的 "生产环境证书同步" 章节手动同步
- 或修改 `update-ssl-cert.sh` 添加自动同步逻辑

---

## 📌 重要提示

1. **Let's Encrypt 证书有效期 90 天**，脚本在剩余 30 天时自动触发更新
2. **准生产环境自动更新**，生产环境需手动同步（或修改脚本实现自动同步）
3. **更新前会自动备份旧证书**，如有问题可快速回滚
4. **建议在低峰期执行更新**，避免 nginx reload 影响用户

---

**维护者**: Claude Code  
**创建日期**: 2026-03-01  
**最后更新**: 2026-03-01
