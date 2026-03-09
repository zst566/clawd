/**
 * 票根审核页面
 * 已重构：提取卡片组件，逻辑分离到 composable
 */

<template>
  <div class="ticket-review-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        票根审核
        <el-badge :value="pendingCount" v-if="pendingCount > 0" class="pending-badge" />
      </h2>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="票根类型">
          <el-select v-model="queryForm.ticketType" placeholder="全部类型" clearable style="width: 160px">
            <el-option
              v-for="item in ticketTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="置信度">
          <el-select v-model="queryForm.confidenceLevel" placeholder="全部" clearable style="width: 120px">
            <el-option label="高 (≥0.75)" value="high" />
            <el-option label="中 (0.60-0.75)" value="medium" />
            <el-option label="低 (<0.60)" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 票根列表 -->
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>待审核票根列表</span>
          <span class="header-hint">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>

      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="ticketList.length === 0" class="empty-wrapper">
        <el-empty description="暂无待审核的票根" />
      </div>

      <div v-else class="ticket-list">
        <TicketCard
          v-for="ticket in ticketList"
          :key="ticket.id"
          :ticket="ticket"
          @preview="handlePreviewImage"
          @review="handleReview"
          @view-detail="handleViewDetail"
        />
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 审核对话框 -->
    <ReviewDialog
      v-model:visible="reviewDialog.visible"
      :ticket="reviewDialog.currentTicket"
      :action="reviewDialog.action"
      @success="loadData"
    />

    <!-- 图片预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :src="previewImageUrl"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import TicketCard from './components/TicketCard.vue'
import ReviewDialog from './components/ReviewDialog.vue'
import ImagePreview from '@/components/common/ImagePreview.vue'
import { usePagination } from '@/composables/usePagination'
import { getPendingReviewList, approveTicket, rejectTicket } from '@/api/ticket'

// 使用分页 composable
const { pagination, loading } = usePagination()

// 票根列表
const ticketList = ref([])
const pendingCount = ref(0)

// 查询表单
const queryForm = reactive({
  ticketType: '',
  confidenceLevel: '',
  dateRange: []
})

// 票种选项
const ticketTypeOptions = [
  { value: 'train', label: '火车票' },
  { value: 'plane', label: '飞机票' },
  { value: 'bus', label: '汽车票' },
  { value: 'movie', label: '电影票' },
  { value: 'show', label: '演出票' }
]

// 审核对话框状态
const reviewDialog = reactive({
  visible: false,
  currentTicket: null,
  action: 'approve'
})

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ticketType: queryForm.ticketType || undefined,
      confidenceLevel: queryForm.confidenceLevel || undefined,
      startDate: queryForm.dateRange?.[0] || undefined,
      endDate: queryForm.dateRange?.[1] || undefined
    }
    
    const res = await getPendingReviewList(params)
    if (res.code === 200) {
      ticketList.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
      pendingCount.value = res.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取待审核列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadData()
})

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  queryForm.ticketType = ''
  queryForm.confidenceLevel = ''
  queryForm.dateRange = []
  pagination.page = 1
  loadData()
}

// 预览图片
const handlePreviewImage = (url) => {
  previewImageUrl.value = url
  previewVisible.value = true
}

// 审核
const handleReview = (ticket, action) => {
  reviewDialog.currentTicket = ticket
  reviewDialog.action = action
  reviewDialog.visible = true
}

// 查看详情
const handleViewDetail = (ticket) => {
  // 实现查看详情逻辑
}
</script>

<style lang="scss" scoped>
.ticket-review-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  
  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .pending-badge {
      :deep(.el-badge__content) {
        background-color: #f56c6c;
      }
    }
  }
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-hint {
    font-size: 14px;
    color: #909399;
  }
}

.loading-wrapper,
.empty-wrapper {
  padding: 40px 0;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
