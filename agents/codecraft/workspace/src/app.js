/**
 * 应用主入口 - 示例配置
 * 展示如何整合票根模块路由
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 导入路由
const ticketRouter = require('./routes/v1/ticket');

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/v1/ticket', ticketRouter);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    success: false,
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
