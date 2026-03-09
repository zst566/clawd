#!/usr/bin/env python3
"""
完整修复 api.ts - 删除所有 console.log/error 调用及其参数
"""

import re
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 删除请求拦截器中的 console.log
content = re.sub(
    r'// 🔒 使用 sanitizeHeaders 过滤敏感信息后打印\n\s+params: JSON\.stringify\(config\.params, null, 2\),\n\s+data: config\.data,\n\s+headers: sanitizeHeaders\(config\.headers\)\n\s+\}\)\n',
    '',
    content
)

# 删除响应拦截器中的 console.log
content = re.sub(
    r'// 🔒 使用 sanitizeHeaders 过滤敏感信息后打印\n\s+data: response\.data,\n\s+headers: sanitizeHeaders\(response\.headers\)\n\s+\}\)\n',
    '',
    content
)

# 删除网络错误处理中的 console.error
content = re.sub(
    r'console\.error\(\n\s+`\[\$\{config\?\.method\?\.toUpperCase\(\)\}\] \$\{config\?\.url\}\s*\[\$\{requestId\}\] - Network Error`,\n\s+error\.message\n\s+\)\n',
    '',
    content
)

# 删除响应错误处理中的 console.error
content = re.sub(
    r'// 错误日志记录 - 🔒 使用 sanitizeHeaders 过滤敏感信息\n\s+console\.error\(\s*`\[\$\{config\?\.method\?\.toUpperCase\(\)\}\] \$\{config\?\.url\}\s*\[\$\{requestId\}\] - \$\{status\}`,\s*\{\n\s+error: data,\n\s+headers: sanitizeHeaders\(error\.response\.headers\)\n\s+\}\)\n',
    '',
    content
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed api.ts")
