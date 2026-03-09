# Dashboard 组件测试计划

**创建时间**: 2026-02-28 14:40  
**测试范围**: DashboardHeader, YearSelector, ZombieOrderPanel

---

## ⚠️ 前置条件

项目未安装测试框架，需先安装：

```bash
npm install -D vitest @vue/test-utils jsdom
```

或在 package.json 添加：

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

---

## 测试文件清单

| 组件 | 测试文件 | 优先级 |
|------|---------|--------|
| DashboardHeader | DashboardHeader.spec.js | P1 |
| YearSelector | YearSelector.spec.js | P1 |
| ZombieOrderPanel | ZombieOrderPanel.spec.js | P1 |

---

## DashboardHeader.spec.js

```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardHeader from '../components/DashboardHeader.vue'

describe('DashboardHeader', () => {
  it('renders correctly', () => {
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

  it('emits refresh event', async () => {
    const wrapper = mount(DashboardHeader, {
      props: { refreshing: false }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('shows zombie warning when zombieTotalCount > 0', () => {
    const wrapper = mount(DashboardHeader, {
      props: { zombieTotalCount: 5 }
    })
    expect(wrapper.text()).toContain('僵尸订单')
  })
})
```

---

## YearSelector.spec.js

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import YearSelector from '../components/YearSelector.vue'

describe('YearSelector', () => {
  it('renders year picker', () => {
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

  it('emits year-change on year select', async () => {
    const wrapper = mount(YearSelector, {
      props: { yearForm: { selectedYear: '2026' } }
    })
    await wrapper.find('el-date-picker').trigger('change')
    expect(wrapper.emitted('year-change')).toBeTruthy()
  })
})
```

---

## ZombieOrderPanel.spec.js

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ZombieOrderPanel from '../components/ZombieOrderPanel.vue'

describe('ZombieOrderPanel', () => {
  it('shows nothing when not scanned', () => {
    const wrapper = mount(ZombieOrderPanel, {
      props: {
        scanned: false,
        stats: [],
        downloading: null
      }
    })
    expect(wrapper.find('.zombie-result-section').exists()).toBe(false)
  })

  it('shows results when scanned with stats', () => {
    const wrapper = mount(ZombieOrderPanel, {
      props: {
        scanned: true,
        stats: [{ year: 2025, orderCount: 10, totalBalance: 50000 }],
        downloading: null
      }
    })
    expect(wrapper.find('.zombie-result-section').exists()).toBe(true)
  })

  it('emits download event', async () => {
    const wrapper = mount(ZombieOrderPanel, {
      props: {
        scanned: true,
        stats: [{ year: 2025, orderCount: 10, totalBalance: 50000 }],
        downloading: null
      }
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('download')).toBeTruthy()
  })
})
```

---

## 运行测试

```bash
# 安装依赖后
npm run test:run

# 或监听模式
npm test
```

---

*测试计划创建：Guardian 🛡️*
