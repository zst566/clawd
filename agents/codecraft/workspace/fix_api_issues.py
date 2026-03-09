#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 修复空块
content = content.replace(
    '''        if (!isValid) {
                  }
      }''',
    '''        if (!isValid) {
          // Token 无效，将在响应拦截器中处理
        }
      }'''
)

# 修复缩进
content = content.replace(
    '''      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
            return config
    },
    (error) => {
            return Promise.reject(error)
    }
  )''',
    '''      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )'''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed")
