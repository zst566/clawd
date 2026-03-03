#!/usr/bin/env python3
"""
修复 TypeScript 文件中的孤立 console.log 参数块

问题：删除 console.log 时，留下了孤立的 { key: value, ... } 对象字面量
解决：找到并删除这些孤立的块
"""

import re
import os

def find_and_remove_isolated_blocks(content):
    """
    找到并删除孤立的 { key: value, ... } 块
    这些块通常是 console.log 的参数
    """
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # 检测孤立的 { 开始的对象字面量
        # 特征：行首是属性名后跟冒号，如 "hasWindow:" 或 "name:"
        if (':' in stripped and 
            not stripped.startswith('//') and 
            not stripped.startswith('*') and
            not stripped.startswith('{') and  # 不是正常的块开始
            not stripped.startswith('}') and
            not stripped.startswith('if ') and
            not stripped.startswith('else') and
            not stripped.startswith('catch') and
            not stripped.startswith('for ') and
            not stripped.startswith('while ') and
            not stripped.startswith('switch') and
            '=' not in stripped.split(':')[0] and  # 不是赋值
            '(' not in stripped.split(':')[0]):   # 不是函数调用
            
            # 检查这是不是对象字面量的属性
            # 向前看，找到匹配的 })
            temp_i = i
            brace_depth = 0
            is_isolated_block = False
            
            while temp_i < len(lines):
                temp_line = lines[temp_i]
                brace_depth += temp_line.count('{') - temp_line.count('}')
                
                # 如果遇到 } 且深度为0或负数，检查是否是 })
                if brace_depth <= 0 and '})' in temp_line:
                    # 检查这是否是孤立的块（前面没有 console.log 或类似的东西）
                    # 通过检查前面的几行
                    prev_content = ''.join(lines[max(0, i-3):i])
                    if 'console.' not in prev_content and 'log(' not in prev_content:
                        is_isolated_block = True
                    break
                
                # 如果深度变得很大，可能不是我们要找的
                if temp_i - i > 20:
                    break
                    
                temp_i += 1
            
            if is_isolated_block:
                # 跳过这个孤立块
                i = temp_i + 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def remove_empty_else_blocks(content):
    """删除空的 else {} 块"""
    # 匹配 } else { } 或 else { }
    content = re.sub(r'\}\s*else\s*\{\s*\}', '}', content)
    content = re.sub(r'else\s*\{\s*\}', '', content)
    return content

def remove_empty_catch_blocks(content):
    """删除空的 catch (error) {} 块"""
    content = re.sub(r'catch\s*\(\s*\w*\s*\)\s*\{\s*\}', 'catch (error) { /* ignored */ }', content)
    return content

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r') as f:
            original = f.read()
        
        content = original
        content = find_and_remove_isolated_blocks(content)
        content = remove_empty_else_blocks(content)
        content = remove_empty_catch_blocks(content)
        
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
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    files = [
        'src/utils/webview-bridge.ts',
        'src/composables/useCamera.ts', 
        'src/router/guards.ts',
        'src/services/api.ts',
        'src/components/merchant/ScanResultPopup.vue',
        'src/views/customer/Home.vue',
        'src/views/customer/PromotionDetail.vue',
        'src/views/merchant/Verifications.vue',
    ]
    
    fixed = 0
    for f in files:
        if fix_file(f):
            fixed += 1
    
    print(f"\nTotal: {fixed} files fixed")
