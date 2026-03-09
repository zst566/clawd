import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ZombieOrderPanel from '../views/Dashboard/components/ZombieOrderPanel.vue'

describe('ZombieOrderPanel 组件测试', () => {

  describe('基础渲染', () => {
    it('未扫描时不显示结果区域', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: false,
          stats: [],
          downloading: null
        }
      })
      expect(wrapper.find('.zombie-result-section').exists()).toBe(false)
    })

    it('scanned=true 且无数据时不显示结果', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [],
          downloading: null
        }
      })
      expect(wrapper.find('.zombie-result-section').exists()).toBe(false)
    })
  })

  describe('结果展示', () => {
    it('scanned=true 且有数据时应显示结果', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      expect(wrapper.find('.zombie-result-section').exists()).toBe(true)
    })

    it('应正确显示年份', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      expect(wrapper.text()).toContain('2025')
    })

    it('应正确显示订单数量', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      expect(wrapper.text()).toContain('10')
    })

    it('应正确计算余额(元)', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      // totalBalance 是分，除以100转为元
      expect(wrapper.text()).toContain('500.00')
    })

    it('orderCount > 0 时应有危险样式', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      const countSpan = wrapper.find('span.text-danger')
      expect(countSpan.exists()).toBe(true)
    })
  })

  describe('事件触发', () => {
    it('点击下载按钮应触发 download 事件', async () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      const downloadBtn = wrapper.find('button')
      await downloadBtn.trigger('click')
      expect(wrapper.emitted('download')).toBeTruthy()
    })

    it('download 事件应传递年份参数', async () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      const downloadBtn = wrapper.find('button')
      await downloadBtn.trigger('click')
      const emitted = wrapper.emitted('download')
      expect(emitted[0][0]).toBe(2025)
    })
  })

  describe('下载状态', () => {
    it('downloading=某年份时对应按钮应显示 loading', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 },
            { year: 2024, orderCount: 5, totalBalance: 25000 }
          ],
          downloading: 2024
        }
      })
      const loadingBtn = wrapper.find('button[loading]')
      expect(loadingBtn.exists()).toBe(true)
    })

    it('downloading=null 时无按钮显示 loading', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 }
          ],
          downloading: null
        }
      })
      const loadingBtn = wrapper.find('button[loading]')
      expect(loadingBtn.exists()).toBe(false)
    })
  })

  describe('多数据渲染', () => {
    it('应正确渲染多年份数据', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 },
            { year: 2024, orderCount: 5, totalBalance: 25000 },
            { year: 2023, orderCount: 3, totalBalance: 15000 }
          ],
          downloading: null
        }
      })
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(3)
    })

    it('应显示所有年份', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10, totalBalance: 50000 },
            { year: 2024, orderCount: 5, totalBalance: 25000 }
          ],
          downloading: null
        }
      })
      expect(wrapper.text()).toContain('2025')
      expect(wrapper.text()).toContain('2024')
    })
  })

  describe('边界条件', () => {
    it('空 stats 数组应正常渲染', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [],
          downloading: null
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('orderCount=0 时不应显示危险样式', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 0, totalBalance: 0 }
          ],
          downloading: null
        }
      })
      const dangerSpan = wrapper.find('span.text-danger')
      expect(dangerSpan.exists()).toBe(false)
    })

    it('totalBalance 为 0', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 0, totalBalance: 0 }
          ],
          downloading: null
        }
      })
      expect(wrapper.text()).toContain('0.00')
    })

    it('大数字应正确格式化', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: [
            { year: 2025, orderCount: 10000, totalBalance: 100000000 }
          ],
          downloading: null
        }
      })
      // 100000000分 = 1000000元 = 1,000,000.00
      expect(wrapper.text()).toContain('1,000,000.00')
    })
  })

  describe('Props 验证', () => {
    it('scanned 默认为 false', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          stats: [],
          downloading: null
        }
      })
      expect(wrapper.props('scanned')).toBe(false)
    })

    it('stats 默认为空数组', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          downloading: null
        }
      })
      expect(wrapper.props('stats')).toEqual([])
    })

    it('downloading 默认为 null', () => {
      const wrapper = mount(ZombieOrderPanel, {
        props: {
          scanned: true,
          stats: []
        }
      })
      expect(wrapper.props('downloading')).toBe(null)
    })
  })
})
