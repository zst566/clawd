<template>
  <img
    v-if="isShow"
    :src="src"
    :alt="alt"
    :style="imageStyle"
    class="lazy-image"
    @load="handleLoad"
    @error="handleError"
  />
  <div v-else :style="placeholderStyle" class="lazy-placeholder">
    <slot name="placeholder">
      <van-loading v-if="loading" type="circle" />
    </slot>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // 图片地址
  src: {
    type: String,
    default: ''
  },
  // 替代文本
  alt: {
    type: String,
    default: ''
  },
  // 占位图样式
  placeholderStyle: {
    type: Object,
    default: () => ({})
  },
  // 图片样式
  imageStyle: {
    type: Object,
    default: () => ({})
  },
  // 懒加载根元素
  root: {
    type: Element,
    default: null
  },
  // 根元素边距
  rootMargin: {
    type: String,
    default: '50px'
  },
  // 阈值
  threshold: {
    type: [Number, Array],
    default: 0
  }
})

const emit = defineEmits(['load', 'error'])

const isShow = ref(false)
const loading = ref(false)
let observer = null

// 创建观察者
const initObserver = () => {
  if (!('IntersectionObserver' in window)) {
    // 不支持则直接显示
    isShow.value = true
    return
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loading.value = true
        isShow.value = true
        // 开始加载图片
        observer?.unobserve(entry.target)
      }
    })
  }, {
    root: props.root,
    rootMargin: props.rootMargin,
    threshold: props.threshold
  })

  observer.observe(vm.$el)
}

const handleLoad = () => {
  loading.value = false
  emit('load')
}

const handleError = () => {
  loading.value = false
  emit('error')
}

onMounted(() => {
  initObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style lang="scss" scoped>
.lazy-image {
  display: block;
}

.lazy-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
</style>
