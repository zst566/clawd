/**
 * 分页Composable
 * 提取分页逻辑为可复用函数
 */

import { ref, reactive } from 'vue'

/**
 * 分页 composable
 * @param {Object} options 配置选项
 * @param {number} options.page - 初始页码
 * @param {number} options.size - 初始每页条数
 * @param {Function} options.onPageChange - 页码变化回调
 * @param {Function} options.onSizeChange - 每页条数变化回调
 */
export function usePagination(options = {}) {
  const { page = 1, size = 10, onPageChange, onSizeChange } = options

  const pagination = reactive({
    page,
    size,
    total: 0
  })

  const loading = ref(false)

  const handleSizeChange = (newSize) => {
    pagination.size = newSize
    pagination.page = 1
    onSizeChange?.(newSize)
  }

  const handleCurrentChange = (newPage) => {
    pagination.page = newPage
    onPageChange?.(newPage)
  }

  const setTotal = (total) => {
    pagination.total = total
  }

  const resetPagination = () => {
    pagination.page = 1
    pagination.size = size
    pagination.total = 0
  }

  return {
    pagination,
    loading,
    handleSizeChange,
    handleCurrentChange,
    setTotal,
    resetPagination
  }
}

export default usePagination
