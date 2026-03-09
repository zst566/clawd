/**
 * 票根相关工具函数
 */

export const TICKET_TYPE_NAME_MAP = {
  train: '火车票',
  plane: '飞机票',
  bus: '汽车票',
  movie: '电影票',
  show: '演出票',
  other: '其他'
}

/**
 * 获取票根类型名称
 * @param {string} type - 票根类型编码
 * @returns {string} 票根类型名称
 */
export const getTicketTypeName = (type) => {
  return TICKET_TYPE_NAME_MAP[type] || type || '未知类型'
}

/**
 * 格式化金额
 * @param {number|string} amount - 金额
 * @param {string} prefix - 前缀符号
 * @returns {string} 格式化后的金额
 */
export const formatAmount = (amount, prefix = '¥') => {
  if (amount === null || amount === undefined || amount === '') {
    return '-'
  }
  const num = parseFloat(amount)
  if (isNaN(num)) {
    return '-'
  }
  return `${prefix}${num.toFixed(2)}`
}

/**
 * 验证金额
 * @param {string|number} value - 输入值
 * @param {Object} options - 验证选项
 * @returns {boolean} 是否有效
 */
export const validateAmount = (value, options = {}) => {
  const { min = 0, max = 999999 } = options
  
  if (value === null || value === undefined || value === '') {
    return false
  }
  
  const num = parseFloat(value)
  
  if (isNaN(num)) {
    return false
  }
  
  if (num < min || num > max) {
    return false
  }
  
  // 最多两位小数
  const str = String(num)
  if (str.includes('.')) {
    const decimals = str.split('.')[1]
    if (decimals && decimals.length > 2) {
      return false
    }
  }
  
  return true
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的日期
 */
export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期
 */
export const formatDate = (date) => {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的时间
 */
export const formatTime = (date) => {
  return formatDateTime(date, 'HH:mm')
}

export default {
  getTicketTypeName,
  formatAmount,
  validateAmount,
  formatDateTime,
  formatDate,
  formatTime
}
