#!/usr/bin/env python3
"""
精确修复 api.ts

原始结构：
  if (!error.response) {
    console.error(...)
    throw new Error('网络连接失败，请检查网络设置')
  }

目标结构：
  if (!error.response) {
    throw new Error('网络连接失败，请检查网络设置')
  }
"""

import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 1. 修复网络错误处理
# 删除 console.error 调用，但保留 if 块结构
content = content.replace(
    '''      if (!error.response) {
        console.error(
          `[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`,
          error.message
        )
        throw new Error('网络连接失败，请检查网络设置')
      }''',
    '''      if (!error.response) {
        throw new Error('网络连接失败，请检查网络设置')
      }'''
)

# 2. 删除请求拦截器中的 console.log
content = content.replace(
    '''      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
        params: JSON.stringify(config.params, null, 2),
        data: config.data,
        headers: sanitizeHeaders(config.headers)
      })
''',
    ''
)

# 3. 删除响应拦截器中的 console.log
content = content.replace(
    '''      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
        data: response.data,
        headers: sanitizeHeaders(response.headers)
      })
''',
    ''
)

# 4. 删除响应错误处理中的 console.error 和注释
content = content.replace(
    '''      // 错误日志记录 - 🔒 使用 sanitizeHeaders 过滤敏感信息
      console.error(`[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - ${status}`, {
        error: data,
        headers: sanitizeHeaders(error.response.headers)
      })
''',
    ''
)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed api.ts")
