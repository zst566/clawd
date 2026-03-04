#!/usr/bin/env python3
import os

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    lines = f.readlines()

# 第107行是 '      }\n' (buildError 函数的结束)
# 第108行是 '\n'
# 第109行是 '          error.message\n'
# 第110行是 '        )\n'
# 第111行是 throw new Error
# 第112行是 '      }\n'

# 我们需要：
# 第107行: '      }\n' (buildError 函数结束)
# 第108行: '\n'
# 第109行: '      if (!error.response) {\n'
# 第110行: "        throw new Error('网络连接失败，请检查网络设置')\n"
# 第111行: '      }\n'

# 删除第109-110行（error.message 和 )）
lines = lines[:108] + lines[110:]

# 在现在的第109行（原来是第111行 throw new Error）前面添加 if 语句
lines.insert(109, '      if (!error.response) {\n')

# 在第111行（throw new Error）后面添加 }
# throw new Error 现在在 第110行
lines.insert(111, '      }\n')

with open('src/services/api.ts', 'w') as f:
    f.writelines(lines)

print("Fixed")
