#!/usr/bin/env python3
"""
修复 api.ts 中的孤立块
"""

import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 要删除的行的内容特征
lines_to_delete = [
    '      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印\n',
    '        params: JSON.stringify(config.params, null, 2),\n',
    '        data: config.data,\n',
    '        headers: sanitizeHeaders(config.headers)\n',
    '      })\n',
    '        data: response.data,\n',
    '        headers: sanitizeHeaders(response.headers)\n',
    '      // 错误日志记录 - 🔒 使用 sanitizeHeaders 过滤敏感信息\n',
    '        `[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`,\n',
    '        error: data,\n',
    '        headers: sanitizeHeaders(error.response.headers)\n',
]

result = []
deleted = 0

for line in lines:
    if line in lines_to_delete:
        deleted += 1
        continue
    result.append(line)

with open('src/services/api.ts', 'w') as f:
    f.writelines(result)

print(f"Deleted {deleted} lines")
