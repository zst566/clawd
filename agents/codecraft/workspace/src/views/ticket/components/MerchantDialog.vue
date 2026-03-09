<template>
  <el-dialog
    :model-value="visible"
    :title="type === 'add' ? '新增商户' : '编辑商户'"
    width="700px"
    :close-on-click-modal="false"
    @closed="onDialogClosed"
    @update:model-value="handleUpdateVisible"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属分类" prop="category">
            <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入商户名称" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="商户简称">
            <el-input v-model="formData.shortName" placeholder="请输入商户简称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input v-model="formData.phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="商户Logo">
        <ImageUploader
          v-model="formData.logo"
          :max-size="2"
          upload-text="Logo"
          hint="建议尺寸 200x200 像素，支持 JPG、PNG 格式"
          @change="handleLogoChange"
        />
      </el-form-item>

      <el-form-item label="商户描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入商户描述"
        />
      </el-form-item>

      <el-form-item label="详细地址">
        <el-input v-model="formData.address" placeholder="请输入详细地址" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="营业时间">
            <el-time-picker
              v-model="formData.businessHoursStart"
              placeholder="开始时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 48%"
              :disabled="formData.is24h"
            />
            <span style="margin: 0 4%">-</span>
            <el-time-picker
              v-model="formData.businessHoursEnd"
              placeholder="结束时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 48%"
              :disabled="formData.is24h"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item>
            <el-checkbox v-model="formData.is24h">24小时营业</el-checkbox>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="状态">
        <el-switch
          v-model="formData.status"
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
import ImageUploader from '@/components/common/ImageUploader.vue'
import { getMerchants, createMerchant, updateMerchant } from '@/api/ticket'
import { uploadToOss } from '@/api/config'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'add'
  },
  merchantData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

// 分类选项
const categoryOptions = [
  { value: 'food', label: '餐饮美食' },
  { value: 'hotel', label: '酒店住宿' },
  { value: 'attraction', label: '景点门票' },
  { value: 'shopping', label: '购物商场' },
  { value: 'entertainment', label: '休闲娱乐' },
  { value: 'transport', label: '交通出行' },
  { value: 'other', label: '其他' }
]

const formRef = ref(null)
const submitLoading = ref(false)

const formData = reactive({
  id: null,
  name: '',
  shortName: '',
  category: '',
  logo: '',
  description: '',
  phone: '',
  address: '',
  businessHoursStart: '',
  businessHoursEnd: '',
  is24h: false,
  status: 1
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入商户名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 监听弹窗显示状态
watch(() => props.visible, (val) => {
  if (val && props.type === 'edit' && props.merchantData) {
    loadMerchantData(props.merchantData.id)
  }
})

// 加载商户数据
const loadMerchantData = async (id) => {
  try {
    const res = await getMerchants({ id })
    if (res.code === 200 && res.data.list.length > 0) {
      const data = res.data.list[0]
      Object.assign(formData, {
        id: data.id,
        name: data.name,
        shortName: data.shortName || '',
        category: data.category || '',
        logo: data.logo || '',
        description: data.description || '',
        phone: data.phone || '',
        address: data.address || '',
        businessHoursStart: data.businessHoursStart || '',
        businessHoursEnd: data.businessHoursEnd || '',
        is24h: data.is24h || false,
        status: data.status
      })
    }
  } catch (error) {
    console.error('获取商户详情失败:', error)
    ElMessage.error('获取商户详情失败')
  }
}

// Logo上传
const handleLogoChange = async (file, url) => {
  try {
    const res = await uploadToOss(file)
    formData.logo = res.data.url
    ElMessage.success('Logo上传成功')
  } catch (error) {
    console.error('上传Logo失败:', error)
    ElMessage.error('上传Logo失败')
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = {
          name: formData.name,
          shortName: formData.shortName,
          category: formData.category,
          logo: formData.logo,
          description: formData.description,
          phone: formData.phone,
          address: formData.address,
          businessHoursStart: formData.is24h ? '' : formData.businessHoursStart,
          businessHoursEnd: formData.is24h ? '' : formData.businessHoursEnd,
          is24h: formData.is24h,
          status: formData.status
        }

        if (props.type === 'add') {
          await createMerchant(data)
          ElMessage.success('新增成功')
        } else {
          await updateMerchant(formData.id, data)
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
  formData.shortName = ''
  formData.category = ''
  formData.logo = ''
  formData.description = ''
  formData.phone = ''
  formData.address = ''
  formData.businessHoursStart = ''
  formData.businessHoursEnd = ''
  formData.is24h = false
  formData.status = 1
  
  formRef.value?.clearValidate()
}

// 更新弹窗可见性
const handleUpdateVisible = (val) => {
  emit('update:visible', val)
}
</script>
