<template>
  <div class="task-board">
    <div class="board-header">
      <div class="project-selector">
        <label>项目:</label>
        <select v-model="store.currentProject" @change="onProjectChange">
          <option v-for="project in store.projects" :key="project.id" :value="project">
            {{ project.name }}
          </option>
        </select>
        <button class="btn btn-secondary" @click="showNewProject = true">+ 新建项目</button>
      </div>
      
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ store.stats.total }}</span>
          <span class="stat-label">总任务</span>
        </div>
        <div class="stat-item">
          <span class="stat-value pending">{{ store.stats.pending }}</span>
          <span class="stat-label">待分配</span>
        </div>
        <div class="stat-item">
          <span class="stat-value running">{{ store.stats.running }}</span>
          <span class="stat-label">执行中</span>
        </div>
        <div class="stat-item">
          <span class="stat-value completed">{{ store.stats.completed }}</span>
          <span class="stat-label">已完成</span>
        </div>
      </div>
      
      <button class="btn btn-primary" @click="showNewTask = true">
        + 新建任务
      </button>
    </div>

    <div class="kanban-board">
      <!-- 待分配 -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-icon">⏳</span>
          <span class="column-title">待分配</span>
          <span class="column-count">{{ store.tasksByStatus.pending.length }}</span>
        </div>
        <div class="column-content">
          <div 
            v-for="task in store.tasksByStatus.pending" 
            :key="task.id"
            class="task-card"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-priority" :class="'priority-' + task.priority">
                {{ '⭐'.repeat(task.priority) }}
              </span>
            </div>
            <h4 class="task-title">{{ task.title }}</h4>
            
            <div class="task-meta">
              <span v-if="task.estimated_duration" class="task-duration">
                ⏱️ {{ task.estimated_duration }}分钟
              </span>
              <span class="task-date">{{ formatDate(task.created_at) }}</span>
            </div>
            
            <button 
              class="btn-assign"
              @click.stop="openAssignDialog(task)"
            >
              分配
            </button>
          </div>
        </div>
      </div>

      <!-- 执行中 -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-icon">🔄</span>
          <span class="column-title">执行中</span>
          <span class="column-count">{{ store.tasksByStatus.running.length }}</span>
        </div>
        <div class="column-content">
          <div 
            v-for="task in store.tasksByStatus.running" 
            :key="task.id"
            class="task-card running"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-priority" :class="'priority-' + task.priority">
                {{ '⭐'.repeat(task.priority) }}
              </span>
              <span class="status-badge running">运行中</span>
            </div>
            
            <h4 class="task-title">{{ task.title }}</h4>
            
            <div class="task-assignee" v-if="task.assigned_name">
              <span class="assignee-avatar">{{ task.avatar_emoji || '🤖' }}</span>
              <span class="assignee-name">{{ task.assigned_name }}</span>
            </div>
            
            <div class="task-meta">
              <span class="task-duration">
                ⏱️ 已运行 {{ calculateDuration(task.started_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 已完成 -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-icon">✅</span>
          <span class="column-title">已完成</span>
          <span class="column-count">{{ store.tasksByStatus.completed.length }}</span>
        </div>
        <div class="column-content">
          <div 
            v-for="task in store.tasksByStatus.completed" 
            :key="task.id"
            class="task-card completed"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-priority" :class="'priority-' + task.priority">
                {{ '⭐'.repeat(task.priority) }}
              </span>
              <span class="status-badge completed">完成</span>
            </div>
            
            <h4 class="task-title">{{ task.title }}</h4>
            
            <div class="task-meta">
              <span v-if="task.actual_duration" class="task-duration">
                ✅ 耗时 {{ Math.round(task.actual_duration) }}分钟
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 暂停/异常 -->
      <div class="kanban-column">
        <div class="column-header">
          <span class="column-icon">⏸️</span>
          <span class="column-title">暂停/异常</span>
          <span class="column-count">{{ store.tasksByStatus.paused.length + store.tasksByStatus.failed.length }}</span>
        </div>
        <div class="column-content">
          <div 
            v-for="task in [...store.tasksByStatus.paused, ...store.tasksByStatus.failed]" 
            :key="task.id"
            class="task-card paused"
            @click="selectTask(task)"
          >
            <div class="task-header">
              <span class="task-priority" :class="'priority-' + task.priority">
                {{ '⭐'.repeat(task.priority) }}
              </span>
              <span class="status-badge" :class="task.status">
                {{ task.status === 'paused' ? '暂停' : '失败' }}
              </span>
            </div>
            
            <h4 class="task-title">{{ task.title }}</h4>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建任务弹窗 -->
    <div v-if="showNewTask" class="modal" @click="showNewTask = false">
      <div class="modal-content" @click.stop>
        <h3>📋 新建任务</h3>
        
        <div class="form-group">
          <label>任务标题 *</label>
          <input v-model="newTask.title" placeholder="输入任务标题" />
        </div>
        
        <div class="form-group">
          <label>任务描述</label>
          <textarea v-model="newTask.description" rows="3" placeholder="输入任务描述..."></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newTask.priority">
              <option :value="1">⭐ 低</option>
              <option :value="2">⭐⭐ 中低</option>
              <option :value="3">⭐⭐⭐ 中</option>
              <option :value="4">⭐⭐⭐⭐ 中高</option>
              <option :value="5">⭐⭐⭐⭐⭐ 高</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>预计耗时(分钟)</label>
            <input v-model.number="newTask.estimated_duration" type="number" />
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showNewTask = false">取消</button>
          <button class="btn btn-primary" @click="createTask" :disabled="!newTask.title">创建</button>
        </div>
      </div>
    </div>

    <!-- 分配任务弹窗 -->
    <div v-if="showAssign" class="modal" @click="showAssign = false">
      <div class="modal-content" @click.stop>
        <h3>🎯 分配任务: {{ selectedTask?.title }}</h3>
        
        <div class="agent-list">
          <div 
            v-for="agent in store.agents" 
            :key="agent.id"
            class="agent-item"
            :class="{ selected: selectedAgent === agent.id }"
            @click="selectedAgent = agent.id"
          >
            <span class="agent-avatar">{{ agent.avatar_emoji }}</span>
            <div class="agent-info">
              <div class="agent-name">{{ agent.name }}</div>
              <div class="agent-capabilities">
                <span v-for="cap in agent.capabilities" :key="cap" class="cap-tag">
                  {{ cap }}
                </span>
              </div>
            </div>
            <span class="agent-status" :class="agent.status">
              {{ agent.status === 'idle' ? '空闲' : agent.status === 'busy' ? '忙碌' : '离线' }}
            </span>
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showAssign = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="assignTask"
            :disabled="!selectedAgent"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDashboardStore, type Task } from '../stores/dashboard'
import dayjs from 'dayjs'

const store = useDashboardStore()

const showNewTask = ref(false)
const showAssign = ref(false)
const showNewProject = ref(false)
const selectedTask = ref<Task | null>(null)
const selectedAgent = ref('')

const newTask = ref({
  title: '',
  description: '',
  priority: 3,
  estimated_duration: 60
})

onMounted(() => {
  if (store.currentProject) {
    store.fetchTasks(store.currentProject.id)
  }
})

watch(() => store.currentProject, (project) => {
  if (project) {
    store.fetchTasks(project.id)
  }
})

function onProjectChange() {
  if (store.currentProject) {
    store.fetchTasks(store.currentProject.id)
  }
}

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}

function calculateDuration(startedAt: string | null) {
  if (!startedAt) return '0分钟'
  const minutes = dayjs().diff(dayjs(startedAt), 'minute')
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小时${remainingMinutes}分钟`
}

function selectTask(task: Task) {
  selectedTask.value = task
}

function openAssignDialog(task: Task) {
  selectedTask.value = task
  selectedAgent.value = ''
  showAssign.value = true
}

async function createTask() {
  if (!store.currentProject) return
  
  try {
    await store.createTask(store.currentProject.id, {
      ...newTask.value,
      created_by: 'user'
    })
    
    showNewTask.value = false
    newTask.value = {
      title: '',
      description: '',
      priority: 3,
      estimated_duration: 60
    }
  } catch (err) {
    alert('创建任务失败')
  }
}

async function assignTask() {
  if (!selectedTask.value || !selectedAgent.value) return
  
  try {
    await store.assignTask(selectedTask.value.id, selectedAgent.value)
    showAssign.value = false
    selectedAgent.value = ''
  } catch (err) {
    alert('分配任务失败')
  }
}
</script>

<style scoped>
.task-board {
  max-width: 1600px;
  margin: 0 auto;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.project-selector label {
  font-weight: 500;
}

.project-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 200px;
}

.stats-bar {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.stat-value.pending { color: #fa8c16; }
.stat-value.running { color: #52c41a; }
.stat-value.completed { color: #1890ff; }

.stat-label {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.kanban-column {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 1rem;
  min-height: 500px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e8e8e8;
}

.column-icon {
  font-size: 1.25rem;
}

.column-title {
  font-weight: 600;
  flex: 1;
}

.column-count {
  background: #ddd;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.task-card.running {
  border-left-color: #52c41a;
}

.task-card.completed {
  border-left-color: #1890ff;
  opacity: 0.8;
}

.task-card.paused {
  border-left-color: #ff4d4f;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.task-priority {
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.running {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.completed {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge.paused {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-badge.failed {
  background: #fff1f0;
  color: #ff4d4f;
}

.task-title {
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f0f4ff;
  border-radius: 6px;
}

.assignee-avatar {
  font-size: 1.25rem;
}

.assignee-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
}

.task-duration {
  color: #666;
}

.btn-assign {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f0f4ff;
  border: 1px dashed #667eea;
  border-radius: 6px;
  color: #667eea;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-assign:hover {
  background: #667eea;
  color: white;
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
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.agent-list {
  max-height: 300px;
  overflow-y: auto;
}

.agent-item {
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

.agent-item:hover,
.agent-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.agent-avatar {
  font-size: 2rem;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.agent-capabilities {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cap-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  border-radius: 4px;
}

.agent-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.agent-status.idle {
  background: #f6ffed;
  color: #52c41a;
}

.agent-status.busy {
  background: #fff7e6;
  color: #fa8c16;
}

.agent-status.offline {
  background: #f5f5f5;
  color: #999;
}
</style>
