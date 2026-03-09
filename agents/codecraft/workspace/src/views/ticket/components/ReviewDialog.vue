<template>
  <el-dialog
    :model-value="visible"
    :title="action === 'approve' ? '确认通过' : '确认拒绝'"
    width="600px"
    @update:model-value="handleUpdateVisible"
  >
    <div v-if="ticket" class="review-content">
      <div class="review-preview">
        <el-image :src="ticket.imageUrl" fit="contain" class="review-image" />
      </div>
      <div class="review-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="票号">{{ ticket.ticketNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ ticket.ticketTypeName }}</el-descriptions-item>
          <el-descriptions-item label="出发地">{{ ticket.departure || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目的地">{{ ticket.destination || '-' }}</el-descriptions-item>
          <el-descriptions-item label="出发时间">{{ ticket.departureTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="票价">¥{{ ticket.price || '-' }}</el-descriptions-item>
          <el-descriptions-item label="座位">{{ ticket.seat || '-' }}</el-descriptions-item>
          <el-descriptions-item label="上传用户">{{ ticket.userName || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :model="reviewForm" label-position="top">
        <el-form-item label="审核备注">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（可选）"
            show-word-limit
            maxlength="200"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleUpdateVisible(false)">取消</el-button>
      <el-button
        :type="action === 'approve' ? 'success' : 'danger'"
        @click="handleSubmit"
        :loading="submitLoading"
      >
        {{ action === 'approve' ? '确认通过' : '确认拒绝' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { approveTicket, rejectTicket } from '@/api/ticket'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  ticket: {
    type: Object,
    default: null
  },
  action: {
    type: String,
    default: 'approve'
  }
})

const emit = defineEmits(['update:visible', 'success'])

const submitLoading = ref(false)

const reviewForm = reactive({
  comment: ''
})

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val) {
    reviewForm.comment = ''
  }
})

// 提交审核
const handleSubmit = async () => {
  submitLoading.value = true

  try {
    const data = {
      comment: reviewForm.comment
    }

    if (props.action === 'approve') {
      await approveTicket(props.ticket.id, data)
      ElMessage.success('审核通过')
    } else {
      await rejectTicket(props.ticket.id, data)
      ElMessage.success('已拒绝')
    }

    handleUpdateVisible(false)
    emit('success')
  } catch (error) {
    console.error('审核操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>

<style lang="scss" scoped>
.review-content {
  .review-preview {
    margin-bottom: 16px;
    
    .review-image {
      width: 100%;
      max-height: 200px;
      border-radius: 6px;
    }
  }

  .review-info {
    margin-bottom: 16px;
  }
}
</style>
