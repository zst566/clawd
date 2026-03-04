#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复缩进
content = content.replace(
    '''      // 商户相关API的403错误处理（权限被取消）
                const authStore = useAuthStore()''',
    '''      // 商户相关API的403错误处理（权限被取消）
        const authStore = useAuthStore()'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed indentation")
