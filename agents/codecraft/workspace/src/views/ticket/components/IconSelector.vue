<template>
  <el-select v-model="currentValue" placeholder="请选择图标" style="width: 100%">
    <el-option
      v-for="icon in iconOptions"
      :key="icon.value"
      :label="icon.label"
      :value="icon.value"
    >
      <div class="icon-option">
        <el-icon :size="18">
          <component :is="icon.component" />
        </el-icon>
        <span>{{ icon.label }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, Van, Promotion, Ticket, Monitor, Basketball, FirstAidKit, School } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const currentValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 图标选项配置
const iconOptions = [
  { value: 'picture', label: '电影票', component: Picture },
  { value: 'van', label: '火车票', component: Van },
  { value: 'promotion', label: '飞机票', component: Promotion },
  { value: 'ticket', label: '通用票', component: Ticket },
  { value: 'monitor', label: '演出票', component: Monitor },
  { value: 'basketball', label: '赛事票', component: Basketball },
  { value: 'first-aid-kit', label: '医疗票', component: FirstAidKit },
  { value: 'school', label: '教育票', component: School }
]
</script>

<style lang="scss" scoped>
.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
