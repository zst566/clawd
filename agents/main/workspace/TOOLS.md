# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## SSH 生产服务器

### 鹿状元 (lantel.net)
- **地址**: 8.138.192.106
- **SSH 别名**: `lzy-pre-production` (配置在 ~/.ssh/config)
- **用户名**: root
- **端口**: 22
- **生产环境**: https://xiaolu.lantel.net
- **安全组ID**: `sg-7xv87ksctb1y8bwphjm1` (华南3-广州)

**SSL证书自动更新**:
- 脚本位置: `/Volumes/SanDisk2T/dv-codeBase/鹿状元/check-and-renew-ssl.sh`
- 定时任务: 每天9点自动检查，≤30天时自动更新
- 手动执行: `cd /Volumes/SanDisk2T/dv-codeBase/鹿状元 && ./check-and-renew-ssl.sh`
- 当前证书到期: 2026年8月30日 (剩余177天)

**快速连接**:
```bash
ssh lzy-pre-production
```

---

### 信宜文旅平台 (茂名文旅)
- **地址**: 112.74.36.81
- **用户名**: root
- **密码**: nrftI5r4ag9qAGvk
- **端口**: 22 (默认)
- **部署目录**: /app/xinyi-wenlu/
- **用途**: 线上生产环境部署

**快速连接**:
```bash
ssh root@112.74.36.81
```

**上传文件示例**:
```bash
scp YrFkEANYk4.txt root@112.74.36.81:/app/xinyi-wenlu/nginx/html/
```

## 阿里云 OSS 存储

### 存储桶信息
- **Bucket**: hxcm-oss
- **地域**: oss-cn-shenzhen-internal
- **外网域名**: hxcm-oss.oss-cn-shenzhen.aliyuncs.com
- **内网域名**: hxcm-oss.oss-cn-shenzhen-internal.aliyuncs.com

### AccessKey 凭证（敏感信息）
> ⚠️ **注意**：此为生产环境敏感凭证，请勿泄露

| 项目 | 值 |
|------|-----|
| AccessKey ID | `*(已移除)` |
| AccessKey Secret | `*(已移除)` |

**配置位置**：
- 本地：`apps/backend/.env.production`
- 服务器：`/root/scripts/deploy-backend.sh`

**用途**：Banner 图片上传到 OSS

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
