#!/usr/bin/env python3
"""
修复所有 TypeScript/Vue 文件中的孤立 console.log 参数块
"""

import os

def delete_lines(filepath, ranges):
    """删除指定范围的行 (1-indexed, inclusive)"""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    to_delete = set()
    for start, end in ranges:
        for i in range(start - 1, end):
            to_delete.add(i)
    
    result = [line for i, line in enumerate(lines) if i not in to_delete]
    
    with open(filepath, 'w') as f:
        f.writelines(result)
    
    print(f"✓ Fixed: {filepath} (deleted {len(to_delete)} lines)")
    return True

# 定义所有文件的修复范围
FIXES = {
    'src/utils/webview-bridge.ts': [
        (69, 77),    # detectEnvironment 中的孤立对象
        (313, 322),  # navigateToPayment 中的孤立对象
        (480, 484),  # else 块中的孤立对象
        (472, 476),  # payment 中的孤立对象
    ],
    'src/composables/useCamera.ts': [
        (131, 134),  # catch 块中的孤立对象
    ],
    'src/router/guards.ts': [
        (253, 258),  # getMyStatus 后的孤立对象
        (270, 272),  # if 条件后的孤立对象
    ],
    'src/services/api.ts': [
        (79, 82),    # 请求拦截器中的孤立对象
        (96, 99),    # 响应拦截器中的孤立对象
    ],
    'src/components/merchant/ScanResultPopup.vue': [
        (161, 164),  # canVerify 函数中的孤立对象
    ],
    'src/views/customer/Home.vue': [
        (135, 138),  # Promise.all 后的孤立对象
    ],
    'src/views/customer/PromotionDetail.vue': [
        (640, 645),  # 构建 paymentUrl 后的孤立对象
    ],
    'src/views/merchant/Verifications.vue': [
        (221, 225),  # loadVerifications 中的孤立对象
    ],
}

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    fixed = 0
    for filepath, ranges in FIXES.items():
        try:
            if delete_lines(filepath, ranges):
                fixed += 1
        except Exception as e:
            print(f"✗ Error fixing {filepath}: {e}")
    
    print(f"\n=== Total: {fixed} files fixed ===")
