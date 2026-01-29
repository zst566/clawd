# API接口文档

## 一、基础信息

### 1.1 接口基础
```
Base URL: /api/v1
Content-Type: application/json
认证方式: Bearer Token
```

### 1.2 通用响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 1.3 错误码说明
```
200     成功
400     请求参数错误
401     未登录或token过期
403     无权限
404     资源不存在
500     服务器错误
```

---

## 二、认证模块 /auth

### 2.1 登录
```typescript
POST /auth/login
Body: {
  phone: string,      // 手机号
  code: string        // 验证码
}
Response: {
  token: string,
  user: {
    id: number,
    nickname: string,
    avatar: string
  }
}
```

### 2.2 获取验证码
```typescript
POST /auth/send-code
Body: {
  phone: string       // 手机号
}
```

### 2.3 获取用户信息
```typescript
GET /auth/profile
Headers: { Authorization: "Bearer xxx" }
Response: {
  id: number,
  phone: string,
  nickname: string,
  avatar: string,
  created_at: string
}
```

---

## 三、Banner模块 /banners

### 3.1 Banner列表
```typescript
GET /banners
Query: {
  type?: string,      // Banner类型
  status?: number,    // 状态
  page?: number,      // 页码
  limit?: number      // 每页数量
}
Response: {
  list: [{
    id: number,
    title: string,
    image_url: string,
    link_type: string,
    link_value: string,
    sort: number,
    status: number,
    start_time: string,
    end_time: string
  }],
  total: number
}
```

### 3.2 创建Banner
```typescript
POST /banners
Body: {
  title: string,
  image_url: string,
  link_type?: string,
  link_value?: string,
  sort?: number,
  status?: number,
  start_time?: string,
  end_time?: string
}
```

### 3.3 更新Banner
```typescript
PUT /banners/:id
Body: 同创建接口
```

### 3.4 删除Banner
```typescript
DELETE /banners/:id
```

---

## 四、景点模块 /attractions

### 4.1 景点列表
```typescript
GET /attractions
Query: {
  category?: string,      // 分类code
  level?: string,         // 级别
  keyword?: string,       // 关键词
  lat?: number,           // 纬度（计算距离）
  lng?: number,           // 经度
  page?: number,
  limit?: number
}
Response: {
  list: [{
    id: number,
    name: string,
    level: string,
    category_name: string,
    address: string,
    cover_image: string,
    rating: number,
    distance?: number,    // 距用户距离(km)
    review_count: number
  }],
  total: number
}
```

### 4.2 景点详情
```typescript
GET /attractions/:id
Response: {
  id: number,
  name: string,
  name_en: string,
  level: string,
  category_id: number,
  category_name: string,
  address: string,
  longitude: number,
  latitude: number,
  cover_image: string,
  description: string,
  tips: string,
  rating: number,
  review_count: number,
  images: [{
    id: number,
    url: string,
    type: string
  }],
  hours: [{
    day_of_week: number,
    open_time: string,
    close_time: string,
    last_entry_time: string,
    status: number
  }],
  tags: string[]
}
```

### 4.3 景点分类列表
```typescript
GET /attraction-categories
Response: [{
  id: number,
  name: string,
  code: string,
  icon: string
}]
```

### 4.4 创建景点
```typescript
POST /attractions
Body: {
  name: string,
  name_en?: string,
  level: string,
  category_id: number,
  province: string,
  city: string,
  district: string,
  address: string,
  longitude: number,
  latitude: number,
  cover_image: string,
  description?: string,
  tips?: string
}
```

### 4.5 更新景点
```typescript
PUT /attractions/:id
Body: 同创建接口
```

### 4.6 删除景点
```typescript
DELETE /attractions/:id
```

---

## 五、民宿模块 /homestays

### 5.1 民宿列表
```typescript
GET /homestays
Query: {
  keyword?: string,
  min_price?: number,
  max_price?: number,
  facilities?: string[],  // 设施标签
  lat?: number,
  lng?: number,
  page?: number,
  limit?: number
}
Response: {
  list: [{
    id: number,
    name: string,
    address: string,
    cover_image: string,
    rating: number,
    price_from: number,
    facilities: string[],
    distance?: number
  }],
  total: number
}
```

### 5.2 民宿详情
```typescript
GET /homestays/:id
Response: {
  id: number,
  name: string,
  address: string,
  longitude: number,
  latitude: number,
  cover_image: string,
  description: string,
  facilities: string[],
  rating: number,
  review_count: number,
  images: [{
    id: number,
    url: string
  }],
  rooms: [{
    id: number,
    name: string,
    price: number,
    stock: number,
    max_occupancy: number,
    bed_type: string,
    area: number,
    images: string[],
    facilities: string[]
  }]
}
```

### 5.3 民宿评价列表
```typescript
GET /homestays/:id/reviews
Query: {
  page?: number,
  limit?: number
}
Response: {
  list: [{
    id: number,
    user_id: number,
    nickname: string,
    avatar: string,
    rating: number,
    content: string,
    images: string[],
    created_at: string
  }],
  total: number,
  average_rating: number
}
```

### 5.4 创建民宿
```typescript
POST /homestays
Body: {
  name: string,
  province: string,
  city: string,
  district: string,
  address: string,
  longitude: number,
  latitude: number,
  cover_image: string,
  description?: string,
  facilities?: string[]
}
```

---

## 六、拼车模块 /carpool

### 6.1 上车点列表
```typescript
GET /carpool/locations
Query: {
  type?: string,    // 类型
  status?: number
}
Response: [{
  id: number,
  name: string,
  type: string,
  address: string,
  longitude: number,
  latitude: number
}]
```

### 6.2 目的地列表
```typescript
GET /carpool/destinations
Query: {
  type?: string,
  status?: number
}
Response: 同上车点列表
```

### 6.3 高铁班次列表
```typescript
GET /carpool/schedules
Query: {
  date?: string     // 日期，格式：YYYY-MM-DD
}
Response: [{
  id: number,
  train_no: string,
  departure_station: string,
  arrival_station: string,
  departure_time: string,
  arrival_time: string
}]
```

### 6.4 发起拼车
```typescript
POST /carpool/orders
Headers: { Authorization: "Bearer xxx" }
Body: {
  location_id: number,
  destination_id: number,
  schedule_id: number,
  train_date: string,       // 高铁日期
  passenger_count: number,
  contact_name: string,
  contact_phone: string,
  remark?: string
}
Response: {
  order_id: number,
  order_no: string,
  status: number,
  estimated_price: number
}
```

### 6.5 订单详情
```typescript
GET /carpool/orders/:id
Headers: { Authorization: "Bearer xxx" }
Response: {
  id: number,
  order_no: string,
  status: number,
  location_name: string,
  destination_name: string,
  train_no: string,
  departure_time: string,
  passenger_count: number,
  contact_name: string,
  contact_phone: string,
  total_amount: number,
  vehicle?: {
    id: number,
    model: string,
    plate_number: string
  },
  driver?: {
    id: number,
    name: string,
    phone: string
  },
  pickup_time?: string,
  estimated_arrival?: string,
  created_at: string
}
```

### 6.6 我的订单列表
```typescript
GET /carpool/orders
Headers: { Authorization: "Bearer xxx" }
Query: {
  status?: number,    // 订单状态
  page?: number,
  limit?: number
}
Response: {
  list: [{
    id: number,
    order_no: string,
    status: number,
    location_name: string,
    destination_name: string,
    departure_time: string,
    passenger_count: number,
    total_amount: number,
    created_at: string
  }],
  total: number
}
```

### 6.7 取消订单
```typescript
POST /carpool/orders/:id/cancel
Headers: { Authorization: "Bearer xxx" }
Body: {
  reason: string
}
```

### 6.8 发起支付
```typescript
POST /carpool/orders/:id/pay
Headers: { Authorization: "Bearer xxx" }
Body: {
  payment_method: string   // wechat/alipay
}
Response: {
  payment_params: object,  // 支付参数
  pay_url: string          // 支付链接（HTML5）
}
```

### 6.9 支付回调
```typescript
POST /carpool/payment/notify
Body: {
  order_no: string,
  transaction_no: string,
  amount: number,
  status: number
}
```

---

## 七、资讯模块 /articles

### 7.1 资讯列表
```typescript
GET /articles
Query: {
  category?: string,
  page?: number,
  limit?: number
}
Response: {
  list: [{
    id: number,
    title: string,
    cover_image: string,
    category: string,
    summary: string,
    view_count: number,
    published_at: string
  }],
  total: number
}
```

### 7.2 资讯详情
```typescript
GET /articles/:id
Response: {
  id: number,
  title: string,
  cover_image: string,
  category: string,
  content: string,
  view_count: number,
  published_at: string
}
```

---

## 八、用户模块 /users

### 8.1 我的信息
```typescript
GET /users/profile
Headers: { Authorization: "Bearer xxx" }
Response: {
  id: number,
  phone: string,
  nickname: string,
  avatar: string
}
```

### 8.2 更新信息
```typescript
PUT /users/profile
Headers: { Authorization: "Bearer xxx" }
Body: {
  nickname?: string,
  avatar?: string
}
```

---

## 九、管理端API（需管理员权限）

### 9.1 创建景点
```typescript
POST /admin/attractions
Headers: { Authorization: "Bearer xxx", "X-Admin-Role": "admin" }
Body: {
  name: string,
  level: string,
  category_id: number,
  // ... 其他字段
}
```

### 9.2 批量操作
```typescript
POST /admin/batch/delete
Headers: { Authorization: "Bearer xxx", "X-Admin-Role": "admin" }
Body: {
  ids: number[],
  type: string   // attractions/homestays/articles
}
```

### 9.3 数据统计
```typescript
GET /admin/stats
Headers: { Authorization: "Bearer xxx", "X-Admin-Role": "admin" }
Query: {
  start_date?: string,
  end_date?: string
}
Response: {
  attraction_count: number,
  homestay_count: number,
  order_count: number,
  revenue: number
}
```
