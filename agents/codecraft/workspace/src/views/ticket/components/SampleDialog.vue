<template>
  <el-dialog
    :model-value="visible"
    :title="`样例图片管理 - ${currentType?.name || ''}`"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="handleUpdateVisible"
  >
    <div class="sample-toolbar">
      <el-upload
        class="sample-uploader"
        :show-file-list="false"
        :auto-upload="false"
        accept="image/*"
        :on-change="handleSampleUpload"
      >
        <el-button type="primary">
          <el-icon><Plus /></el-icon> 上传样例图片
        </el-button>
      </el-upload>
      <el-text type="info">共 {{ sampleList.length }} 张样例图片</el-text>
    </div>

    <div class="sample-grid">
      <div
        v-for="(sample, index) in sampleList"
        :key="sample.id"
        class="sample-item"
      >
        <div class="sample-image-wrapper" @click="handlePreviewImage(sample.imageUrl)">
          <el-image
            :src="sample.imageUrl"
            fit="cover"
            class="sample-image"
          />
          <div class="sample-overlay">
            <el-icon><ZoomIn /></el-icon>
          </div>
        </div>
        <div class="sample-info">
          <el-input
            v-model="sample.description"
            type="textarea"
            :rows="2"
            placeholder="图片描述"
            size="small"
            @blur="handleUpdateDescription(sample)"
          />
        </div>
        <div class="sample-actions">
          <el-button
            type="primary"
            link
            :disabled="index === 0"
            @click="handleMoveSample(index, -1)"
          >
            <el-icon><ArrowUp /></el-icon> 上移
          </el-button>
          <el-button
            type="primary"
            link
            :disabled="index === sampleList.length - 1"
            @click="handleMoveSample(index, 1)"
          >
            <el-icon><ArrowDown /></el-icon> 下移
          </el-button>
          <el-popconfirm title="确定删除该样例图片吗？" @confirm="handleDeleteSample(sample.id)">
            <template #reference>
              <el-button type="danger" link>
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleUpdateVisible(false)">关闭</el-button>
    </template>

    <!-- 图片预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :src="previewImageUrl"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, ZoomIn, ArrowUp, ArrowDown, Delete } from '@element-plus/icons-vue'
import ImagePreview from '@/components/common/ImagePreview.vue'
import { uploadToOss } from '@/api/config'
import {
  getTicketTypes,
  uploadSampleImage,
  deleteSampleImage,
  updateSampleOrder
} from '@/api/ticket'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentType: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

const sampleList = ref([])
const sampleLoading = ref(false)

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 监听弹窗显示
watch(() => props.visible, async (val) => {
  if (val && props.currentType?.id) {
    await loadSamples(props.currentType.id)
  }
})

// 加载样例
const loadSamples = async (typeId) => {
  sampleLoading.value = true
  try {
    const res = await getTicketTypes({ id: typeId })
    if (res.code === 200 && res.data.list.length > 0) {
      sampleList.value = res.data.list[0].samples || []
    }
  } catch (error) {
    console.error('获取样例列表失败:', error)
    ElMessage.error('获取样例列表失败')
  } finally {
    sampleLoading.value = false
  }
}

// 上传样例图片
const handleSampleUpload = async (file) => {
  try {
    const res = await uploadToOss(file.raw)
    const imageUrl = res.data.url
    
    await uploadSampleImage(props.currentType.id, { imageUrl })
    ElMessage.success('上传成功')
    await loadSamples(props.currentType.id)
    emit('refresh')
  } catch (error) {
    console.error('上传样例图片失败:', error)
    ElMessage.error('上传失败')
  }
}

// 更新描述
const handleUpdateDescription = async (sample) => {
  // 可实现实时保存逻辑
}

// 移动样例
const handleMoveSample = async (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= sampleList.value.length) return

  // 交换位置
  const temp = sampleList.value[index]
  sampleList.value[index] = sampleList.value[newIndex]
  sampleList.value[newIndex] = temp

  // 保存新顺序
  try {
    const order = sampleList.value.map((s, i) => ({ id: s.id, order: i }))
    await updateSampleOrder(props.currentType.id, order)
    ElMessage.success('排序已更新')
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
    // 回滚
    sampleList.value[index] = sampleList.value[newIndex]
    sampleList.value[newIndex] = temp
  }
}

// 删除样例
const handleDeleteSample = async (sampleId) => {
  try {
    await deleteSampleImage(props.currentType.id, sampleId)
    ElMessage.success('删除成功')
    await loadSamples(props.currentType.id)
    emit('refresh')
  } catch (error) {
    console.error('删除样例失败:', error)
    ElMessage.error('删除失败')
  }
}

// 预览图片
const handlePreviewImage = (url) => {
  previewImageUrl.value = url
  previewVisible.value = true
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>

<style lang="scss" scoped>
.sample-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.sample-item {
  .sample-image-wrapper {
    position: relative;
    width: 100%;
    height: 150px;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;

    .sample-image {
      width: 100%;
      height: 100%;
    }

    .sample-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      .el-icon {
        font-size: 24px;
        color: #fff;
      }
    }

    &:hover .sample-overlay {
      opacity: 1;
    }
  }

  .sample-info {
    margin: 8px 0;
  }

  .sample-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
}
</style>
