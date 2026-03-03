import re

# 修复 Promotions.vue
with open('src/views/customer/Promotions.vue', 'r') as f:
    content = f.read()

# 1. 确保导入包含 formatPrice
if "import { formatMoney, formatPrice }" not in content and "import { formatMoney }" in content:
    content = content.replace(
        "import { formatMoney } from '@/utils/format'",
        "import { formatMoney, formatPrice } from '@/utils/format'"
    )

# 2. 删除本地 formatPrice 定义
pattern = r"const formatPrice = \(price: number \| undefined \| null\): string => \{\n  if \(price === null \|\| price === undefined \|\| \(typeof price !== 'number'\) \|\| isNaN\(price\)\) \{\n    return formatMoney\(0\)\n  \}\n  return formatMoney\(price\)\n\}"
content = re.sub(pattern, '', content)

with open('src/views/customer/Promotions.vue', 'w') as f:
    f.write(content)
print('Promotions.vue 修复完成')

# 修复 OrderBasicInfo.vue
with open('src/components/merchant/order/OrderBasicInfo.vue', 'r') as f:
    content = f.read()

# 检查是否已经导入了 formatPrice
if "import { formatPrice" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatPrice, formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatPrice
pattern1 = r"// 格式化金额\nconst formatPrice = \(price: number \| undefined\): string => \{\n  return \(price \|\| 0\)\.toFixed\(2\)\n\}"
content = re.sub(pattern1, '', content)

# 删除本地 formatDateTime  
pattern2 = r"// 格式化日期时间\nconst formatDateTime = \(dateStr: string\): string => \{\n  if \(!dateStr\) return ''\n  try \{\n    return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n  \} catch \(e\) \{\n    return dateStr\n  \}\n\}"
content = re.sub(pattern2, '', content)

with open('src/components/merchant/order/OrderBasicInfo.vue', 'w') as f:
    f.write(content)
print('OrderBasicInfo.vue 修复完成')

# 修复 PaymentInfo.vue
with open('src/components/merchant/order/PaymentInfo.vue', 'r') as f:
    content = f.read()

if "import { formatPrice" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatPrice, formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatDateTime
pattern1 = r"// 格式化日期\nconst formatDateTime = \(dateStr: string\): string => \{\n  if \(!dateStr\) return '-'\n  try \{\n    return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n  \} catch \{\n    return dateStr\n  \}\n\}"
content = re.sub(pattern1, '', content)

# 删除本地 formatPrice
pattern2 = r"const formatPrice = \(price: number \| undefined\): string => \{\n  return \(price \|\| 0\)\.toFixed\(2\)\n\}"
content = re.sub(pattern2, '', content)

with open('src/components/merchant/order/PaymentInfo.vue', 'w') as f:
    f.write(content)
print('PaymentInfo.vue 修复完成')

# 修复 OrderTimeline.vue
with open('src/components/merchant/order/OrderTimeline.vue', 'r') as f:
    content = f.read()

if "import { formatDateTime" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatDateTime
pattern = r"const formatDateTime = \(dateStr: string \| undefined\): string => \{\n  if \(!dateStr\) return ''\n  return new Date\(dateStr\)\.toLocaleString\('zh-CN'\)\n\}"
content = re.sub(pattern, '', content)

with open('src/components/merchant/order/OrderTimeline.vue', 'w') as f:
    f.write(content)
print('OrderTimeline.vue 修复完成')

# 修复 Orders.vue
with open('src/views/customer/Orders.vue', 'r') as f:
    content = f.read()

if "import { formatDateTime" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatDateTime - 这个比较长，使用更宽松的模式
# 找到函数开始和结束
start_marker = "// 格式化日期时间（后端返回的是北京时间"
if start_marker in content:
    # 找到函数的开始位置
    start_idx = content.find(start_marker)
    # 找到函数体结束（通过查找下一个函数或闭合的 script）
    # 函数大约在 "return date.toLocaleString" 之后结束
    end_marker = "  }"
    # 从 start_idx 后查找第一个匹配的函数结束
    remaining = content[start_idx:]
    # 找到 "  }\n\n  //" 或 "  }\n}\n" 模式
    match = re.search(r'\n  }\n(?=\n  //|\n\nconst|\n\n  //|\n})', remaining)
    if match:
        end_idx = start_idx + match.end()
        content = content[:start_idx] + content[end_idx:]

with open('src/views/customer/Orders.vue', 'w') as f:
    f.write(content)
print('Orders.vue 修复完成')

print("\n所有文件修复完成！")
