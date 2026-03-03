import re

with open('src/components/customer/ProfileHeader.vue', 'r') as f:
    content = f.read()

# 添加导入
content = content.replace(
    "<script setup lang=\"ts\">\nimport { computed } from 'vue'",
    "<script setup lang=\"ts\">\nimport { computed } from 'vue'\nimport { formatPhone as formatPhoneUtil, formatDate as formatDateUtil } from '@/utils/format'"
)

# 修改本地 fallback 使用工具函数
old_phone_fallback = '''// 格式化手机号
const formatPhone = (phone: string | undefined): string => {
  if (props.formatPhone) {
    return props.formatPhone(phone)
  }
  if (!phone) return ''
  return phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2')
}'''

new_phone_fallback = '''// 格式化手机号
const formatPhone = (phone: string | undefined): string => {
  if (props.formatPhone) {
    return props.formatPhone(phone)
  }
  return formatPhoneUtil(phone)
}'''

content = content.replace(old_phone_fallback, new_phone_fallback)

# 修改日期 fallback
old_date_fallback = '''// 格式化日期
const formatDate = (dateStr: string | undefined): string => {
  if (props.formatDate) {
    return props.formatDate(dateStr)
  }
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  } catch (error) {
    console.error('日期格式化失败:', error)
    return ''
  }
}'''

new_date_fallback = '''// 格式化日期
const formatDate = (dateStr: string | undefined): string => {
  if (props.formatDate) {
    return props.formatDate(dateStr)
  }
  return formatDateUtil(dateStr, 'YYYY-MM-DD')
}'''

content = content.replace(old_date_fallback, new_date_fallback)

with open('src/components/customer/ProfileHeader.vue', 'w') as f:
    f.write(content)

print('ProfileHeader.vue 更新完成')
