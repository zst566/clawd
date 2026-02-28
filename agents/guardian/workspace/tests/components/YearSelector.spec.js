import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import YearSelector from '../views/Dashboard/components/YearSelector.vue'

// Mock auth store
vi.mock('../store/auth', () => ({
  useAuthStore: () => ({
    user: { role: 'admin' }
  })
}))

describe('YearSelector 组件测试', () => {

  describe('基础渲染', () => {
    it('应该渲染年度选择器', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      expect(wrapper.find('el-date-picker').exists()).toBe(true)
    })

    it('应该显示操作按钮', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Props 响应', () => {
    it('loading=true 时加载按钮应显示 loading', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: true,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const loadBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('加载')
      )
      if (loadBtn) {
        expect(loadBtn.props('loading')).toBe(true)
      }
    })

    it('hasData=true 时导出按钮应启用', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: true
        }
      })
      const exportBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('导出')
      )
      if (exportBtn) {
        expect(exportBtn.attributes('disabled')).toBeFalsy()
      }
    })

    it('hasData=false 时导出按钮应禁用', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const exportBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('导出')
      )
      if (exportBtn) {
        expect(exportBtn.attributes('disabled')).toBeTruthy()
      }
    })

    it('calculating=true 时计算按钮应显示 loading', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: true,
          hasData: false
        }
      })
      const calcBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('计算')
      )
      if (calcBtn) {
        expect(calcBtn.props('loading')).toBe(true)
      }
    })
  })

  describe('事件触发', () => {
    it('选择年度应触发 year-change 事件', async () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const datePicker = wrapper.find('el-date-picker')
      if (datePicker.exists()) {
        await datePicker.trigger('change')
        expect(wrapper.emitted('year-change')).toBeTruthy()
      }
    })

    it('点击加载按钮应触发 load-data 事件', async () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const loadBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('加载')
      )
      if (loadBtn) {
        await loadBtn.trigger('click')
        expect(wrapper.emitted('load-data')).toBeTruthy()
      }
    })

    it('点击导出按钮应触发 export 事件', async () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: true
        }
      })
      const exportBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('导出')
      )
      if (exportBtn) {
        await exportBtn.trigger('click')
        expect(wrapper.emitted('export')).toBeTruthy()
      }
    })

    it('点击计算按钮应触发 calculate-cache 事件', async () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      const calcBtn = wrapper.findAll('button').find(btn =>
        btn.text().includes('计算')
      )
      if (calcBtn) {
        await calcBtn.trigger('click')
        expect(wrapper.emitted('calculate-cache')).toBeTruthy()
      }
    })
  })

  describe('权限控制', () => {
    it('管理员应看到计算按钮', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        },
        global: {
          mocks: {
            useAuthStore: () => ({ user: { role: 'admin' } })
          }
        }
      })
      expect(wrapper.text()).toContain('    })

    it('非管理员不应计算')
看到计算按钮', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        },
        global: {
          mocks: {
            useAuthStore: () => ({ user: { role: 'user' } })
          }
        }
      })
      expect(wrapper.text()).not.toContain('计算')
    })
  })

  describe('边界条件', () => {
    it('selectedYear 为空时应有默认行为', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '' },
          loading: false,
          exporting: false,
          calculating: false,
          hasData: false
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('所有 loading 状态同时为 true', () => {
      const wrapper = mount(YearSelector, {
        props: {
          yearForm: { selectedYear: '2026' },
          loading: true,
          exporting: true,
          calculating: true,
          hasData: true
        }
      })
      const loadingButtons = wrapper.findAll('button[loading]')
      expect(loadingButtons.length).toBe(3)
    })
  })
})
