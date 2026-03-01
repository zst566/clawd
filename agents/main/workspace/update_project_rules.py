import os

file_path = '/Users/asura.zhou/clawd/project-rules/鹿状元-项目规则.md'

# 读取现有内容
with open(file_path, 'r') as f:
    content = f.read()

# 移除旧的最后更新行
content = content.rstrip()
if content.endswith('*最后更新: 2026-03-01*'):
    content = content[:content.rfind('*最后更新: 2026-03-01*')].rstrip()

# 添加新的相关文档章节
new_section = '''

---

## 📚 相关文档

### 开发环境管理
- **开发环境管理指南**: `docs/开发环境管理指南.md`
  - 包含所有开发环境脚本的使用说明
  - dev-start.sh, dev-stop.sh, dev-restart.sh 等
  - 开发环境配置和故障排除

### SSL 证书管理
- **SSL 证书管理指南**: `docs/SSL证书管理指南.md`
  - SSL 证书自动检查和更新方案
  - 准生产环境 (8.138.192.106) 和生产环境 (8.138.187.106) 的证书管理
  - 证书更新脚本: check-ssl-expiry.sh, update-ssl-cert.sh, sync-ssl-to-prod.sh

---

*最后更新: 2026-03-01*
'''

content = content + new_section

# 写回文件
with open(file_path, 'w') as f:
    f.write(content)

print('✅ 项目规则文件已更新')