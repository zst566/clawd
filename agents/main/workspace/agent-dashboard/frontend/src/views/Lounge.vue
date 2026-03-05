<template>
  <div class="lounge">
    <div class="lounge-header">
      <h2>🛋️ 智能体休息区</h2>
      <p class="lounge-desc">空闲的智能体在这里休息，点击可分配任务</p>
    </div>

    <div class="lounge-floor">
      <div 
        v-for="agent in store.agents" 
        :key="agent.id"
        class="agent-seat"
        :class="{ 'is-idle': agent.status === 'idle', 'is-busy': agent.status === 'busy', 'is-offline': agent.status === 'offline' }"
        @click="agent.status === 'idle' ? selectAgent(agent) : null"
      >
        <div class="seat-avatar">
          <span class="agent-emoji">{{ agent.avatar_emoji }}</span>
          <span class="status-indicator" :class="agent.status"></span>
        </div>
        
        <div class="seat-info">
          <h3 class="agent-name">{{ agent.name }}</h3>
          <span class="agent-alias">{{ agent.alias }}</span>
          
          <div class="agent-role">
            <span class="role-badge">{{ getRoleLabel(agent.role) }}</span>
          </div>
          
          <div class="agent-capabilities">
            <span 
              v-for="cap in agent.capabilities.slice(0, 3)" 
              :key="cap"
              class="cap-tag"
            >
              {{ cap }}
            </span>
            <span v-if="agent.capabilities.length > 3" class="cap-more">
              +{{ agent.capabilities.length - 3 }}
            </span>
          </div>
        </div>

        <div class="seat-status">
          <div class="status-badge" :class="agent.status">
            <span v-if="agent.status === 'idle'">💤 休息中</span>
            <span v-else-if="agent.status === 'busy'">🔄 工作中</span>
            <span v-else>⚫ 离线</span>
          </div>
          
          <div class="instance-info" v-if="agent.status === 'busy'">
            <span>{{ getActiveInstances(agent.id) }} 个分身在工作</span>
          </div>
        </div>

        <div class="seat-actions" v-if="agent.status === 'idle'">
          <button class="btn-assign" @click.stop="selectAgent(agent)">
            分配任务
          </button>
        </div>
      </div>
    </div>

    <!-- 分配任务弹窗 -->
    <div v-if="showAssign" class="modal" @click="showAssign = false">
      <div class="modal-content" @click.stop>
        <h3>🎯 给 {{ selectedAgent?.name }} 分配任务</h3>
        
        <div class="task-selector">
          <div class="section-title">📋 选择任务</div>
          
          <div v-if="pendingTasks.length === 0" class="empty-tasks">
            暂无待分配的任务，请先创建任务
          </div>
          
          <div v-else class="task-list">
            <div 
              v-for="task in pendingTasks" 
              :key="task.id"
              class="task-item"
              :class="{ selected: selectedTask?.id === task.id }"
              @click="selectedTask = task"
            >
              <div class="task-priority">
                {{ '⭐'.repeat(task.priority) }}
              </div>
              
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">
                  <span v-if="task.estimated_duration">⏱️ {{ task.estimated_duration }}分钟</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="instance-selector" v-if="selectedAgent">
          <div class="section-title">🤖 选择分身</div>
          
          <div class="instance-options">
            <label class="instance-option">
              <input type="radio" v-model="useNewInstance" :value="false" />
              <span>使用现有分身</span>
            </label>
            
            <label class="instance-option">
              <input type="radio" v-model="useNewInstance" :value="true" />
              <span>创建新分身</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="showAssign = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="confirmAssign"
            :disabled="!selectedTask"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore, type Agent, type Task } from '../stores/dashboard'

const store = useDashboardStore()

const showAssign = ref(false)
const selectedAgent = ref<Agent | null>(null)
const selectedTask = ref<Task | null>(null)
const useNewInstance = ref(false)

const pendingTasks = computed(() => {
  return store.tasks.filter(t => t.status === 'pending')
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

function getActiveInstances(agentId: string) {
  const agent = store.workshop.find(a => a.agent_id === agentId)
  if (!agent) return 0
  return agent.instances.filter(i => i.status === 'busy').length
}

function selectAgent(agent: Agent) {
  selectedAgent.value = agent
  selectedTask.value = null
  useNewInstance.value = false
  showAssign.value = true
  
  // 获取当前项目的待分配任务
  if (store.currentProject) {
    store.fetchTasks(store.currentProject.id)
  }
}

async function confirmAssign() {
  if (!selectedTask.value || !selectedAgent.value) return

  try {
    // 如果需要创建新分身
    if (useNewInstance.value) {
      await store.spawnInstance(selectedAgent.value.id)
    }
    
    // 分配任务
    await store.assignTask(selectedTask.value.id, selectedAgent.value.id)
    
    showAssign.value = false
    selectedTask.value = null
    selectedAgent.value = null
    
    // 刷新工作间状态
    await store.fetchWorkshop()
    
    alert('任务分配成功！')
  } catch (err) {
    alert('分配任务失败: ' + err)
  }
}

onMounted(() => {
  store.fetchAgents()
  store.fetchWorkshop()
})
</script>

<style scoped>
.lounge {
  max-width: 1400px;
  margin: 0 auto;
}

.lounge-header {
  margin-bottom: 2rem;
}

.lounge-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.lounge-desc {
  color: #666;
}

.lounge-floor {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.agent-seat {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
  position: relative;
  border: 2px solid transparent;
}

.agent-seat:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.agent-seat.is-idle {
  border-color: #b7eb8f;
  cursor: pointer;
}

.agent-seat.is-idle:hover {
  background: #f6ffed;
}

.agent-seat.is-busy {
  border-color: #91d5ff;
  opacity: 0.8;
}

.agent-seat.is-offline {
  border-color: #d9d9d9;
  opacity: 0.6;
}

.seat-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
}

.agent-emoji {
  font-size: 4rem;
  display: block;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: calc(50% - 2rem);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid white;
}

.status-indicator.idle {
  background: #52c41a;
  animation: pulse 2s infinite;
}

.status-indicator.busy {
  background: #fa8c16;
}

.status-indicator.offline {
  background: #999;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

.seat-info {
  text-align: center;
  margin-bottom: 1rem;
}

.agent-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.agent-alias {
  font-size: 0.875rem;
  color: #999;
}

.agent-role {
  margin: 0.5rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.agent-capabilities {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.cap-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  color: #666;
}

.cap-more {
  font-size: 0.75rem;
  color: #999;
}

.seat-status {
  text-align: center;
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.idle {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.busy {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.offline {
  background: #f5f5f5;
  color: #999;
}

.instance-info {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.5rem;
}

.seat-actions {
  display: flex;
  justify-content: center;
}

.btn-assign {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-assign:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Modal 样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.section-title {
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
}

.empty-tasks {
  text-align: center;
  padding: 2rem;
  color: #999;
  background: #f5f5f5;
  border-radius: 8px;
}

.task-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.task-item:hover,
.task-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.task-priority {
  font-size: 0.875rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.task-meta {
  font-size: 0.75rem;
  color: #999;
}

.instance-selector {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.instance-options {
  display: flex;
  gap: 2rem;
}

.instance-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.instance-option input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
