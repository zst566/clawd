/**
 * 通用CRUDComposable
 * 提取增删改查逻辑为可复用函数
 */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 通用CRUD composable
 * @param {Object} options 配置选项
 * @param {Function} options.getListFn - 获取列表函数
 * @param {Function} options.createFn - 创建函数
 * @param {Function} options.updateFn - 更新函数
 * @param {Function} options.deleteFn - 删除函数
 * @param {Function} options.getDetailFn - 获取详情函数（可选）
 */
export function useCrud(options = {}) {
  const {
    getListFn,
    createFn,
    updateFn,
    deleteFn,
    getDetailFn
  } = options

  const loading = ref(false)
  const tableData = ref([])

  /**
   * 获取列表数据
   * @param {Object} params - 查询参数
   */
  const loadData = async (params = {}) => {
    if (!getListFn) {
      console.error('未配置获取列表函数')
      return
    }

    loading.value = true

    try {
      const res = await getListFn(params)
      if (res.code === 200) {
        tableData.value = res.data?.list || res.data || []
        return res.data?.pagination || res.data
      } else {
        ElMessage.error(res.message || '获取数据失败')
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      ElMessage.error('获取数据失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建数据
   * @param {Object} data - 创建数据
   */
  const createData = async (data) => {
    if (!createFn) {
      console.error('未配置创建函数')
      return false
    }

    try {
      const res = await createFn(data)
      if (res.code === 200) {
        ElMessage.success('创建成功')
        return true
      } else {
        ElMessage.error(res.message || '创建失败')
        return false
      }
    } catch (error) {
      console.error('创建失败:', error)
      ElMessage.error(error.message || '创建失败')
      return false
    }
  }

  /**
   * 更新数据
   * @param {string|number} id - 数据ID
   * @param {Object} data - 更新数据
   */
  const updateData = async (id, data) => {
    if (!updateFn) {
      console.error('未配置更新函数')
      return false
    }

    try {
      const res = await updateFn(id, data)
      if (res.code === 200) {
        ElMessage.success('更新成功')
        return true
      } else {
        ElMessage.error(res.message || '更新失败')
        return false
      }
    } catch (error) {
      console.error('更新失败:', error)
      ElMessage.error(error.message || '更新失败')
      return false
    }
  }

  /**
   * 删除数据
   * @param {string|number} id - 数据ID
   */
  const deleteData = async (id) => {
    if (!deleteFn) {
      console.error('未配置删除函数')
      return false
    }

    try {
      const res = await deleteFn(id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        return true
      } else {
        ElMessage.error(res.message || '删除失败')
        return false
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error(error.message || '删除失败')
      return false
    }
  }

  /**
   * 获取详情
   * @param {string|number} id - 数据ID
   */
  const getDetail = async (id) => {
    if (!getDetailFn) {
      console.error('未配置获取详情函数')
      return null
    }

    try {
      const res = await getDetailFn(id)
      if (res.code === 200) {
        return res.data || res.data?.list?.[0] || null
      } else {
        ElMessage.error(res.message || '获取详情失败')
        return null
      }
    } catch (error) {
      console.error('获取详情失败:', error)
      ElMessage.error('获取详情失败')
      return null
    }
  }

  return {
    loading,
    tableData,
    loadData,
    createData,
    updateData,
    deleteData,
    getDetail
  }
}

export default useCrud
