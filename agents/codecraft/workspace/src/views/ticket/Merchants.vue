/**
 * 商户管理页面
 * 已重构：提取弹窗为独立组件，逻辑分离到 composable
 */

<template>
  <div class="merchants-page">
    <!-- 页面标题栏 -->
    <el-card class="header-card" shadow="never">
      <div class="page-header">
        <h2 class="page-title">商户管理</h2>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增商户
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
        
        <el-table-column label="商户信息" min-width="200">
          <template #default="{ row }">
            <div class="merchant-info">
              <el-avatar :size="48" :src="row.logo" class="merchant-logo">
                <el-icon :size="24"><Shop /></el-icon>
              </el-avatar>
              <div class="merchant-detail">
                <div class="merchant-name">{{ row.name }}</div>
                <el-tag size="small" type="info">{{ row.categoryName || row.category || '未分类' }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        
        <el-table-column label="优惠规则" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.discountRulesCount || 0 }} 条</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="核销次数" width="120">
          <template #default="{ row }">
            <el-tag type="success">{{ row.verificationCount || 0 }} 次</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusSwitch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleManageRules(row)">管理规则</el-button>
            <el-popconfirm title="确定删除该商户吗？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </CommonTable>
    </el-card>

    <!-- 商户表单弹窗 -->
    <MerchantDialog
      v-model:visible="merchantDialog.visible"
      :type="merchantDialog.type"
      :merchant-data="merchantDialog.currentRow"
      @success="loadTableData"
    />

    <!-- 规则管理弹窗 -->
    <RulesDialog
      v-model:visible="rulesDialog.visible"
      :merchant="rulesDialog.merchant"
      @refresh="loadTableData"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Shop } from '@element-plus/icons-vue'
import CommonTable from '@/components/common/CommonTable.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import MerchantDialog from './components/MerchantDialog.vue'
import RulesDialog from './components/RulesDialog.vue'
import { usePagination } from '@/composables/usePagination'
import {
  getMerchants,
  deleteMerchant,
  toggleMerchantStatus
} from '@/api/ticket'

// 使用分页 composable
const { pagination, loading, handleSizeChange, handleCurrentChange } = usePagination({
  onPageChange: loadTableData,
  onSizeChange: loadTableData
})

// 表格数据
const tableData = ref([])

// 商户弹窗状态
const merchantDialog = reactive({
  visible: false,
  type: 'add',
  currentRow: null
})

// 规则弹窗状态
const rulesDialog = reactive({
  visible: false,
  merchant: null
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    const res = await getMerchants(params)
    if (res.code === 200) {
      tableData.value = res.data.list.map(item => ({
        ...item,
        discountRulesCount: item.discountRules?.length || 0,
        verificationCount: item.verificationCount || 0
      }))
      pagination.total = res.data.pagination.total
    }
  } catch (error) {
    console.error('获取商户列表失败:', error)
    ElMessage.error('获取商户列表失败')
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
  merchantDialog.type = 'add'
  merchantDialog.currentRow = null
  merchantDialog.visible = true
}

// 编辑
const handleEdit = (row) => {
  merchantDialog.type = 'edit'
  merchantDialog.currentRow = row
  merchantDialog.visible = true
}

// 状态切换
const handleStatusChange = async (row, val) => {
  try {
    await toggleMerchantStatus(row.id, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    row.status = val === 1 ? 0 : 1
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    const res = await deleteMerchant(row.id)
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

// 管理优惠规则
const handleManageRules = (row) => {
  rulesDialog.merchant = row
  rulesDialog.visible = true
}
</script>

<style lang="scss" scoped>
.merchants-page {
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
      font-weight: : #303133600;
      color;
    }
  }
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .merchant-logo {
    flex-shrink: 0;
    background: #f5f7fa;
  }
  
  .merchant-detail {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .merchant-name {
      font-weight: 500;
      color: #303133;
    }
  }
}
</style>
