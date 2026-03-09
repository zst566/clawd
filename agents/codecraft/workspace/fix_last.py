import re

# 修复 OrderBasicInfo.vue - 删除本地 formatDateTime
with open('src/components/merchant/order/OrderBasicInfo.vue', 'r') as f:
    content = f.read()

# 删除本地 formatDateTime 定义
old_func = '''// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

'''
content = content.replace(old_func, '')

with open('src/components/merchant/order/OrderBasicInfo.vue', 'w') as f:
    f.write(content)
print('OrderBasicInfo.vue 本地 formatDateTime 已删除')

# 修复 PaymentInfo.vue
with open('src/components/merchant/order/PaymentInfo.vue', 'r') as f:
    content = f.read()

# 检查是否已导入
if "import { formatPrice" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatPrice, formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatDateTime
old_func = '''// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

'''
content = content.replace(old_func, '')

# 删除本地 formatPrice
old_price = '''// 格式化价格
const formatPrice = (price: number | undefined): string => {
  return (price || 0).toFixed(2)
}
'''
content = content.replace(old_price, '')

with open('src/components/merchant/order/PaymentInfo.vue', 'w') as f:
    f.write(content)
print('PaymentInfo.vue 本地函数已删除')

# 修复 OrderTimeline.vue
with open('src/components/merchant/order/OrderTimeline.vue', 'r') as f:
    content = f.read()

if "import { formatDateTime" not in content:
    content = content.replace(
        "<script setup lang=\"ts\">",
        "<script setup lang=\"ts\">\nimport { formatDateTime } from '@/utils/format'"
    )

# 删除本地 formatDateTime
old_func = '''// 格式化日期时间
const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}
'''
content = content.replace(old_func, '')

with open('src/components/merchant/order/OrderTimeline.vue', 'w') as f:
    f.write(content)
print('OrderTimeline.vue 本地函数已删除')

print("\n所有剩余文件修复完成！")
