/**
 * 上传Composable
 * 提取文件上传逻辑为可复用函数
 */

import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 上传 composable
 * @param {Object} options 配置选项
 * @param {Function} options.uploadRequest - 上传请求函数
 * @param {string} options.accept - 接受的文件类型
 * @param {number} options.maxSize - 最大文件大小(MB)
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 失败回调
 */
export function useUpload(options = {}) {
  const {
    uploadRequest,
    accept = 'image/*',
    maxSize = 5,
    onSuccess,
    onError
  } = options

  const uploading = ref(false)
  const uploadProgress = ref(0)

  /**
   * 验证文件
   * @param {File} file - 文件对象
   */
  const validateFile = (file) => {
    // 检查文件类型
    const isImage = accept.includes('image')
    if (isImage && !file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件')
      return false
    }

    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize
    if (!isLtMaxSize) {
      ElMessage.error(`文件大小不能超过 ${maxSize}MB`)
      return false
    }

    return true
  }

  /**
   * 上传文件
   * @param {File} file - 文件对象
   */
  const uploadFile = async (file) => {
    if (!uploadRequest) {
      ElMessage.error('未配置上传请求函数')
      return null
    }

    if (!validateFile(file)) {
      return null
    }

    uploading.value = true
    uploadProgress.value = 0

    try {
      const res = await uploadRequest(file)
      const url = res.data?.url || res.url
      
      ElMessage.success('上传成功')
      onSuccess?.(url, res)
      
      return url
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error(error.message || '上传失败')
      onError?.(error)
      
      return null
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }

  /**
   * 处理文件变化
   * @param {Object} file - Element Plus的文件对象
   */
  const handleChange = async (file) => {
    if (file?.raw) {
      await uploadFile(file.raw)
    }
  }

  /**
   * 移除文件
   */
  const removeFile = () => {
    // 可由调用方实现具体逻辑
  }

  return {
    uploading,
    uploadProgress,
    validateFile,
    uploadFile,
    handleChange,
    removeFile
  }
}

export default useUpload
