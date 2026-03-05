<template>
  <div class="dashboard-view">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.stats.total }}</div>
          <div class="stat-label">总任务</div>
        </div>
      </div>
      
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.stats.pending }}</div>
          <div class="stat-label">待分配</div>
        </div>
      </div>
      
      <div class="stat-card running">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.stats.running }}</div>
          <div class="stat-label">执行中</div>
        </div>
      </div>
      
      <div class="stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ store.stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 智能体状态概览 -->
    <div class="section">
      <div class="section-header">
        <h3>🤖 智能体状态</h3>
        <router-link to="/lounge" class="view-all">查看全部 →</router-link>
      </div>
      
      <div class="agents-grid">
        <div 
          v-for="agent in store.agents" 
          :key="agent.id"
          class="agent-card"
          :class="agent.status"
        >
          <div class="agent-avatar">{{ agent.avatar_emoji }}</div>
          <div class="agent-info">
            <div class="agent-name">{{ agent.name }}</div>
            <div class="agent-status">
              <span v-if="agent.status === 'idle'">💤 空闲</span>
              <span v-else-if="agent.status === 'busy'">🔄 工作中</span>
              <span v-else>⚫ 离线</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近任务 -->
    <div class="section">
      <div class="section-header">
        <h3>📋 最近任务</h3>
        <router-link to="/tasks" class="view-all">查看全部 →</router-link>
      </div>
      
      <div class="recent-tasks">
        <div 
          v-for="task in recentTasks" 
          :key="task.id"
          class="recent-task-item"
          :class="task.status"
        >
          <div class="task-status-icon">
            {{ getStatusIcon(task.status) }}
          </div>
          
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <span class="task-priority">{{ '⭐'.repeat(task.priority) }}</span>
              <span v-if="task.assigned_name">🤖 {{ task.assigned_name }}</span>
              <span>{{ formatDate(task.created_at) }}</span>
            </div>
          </div>
          
          <div class="task-status-badge" :class="task.status">
            {{ getStatusText(task.status) }}
          </div>
        </div>
        
        <div v-if="recentTasks.length === 0" class="empty-state">
          暂无任务，点击"任务看板"创建新任务
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="section">
      <div class="section-header">
        <h3>⚡ 快速操作</h3>
      </div>
      
      <div class="quick-actions">
        <router-link to="/tasks" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-text">管理任务</span>
        </router-link>
        
        <router-link to="/workshop" class="action-card">
          <span class="action-icon">🏭</span>
          <span class="action-text">查看工作间</span>
        </router-link>
        
        <router-link to="/lounge" class="action-card">
          <span class="action-icon">🛋️</span>
          <span class="action-text">分配任务</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import dayjs from 'dayjs'

const store = useDashboardStore()

const recentTasks = computed(() => {
  return store.tasks.slice(0, 5)
})

function getStatusIcon(status: string) {
  const icons: Record<string, string> = {
    pending: '⏳',
    assigned: '📋',
    running: '🔄',
    paused: '⏸️',
    completed: '✅',
    failed: '❌'
  }
  return icons[status] || '📌'
}

function getStatusText(status: string) {
  const texts: Record<string, string> = {
    pending: '待分配',
    assigned: '已分配',
    running: '执行中',
    paused: '暂停',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}
</script>

<style scoped>
.dashboard-view {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.stat-card.pending {
  border-left: 4px solid #fa8c16;
}

.stat-card.running {
  border-left: 4px solid #52c41a;
}

.stat-card.completed {
  border-left: 4px solid #1890ff;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 0.875rem;
  color: #999;
}

.section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-size: 0.875rem;
}

.view-all:hover {
  text-decoration: underline;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.agent-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid #ddd;
}

.agent-card.idle {
  border-left-color: #52c41a;
}

.agent-card.busy {
  border-left-color: #fa8c16;
}

.agent-card.offline {
  border-left-color: #999;
}

.agent-avatar {
  font-size: 2.5rem;
}

.agent-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.agent-status {
  font-size: 0.875rem;
  color: #999;
}

.recent-tasks {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
}

.recent-task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.recent-task-item:last-child {
  border-bottom: none;
}

.recent-task-item:hover {
  background: #f9f9f9;
}

.task-status-icon {
  font-size: 1.5rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.task-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #999;
}

.task-priority {
  color: #fa8c16;
}

.task-status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.task-status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.task-status-badge.running {
  background: #f6ffed;
  color: #52c41a;
}

.task-status-badge.completed {
  background: #e6f7ff;
  color: #1890ff;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.action-icon {
  font-size: 2.5rem;
}

.action-text {
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
