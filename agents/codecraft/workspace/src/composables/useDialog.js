/**
 * 对话框Composable
 * 提取弹窗逻辑为可复用函数
 */

import { ref } from 'vue'

/**
 * 对话框 composable
 * @param {Object} options 配置选项
 * @param {string} options.defaultType - 默认弹窗类型
 */
export function useDialog(options = {}) {
  const { defaultType = 'add' } = options

  const visible = ref(false)
  const dialogType = ref(defaultType)
  const currentRow = ref(null)

  /**
   * 打开新增弹窗
   * @param {Object} row - 当前行数据（可选）
   */
  const openAdd = (row = null) => {
    dialogType.value = 'add'
    currentRow.value = row
    visible.value = true
  }

  /**
   * 打开编辑弹窗
   * @param {Object} row - 当前行数据
   */
  const openEdit = (row) => {
    dialogType.value = 'edit'
    currentRow.value = row
    visible.value = true
  }

  /**
   * 打开弹窗
   * @param {string} type - 弹窗类型
   * @param {Object} row - 当前行数据
   */
  const open = (type, row = null) => {
    dialogType.value = type
    currentRow.value = row
    visible.value = true
  }

  /**
   * 关闭弹窗
   */
  const close = () => {
    visible.value = false
    currentRow.value = null
  }

  /**
   * 切换弹窗
   */
  const toggle = () => {
    visible.value = !visible.value
  }

  /**
   * 是否为新增模式
   */
  const isAdd = () => dialogType.value === 'add'

  /**
   * 是否为编辑模式
   */
  const isEdit = () => dialogType.value === 'edit'

  return {
    visible,
    dialogType,
    currentRow,
    openAdd,
    openEdit,
    open,
    close,
    toggle,
    isAdd,
    isEdit
  }
}

export default useDialog
