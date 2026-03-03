#!/usr/bin/env python3
"""
修复 TypeScript/Vue 文件中的孤立 console.log 参数块
使用精确匹配删除特定的孤立块
"""

import os

# 定义要删除的孤立块 (文件路径, 块的特征内容)
BLOCKS_TO_DELETE = [
    # webview-bridge.ts
    ('src/utils/webview-bridge.ts', '''      hasWindow: typeof window !== 'undefined',
      hasWx: typeof window !== 'undefined' && !!window.wx,
      hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
      hasGetEnv: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.getEnv === 'function',
      hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function',
      hasNavigateTo: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.navigateTo === 'function'
    })'''),
    
    ('src/utils/webview-bridge.ts', '''        isInMiniProgram: this.isInMiniProgram,
        hasWindow: typeof window !== 'undefined',
        hasWx: typeof window !== 'undefined' && !!window.wx,
        hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
        hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
      })'''),
    
    ('src/utils/webview-bridge.ts', '''          hasWindow: typeof window !== 'undefined',
          hasWx: typeof window !== 'undefined' && !!window.wx,
          hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
          hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function'
        })'''),
    
    ('src/utils/webview-bridge.ts', '''        isInMiniProgram: this.isInMiniProgram,
        hasWx: typeof window !== 'undefined' && !!window.wx,
        hasMiniProgram: typeof window !== 'undefined' && !!window.wx?.miniProgram,
        hasPostMessage: typeof window !== 'undefined' && typeof window.wx?.miniProgram?.postMessage === 'function'
      })'''),
    
    # useCamera.ts
    ('src/composables/useCamera.ts', '''        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })'''),
    
    # guards.ts
    ('src/router/guards.ts', '''          hasBinding: status.hasBinding,
          hasMerchantUser: !!status.merchantUser,
          approvalStatus: status.merchantUser?.approvalStatus,
          isActive: status.merchantUser?.isActive,
          merchantCode: status.merchantUser?.merchantCode
        })'''),
    
    ('src/router/guards.ts', '''            approvalStatus: status.merchantUser.approvalStatus,
            isActive: status.merchantUser.isActive
          })'''),
    
    # api.ts
    ('src/services/api.ts', '''        params: JSON.stringify(config.params, null, 2),
        data: config.data,
        headers: sanitizeHeaders(config.headers)
      })'''),
    
    ('src/services/api.ts', '''        data: response.data,
        headers: sanitizeHeaders(response.headers)
      })'''),
    
    # ScanResultPopup.vue
    ('src/components/merchant/ScanResultPopup.vue', '''    originalStatus: status,
    normalizedStatus,
    canVerify: canVerifyResult
  })'''),
    
    # Home.vue
    ('src/views/customer/Home.vue', '''      banner: bannerConfigsResult,
      shortcut: shortcutConfigsResult
    })'''),
    
    # PromotionDetail.vue
    ('src/views/customer/PromotionDetail.vue', '''      orderId,
      finalPayAmount,
      paymentUrl,
      hasNavigateTo,
      hasMiniProgram: !!miniProgram
    })'''),
    
    # Verifications.vue
    ('src/views/merchant/Verifications.vue', '''        listLength: result?.list?.length || 0, 
        pagination: result?.pagination,
        firstItem: result?.list?.[0] 
      })'''),
]

def fix_file(filepath, blocks):
    """修复单个文件"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        deleted = 0
        
        for _, block in blocks:
            if block in content:
                content = content.replace(block, '')
                deleted += 1
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✓ Fixed: {filepath} (deleted {deleted} blocks)")
            return True
        else:
            print(f"  No changes: {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error fixing {filepath}: {e}")
        return False

if __name__ == '__main__':
    os.chdir('/Volumes/SanDisk2T/dv-codeBase/Golden_Coast_Mall/mall-vue')
    
    # 按文件分组
    files = {}
    for filepath, block in BLOCKS_TO_DELETE:
        if filepath not in files:
            files[filepath] = []
        files[filepath].append((filepath, block))
    
    fixed = 0
    for filepath, blocks in files.items():
        if fix_file(filepath, blocks):
            fixed += 1
    
    print(f"\n=== Total: {fixed} files fixed ===")
