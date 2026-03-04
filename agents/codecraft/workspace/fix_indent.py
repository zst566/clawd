#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复多余的缩进
content = content.replace(
    '''    }

        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))

    return retryRequest(fn, retries + 1)''',
    '''    }

    await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))

    return retryRequest(fn, retries + 1)'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed indentation")
