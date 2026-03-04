#!/usr/bin/env python3
import os
import re

os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# 删除所有 console.xxx(...) 调用（包括多行）
def remove_console_calls(content):
    result = []
    i = 0
    while i < len(content):
        # 查找 console.
        match = re.search(r'console\.(log|error|warn)\(', content[i:])
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
        
        # 跳过尾随的换行符
        while j < len(content) and content[j] == '\n':
            j += 1
        
        i = j
    
    return ''.join(result)

content = remove_console_calls(content)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

print("Removed all console calls")
