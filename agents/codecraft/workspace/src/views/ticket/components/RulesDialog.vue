<template>
  <el-dialog
    :model-value="visible"
    :title="`优惠规则管理 - ${merchant?.name || ''}`"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="handleUpdateVisible"
  >
    <div class="rules-toolbar">
      <el-button type="primary" @click="handleAddRule">
        <el-icon><Plus /></el-icon> 新增规则
      </el-button>
      <el-text type="info">共 {{ rulesList.length }} 条优惠规则</el-text>
    </div>

    <el-table
      :data="rulesList"
      v-loading="rulesLoading"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="name" label="规则名称" min-width="150" />
      
      <el-table-column label="适用票种" min-width="150">
        <template #default="{ row }">
          <el-tag
            v-for="type in row.applicableTypes"
            :key="type"
            size="small"
            class="type-tag"
          >
            {{ getTicketTypeName(type) }}
          </el-tag>
          <span v-if="!row.applicableTypes || row.applicableTypes.length === 0">-</span>
        </template>
      </el-table-column>
      
      <el-table-column label="优惠类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.discountType === 'percentage' ? 'warning' : 'success'">
            {{ row.discountType === 'percentage' ? '百分比' : '固定金额' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="优惠值" width="100">
        <template #default="{ row }">
          {{ row.discountType === 'percentage' ? `${row.discountValue}%` : `¥${row.discountValue}` }}
        </template>
      </el-table-column>
      
      <el-table-column label="有效期" min-width="180">
        <template #default="{ row }">
          <div v-if="row.startDate && row.endDate">
            {{ row.startDate }} 至 {{ row.endDate }}
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusSwitch
            v-model="row.isActive"
            :active-value="1"
            :inactive-value="0"
            @change="(val) => handleRuleStatusChange(row, val)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEditRule(row)">编辑</el-button>
          <el-popconfirm title="确定删除该规则吗？" @confirm="handleDeleteRule(row)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-button @click="handleUpdateVisible(false)">关闭</el-button>
    </template>

    <!-- 规则表单弹窗 -->
    <RuleFormDialog
      v-model:visible="ruleFormVisible"
      :type="ruleDialogType"
      :rule-data="ruleFormData"
      :merchant-id="merchant?.id"
      @success="loadRules"
    />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import RuleFormDialog from './RuleFormDialog.vue'
import {
  getDiscountRules,
  deleteDiscountRule,
  toggleMerchantStatus
} from '@/api/ticket'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  merchant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'refresh'])

// 票种名称映射
const ticketTypeNameMap = {
  train: '火车票',
  plane: '飞机票',
  bus: '汽车票',
  movie: '电影票',
  show: '演出票',
  other: '其他'
}

const getTicketTypeName = (type) => {
  return ticketTypeNameMap[type] || type
}

const rulesList = ref([])
const rulesLoading = ref(false)

// 规则表单弹窗状态
const ruleFormVisible = ref(false)
const ruleDialogType = ref('add')
const ruleFormData = ref(null)

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val && props.merchant?.id) {
    loadRules(props.merchant.id)
  }
})

// 加载优惠规则
const loadRules = async (merchantId) => {
  rulesLoading.value = true
  try {
    const res = await getDiscountRules(merchantId)
    if (res.code === 200) {
      rulesList.value = res.data || []
    }
  } catch (error) {
    console.error('获取优惠规则失败:', error)
    ElMessage.error('获取优惠规则失败')
  } finally {
    rulesLoading.value = false
  }
}

// 新增规则
const handleAddRule = () => {
  ruleDialogType.value = 'add'
  ruleFormData.value = null
  ruleFormVisible.value = true
}

// 编辑规则
const handleEditRule = (row) => {
  ruleDialogType.value = 'edit'
  ruleFormData.value = row
  ruleFormVisible.value = true
}

// 规则状态切换
const handleRuleStatusChange = async (row, val) => {
  try {
    await toggleMerchantStatus(props.merchant.id, val, row.id)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
  } catch (error) {
    console.error('更新规则状态失败:', error)
    ElMessage.error('更新规则状态失败')
    row.isActive = val === 1 ? 0 : 1
  }
}

// 删除规则
const handleDeleteRule = async (row) => {
  try {
    const res = await deleteDiscountRule(props.merchant.id, row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadRules(props.merchant.id)
      emit('refresh')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除规则失败:', error)
    ElMessage.error('删除规则失败')
  }
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>

<style lang="scss" scoped>
.rules-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.type-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
