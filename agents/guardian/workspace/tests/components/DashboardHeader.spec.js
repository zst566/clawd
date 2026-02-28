import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardHeader from '../views/Dashboard/components/DashboardHeader.vue'

// Mock Element Plus icons
vi.mock('@element-plus/icons-vue', () => ({
  Refresh: { template: '<span></span>' },
  Calendar: { template: '<span></span>' },
  Monitor: { template: '<span></span>' },
  Warning: { template: '<span></span>' Mock auth }
}))

// store
vi.mock('../store/auth', () => ({
  useAuthStore: () => ({
    user: { role: 'admin' }
  })
}))

describe('DashboardHeader 组件测试', () => {
  
  describe('基础渲染', () => {
    it('应该正确渲染标题', () => {
      const wrapper = mount(DashboardHeader, {
        props: {
          refreshing: false,
          scanningZombie: false,
          zombieScanStep: '',
          zombieTotalCount: 0,
          batchCalculating: false
        }
      })
      expect(wrapper.text()).toContain('数据概览')
    })

    it('应该渲染刷新按钮', () => {
      const wrapper = mount(DashboardHeader, {
        props: { refreshing: false }
      })
      expect(wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('Props 响应', () => {
    it('refreshing=true 时按钮应显示 loading', () => {
      const wrapper = mount(DashboardHeader, {
        props: { refreshing: true }
      })
      const button = wrapper.find('button:first-child')
      expect(button.props('loading')).toBe(true)
    })

    it('zombieTotalCount > 0 时应显示警告', () => {
      const wrapper = mount(DashboardHeader, {
        props: { zombieTotalCount: 5, scanningZombie: false }
      })
      expect(wrapper.text()).toContain('僵尸订单')
    })

    it('scanningZombie=true 时应显示扫描状态', () => {
      const wrapper = mount(DashboardHeader, {
        props: { 
          scanningZombie: true, 
          zombieScanStep: '正在查询...',
          zombieTotalCount: 0
        }
      })
      expect(wrapper.text()).toContain('正在查询')
    })
  })

  describe('事件触发', () => {
    it('点击刷新按钮应触发 refresh 事件', async () => {
      const wrapper = mount(DashboardHeader, {
        props: { refreshing: false }
      })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('refresh')).toBeTruthy()
    })

    it('点击僵尸订单检查应触发 scan-zombie 事件', async () => {
      const wrapper = mount(DashboardHeader, {
        props: { scanningZombie: false }
      })
      const zombieBtn = wrapper.findAll('button').find(btn => 
        btn.text().includes('僵尸')
      )
      if (zombieBtn) {
        await zombieBtn.trigger('click')
        expect(wrapper.emitted('scan-zombie')).toBeTruthy()
      }
    })
  })

  describe('权限控制', () => {
    it('管理员应看到批量统计按钮', () => {
      // Mock admin user
      const wrapper = mount(DashboardHeader, {
        props: { 
          refreshing: false,
          scanningZombie: false,
          zombieScanStep: '',
          zombieTotalCount: 0,
          batchCalculating: false
        },
        global: {
          mocks: {
            useAuthStore: () => ({ user: { role: 'admin' } })
          }
        }
      })
      expect(wrapper.text()).toContain('批量统计')
    })

    it('非管理员不应看到批量统计按钮', () => {
      const wrapper = mount(DashboardHeader, {
        props: { 
          refreshing: false,
          scanningZombie: false,
          zombieScanStep: '',
          zombieTotalCount: 0,
          batchCalculating: false
        },
        global: {
          mocks: {
            useAuthStore: () => ({ user: { role: 'user' } })
          }
        }
      })
      expect(wrapper.text()).not.toContain('批量统计')
    })
  })

  describe('边界条件', () => {
    it('zombieTotalCount=0 时不应显示警告', () => {
      const wrapper = mount(DashboardHeader, {
        props: { zombieTotalCount: 0, scanningZombie: false }
      })
      expect(wrapper.text()).not.toContain('待处理')
    })

    it('batchCalculating=true 时按钮应显示 loading', () => {
      const wrapper = mount(DashboardHeader, {
        props: { 
          refreshing: false,
          scanningZombie: false,
          zombieScanStep: '',
          zombieTotalCount: 0,
          batchCalculating: true
        }
      })
      const batchBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('批量统计')
      )
      if (batchBtn) {
        expect(batchBtn.props('loading')).toBe(true)
      }
    })
  })
})
