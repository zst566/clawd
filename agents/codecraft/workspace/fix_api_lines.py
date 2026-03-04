#!/usr/bin/env python3
"""
完整修复 api.ts - 删除所有 console.log/error 及其参数
"""

import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 要删除的行的索引 (0-indexed)
lines_to_delete = [
    # 请求拦截器 console.log (第79-83行)
    78, 79, 80, 81, 82,
    # 响应拦截器 console.log (第96-99行)
    95, 96, 97, 98,
    # 网络错误 console.error (第114-116行)
    113, 114, 115,
    # 响应错误 console.error (第122-125行)
    121, 122, 123, 124,
]

result = []
for i, line in enumerate(lines):
    if i not in lines_to_delete:
        result.append(line)

with open('src/services/api.ts', 'w') as f:
    f.writelines(result)

print(f"Deleted {len(lines_to_delete)} lines")
