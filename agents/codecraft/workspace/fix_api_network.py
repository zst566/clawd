#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 删除第109-110行（error.message 和 )）
del lines[108:110]  # 删除索引 108 和 109

# 在第107行（原来的108，现在是107）后面插入 if 语句
# 现在的第107行是空行
lines.insert(108, '      if (!error.response) {\n')

# throw new Error 现在在 第109行
# 在它后面插入 }
lines.insert(110, '      }\n')

with open('src/services/api.ts', 'w') as f:
    f.writelines(lines)

print("Fixed")
