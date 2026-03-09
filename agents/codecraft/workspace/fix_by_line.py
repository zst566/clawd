#!/usr/bin/env python3
"""
精确修复 TypeScript 文件 - 基于行号删除孤立的 console.log 参数块
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

# 定义每个文件的修复范围
# 格式: 文件路径: [(开始行, 结束行), ...]
FIXES = {
    'src/utils/webview-bridge.ts': [
        # detectEnvironment 中的孤立对象字面量 (第69-77行)
        (69, 77),
        # else {} 空块在第88-89行 (else { })
        # 实际上在第87行 } else { 和第88行 }
        # 让我检查准确位置
    ],
}

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    # 先查看各个文件的问题位置
    import subprocess
    
    # 找出 webview-bridge.ts 中所有孤立块的位置
    result = subprocess.run(
        ['grep', '-n', 'hasWindow:', 'src/utils/webview-bridge.ts'],
        capture_output=True, text=True
    )
    print("webview-bridge.ts 中的 hasWindow: 位置:")
    print(result.stdout)
    
    # 找出 else {} 空块
    result = subprocess.run(
        ['grep', '-n', 'else {', 'src/utils/webview-bridge.ts'],
        capture_output=True, text=True
    )
    print("\nwebview-bridge.ts 中的 else { 位置:")
    print(result.stdout)
