#!/usr/bin/env python3
"""
修复所有 TypeScript/Vue 文件中的孤立 console.log 参数块
使用上下文匹配来精确定位
"""

import os
import re

def fix_isolated_blocks(content):
    """
    修复孤立的 { key: value, ... } 块
    这些块前面通常是空行或注释，后面跟着 }) 
    """
    lines = content.split('\n')
    result = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # 检测孤立的 { 开始的对象字面量的特征：
        # 1. 行包含 key: value 格式（属性名后跟冒号）
        # 2. 不是赋值语句（= 在冒号之前）
        # 3. 不是类型定义（没有特定关键字）
        # 4. 不是解构赋值
        if (':' in stripped and 
            not stripped.startswith('//') and 
            not stripped.startswith('*') and
            not stripped.startswith('/*') and
            '=' not in stripped.split(':')[0] and  # 不是赋值
            '(' not in stripped.split(':')[0] and  # 不是函数调用
            not any(kw in stripped.split(':')[0] for kw in ['if', 'else', 'for', 'while', 'switch', 'case', 'default', 'return', 'break', 'continue'])):
            
            # 向前看，找到匹配的 })
            temp_i = i
            brace_depth = 0
            is_isolated = False
            end_i = -1
            
            while temp_i < len(lines):
                temp_line = lines[temp_i]
                brace_depth += temp_line.count('{') - temp_line.count('}')
                
                # 如果遇到 }) 且深度为0或负数
                if brace_depth <= 0 and '})' in temp_line:
                    # 检查这是否是孤立的块
                    # 特征：前面没有 console.log 或类似的东西
                    prev_lines = ''.join(lines[max(0, i-3):i])
                    if 'console.' not in prev_lines and 'log(' not in prev_lines:
                        is_isolated = True
                        end_i = temp_i
                    break
                
                # 如果深度变得很大或遇到其他代码结构，停止
                if temp_i - i > 20:
                    break
                    
                temp_i += 1
            
            if is_isolated:
                # 跳过这个孤立块
                i = end_i + 1
                continue
        
        result.append(line)
        i += 1
    
    return '\n'.join(result)

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r') as f:
            original = f.read()
        
        content = fix_isolated_blocks(original)
        
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
    
    print(f"\n=== Total: {fixed} files fixed ===")
