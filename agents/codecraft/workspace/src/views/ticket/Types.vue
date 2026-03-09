/**
 * 票根类型管理页面
 * 已重构：提取图标选择器为独立组件，逻辑分离到 composable
 */

<template>
  <div class="ticket-types-page">
    <!-- 页面标题栏 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <h2 class="page-title">票根类型管理</h2>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增类型
        </el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <CommonTable
        :data="tableData"
        v-loading="loading"
        :current-page="pagination.page"
        :page-size="pagination.size"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <el-icon :size="24" class="type-icon">
              <component :is="getIconComponent(row.icon)" />
            </el-icon>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="票根类型" min-width="150" />
        
        <el-table-column prop="code" label="类型编码" width="120" />
        
        <el-table-column label="样例数量" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.sampleCount || 0 }}张</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="验证规则" width="100">
          <template #default="{ row }">
            <el-tag :type="row.hasValidationRules ? 'success' : 'info'">
              {{ row.hasValidationRules ? '已配置' : '未配置' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusSwitch
              v-model="row.isActive"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="排序" width="120">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sortOrder"
              :min="0"
              :max="999"
              :step="1"
              size="small"
              style="width: 90px"
              @change="(val) => handleSortChange(row, val)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleManageSamples(row)">管理样例</el-button>
            <el-popconfirm title="确定删除该票根类型吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </CommonTable>
    </el-card>

    <!-- 类型表单弹窗 -->
    <TypeDialog
      v-model:visible="typeDialog.visible"
      :type="typeDialog.type"
      :type-data="typeDialog.currentRow"
      @success="loadTableData"
    />

    <!-- 样例图片管理弹窗 -->
    <SampleDialog
      v-model:visible="sampleDialog.visible"
      :current-type="sampleDialog.currentType"
      @refresh="loadTableData"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Picture, Van, Promotion, Ticket, Monitor, Basketball, FirstAidKit, School } from '@element-plus/icons-vue'
import CommonTable from '@/components/common/CommonTable.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import TypeDialog from './components/TypeDialog.vue'
import SampleDialog from './components/SampleDialog.vue'
import { usePagination } from '@/composables/usePagination'
import {
  getTicketTypes,
  deleteTicketType,
  toggleTicketTypeStatus,
  updateTicketType
} from '@/api/ticket'

// 使用分页 composable
const { pagination, loading, handleSizeChange, handleCurrentChange } = usePagination({
  onPageChange: loadTableData,
  onSizeChange: loadTableData
})

// 表格数据
const tableData = ref([])

// 图标映射表
const iconComponentMap = {
  picture: Picture,
  van: Van,
  promotion: Promotion,
  ticket: Ticket,
  monitor: Monitor,
  basketball: Basketball,
  'first-aid-kit': FirstAidKit,
  school: School
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconComponentMap[iconName] || Ticket
}

// 类型弹窗状态
const typeDialog = reactive({
  visible: false,
  type: 'add',
  currentRow: null
})

// 样例弹窗状态
const sampleDialog = reactive({
  visible: false,
  currentType: null
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    const res = await getTicketTypes(params)
    if (res.code === 200) {
      tableData.value = res.data.list.map(item => ({
        ...item,
        sampleCount: item.samples?.length || 0,
        hasValidationRules: !!(item.ticketNoPattern || (item.requiredFields && item.requiredFields.length > 0))
      }))
      pagination.total = res.data.pagination.total
    }
  } catch (error) {
    console.error('获取票根类型列表失败:', error)
    ElMessage.error('获取票根类型列表失败')
  } finally {
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  loadTableData()
})

// 新增
const handleAdd = () => {
  typeDialog.type = 'add'
  typeDialog.currentRow = null
  typeDialog.visible = true
}

// 编辑
const handleEdit = (row) => {
  typeDialog.type = 'edit'
  typeDialog.currentRow = row
  typeDialog.visible = true
}

// 状态切换
const handleStatusChange = async (row, val) => {
  try {
    await toggleTicketTypeStatus(row.id, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    row.isActive = val === 1 ? 0 : 1
  }
}

// 排序变更
const handleSortChange = async (row, val) => {
  try {
    await updateTicketType(row.id, { sortOrder: val })
    ElMessage.success('排序已更新')
    loadTableData()
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    const res = await deleteTicketType(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadTableData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 管理样例
const handleManageSamples = (row) => {
  sampleDialog.currentType = row
  sampleDialog.visible = true
}
</script>

<style lang="scss" scoped>
.ticket-types-page {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.type-icon {
  color: #409eff;
}
</style>
