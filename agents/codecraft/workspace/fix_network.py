#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复网络错误处理
content = content.replace(
    '''      // 网络错误处理
        throw new Error('网络连接失败，请检查网络设置')
      }''',
    '''      // 网络错误处理
      if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置')
      }'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed")
