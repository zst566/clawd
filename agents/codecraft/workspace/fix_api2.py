#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复 forEach 缺失的 })
content = content.replace(
    """      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value as string)
    }""",
    """      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value as string)
      })"""
)

# 修复 post 缺失的 })
content = content.replace(
    """        headers: {
          'Content-Type': 'multipart/form-data'
        }
    )""",
    """        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    )"""
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed api.ts")
