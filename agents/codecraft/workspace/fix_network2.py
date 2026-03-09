#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 找到第106行（0-indexed 105）并替换
for i, line in enumerate(lines):
    if 'throw new Error' in line and '网络连接失败' in line:
        # 检查前面是否有 if (!error.response) {
        if i > 0 and 'if (!error.response)' not in lines[i-1]:
            # 替换这一行，添加缩进和 if 语句
            lines[i] = '      if (!error.response) {\n' + line
            # 找到对应的 } 并在后面添加 }
            # 查找下一行是否是 }
            if i + 1 < len(lines) and lines[i + 1].strip() == '}':
                lines[i + 1] = '      }\n'
            break

with open('src/services/api.ts', 'w') as f:
    f.writelines(lines)

print("Fixed")
