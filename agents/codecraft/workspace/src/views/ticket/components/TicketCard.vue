<template>
  <div class="ticket-item">
    <!-- 左侧缩略图 -->
    <div class="ticket-image-wrapper" @click="handlePreview">
      <el-image
        :src="ticket.thumbnailUrl || ticket.imageUrl"
        fit="cover"
        class="ticket-thumbnail"
      >
        <template #error>
          <div class="image-error">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div class="image-overlay">
        <el-icon><ZoomIn /></el-icon>
      </div>
    </div>

    <!-- 中间信息区 -->
    <div class="ticket-info">
      <div class="info-header">
        <el-tag :type="confidenceType" size="small" class="confidence-tag">
          <el-icon v-if="ticket.confidence >= 0.75"><CircleCheck /></el-icon>
          <el-icon v-else-if="ticket.confidence >= 0.6"><Warning /></el-icon>
          <el-icon v-else><CircleClose /></el-icon>
          置信度 {{ formatConfidence(ticket.confidence) }}
        </el-tag>
        <span class="ticket-type">{{ ticket.ticketTypeName }}</span>
        <span class="upload-time">{{ ticket.createdAt }}</span>
      </div>

      <div class="extracted-info">
        <div class="info-row">
          <span class="info-label">票号:</span>
          <span class="info-value">{{ ticket.ticketNo || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">行程:</span>
          <span class="info-value">{{ ticket.departure || '-' }} → {{ ticket.destination || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">出发时间:</span>
          <span class="info-value">{{ ticket.departureTime || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">票价:</span>
          <span class="info-value price">¥{{ ticket.price || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">座位:</span>
          <span class="info-value">{{ ticket.seat || '-' }}</span>
        </div>
      </div>

      <div v-if="ticket.uncertaintyReason" class="uncertainty-reason">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ ticket.uncertaintyReason }}</span>
      </div>
    </div>

    <!-- 右侧用户信息和操作 -->
    <div class="ticket-actions">
      <div class="user-info">
        <el-avatar :size="40" :src="ticket.userAvatar">
          {{ ticket.userName?.charAt(0) || 'U' }}
        </el-avatar>
        <div class="user-detail">
          <div class="user-name">{{ ticket.userName || '未知用户' }}</div>
          <div class="user-phone">{{ ticket.userPhone || '-' }}</div>
        </div>
      </div>
      <div class="action-buttons">
        <el-button type="success" @click="handleReview('approve')">
          <el-icon><Check /></el-icon> 通过
        </el-button>
        <el-button type="danger" @click="handleReview('reject')">
          <el-icon><Close /></el-icon> 拒绝
        </el-button>
        <el-button type="primary" link @click="handleViewDetail">
          查看详情
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, ZoomIn, CircleCheck, Warning, CircleClose, InfoFilled, Check, Close } from '@element-plus/icons-vue'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['preview', 'review', 'view-detail'])

// 置信度类型
const confidenceType = computed(() => {
  if (props.ticket.confidence >= 0.75) return 'success'
  if (props.ticket.confidence >= 0.6) return 'warning'
  return 'danger'
})

// 格式化置信度
const formatConfidence = (value) => {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(0)}%`
}

// 预览图片
const handlePreview = () => {
  emit('preview', props.ticket.imageUrl)
}

// 审核
const handleReview = (action) => {
  emit('review', props.ticket, action)
}

// 查看详情
const handleViewDetail = () => {
  emit('view-detail', props.ticket)
}
</script>

<style lang="scss" scoped>
.ticket-item {
  display: flex;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: box-shadow 0.3s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.ticket-image-wrapper {
  position: relative;
  width: 120px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;

  .ticket-thumbnail {
    width: 100%;
    height: 100%;
  }

  .image-overlay {
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
      font-size: 20px;
      color: #fff;
    }
  }

  &:hover .image-overlay {
    opacity: 1;
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

.ticket-info {
  flex: 1;
  padding: 0 16px;
  min-width: 0;

  .info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    .confidence-tag {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .ticket-type {
      font-weight: 500;
      color: #303133;
    }

    .upload-time {
      font-size: 12px;
      color: #909399;
      margin-left: auto;
    }
  }

  .extracted-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 16px;

    .info-row {
      .info-label {
        color: #909399;
        margin-right: 4px;
      }

      .info-value {
        color: #606266;

        &.price {
          color: #f56c6c;
          font-weight: 500;
        }
      }
    }
  }

  .uncertainty-reason {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding: 8px;
    background: #fdf6ec;
    border-radius: 4px;
    color: #e6a23c;
    font-size: 12px;
  }
}

.ticket-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  width: 180px;
  flex-shrink: 0;

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-detail {
      .user-name {
        font-weight: 500;
        color: #303133;
      }

      .user-phone {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
}
</style>
