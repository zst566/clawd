#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复 throw error 的缩进
content = content.replace('                throw error', '        throw error')

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed throw error indentation")
