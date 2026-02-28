/**
 * @file test-utils.js
 * @description 测试工具函数
 */

/**
 * 模拟 API 响应
 * @param {any} data - 响应数据
 * @param {number} delay - 延迟毫秒
 * @returns {Promise} 
 */
export function mockApiResponse(data, delay = 100) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}

/**
 * 模拟 API 错误
 * @param {string} message - 错误消息
 * @param {number} delay - 延迟毫秒
 * @returns {Promise} 
 */
export function mockApiError(message, delay = 100) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message))
    }, delay)
  })
}

/**
 * 创建模拟的表单数据
 * @param {Object} overrides - 覆盖默认值的对象
 * @returns {Object} 模拟表单数据
 */
export function createMockFormData(overrides = {}) {
  return {
    campus_id: 'campus-1',
    receipt_type: 'normal',
    student: {
      name: '测试学生',
      phone: '13800138000',
      gender: 'male'
    },
    classes: [
      {
        grade: '初一',
        grade_id: 1,
        subject_id: 1,
        subject_code: 'math',
        level: '提高班',
        level_code: 'advanced',
        class_type_code: 'regular',
        class_type: '常规班',
        class_name: '校区A初一数学提高班',
        sessions: 10,
        unit_price: 150,
        material_fee: 200,
        material_fee_mode: 'default',
        material_fee_multiplier: 1,
        discount: 100,
        deduction: 0
      }
    ],
    payment_method: '微信',
    payment_transaction_number: 'TXN12345678901234567890',
    payment_date: '2026-02-28',
    ...overrides
  }
}

/**
 * 创建模拟的用户数据
 * @param {Object} overrides - 覆盖默认值的对象
 * @returns {Object} 模拟用户数据
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    name: '测试用户',
    role: 'consultant',
    campus_id: 'campus-1',
    campus_name: '测试校区',
    ...overrides
  }
}

/**
 * 创建模拟的Dashboard汇总数据
 * @returns {Object} 模拟Dashboard数据
 */
export function createMockDashboardSummary() {
  return {
    latestMonth: '2026-01',
    yearReceipt: 1000000,  // 分
    yearRefund: 50000,     // 分
    yearRevenue: 800000,   // 分
    latestBalance: 5000000, // 分
    totalOrderCount: 100,
    jiaoWu2OrderCount: 60,
    jiaoWu3OrderCount: 40,
    yearReceiptMomDiff: 100000,
    yearRefundMomDiff: -5000,
    yearRevenueMomDiff: 80000,
    latestBalanceMomDiff: 200000,
    prevMonthBalance: 4800000,
    prevMonthBalanceEstimated: false,
    databaseKey: 'test_db',
    databaseName: 'rde_test',
    databaseHost: 'localhost',
    databasePort: 3306,
    statTime: '2026-02-28 10:00:00'
  }
}

/**
 * 创建模拟的月度数据
 * @param {number} year - 年份
 * @returns {Array} 月度数据数组
 */
export function createMockMonthlyData(year = 2026) {
  const months = []
  for (let i = 1; i <= 12; i++) {
    const month = String(i).padStart(2, '0')
    months.push({
      month: `${year}-${month}`,
      monthOrderCount: Math.floor(Math.random() * 50) + 10,
      monthReceipt: Math.floor(Math.random() * 500000) + 100000,
      monthReceiptBalance: Math.floor(Math.random() * 300000) + 50000,
      monthReceiptNonBalance: Math.floor(Math.random() * 200000) + 50000,
      monthRefund: Math.floor(Math.random() * 50000),
      monthRefundBalance: Math.floor(Math.random() * 30000),
      monthRefundNonBalance: Math.floor(Math.random() * 20000),
      monthRevenue: Math.floor(Math.random() * 400000) + 80000,
      monthBalance: Math.floor(Math.random() * 1000000) + 500000,
      monthReceivableNonAmortizable: Math.floor(Math.random() * 50000)
    })
  }
  return months
}

/**
 * 模拟 localStorage
 * @returns {Object} localStorage 模拟
 */
export function createMockLocalStorage() {
  const storage = {}
  return {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => { storage[key] = value },
    removeItem: (key) => { delete storage[key] },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]) }
  }
}

/**
 * 模拟 sessionStorage
 * @returns {Object} sessionStorage 模拟
 */
export function createMockSessionStorage() {
  return createMockLocalStorage()
}

/**
 * 模拟 Vue Router
 * @param {Object} options - 配置选项
 * @returns {Object} Vue Router 模拟
 */
export function createMockRouter(options = {}) {
  return {
    push: async (to) => {
      if (options.onPush) options.onPush(to)
    },
    replace: async (to) => {
      if (options.onReplace) options.onReplace(to)
    },
    back: async () => {
      if (options.onBack) options.onBack()
    },
    currentRoute: {
      value: {
        path: options.path || '/',
        name: options.name || 'dashboard',
        ...options.route
      }
    }
  }
}

/**
 * 模拟 Element Plus ElMessage
 * @returns {Object} ElMessage 模拟
 */
export function createMockElMessage() {
  return {
    success: () => {},
    warning: () => {},
    error: () => {},
    info: () => {}
  }
}

/**
 * 模拟 Pinia Store
 * @param {Object} state - 初始状态
 * @returns {Object} Store 模拟
 */
export function createMockStore(state = {}) {
  const store = { ...state }
  return {
    useStore: () => store,
    state: store,
    $patch: (partial) => {
      Object.assign(store, partial)
    },
    $reset: () => {
      Object.keys(state).forEach(key => {
        store[key] = state[key]
      })
    }
  }
}

/**
 * 等待指定时间
 * @param {number} ms - 毫秒
 * @returns {Promise}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟 DOM 元素
 * @param {string} tagName - 标签名
 * @param {Object} attributes - 属性
 * @returns {HTMLElement} 模拟元素
 */
export function createMockElement(tagName = 'div', attributes = {}) {
  const element = {
    tagName: tagName.toUpperCase(),
    attributes: {},
    children: [],
    textContent: '',
    innerHTML: '',
    
    // DOM 方法
    getAttribute: (name) => attributes[name] || null,
    setAttribute: (name, value) => { attributes[name] = value },
    removeAttribute: (name) => { delete attributes[name] },
    appendChild: (child) => { element.children.push(child) },
    removeChild: (child) => {
      const index = element.children.indexOf(child)
      if (index > -1) element.children.splice(index, 1)
      return child
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    style: {},
    getBoundingClientRect: () => ({
      top: 0,
      left: 0,
      width: 100,
      height: 100
    }),
    scrollIntoView: () => {},
    focus: () => {},
    blur: () => {}
  }
  
  // 复制 attributes
  Object.keys(attributes).forEach(key => {
    element.attributes[key] = attributes[key]
  })
  
  return element
}

/**
 * 模拟 fetch API
 * @param {Object} handlers - 响应处理器映射
 * @returns {Function} 模拟 fetch
 */
export function createMockFetch(handlers = {}) {
  return async (url, options) => {
    const handler = handlers[url]
    if (handler) {
      return handler(url, options)
    }
    throw new Error(`No handler for ${url}`)
  }
}

/**
 * 断言辅助函数
 */
export const assert = {
  /**
   * 断言值为真
   */
  isTrue: (value, message = '') => {
    if (!value) throw new Error(`Expected true but got ${value}. ${message}`)
  },
  
  /**
   * 断言值为假
   */
  isFalse: (value, message = '') => {
    if (value) throw new Error(`Expected false but got ${value}. ${message}`)
  },
  
  /**
   * 断言值相等
   */
  equals: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but got ${actual}. ${message}`)
    }
  },
  
  /**
   * 断言值不为空
   */
  isNotEmpty: (value, message = '') => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`Expected non-empty value but got ${value}. ${message}`)
    }
  },
  
  /**
   * 断言函数抛出错误
   */
  throws: (fn, message = '') => {
    try {
      fn()
      throw new Error(`Expected function to throw but it didn't. ${message}`)
    } catch (e) {
      if (e.message.includes('Expected function to throw')) throw e
    }
  }
}
