import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import TaskBoard from '../views/TaskBoard.vue'
import Workshop from '../views/Workshop.vue'
import Lounge from '../views/Lounge.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/tasks',
    name: 'TaskBoard',
    component: TaskBoard
  },
  {
    path: '/workshop',
    name: 'Workshop',
    component: Workshop
  },
  {
    path: '/lounge',
    name: 'Lounge',
    component: Lounge
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
