<template>
  <el-dialog
    :model-value="visible"
    :title="type === 'add' ? '新增优惠规则' : '编辑优惠规则'"
    width="600px"
    :close-on-click-modal="false"
    @closed="onDialogClosed"
    @update:model-value="handleUpdateVisible"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入规则名称" />
      </el-form-item>

      <el-form-item label="适用票种">
        <el-checkbox-group v-model="formData.applicableTypes">
          <el-checkbox label="train">火车票</el-checkbox>
          <el-checkbox label="plane">飞机票</el-checkbox>
          <el-checkbox label="bus">汽车票</el-checkbox>
          <el-checkbox label="movie">电影票</el-checkbox>
          <el-checkbox label="show">演出票</el-checkbox>
          <el-checkbox label="other">其他</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="优惠类型">
            <el-radio-group v-model="formData.discountType">
              <el-radio label="percentage">百分比</el-radio>
              <el-radio label="fixed">固定金额</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优惠值" prop="discountValue">
            <el-input-number
              v-model="formData.discountValue"
              :min="0"
              :max="formData.discountType === 'percentage' ? 100 : 999999"
              :precision="formData.discountType === 'percentage' ? 0 : 2"
              style="width: 100%"
              :placeholder="formData.discountType === 'percentage' ? '如: 20 表示20%' : '如: 50 表示50元'"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="最低消费金额">
            <el-input-number
              v-model="formData.minAmount"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="无限制"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大优惠金额">
            <el-input-number
              v-model="formData.maxDiscount"
              :min="0"
              :precision="2"
              style="width: 100%"
              placeholder="无限制"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="有效期">
        <el-date-picker
          v-model="formData.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch
          v-model="formData.isActive"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleUpdateVisible(false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createDiscountRule,
  updateDiscountRule
} from '@/api/ticket'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'add'
  },
  ruleData: {
    type: Object,
    default: null
  },
  merchantId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitLoading = ref(false)

const formData = reactive({
  id: null,
  name: '',
  applicableTypes: [],
  discountType: 'percentage',
  discountValue: undefined,
  minAmount: undefined,
  maxDiscount: undefined,
  dateRange: [],
  isActive: 1
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  discountValue: [
    { required: true, message: '请输入优惠值', trigger: 'blur' }
  ]
}

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val && props.type === 'edit' && props.ruleData) {
    Object.assign(formData, {
      id: props.ruleData.id,
      name: props.ruleData.name,
      applicableTypes: props.ruleData.applicableTypes || [],
      discountType: props.ruleData.discountType || 'percentage',
      discountValue: props.ruleData.discountValue,
      minAmount: props.ruleData.minAmount,
      maxDiscount: props.ruleData.maxDiscount,
      dateRange: props.ruleData.startDate && props.ruleData.endDate 
        ? [props.ruleData.startDate, props.ruleData.endDate] 
        : [],
      isActive: props.ruleData.isActive
    })
  }
})

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          name: formData.name,
          applicableTypes: formData.applicableTypes,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minAmount: formData.minAmount,
          maxDiscount: formData.maxDiscount,
          startDate: formData.dateRange?.[0] || null,
          endDate: formData.dateRange?.[1] || null,
          isActive: formData.isActive
        }

        if (props.type === 'add') {
          await createDiscountRule(props.merchantId, data)
          ElMessage.success('新增成功')
        } else {
          await updateDiscountRule(props.merchantId, formData.id, data)
          ElMessage.success('修改成功')
        }

        handleUpdateVisible(false)
        emit('success')
      } catch (error) {
        console.error('保存规则失败:', error)
        ElMessage.error(error.message || '保存规则失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 弹窗关闭回调
const onDialogClosed = () => {
  resetForm()
}

// 重置表单
const resetForm = () => {
  formData.id = null
  formData.name = ''
  formData.applicableTypes = []
  formData.discountType = 'percentage'
  formData.discountValue = undefined
  formData.minAmount = undefined
  formData.maxDiscount = undefined
  formData.dateRange = []
  formData.isActive = 1
  
  formRef.value?.clearValidate()
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>
