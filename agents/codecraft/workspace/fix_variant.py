import re

with open('src/components/customer/VariantSelector.vue', 'r') as f:
    content = f.read()

# 1. 更新导入语句
content = content.replace(
    "import { formatMoney } from '@/utils/format'",
    "import { formatPrice } from '@/utils/format'"
)

# 2. 删除本地的 formatPrice 函数定义（包括注释）
pattern = r'''\n/\*\*
 \* 格式化价格
 \*/\nconst formatPrice = \(price: number\): string => \{\n  return formatMoney\(price\)\n\}'''
content = re.sub(pattern, '', content)

with open('src/components/customer/VariantSelector.vue', 'w') as f:
    f.write(content)

print('VariantSelector.vue 更新完成')
