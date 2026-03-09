#!/usr/bin/env python3
"""
使用 AST 风格的方法修复 api.ts
找到所有 console.log/error 调用并删除
"""

import os
import re

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 查找并删除 console.log/error 调用
# 模式：console.log(...) 或 console.error(...)

def remove_console_call(content, func_name):
    """删除 console.func_name(...) 调用"""
    pattern = r'console\.' + func_name + r'\([^)]*\)'
    
    # 对于多行调用，需要更复杂的处理
    # 找到 console.xxx( 然后匹配括号
    result = []
    i = 0
    while i < len(content):
        match = re.search(r'console\.' + func_name + r'\(', content[i:])
        if not match:
            result.append(content[i:])
            break
        
        start = i + match.start()
        result.append(content[i:start])
        
        # 找到匹配的 )
        paren_depth = 1
        j = start + len(match.group())
        in_string = False
        string_char = None
        
        while j < len(content) and paren_depth > 0:
            c = content[j]
            
            if not in_string:
                if c in '"\'`':
                    in_string = True
                    string_char = c
                elif c == '(':
                    paren_depth += 1
                elif c == ')':
                    paren_depth -= 1
            else:
                if c == string_char and content[j-1] != '\\':
                    in_string = False
            
            j += 1
        
        # 跳过这个调用（包括可能的尾随分号和换行）
        while j < len(content) and content[j] in '; \n':
            j += 1
        
        i = j
    
    return ''.join(result)

# 删除 console.log 和 console.error
content = remove_console_call(content, 'log')
content = remove_console_call(content, 'error')

# 删除注释行 "// 🔒 使用 sanitizeHeaders..."
content = re.sub(r'\s*// 🔒 使用 sanitizeHeaders[^\n]*\n', '\n', content)

# 删除注释行 "// 错误日志记录..."
content = re.sub(r'\s*// 错误日志记录[^\n]*\n', '\n', content)

# 清理多余的空行
content = re.sub(r'\n{3,}', '\n\n', content)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Fixed api.ts")
