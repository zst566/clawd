/**
 * Dashboard 常量配置
 * 
 * 集中管理 Dashboard 相关的常量，避免硬编码
 */

// 表格列配置
export const MONTHLY_TABLE_COLUMNS = [
  { prop: 'month', label: '数据月份', width: 120, align: 'center' },
  { prop: 'monthOrderCount', label: '本月独立订单数量', width: 150, align: 'right', format: 'number' },
  { prop: 'monthReceipt', label: '本月新增实收', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthReceiptBalance', label: '本月新增实收-余额', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthReceiptNonBalance', label: '本月新增实收-非余额', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthRefund', label: '本月实际退款', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthRefundBalance', label: '本月实际退款-余额', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthRefundNonBalance', label: '本月实际退款-非余额', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthRevenue', label: '本月确认收入', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthBalance', label: '本月预收款余额', width: 150, align: 'right', format: 'currency' },
  { prop: 'monthReceivableNonAmortizable', label: '本月不可摊销应收款', width: 150, align: 'right', format: 'currency' }
]

// 需要汇总的字段（流量数据）
export const SUMMARY_FIELDS = [
  'monthReceipt',
  'monthReceiptBalance',
  'monthReceiptNonBalance',
  'monthRefund',
  'monthRefundBalance',
  'monthRefundNonBalance',
  'monthRevenue'
]

// 时点数字段（不汇总）
export const TIME_POINT_FIELDS = [
  'monthBalance',
  'monthReceivableNonAmortizable'
]

// 图表颜色配置
export const CHART_COLORS = {
  receipt: '#67c23a',      // 实收 - 绿色
  refund: '#f56c6c',       // 退款 - 红色
  revenue: '#409eff',      // 收入 - 蓝色
  balance: '#e6a23c'       // 余额 - 橙色
}

// 默认僵尸订单检查日期阈值
export const DEFAULT_ZOMBIE_DATE_THRESHOLD = '2025-12-01'

// 统计卡片配置（旧版 dashboard）
export const SUMMARY_CARDS = [
  { key: 'latestMonth', label: '最新计算数据月份' },
  { key: 'yearReceipt', label: '本年度新增实收' },
  { key: 'yearRefund', label: '本年度新增退款' },
  { key: 'yearRevenue', label: '本年度确认收入' },
  { key: 'latestBalance', label: '最新预收款余额' }
]

// 导出 Excel 列配置
export const EXPORT_COLUMNS = [
  { key: 'month', label: '数据月份', width: 12 },
  { key: 'monthOrderCount', label: '本月独立订单数量', width: 18 },
  { key: 'monthReceipt', label: '本月新增实收', width: 18 },
  { key: 'monthReceiptBalance', label: '本月新增实收-余额', width: 20 },
  { key: 'monthReceiptNonBalance', label: '本月新增实收-非余额', width: 22 },
  { key: 'monthRefund', label: '本月实际退款', width: 18 },
  { key: 'monthRefundBalance', label: '本月实际退款-余额', width: 20 },
  { key: 'monthRefundNonBalance', label: '本月实际退款-非余额', width: 22 },
  { key: 'monthRevenue', label: '本月确认收入', width: 18 },
  { key: 'monthBalance', label: '本月预收款余额', width: 18 },
  { key: 'monthReceivableNonAmortizable', label: '本月不可摊销应收款', width: 22 }
]

// 图表配置
export const CHART_CONFIG = {
  receiptRefund: {
    title: '实收与退款趋势',
    series: [
      { name: '本月新增实收', field: 'monthReceipt', color: CHART_COLORS.receipt },
      { name: '本月实际退款', field: 'monthRefund', color: CHART_COLORS.refund }
    ]
  },
  revenue: {
    title: '确认收入趋势',
    series: [
      { name: '本月确认收入', field: 'monthRevenue', color: CHART_COLORS.revenue, area: true }
    ]
  },
  balance: {
    title: '预收款余额趋势',
    series: [
      { name: '本月预收款余额', field: 'monthBalance', color: CHART_COLORS.balance, area: true }
    ]
  }
}

// 按钮权限映射
export const BUTTON_PERMISSIONS = {
  batchCalculate: 'admin',
  zombieFix: 'admin',
  jiaoWuScript: 'admin'
}
