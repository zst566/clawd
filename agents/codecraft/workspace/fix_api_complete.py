#!/usr/bin/env python3
"""
完整修复 api.ts
"""

import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 删除所有孤立的 console.log 参数块

# 1. 请求拦截器中的块
content = content.replace(
    '''      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
        params: JSON.stringify(config.params, null, 2),
        data: config.data,
        headers: sanitizeHeaders(config.headers)
      })
''',
    '')

# 2. 响应拦截器中的块
content = content.replace(
    '''      // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
        data: response.data,
        headers: sanitizeHeaders(response.headers)
      })
''',
    '')

# 3. 错误处理中的网络错误日志块
content = content.replace(
    '''        `[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`,
        error.message
      )
''',
    '')

# 4. 错误处理中的响应错误日志块  
content = content.replace(
    '''      // 错误日志记录 - 🔒 使用 sanitizeHeaders 过滤敏感信息
        error: data,
        headers: sanitizeHeaders(error.response.headers)
      })
''',
    '')

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed api.ts")
