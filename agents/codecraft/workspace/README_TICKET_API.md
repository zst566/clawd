# 票根模块 API 文档

## 模块概述

票根模块提供票根类型查询、OCR识别、我的票根管理等功能。

## 文件结构

```
src/
├── routes/v1/ticket/
│   ├── index.js          # 路由入口，整合所有子路由
│   ├── types.js          # 票根类型API
│   ├── recognize.js      # OCR识别API
│   └── my-tickets.js     # 我的票根API
├── services/
│   └── ocrService.js     # OCR任务处理服务
├── utils/
│   └── response.js       # 统一响应格式
└── middleware/
    ├── auth.js           # JWT认证
    └── errorHandler.js   # 错误处理
```

## API 列表

### 1. 票根类型 API

#### GET /api/v1/ticket/types
获取票根类型列表

**参数:**
- `active` (可选): 是否只返回启用的类型，默认 `true`

**响应示例:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "uuid",
      "code": "movie",
      "name": "电影票",
      "icon": "https://...",
      "description": "影院电影票",
      "sortOrder": 1,
      "isActive": true
    }
  ],
  "message": "获取票根类型列表成功",
  "success": true,
  "timestamp": 1700000000000
}
```

### 2. OCR 识别 API

#### POST /api/v1/ticket/recognize
提交OCR识别任务（需要登录）

**请求体:**
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "type": "movie"
}
```

**响应示例:**
```json
{
  "code": 201,
  "data": {
    "taskId": "uuid",
    "status": "pending",
    "message": "OCR识别任务已提交，请轮询查询结果"
  },
  "message": "OCR识别任务提交成功",
  "success": true,
  "timestamp": 1700000000000
}
```

#### GET /api/v1/ticket/recognize/:taskId
查询OCR识别结果（需要登录）

**响应示例（处理中）:**
```json
{
  "code": 200,
  "data": {
    "status": "processing",
    "message": "任务正在处理中",
    "createdAt": "2026-03-05T10:00:00Z",
    "updatedAt": "2026-03-05T10:00:05Z"
  },
  "message": "查询成功",
  "success": true
}
```

**响应示例（识别成功）:**
```json
{
  "code": 200,
  "data": {
    "status": "success",
    "ticket": {
      "id": "uuid",
      "typeId": "uuid",
      "typeName": "电影票",
      "typeCode": "movie",
      "name": "电影票-A1B2C3",
      "imageUrl": "https://...",
      "status": "valid",
      "ocrStatus": "success",
      "aiRecognized": true,
      "validStart": "2026-03-05T10:00:00Z",
      "validEnd": "2026-04-04T10:00:00Z",
      "createdAt": "2026-03-05T10:00:00Z"
    },
    "ocrResult": {
      "typeId": "uuid",
      "typeCode": "movie",
      "typeName": "电影票",
      "name": "电影票-A1B2C3",
      "date": "2026-03-05",
      "confidence": 0.95,
      "fields": {
        "venue": "万达影城",
        "seat": "5排8座",
        "price": "45.00"
      }
    }
  },
  "message": "OCR识别成功",
  "success": true
}
```

### 3. 我的票根 API

#### GET /api/v1/ticket/my-tickets
获取当前用户的票根列表（需要登录）

**查询参数:**
- `status`: 状态筛选（`valid`/`used`/`expired`/`all`），默认 `all`
- `page`: 页码，默认 1
- `pageSize`: 每页数量，默认 20，最大 50
- `sortBy`: 排序字段（`createdAt`/`validEnd`），默认 `createdAt`
- `sortOrder`: 排序方式（`asc`/`desc`），默认 `desc`

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "uuid",
        "typeId": "uuid",
        "typeName": "电影票",
        "typeCode": "movie",
        "typeIcon": "https://...",
        "name": "电影票-A1B2C3",
        "imageUrl": "https://...",
        "status": "valid",
        "ocrStatus": "success",
        "aiRecognized": true,
        "validStart": "2026-03-05T10:00:00Z",
        "validEnd": "2026-04-04T10:00:00Z",
        "createdAt": "2026-03-05T10:00:00Z",
        "updatedAt": "2026-03-05T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "获取票根列表成功",
  "success": true
}
```

#### GET /api/v1/ticket/my-tickets/stats
获取票根统计（需要登录）

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "valid": 5,
    "used": 3,
    "expired": 2,
    "total": 10,
    "expiringSoon": 1
  },
  "message": "获取票根统计成功",
  "success": true
}
```

#### GET /api/v1/ticket/my-tickets/:id
获取单个票根详情（需要登录）

**响应示例:**
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "typeId": "uuid",
    "typeName": "电影票",
    "typeCode": "movie",
    "typeIcon": "https://...",
    "name": "电影票-A1B2C3",
    "imageUrl": "https://...",
    "status": "valid",
    "ocrStatus": "success",
    "aiRecognized": true,
    "validStart": "2026-03-05T10:00:00Z",
    "validEnd": "2026-04-04T10:00:00Z",
    "createdAt": "2026-03-05T10:00:00Z",
    "updatedAt": "2026-03-05T10:00:00Z"
  },
  "message": "获取票根详情成功",
  "success": true
}
```

## OCR 异步流程说明

1. **提交任务**: 用户上传图片后，系统创建OCR任务并放入队列，立即返回 `taskId`
2. **轮询查询**: 客户端使用 `taskId` 轮询查询结果
3. **任务处理**: 后台Worker从队列取出任务，调用OCR服务进行识别
4. **结果返回**: 识别完成后，客户端下次轮询会收到完整结果并自动创建票根记录

## 启动步骤

1. 安装依赖:
```bash
npm install
```

2. 配置环境变量:
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库和Redis
```

3. 初始化数据库:
```bash
npx prisma migrate dev
npx prisma generate
```

4. 启动服务:
```bash
npm run dev
```

## 注意事项

1. OCR识别是异步流程，提交后需要轮询查询结果
2. 票根有效期默认为30天，过期后状态自动变为 `expired`
3. 图片大小限制为5MB，支持jpg/png/webp格式
