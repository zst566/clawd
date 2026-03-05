<template>
  <div class="dashboard">
    <header class="header">
      <h1>🎯 智能体任务看板</h1>
      <div class="connection-status" :class="{ connected: store.isConnected }">
        {{ store.isConnected ? '🟢 已连接' : '🔴 未连接' }}
      </div>
    </header>

    <nav class="nav">
      <router-link to="/" class="nav-item" exact>📊 概览</router-link>
      <router-link to="/tasks" class="nav-item">📋 任务看板</router-link>
      <router-link to="/workshop" class="nav-item">🏭 工作间</router-link>
      <router-link to="/lounge" class="nav-item">🛋️ 休息区</router-link>
    </nav>

    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from './stores/dashboard'

const store = useDashboardStore()

onMounted(async () => {
  await store.initSocket()
  await store.fetchProjects()
  await store.fetchAgents()
  await store.fetchWorkshop()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #333;
}

.dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(255,255,255,0.2);
}

.connection-status.connected {
  background: rgba(76, 175, 80, 0.3);
}

.nav {
  background: white;
  padding: 0 2rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e8e8e8;
}

.nav-item {
  padding: 1rem 1.5rem;
  text-decoration: none;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  font-weight: 500;
}

.nav-item:hover {
  color: #667eea;
  background: #f9f9f9;
}

.nav-item.router-link-active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f0f4ff;
}

.main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* 通用卡片样式 */
.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

/* 按钮样式 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending { background: #fff7e6; color: #fa8c16; }
.status-assigned { background: #e6f7ff; color: #1890ff; }
.status-running { background: #f6ffed; color: #52c41a; }
.status-paused { background: #fff1f0; color: #ff4d4f; }
.status-completed { background: #f6ffed; color: #52c41a; }
.status-failed { background: #fff1f0; color: #ff4d4f; }
</style>
