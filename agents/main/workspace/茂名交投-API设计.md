# API设计文档 - 信宜文旅平台

## 一、数据库模型设计

### 现有模型（已存在）
- `User` - 用户
- `Carpool` - 拼车
- `CarpoolParticipant` - 拼车参与
- `Order` - 订单
- `SystemConfig` - 系统配置
- `CarpoolRoute` - 线路
- `CarpoolWaypoint` - 途经点
- `CarVehicle` - 车辆/车型

### 新增模型
```prisma
// ==================== 景点相关 ====================

// 景点分类
model AttractionCategory {
  id          Int      @id @default(autoincrement())
  name        String   // 分类名称：历史文化、自然风光、休闲康养、亲子研学
  icon        String?  // 图标
  sort_order  Int      @default(0)
  status      String   @default("active")
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  attractions Attraction[]
}

// 景点
model Attraction {
  id              Int      @id @default(autoincrement())
  name            String   // 景点名称
  name_en         String?  // 英文名称
  category_id     Int
  category        AttractionCategory @relation(fields: [category_id], references: [id])
  
  level           String?  // 级别：5A, 4A, 3A, other
  cover_image     String?  // 封面图
  images          String?  // 详情图JSON数组
  
  address         String?  // 地址
  latitude        Decimal? @db.Decimal(10, 6)
  longitude       Decimal? @db.Decimal(10, 6)
  
  description     String?  @db.Text // 简介
  tips            String?  @db.Text // 游玩贴士
  tips_duration   Int      @default(3) // 建议游玩时长（小时）
  
  rating          Float    @default(0) // 评分
  view_count      Int      @default(0) // 浏览量
  
  status          String   @default("active") // active/inactive
  sort_order      Int      @default(0)
  
  open_hours      OpenHour[]
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([category_id])
  @@index([status])
}

// 开放时间
model OpenHour {
  id              Int      @id @default(autoincrement())
  attraction_id   Int
  attraction      Attraction @relation(fields: [attraction_id], references: [id], onDelete: Cascade)
  
  day_of_week     Int      // 1=周一, 7=周日
  status          Int      @default(1) // 1=开放, 0=关闭
  open_time       String?  // "08:00:00"
  close_time      String?  // "18:00:00"
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([attraction_id, day_of_week])
  @@index([attraction_id])
}

// ==================== 民宿相关 ====================

// 民宿
model Homestay {
  id              Int      @id @default(autoincrement())
  name            String   // 民宿名称
  cover_image     String?  // 封面图
  images          String?  // 相册图JSON数组
  
  address         String?  // 地址
  latitude        Decimal? @db.Decimal(10, 6)
  longitude       Decimal? @db.Decimal(10, 6)
  
  description     String?  @db.Text // 简介
  facilities      String?  // 设施标签JSON数组：["WiFi", "停车", "早餐"]
  
  rating          Float    @default(0) // 评分
  view_count      Int      @default(0) // 浏览量
  
  status          String   @default("active")
  sort_order      Int      @default(0)
  
  rooms           HomestayRoom[]
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([status])
}

// 民宿房间
model HomestayRoom {
  id              Int      @id @default(autoincrement())
  homestay_id     Int
  homestay        Homestay @relation(fields: [homestay_id], references: [id], onDelete: Cascade)
  
  name            String   // 房型名称
  price           Decimal  @db.Decimal(10, 2) // 价格
  stock           Int      @default(0) // 库存
  
  bed_type        String?  // 床型：大床、双床
  area            Int?     // 面积（㎡）
  images          String?  // 房间图片JSON数组
  
  facilities      String?  // 设施JSON数组
  
  status          String   @default("active")
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([homestay_id])
  @@index([status])
}

// ==================== 资讯相关 ====================

// 文章分类
model ArticleCategory {
  id          Int      @id @default(autoincrement())
  name        String   // 分类名称：新闻、活动
  sort_order  Int      @default(0)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  articles    Article[]
}

// 文章
model Article {
  id              Int      @id @default(autoincrement())
  title           String   // 标题
  cover_image     String?  // 封面图
  summary         String?  // 摘要
  content         String   @db.LongText // 内容（HTML/Markdown）
  
  category_id     Int
  category        ArticleCategory @relation(fields: [category_id], references: [id])
  
  view_count      Int      @default(0)
  
  status          String   @default("draft") // draft/published/offline
  published_at    DateTime?
  sort_order      Int      @default(0)
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([category_id])
  @@index([status])
}
```

---

## 二、API接口设计

### 基础信息
- **Base URL**: `/api/v1`
- **认证**: JWT Token (Header: `Authorization: Bearer <token>`)
- **分页**: `?page=1&size=10`
- **响应格式**:
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

---

### 1. 景点管理 API

#### 1.1 景点分类
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/attractions/categories` | 获取分类列表 |
| POST | `/attractions/categories` | 新增分类 |
| PUT | `/attractions/categories/:id` | 更新分类 |
| DELETE | `/attractions/categories/:id` | 删除分类 |

**GET响应**:
```json
{
  "data": [
    { "id": 1, "name": "历史文化", "sort_order": 1, "status": "active" },
    { "id": 2, "name": "自然风光", "sort_order": 2, "status": "active" }
  ]
}
```

#### 1.2 景点 CRUD
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/attractions` | 景点列表（分页、筛选） |
| GET | `/attractions/:id` | 景点详情 |
| POST | `/attractions` | 新增景点 |
| PUT | `/attractions/:id` | 更新景点 |
| DELETE | `/attractions/:id` | 删除景点 |
| PUT | `/attractions/:id/status` | 上下架 |

**GET `/attractions` 参数**:
```
?page=1&size=10
&keyword=信宜     // 搜索名称
&level=4A         // 级别筛选
&category_id=1    // 分类筛选
&status=active    // 状态筛选
```

**GET `/attractions/:id` 响应**:
```json
{
  "data": {
    "id": 1,
    "name": "窦州古城",
    "name_en": "Douzhou Ancient City",
    "category": { "id": 1, "name": "历史文化" },
    "level": "4A",
    "cover_image": "https://...",
    "images": ["https://...", "https://..."],
    "address": "信宜市...",
    "latitude": 22.353333,
    "longitude": 110.943889,
    "description": "窦州古城是...",
    "tips": "建议游玩3小时\n停车方便\n...",
    "tips_duration": 3,
    "rating": 4.8,
    "view_count": 1250,
    "open_hours": [
      { "day_of_week": 1, "status": 1, "open_time": "08:00:00", "close_time": "18:00:00" },
      ...
    ],
    "status": "active",
    "sort_order": 1
  }
}
```

#### 1.3 开放时间
| 方法 | 路径 | 描述 |
|------|------|------|
| PUT | `/attractions/:id/open-hours` | 批量更新开放时间 |

**请求体**:
```json
{
  "open_hours": [
    { "day_of_week": 1, "status": 1, "open_time": "08:00:00", "close_time": "18:00:00" },
    { "day_of_week": 2, "status": 1, "open_time": "08:00:00", "close_time": "18:00:00" },
    ...
  ]
}
```

---

### 2. 民宿管理 API

#### 2.1 民宿 CRUD
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/homestays` | 民宿列表 |
| GET | `/homestays/:id` | 民宿详情 |
| POST | `/homestays` | 新增民宿 |
| PUT | `/homestays/:id` | 更新民宿 |
| DELETE | `/homestays/:id` | 删除民宿 |
| PUT | `/homestays/:id/status` | 上下架 |

**GET `/homestays` 响应**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "信宜民宿·山水间",
      "cover_image": "https://...",
      "rating": 4.9,
      "room_count": 5,
      "address": "信宜市钱排镇...",
      "status": "active",
      "sort_order": 1
    }
  ],
  "pagination": { "page": 1, "size": 10, "total": 20 }
}
```

#### 2.2 房间管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/homestays/:id/rooms` | 获取房间列表 |
| POST | `/homestays/:id/rooms` | 新增房间 |
| PUT | `/homestays/:id/rooms/:room_id` | 更新房间 |
| DELETE | `/homestays/:id/rooms/:room_id` | 删除房间 |

**POST `/homestays/:id/rooms` 请求**:
```json
{
  "name": "豪华大床房",
  "price": 288.00,
  "stock": 3,
  "bed_type": "大床",
  "area": 35,
  "images": ["https://..."],
  "facilities": ["WiFi", "空调", "热水", "电视"],
  "status": "active"
}
```

---

### 3. 资讯管理 API

#### 3.1 文章分类
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/articles/categories` | 获取分类 |
| POST | `/articles/categories` | 新增分类 |

#### 3.2 文章 CRUD
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/articles` | 文章列表 |
| GET | `/articles/:id` | 文章详情 |
| POST | `/articles` | 新增文章 |
| PUT | `/articles/:id` | 更新文章 |
| DELETE | `/articles/:id` | 删除文章 |
| PUT | `/articles/:id/status` | 上线/下线 |

**GET `/articles` 参数**:
```
?page=1&size=10
&keyword=李花节    // 搜索标题
&category=activity // 分类筛选：news/activity
&status=published  // 状态筛选
```

**GET `/articles` 响应**:
```json
{
  "data": [
    {
      "id": 1,
      "title": "2023信宜李花节即将盛大开幕",
      "cover_image": "https://...",
      "summary": "信宜李花节即将开幕...",
      "category": { "id": 1, "name": "活动" },
      "view_count": 23000,
      "published_at": "2024-01-15T10:30:00",
      "status": "published",
      "sort_order": 1
    }
  ]
}
```

---

### 4. Banner管理 API（首页配置）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/banners` | 获取Banner列表 |
| POST | `/banners` | 新增Banner |
| PUT | `/banners/:id` | 更新Banner |
| DELETE | `/banners/:id` | 删除Banner |
| PUT | `/banners/sort` | 批量更新排序 |

**POST `/banners` 请求**:
```json
{
  "title": "信宜李花节",
  "subtitle": "漫山李花等你来",
  "tagline": "2024年1-2月",
  "image": "https://...",
  "link": "/v2/articles/1",
  "effects": ["slide-up"],
  "enabled": true,
  "sort_order": 1,
  "start_time": "2024-01-01 00:00:00",
  "end_time": "2024-02-28 23:59:59"
}
```

---

### 5. 拼车相关 API（扩展）

#### 5.1 线路管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/carpool/routes` | 线路列表 |
| POST | `/carpool/routes` | 新增线路 |
| PUT | `/carpool/routes/:id` | 更新线路 |
| DELETE | `/carpool/routes/:id` | 删除线路 |

**POST `/carpool/routes` 请求**:
```json
{
  "name": "信宜→茂名",
  "waypoints": [
    { "name": "信宜汽车站", "latitude": 22.353333, "longitude": 110.943889, "sort_order": 1, "duration_to_next": 30 },
    { "name": "茂名南站", "latitude": 21.662933, "longitude": 110.925258, "sort_order": 2 }
  ]
}
```

#### 5.2 车型配置
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/carpool/vehicles` | 车型列表 |
| POST | `/carpool/vehicles` | 新增车型 |
| PUT | `/carpool/vehicles/:id` | 更新车型 |
| DELETE | `/carpool/vehicles/:id` | 删除车型 |

---

### 6. 移动端首页 API（聚合）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/mobile/home` | 获取首页完整数据 |

**GET `/mobile/home` 响应**:
```json
{
  "data": {
    "banners": [
      { "id": 1, "title": "信宜李花节", "image": "https://...", "link": "/v2/articles/1" }
    ],
    "features": [
      { "id": 1, "name": "游玩攻略", "icon": "explore", "link": "/v2/attractions" },
      { "id": 2, "name": "住在山水", "icon": "hotel", "link": "/v2/homestays" },
      { "id": 3, "name": "拼车出行", "icon": "car", "link": "/v2/carpool" }
    ],
    "recommendations": {
      "attractions": [
        { "id": 1, "name": "窦州古城", "cover_image": "https://...", "rating": 4.8 }
      ],
      "homestays": [
        { "id": 1, "name": "信宜民宿·山水间", "cover_image": "https://...", "rating": 4.9 }
      ],
      "articles": [
        { "id": 1, "title": "李花节攻略", "cover_image": "https://..." }
      ]
    }
  }
}
```

---

## 三、API与页面组件对应关系

### 移动端页面 → API
| 页面 | API调用 |
|------|---------|
| 首页 | `GET /mobile/home` |
| 景点列表 | `GET /attractions` |
| 景点详情 | `GET /attractions/:id` |
| 民宿列表 | `GET /homestays` |
| 民宿详情 | `GET /homestays/:id`（含房间） |
| 拼车列表 | `GET /carpool` |
| 发起拼车 | `POST /carpool` |
| 等待匹配 | `GET /carpool/:id/status` |
| 吃在信宜 | `GET /attractions?category=food`（或独立API） |
| 特产好礼 | `GET /products`（需新建） |
| 文旅资讯 | `GET /articles` |
| 资讯详情 | `GET /articles/:id` |
| 人工咨询 | -（静态页面） |
| 投诉建议 | `POST /feedback`（需新建） |

### PC端页面 → API
| 页面 | API调用 |
|------|---------|
| 景点管理 | `GET/POST/PUT/DELETE /attractions` |
| 民宿管理 | `GET/POST/PUT/DELETE /homestays` |
| 资讯管理 | `GET/POST/PUT/DELETE /articles` |
| 首页配置 | `GET/POST/PUT/DELETE /banners` |
| 线路配置 | `GET/POST/PUT/DELETE /carpool/routes` |
| 车辆配置 | `GET/POST/PUT/DELETE /carpool/vehicles` |
| 订单管理 | `GET /orders` |
| 用户管理 | `GET /users` |

---

## 四、开发优先级

| 优先级 | API模块 | 依赖页面 |
|--------|---------|----------|
| P0 | 景点CRUD + 开放时间 | 移动端+PC端核心 |
| P0 | 民宿CRUD + 房间 | 移动端+PC端核心 |
| P0 | 资讯CRUD | 移动端+PC端 |
| P1 | Banner管理 | 首页配置 |
| P1 | 拼车线路/车型 | 拼车功能 |
| P2 | 反馈提交 | 投诉建议页面 |
| P2 | 特产商品 | 特产页面（如有） |
