#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复空 if 块
content = content.replace(
    '''        if (!isValid) {
        }''',
    '''        if (!isValid) {
          // Token 无效，将在响应拦截器中处理
        }'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed")
