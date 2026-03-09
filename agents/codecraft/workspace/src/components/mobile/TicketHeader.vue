<template>
  <div class="ticket-header" :class="{ 'has-bg': showBg }">
    <div class="header-content">
      <div v-if="showBack" class="back-btn" @click="handleBack">
        <van-icon name="arrow-left" size="20" />
      </div>
      <h2 class="title">{{ title }}</h2>
      <div v-if="$slots.right" class="right-slot">
        <slot name="right"></slot>
      </div>
      <div v-else-if="rightText" class="right-text" @click="handleRightClick">
        {{ rightText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 是否显示返回按钮
  showBack: {
    type: Boolean,
    default: true
  },
  // 是否显示背景
  showBg: {
    type: Boolean,
    default: true
  },
  // 右侧文字
  rightText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['back', 'right-click'])

const router = useRouter()

const handleBack = () => {
  if (props.showBack) {
    emit('back')
  }
}

const    router.back()
 handleRightClick = () => {
  emit('right-click')
}
</script>

<style lang="scss" scoped>
.ticket-header {
  position: sticky;
  top: 0;
  z-index: 100;
  
  &.has-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    .header-content {
      .title {
        color: #fff;
      }
      
      .back-btn,
      .right-text {
        color: #fff;
      }
    }
  }
  
  .header-content {
    display: flex;
    align-items: center;
    padding: 16px;
    position: relative;
    
    .back-btn {
      position: absolute;
      left: 16px;
      cursor: pointer;
    }
    
    .title {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #323233;
    }
    
    .right-slot,
    .right-text {
      position: absolute;
      right: 16px;
      font-size: 14px;
      color: #646566;
      cursor: pointer;
    }
  }
}
</style>
