/**
 * Ticket API 入口文件
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ==================== 中间件配置 ====================

// 安全头
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    success: false
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ticket-api'
  });
});

// ==================== API路由 ====================

// 票根模块路由
const ticketRoutes = require('./routes/v1/ticket');
app.use('/api/v1/ticket', ticketRoutes);

// 其他模块路由可在此添加
// app.use('/api/v1/user', require('./routes/v1/user'));
// app.use('/api/v1/verify', require('./routes/v1/verify'));

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    success: false
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    success: false,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// ==================== 启动服务 ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Ticket API 服务启动成功`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
  console.log(`📋 API文档: http://localhost:${PORT}/api/v1/ticket/*`);
});

module.exports = app;
