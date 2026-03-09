<template>
  <div class="image-uploader">
    <el-upload
      class="uploader"
      :class="{ 'is-dragger': drag }"
      :drag="drag"
      :show-file-list="false"
      :auto-upload="false"
      :accept="accept"
      :limit="limit"
      :before-upload="handleBeforeUpload"
      :on-change="handleChange"
      :on-exceed="handleExceed"
      v-bind="$attrs"
    >
      <template #trigger>
        <div v-if="imageUrl" class="preview-wrapper">
          <el-image
            :src="imageUrl"
            :fit="fit"
            class="preview-image"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="preview-mask">
            <el-icon @click.stop="handleClick"><ZoomIn /></el-icon>
            <el-icon @click.stop="handleRemove"><Delete /></el-icon>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon v-if="loading" class="is-loading"><Loading /></el-icon>
          <template v-else>
            <el-icon :size="uploadIconSize"><Upload /></el-icon>
            <div class="upload-text">
              <span v-if="drag">将文件拖到此处，或<em>点击上传</em></span>
              <span v-else>点击上传{{ uploadText }}</span>
            </div>
            <div class="upload-hint">{{ hint }}</div>
          </template>
        </div>
      </template>
    </el-upload>

    <!-- 图片预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :src="imageUrl"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, genFileId } from 'element-plus'
import { Upload, ZoomIn, Delete, Picture, Loading } from '@element-plus/icons-vue'
import ImagePreview from './ImagePreview.vue'

const props = defineProps({
  // 图片URL
  modelValue: {
    type: String,
    default: ''
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: 'image/*'
  },
  // 最大文件大小(MB)
  maxSize: {
    type: Number,
    default: 5
  },
  // 是否可拖拽上传
  drag: {
    type: Boolean,
    default: false
  },
  // 最大上传数量
  limit: {
    type: Number,
    default: 1
  },
  // 图片填充模式
  fit: {
    type: String,
    default: 'cover'
  },
  // 上传提示文字
  uploadText: {
    type: String,
    default: '图片'
  },
  // 提示文字
  hint: {
    type: String,
    default: ''
  },
  // 上传图标大小
  uploadIconSize: {
    type: Number,
    default: 32
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'remove', 'error'])

const previewVisible = ref(false)

const imageUrl = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 验证文件
const validateFile = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }

  return true
}

// 上传前检查
const handleBeforeUpload = (file) => {
  return validateFile(file)
}

// 文件变化
const handleChange = (uploadFile) => {
  if (uploadFile?.raw) {
    // 创建本地预览URL
    const url = URL.createObjectURL(uploadFile.raw)
    imageUrl.value = url
    emit('change', uploadFile.raw, url)
  }
}

// 文件超出限制
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

// 点击预览
const handleClick = () => {
  if (imageUrl.value) {
    previewVisible.value = true
  }
}

// 移除图片
const handleRemove = () => {
  imageUrl.value = ''
  emit('remove')
}
</script>

<style lang="scss" scoped>
.image-uploader {
  display: inline-block;
}

.uploader {
  :deep(.el-upload) {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }

  &.is-dragger {
    :deep(.el-upload-dragger) {
      padding: 20px;
    }
  }
}

.preview-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;

  .preview-image {
    width: 100%;
    height: 100%;
    display: block;
  }

  .preview-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0;
    transition: opacity 0.3s;

    .el-icon {
      font-size: 20px;
      color: #fff;
      cursor: pointer;

      &:hover {
        color: #409eff;
      }
    }
  }

  &:hover .preview-mask {
    opacity: 1;
  }
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;

  .upload-text {
    margin-top: 8px;
    font-size: 12px;

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  .upload-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
</style>
