import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Project {
  id: string
  name: string
  description: string
  status: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: 'pending' | 'assigned' | 'running' | 'paused' | 'completed' | 'failed'
  priority: number
  created_by: string
  assigned_to: string | null
  assigned_name: string | null
  avatar_emoji: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  estimated_duration: number | null
  actual_duration: number | null
}

export interface Agent {
  id: string
  name: string
  alias: string
  role: string
  capabilities: string[]
  max_instances: number
  status: 'idle' | 'busy' | 'offline'
  telegram_handle: string | null
  avatar_emoji: string
}

export interface AgentInstance {
  id: string
  agent_id: string
  instance_number: number
  status: 'idle' | 'busy' | 'paused' | 'error'
  current_task_id: string | null
  current_task_title: string | null
  task_started_at: string | null
}

export interface WorkshopAgent {
  agent_id: string
  agent_name: string
  role: string
  avatar_emoji: string
  max_instances: number
  instances: AgentInstance[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const tasks = ref<Task[]>([])
  const agents = ref<Agent[]>([])
  const workshop = ref<WorkshopAgent[]>([])
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)

  // Getters
  const tasksByStatus = computed(() => {
    const grouped = {
      pending: [] as Task[],
      assigned: [] as Task[],
      running: [] as Task[],
      paused: [] as Task[],
      completed: [] as Task[],
      failed: [] as Task[]
    }
    tasks.value.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    return grouped
  })

  const idleAgents = computed(() => agents.value.filter(a => a.status === 'idle'))
  const busyAgents = computed(() => agents.value.filter(a => a.status === 'busy'))

  const stats = computed(() => {
    return {
      total: tasks.value.length,
      pending: tasks.value.filter(t => t.status === 'pending').length,
      running: tasks.value.filter(t => t.status === 'running').length,
      completed: tasks.value.filter(t => t.status === 'completed').length,
      paused: tasks.value.filter(t => t.status === 'paused').length
    }
  })

  // Actions
  async function initSocket() {
    socket.value = io(API_BASE)
    
    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('WebSocket 已连接')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('WebSocket 已断开')
    })

    // 监听实时事件
    socket.value.on('task:created', (task: Task) => {
      tasks.value.unshift(task)
    })

    socket.value.on('task:assigned', ({ task }: { task: Task }) => {
      const index = tasks.value.findIndex(t => t.id === task.id)
      if (index >= 0) {
        tasks.value[index] = task
      }
      fetchWorkshop()
    })

    socket.value.on('task:status_changed', ({ task }: { task: Task }) => {
      const index = tasks.value.findIndex(t => t.id === task.id)
      if (index >= 0) {
        tasks.value[index] = task
      }
      fetchWorkshop()
    })

    socket.value.on('instance:spawned', () => {
      fetchWorkshop()
    })
  }

  async function fetchProjects() {
    try {
      const res = await axios.get(`${API_BASE}/api/projects`)
      projects.value = res.data.data
      if (projects.value.length > 0 && !currentProject.value) {
        currentProject.value = projects.value[0]
      }
    } catch (err) {
      console.error('获取项目失败:', err)
    }
  }

  async function fetchTasks(projectId: string) {
    try {
      const res = await axios.get(`${API_BASE}/api/projects/${projectId}/tasks`)
      tasks.value = res.data.data
    } catch (err) {
      console.error('获取任务失败:', err)
    }
  }

  async function fetchAgents() {
    try {
      const res = await axios.get(`${API_BASE}/api/agents`)
      agents.value = res.data.data.map((a: Agent) => ({
        ...a,
        capabilities: JSON.parse(a.capabilities as unknown as string || '[]')
      }))
    } catch (err) {
      console.error('获取智能体失败:', err)
    }
  }

  async function fetchWorkshop() {
    try {
      const res = await axios.get(`${API_BASE}/api/workspace/workshop`)
      workshop.value = res.data.data
    } catch (err) {
      console.error('获取工作间失败:', err)
    }
  }

  async function createTask(projectId: string, taskData: Partial<Task>) {
    try {
      const res = await axios.post(`${API_BASE}/api/projects/${projectId}/tasks`, taskData)
      return res.data.data
    } catch (err) {
      console.error('创建任务失败:', err)
      throw err
    }
  }

  async function assignTask(taskId: string, agentId: string, instanceId?: string) {
    try {
      const res = await axios.post(`${API_BASE}/api/tasks/${taskId}/assign`, {
        agent_id: agentId,
        instance_id: instanceId,
        performed_by: 'user'
      })
      return res.data.data
    } catch (err) {
      console.error('分配任务失败:', err)
      throw err
    }
  }

  async function updateTaskStatus(taskId: string, status: string, note?: string) {
    try {
      const res = await axios.put(`${API_BASE}/api/tasks/${taskId}/status`, {
        status,
        performed_by: 'user',
        note
      })
      return res.data.data
    } catch (err) {
      console.error('更新任务状态失败:', err)
      throw err
    }
  }

  async function spawnInstance(agentId: string) {
    try {
      const res = await axios.post(`${API_BASE}/api/agents/${agentId}/spawn`)
      return res.data.data
    } catch (err) {
      console.error('创建实例失败:', err)
      throw err
    }
  }

  return {
    projects,
    currentProject,
    tasks,
    agents,
    workshop,
    isConnected,
    tasksByStatus,
    idleAgents,
    busyAgents,
    stats,
    initSocket,
    fetchProjects,
    fetchTasks,
    fetchAgents,
    fetchWorkshop,
    createTask,
    assignTask,
    updateTaskStatus,
    spawnInstance
  }
})
