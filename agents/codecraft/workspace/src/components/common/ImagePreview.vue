<template>
  <el-image-viewer
    v-if="visible"
    :url-list="previewList"
    :initial-index="initialIndex"
    @close="handleClose"
    @switch="handleSwitch"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // 图片URL或URL数组
  src: {
    type: [String, Array],
    default: ''
  },
  // 初始显示的图片索引
  initialIndex: {
    type: Number,
    default: 0
  },
  // 是否显示
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'close', 'switch'])

const previewList = computed(() => {
  if (Array.isArray(props.src)) {
    return props.src
  }
  return props.src ? [props.src] : []
})

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleSwitch = (index) => {
  emit('switch', index)
}
</script>
