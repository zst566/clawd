<template>
  <div class="workshop">
    <div class="workshop-header">
      <h2>🏭 智能体工作间</h2>
      <div class="workshop-stats">
        <span class="stat">
          🟢 运行中: {{ runningInstances }}
        </span>
        <span class="stat">
          💤 空闲: {{ idleInstances }}
        </span>
      </div>
    </div>

    <div class="workshop-floor">
      <div 
        v-for="agent in store.workshop" 
        :key="agent.agent_id"
        class="agent-zone"
      >
        <div class="zone-header">
          <span class="zone-icon">{{ agent.avatar_emoji }}</span>
          <div class="zone-info">
            <h3>{{ agent.agent_name }}</h3>
            <span class="zone-role">{{ getRoleLabel(agent.role) }}</span>
          </div>
          <div class="zone-capacity">
            <span class="capacity-text">
              {{ agent.instances.filter(i => i.status !== 'idle').length }} / {{ agent.max_instances }}
            </span>
            <button 
              v-if="agent.instances.length < agent.max_instances"
              class="btn-spawn"
              @click="spawnInstance(agent.agent_id)"
              title="创建新分身"
            >
              + 分身
            </button>
          </div>
        </div>

        <div class="zone-instances">
          <!-- 空闲实例 -->
          <div 
            v-for="instance in agent.instances.filter(i => i.status === 'idle')" 
            :key="instance.id"
            class="instance-card idle"
          >
            <div class="instance-header">
              <span class="instance-name">{{ agent.agent_name }}-{{ instance.number }}</span>
              <span class="instance-status">💤 空闲</span>
            </div>
            
            <div class="instance-body">
              <div class="idle-animation">
                <span class="zzz">Zzz...</span>
              </div>
            </div>
          </div>

          <!-- 忙碌实例 -->
          <div 
            v-for="instance in agent.instances.filter(i => i.status === 'busy')" 
            :key="instance.id"
            class="instance-card busy"
          >
            <div class="instance-header">
              <span class="instance-name">{{ agent.agent_name }}-{{ instance.number }}</span>
              <span class="instance-status running">🔄 执行中</span>
            </div>
            
            <div class="instance-body" v-if="instance.current_task">
              <div class="current-task">
                <div class="task-label">当前任务</div>
                <div class="task-title">{{ instance.current_task.title }}</div>
                
                <div class="task-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: getProgress(instance) + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ getProgress(instance) }}%</span>
                </div>
                
                <div class="task-meta">
                  <span>⏱️ {{ calculateDuration(instance.task_started_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 暂停实例 -->
          <div 
            v-for="instance in agent.instances.filter(i => i.status === 'paused')" 
            :key="instance.id"
            class="instance-card paused"
          >
            <div class="instance-header">
              <span class="instance-name">{{ agent.agent_name }}-{{ instance.number }}</span>
              <span class="instance-status">⏸️ 暂停</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 动画过渡层 -->
    <div class="animation-overlay" v-if="animatingAssignment">
      <div class="flying-agent" :style="animationStyle">
        {{ animatingAgent?.avatar_emoji }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import dayjs from 'dayjs'

const store = useDashboardStore()

const animatingAssignment = ref(false)
const animatingAgent = ref(null)
const animationStyle = ref({})

const runningInstances = computed(() => {
  return store.workshop.reduce((total, agent) => {
    return total + agent.instances.filter(i => i.status === 'busy').length
  }, 0)
})

const idleInstances = computed(() => {
  return store.workshop.reduce((total, agent) => {
    return total + agent.instances.filter(i => i.status === 'idle').length
  }, 0)
})

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    manager: '项目经理',
    developer: '开发工程师',
    analyst: '数据分析师',
    security: '安全审查',
    reviewer: '质量审查'
  }
  return labels[role] || role
}

function calculateDuration(startedAt: string | null) {
  if (!startedAt) return '0分钟'
  const minutes = dayjs().diff(dayjs(startedAt), 'minute')
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小时${remainingMinutes}分钟`
}

function getProgress(instance: any) {
  // 这里可以根据实际任务进度返回，暂时模拟
  if (!instance.task_started_at) return 0
  const elapsed = dayjs().diff(dayjs(instance.task_started_at), 'minute')
  // 假设任务平均60分钟，计算进度
  const progress = Math.min(Math.round((elapsed / 60) * 100), 99)
  return progress
}

async function spawnInstance(agentId: string) {
  try {
    await store.spawnInstance(agentId)
    await store.fetchWorkshop()
  } catch (err) {
    alert('创建分身失败')
  }
}

onMounted(() => {
  store.fetchWorkshop()
  // 订阅工作间更新
  if (store.socket) {
    store.socket.emit('subscribe:workshop')
  }
})
</script>

<style scoped>
.workshop {
  max-width: 1600px;
  margin: 0 auto;
}

.workshop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.workshop-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.workshop-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  padding: 0.75rem 1.5rem;
  background: white;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.workshop-floor {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.agent-zone {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.zone-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.zone-icon {
  font-size: 2.5rem;
}

.zone-info {
  flex: 1;
}

.zone-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.zone-role {
  font-size: 0.875rem;
  opacity: 0.9;
}

.zone-capacity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.capacity-text {
  font-size: 0.875rem;
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.btn-spawn {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-spawn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.zone-instances {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  min-height: 200px;
}

.instance-card {
  border-radius: 10px;
  padding: 1rem;
  border: 2px solid #e8e8e8;
  transition: all 0.3s;
}

.instance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.instance-card.idle {
  background: #f6ffed;
  border-color: #b7eb8f;
}

.instance-card.busy {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.instance-card.paused {
  background: #fff1f0;
  border-color: #ffa39e;
}

.instance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.instance-name {
  font-weight: 600;
  font-size: 0.9375rem;
}

.instance-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: white;
}

.instance-status.running {
  color: #52c41a;
}

.instance-body {
  min-height: 80px;
}

.idle-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
}

.zzz {
  font-size: 1.5rem;
  color: #999;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.current-task {
  background: white;
  border-radius: 8px;
  padding: 0.75rem;
}

.task-label {
  font-size: 0.75rem;
  color: #999;
  margin-bottom: 0.25rem;
}

.task-title {
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.task-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #667eea;
}

.task-meta {
  font-size: 0.75rem;
  color: #999;
}

/* 动画层 */
.animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.flying-agent {
  position: absolute;
  font-size: 3rem;
  transition: all 1s ease-in-out;
}
</style>
