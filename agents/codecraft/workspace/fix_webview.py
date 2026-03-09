#!/usr/bin/env python3
"""
精确修复 webview-bridge.ts - 基于行号删除孤立的 console.log 参数块
"""

import os

def delete_lines(filepath, ranges):
    """
    删除指定范围的行
    ranges: [(start1, end1), (start2, end2), ...]  1-indexed, inclusive
    """
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    # 转换为0-indexed，构建要删除的行号集合
    to_delete = set()
    for start, end in ranges:
        for i in range(start - 1, end):
            to_delete.add(i)
    
    # 保留不在删除集合中的行
    result = []
    for i, line in enumerate(lines):
        if i not in to_delete:
            result.append(line)
    
    with open(filepath, 'w') as f:
        f.writelines(result)
    
    print(f"✓ Fixed: {filepath} (deleted {len(to_delete)} lines)")

# webview-bridge.ts 的修复范围
# 通过分析代码确定
WEBVIEW_BRIDGE_FIXES = [
    # Block 1: detectEnvironment 中的孤立对象 (第69-77行)
    # 第69-76行是对象内容，第77行是 }) 
    (69, 77),
    
    # Block 2: navigateToPayment 中的孤立对象 (第313-322行)
    # 第313行是注释"// 详细的环境检测日志"
    # 第314-321行是对象内容，第322行是 })
    (313, 322),
    
    # Block 3: else 块中的孤立对象 (第480-484行)
    # 第480-484行是对象内容
    (480, 484),
]

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    delete_lines('src/utils/webview-bridge.ts', WEBVIEW_BRIDGE_FIXES)
