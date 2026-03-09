<template>
  <el-dialog
    :model-value="visible"
    :title="type === 'add' ? '新增票根类型' : '编辑票根类型'"
    width="700px"
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
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="类型名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入类型名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类型编码" prop="code">
            <el-input 
              v-model="formData.code" 
              placeholder="请输入类型编码"
              :disabled="type === 'edit'"
            />
            <div class="form-tip">仅支持小写字母、数字、下划线</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="图标" prop="icon">
            <IconSelector v-model="formData.icon" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序">
            <el-input-number v-model="formData.sortOrder" :min="0" :max="999" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入类型描述"
        />
      </el-form-item>

      <el-divider>验证规则配置</el-divider>

      <el-form-item label="票号正则">
        <el-input 
          v-model="formData.ticketNoPattern" 
          placeholder="例如：^[A-Z0-9]{10}$"
        />
        <div class="form-tip">用于验证票号格式，留空表示不验证</div>
      </el-form-item>

      <el-form-item label="必填字段">
        <el-checkbox-group v-model="formData.requiredFields">
          <el-checkbox label="ticketNo">票号</el-checkbox>
          <el-checkbox label="departure">出发地</el-checkbox>
          <el-checkbox label="destination">目的地</el-checkbox>
          <el-checkbox label="departureTime">出发时间</el-checkbox>
          <el-checkbox label="price">票价</el-checkbox>
          <el-checkbox label="seat">座位</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="有效期天数">
            <el-input-number v-model="formData.validityDays" :min="0" :max="365" style="width: 100%" />
            <div class="form-tip">0表示永久有效</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch
              v-model="formData.isActive"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>
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
import IconSelector from './IconSelector.vue'
import { getTicketTypes, createTicketType, updateTicketType } from '@/api/ticket'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'add'
  },
  typeData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitLoading = ref(false)

const formData = reactive({
  id: null,
  name: '',
  code: '',
  icon: '',
  description: '',
  ticketNoPattern: '',
  requiredFields: [],
  validityDays: 0,
  sortOrder: 0,
  isActive: 1
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入类型名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入类型编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择图标', trigger: 'change' }
  ]
}

// 监听弹窗显示
watch(() => props.visible, (val) => {
  if (val && props.type === 'edit' && props.typeData) {
    loadTypeData(props.typeData.id)
  }
})

// 加载类型数据
const loadTypeData = async (id) => {
  try {
    const res = await getTicketTypes({ id })
    if (res.code === 200 && res.data.list.length > 0) {
      const data = res.data.list[0]
      Object.assign(formData, {
        id: data.id,
        name: data.name,
        code: data.code,
        icon: data.icon,
        description: data.description || '',
        ticketNoPattern: data.ticketNoPattern || '',
        requiredFields: data.requiredFields || [],
        validityDays: data.validityDays || 0,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive
      })
    }
  } catch (error) {
    console.error('获取票根类型详情失败:', error)
    ElMessage.error('获取票根类型详情失败')
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true

      try {
        if (props.type === 'add') {
          await createTicketType(formData)
          ElMessage.success('新增成功')
        } else {
          await updateTicketType(formData.id, formData)
          ElMessage.success('修改成功')
        }

        handleUpdateVisible(false)
        emit('success')
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error(error.message || '保存失败')
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
  formData.code = ''
  formData.icon = ''
  formData.description = ''
  formData.ticketNoPattern = ''
  formData.requiredFields = []
  formData.validityDays = 0
  formData.sortOrder = 0
  formData.isActive = 1
  
  formRef.value?.clearValidate()
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>

<style lang="scss" scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
