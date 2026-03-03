import re
import os

# 文件修改配置
files_to_fix = [
    # formatPrice 修复
    {
        'path': 'src/components/customer/promotion/VariantList.vue',
        'old_import': None,
        'new_import': "import { formatPrice } from '@/utils/format'",
        'pattern': r"const formatPrice = \(price: number\): string =\> \{\n  return price\.toFixed\(2\)\n\}",
        'desc': 'formatPrice (toFixed version)'
    },
    {
        'path': 'src/components/customer/CategoryPromotionList.vue',
        'old_import': "import { formatMoney } from '@/utils/format'",
        'new_import': "import { formatMoney, formatPrice } from '@/utils/format'",
        'pattern': r"// 格式化价格\nconst formatPrice = \(price: number \| undefined \| null\): string =\> \{\n  if \(price === null \|\| price === undefined \|\| \(typeof price !== 'number'\) \|\| isNaN\(price\)\) \{\n    return formatMoney\(0\)\n  \}\n  return formatMoney\(price\)\n\}",
        'desc': 'formatPrice with null check'
    },
    {
        'path': 'src/components/merchant/order/OrderBasicInfo.vue',
        'old_import': None,
        'new_import': "import { formatPrice, formatDateTime } from '@/utils/format'",
        'patterns': [
            r"// 格式化日期时间\nconst formatDateTime = \(dateStr: string\): string =\> \{\n  if \(!dateStr\) return ''\n  try \{\n    return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n  \} catch \(e\) \{\n    return dateStr\n  \}\n\}",
            r"// 格式化金额\nconst formatPrice = \(price: number \| undefined\): string =\> \{\n  return \(price \|\| 0\)\.toFixed\(2\)\n\}"
        ],
        'desc': 'formatPrice and formatDateTime'
    },
    {
        'path': 'src/components/merchant/order/ProductList.vue',
        'old_import': None,
        'new_import': "import { formatPrice } from '@/utils/format'",
        'pattern': r"const formatPrice = \(price: number \| undefined\): string =\> \{\n  return \(price \|\| 0\)\.toFixed\(2\)\n\}",
        'desc': 'formatPrice'
    },
    {
        'path': 'src/components/merchant/order/PaymentInfo.vue',
        'old_import': None,
        'new_import': "import { formatPrice, formatDateTime } from '@/utils/format'",
        'patterns': [
            r"// 格式化日期\nconst formatDateTime = \(dateStr: string\): string =\> \{\n  if \(!dateStr\) return '-'\n  try \{\n    return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n  \} catch \{\n    return dateStr\n  \}\n\}",
            r"const formatPrice = \(price: number \| undefined\): string =\> \{\n  return \(price \|\| 0\)\.toFixed\(2\)\n\}"
        ],
        'desc': 'formatPrice and formatDateTime'
    },
    {
        'path': 'src/views/customer/Promotions.vue',
        'old_import': "import { formatMoney } from '@/utils/format'",
        'new_import': "import { formatMoney, formatPrice } from '@/utils/format'",
        'pattern': r"const formatPrice = \(price: number \| undefined \| null\): string =\> \{\n  if \(price === null \|\| price === undefined \|\| isNaN\(price\)\) \{\n    return formatMoney\(0\)\n  \}\n  return formatMoney\(price\)\n\}",
        'desc': 'formatPrice'
    },
    # formatDateTime 修复
    {
        'path': 'src/views/customer/Orders.vue',
        'old_import': None,
        'new_import': "import { formatDateTime } from '@/utils/format'",
        'pattern': r"// 格式化日期时间.*?const formatDateTime = \(dateStr: string \| Date\) =\> \{[\s\S]*?\n  \}",
        'desc': 'formatDateTime'
    },
    {
        'path': 'src/views/merchant/Verifications.vue',
        'old_import': None,
        'new_import': "import { formatDateTime } from '@/utils/format'",
        'pattern': r"const formatDateTime = \(dateStr: string\) =\> \{[\s\S]*?\n  \}",
        'desc': 'formatDateTime'
    },
    {
        'path': 'src/components/merchant/order/OrderTimeline.vue',
        'old_import': None,
        'new_import': "import { formatDateTime } from '@/utils/format'",
        'pattern': r"const formatDateTime = \(dateStr: string \| undefined\): string =\> \{\n  if \(!dateStr\) return ''\n  return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n\}",
        'desc': 'formatDateTime'
    },
    # formatPhone 修复
    {
        'path': 'src/composables/useProfileData.ts',
        'old_import': None,
        'new_import': "import { formatPhone } from '@/utils/format'",
        'pattern': r"/\*\*\n \* 格式化手机号\n \*/\nconst formatPhone = \(phone: string \| undefined\): string =\> \{\n  if \(!phone\) return ''\n  return phone\.replace\(/\(\\d\{3\}\)\\d\{4\}\(\\d\{4\}\)/, '\$1\*\*\*\*\$2'\)\n\}",
        'desc': 'formatPhone'
    },
    {
        'path': 'src/views/customer/Membership.vue',
        'old_import': None,
        'new_import': "import { formatPhone } from '@/utils/format'",
        'pattern': r"// 格式化手机号\nconst formatPhone = \(phone\?: string\): string =\> \{\n  if \(!phone\) return ''\n  return phone\.replace\(/\(\\d\{3\}\)\\d\{4\}\(\\d\{4\}\)/, '\$1\*\*\*\*\$2'\)\n\}",
        'desc': 'formatPhone'
    },
]

results = []

for config in files_to_fix:
    path = config['path']
    if not os.path.exists(path):
        results.append(f"跳过: {path} (文件不存在)")
        continue
    
    with open(path, 'r') as f:
        content = f.read()
    
    original = content
    
    # 更新导入语句
    if config['old_import']:
        content = content.replace(config['old_import'], config['new_import'])
    elif config['new_import']:
        # 在 script setup 开始处添加导入
        content = content.replace(
            "<script setup lang=\"ts\">\n",
            f"<script setup lang=\"ts\">\n{config['new_import']}\n"
        )
    
    # 删除本地函数定义
    if 'patterns' in config:
        for pattern in config['patterns']:
            content = re.sub(pattern, '', content)
    elif 'pattern' in config:
        content = re.sub(config['pattern'], '', content)
    
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        results.append(f"✓ {path} - 已修复 {config['desc']}")
    else:
        results.append(f"- {path} - 无需修改或模式不匹配")

print("\n".join(results))
