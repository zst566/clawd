#!/usr/bin/env python3
"""
修复 TypeScript 文件中的孤立代码块
这些孤立块是删除 console.log 时留下的
"""

import re
import sys

def fix_webview_bridge(content):
    """修复 webview-bridge.ts"""
    # 1. 修复 detectEnvironment 开头的孤立对象字面量 (第71-78行)
    lines = content.split('\n')
    result = []
    i = 0
    in_isolated_block = False
    brace_count = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测 detectEnvironment 函数后的孤立块开始
        if 'private detectEnvironment()' in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('hasWindow:'):
                # 找到孤立块，跳过直到闭合
                result.append(line)  # 保留函数定义行
                i += 1
                brace_count = 1
                while i < len(lines) and brace_count > 0:
                    brace_count += lines[i].count('{') - lines[i].count('}')
                    i += 1
                # 跳过 }) 行后的空行
                while i < len(lines) and lines[i].strip() == '':
                    i += 1
                continue
        
        # 检测 else {} 空块
        if line.strip() == '} else {' and i + 1 < len(lines) and lines[i + 1].strip() == '}':
            # 保留 else 之前的部分，跳过 else {}
            i += 2
            continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_file(filepath, fix_func):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    content = fix_func(content)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    else:
        print(f"No changes: {filepath}")
        return False

if __name__ == '__main__':
    import os
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    # 修复 webview-bridge.ts
    fix_file('src/utils/webview-bridge.ts', fix_webview_bridge)
