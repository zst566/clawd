<template>
  <el-switch
    v-model="currentValue"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    :disabled="disabled"
    :loading="loading"
    :before-change="beforeChange"
    @change="handleChange"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // 绑定值
  modelValue: {
    type: [Number, String, Boolean],
    default: 0
  },
  // 激活值
  activeValue: {
    type: [Number, String, Boolean],
    default: 1
  },
  // 未激活值
  inactiveValue: {
    type: [Number, String, Boolean],
    default: 0
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 切换前的回调函数
  beforeChange: {
    type: Function,
    default: null
  },
  // 自定义消息
  activeText: {
    type: String,
    default: ''
  },
  inactiveText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const currentValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  currentValue.value = val
})

const handleChange = async (val) => {
  // 如果有 beforeChange 回调，调用它
  if (props.beforeChange) {
    try {
      const result = await props.beforeChange(val)
      if (!result) {
        // 阻止切换，恢复原值
        currentValue.value = val === props.activeValue ? props.inactiveValue : props.activeValue
        return
      }
    } catch (error) {
      console.error('切换前回调执行失败:', error)
      currentValue.value = val === props.activeValue ? props.inactiveValue : props.activeValue
      return
    }
  }

  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<script>
export default {
  name: 'StatusSwitch'
}
</script>
