#!/usr/bin/env python3
"""
修复 api.ts - 正确删除 console 调用，保持代码结构
"""

import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 需要删除的行（基于对原始文件的分析）
# 这些行包含 console.log/error 调用及其参数
lines_to_delete = [
    78,  # // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印
    79,  #     params: JSON.stringify(config.params, null, 2),
    80,  #     data: config.data,
    81,  #     headers: sanitizeHeaders(config.headers)
    82,  #   })
    
    94,  # // 🔒 使用 sanitizeHeaders 过滤敏感信息后打印  
    95,  #     data: response.data,
    96,  #     headers: sanitizeHeaders(response.headers)
    97,  #   })
    
    113, #     `[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - Network Error`,
    114, #     error.message
    115, #   )
    
    119, # // 错误日志记录 - 🔒 使用 sanitizeHeaders 过滤敏感信息
    120, #   console.error(`[${config?.method?.toUpperCase()}] ${config?.url} [${requestId}] - ${status}`, {
    121, #     error: data,
    122, #     headers: sanitizeHeaders(error.response.headers)
    123, #   })
]

# 转换为 0-indexed
lines_to_delete = [i - 1 for i in lines_to_delete]

result = []
for i, line in enumerate(lines):
    if i not in lines_to_delete:
        result.append(line)

with open('src/services/api.ts', 'w') as f:
    f.writelines(result)

print(f"Deleted {len(lines_to_delete)} lines")
