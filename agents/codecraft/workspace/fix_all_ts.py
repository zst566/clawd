#!/usr/bin/env python3
"""
修复 TypeScript 文件中的孤立代码块
这些孤立块是删除 console.log 时留下的
"""

import re
import os

def remove_isolated_object_literal(content, start_pattern, end_marker=None):
    """
    删除孤立的 { key: value, ... } 对象字面量
    start_pattern: 开始匹配的模式
    end_marker: 结束标记（如 '})'）
    """
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测是否匹配开始模式
        if start_pattern in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            # 检查下一行是否是对象字面量的开始
            if ':' in next_line and not next_line.startswith('//') and not next_line.startswith('*'):
                # 找到可能的孤立块，检查是否有匹配的闭合
                result.append(line)
                i += 1
                brace_depth = 0
                found_object = False
                start_idx = i
                
                while i < len(lines):
                    current = lines[i]
                    brace_depth += current.count('{') - current.count('}')
                    
                    if brace_depth < 0 or (brace_depth == 0 and '})' in current):
                        found_object = True
                        i += 1
                        break
                    i += 1
                
                if found_object:
                    # 跳过孤立块
                    continue
                else:
                    # 恢复并继续
                    i = start_idx
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_useCamera(content):
    """修复 useCamera.ts - 删除 catch 块中的孤立对象"""
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测 "isCameraReady.value = false" 后面的孤立块
        if 'isCameraReady.value = false' in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('name:'):
                result.append(line)
                i += 1
                # 跳过孤立块直到 }) 
                while i < len(lines) and '})' not in lines[i]:
                    i += 1
                i += 1  # 跳过 }) 行
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_guards(content):
    """修复 guards.ts - 删除多个孤立对象"""
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测 await 后的孤立块
        if 'await merchantOperatorService.getMyStatus()' in line and i + 2 < len(lines):
            if lines[i + 1].strip() == '' and lines[i + 2].strip().startswith('hasBinding:'):
                result.append(line)
                i += 1
                # 跳过空行和孤立块
                while i < len(lines) and lines[i].strip() == '':
                    result.append(lines[i])
                    i += 1
                while i < len(lines) and '})' not in lines[i]:
                    i += 1
                i += 1  # 跳过 }) 行
                continue
        
        # 检测 if 条件后的孤立块
        if 'status.merchantUser.isActive) {' in line and i + 2 < len(lines):
            if lines[i + 1].strip().startswith('approvalStatus:'):
                # 需要保留 {
                brace_depth = 1
                i += 1
                while i < len(lines) and brace_depth > 0:
                    brace_depth += lines[i].count('{') - lines[i].count('}')
                    i += 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_api(content):
    """修复 api.ts - 删除请求拦截器中的孤立对象"""
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测 "// 🔒 使用 sanitizeHeaders" 后面的孤立块
        if '// 🔒 使用 sanitizeHeaders' in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('params:'):
                result.append(line)
                i += 1
                # 跳过孤立块直到 }) 
                while i < len(lines) and '})' not in lines[i]:
                    i += 1
                i += 1  # 跳过 }) 行
                continue
        
        # 检测响应拦截器中的孤立块
        if '// 🔒 使用 sanitizeHeaders' in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('data:'):
                result.append(line)
                i += 1
                while i < len(lines) and '})' not in lines[i]:
                    i += 1
                i += 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_webview_bridge(content):
    """修复 webview-bridge.ts"""
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # 检测 detectEnvironment 函数后的孤立块
        if 'private detectEnvironment()' in line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if next_line.startswith('hasWindow:'):
                result.append(line)
                i += 1
                brace_depth = 1
                while i < len(lines) and brace_depth > 0:
                    brace_depth += lines[i].count('{') - lines[i].count('}')
                    i += 1
                continue
        
        # 检测 else {} 空块
        stripped = line.strip()
        if stripped == '} else {' or stripped == 'else {':
            if i + 1 < len(lines) and lines[i + 1].strip() == '}':
                # 替换为空行
                i += 2
                continue
        
        # 检测 catch (error) {} 空块
        if 'catch (error) {' in line:
            j = i + 1
            empty = True
            while j < len(lines) and lines[j].strip() != '}':
                if lines[j].strip():
                    empty = False
                    break
                j += 1
            if empty and j < len(lines):
                result.append(line.replace('{', '{ /* ignored */ }'))
                i = j + 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_file(filepath, fix_func):
    """修复单个文件"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        content = fix_func(content)
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✓ Fixed: {filepath}")
            return True
        else:
            print(f"  No changes: {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error fixing {filepath}: {e}")
        return False

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    files_to_fix = [
        ('src/utils/webview-bridge.ts', fix_webview_bridge),
        ('src/composables/useCamera.ts', fix_useCamera),
        ('src/router/guards.ts', fix_guards),
        ('src/services/api.ts', fix_api),
    ]
    
    fixed_count = 0
    for filepath, fix_func in files_to_fix:
        if fix_file(filepath, fix_func):
            fixed_count += 1
    
    print(f"\nTotal fixed: {fixed_count} files")
