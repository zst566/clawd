const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const Database = require('./database');
const createRouter = require('./routes');
const TelegramNotifier = require('./telegram');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/dashboard.db');

// 初始化服务
let db;
let telegram;

function init() {
  try {
    // 初始化数据库
    db = new Database(DB_PATH);
    db.init();
    db.seed();
    console.log('✅ 数据库初始化完成');

    // 初始化 Telegram 通知
    telegram = new TelegramNotifier(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID
    );
    console.log('✅ Telegram 通知服务初始化完成');

    // 中间件
    app.use(cors());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // API 路由
    app.use('/api', createRouter(db, io));

    // WebSocket 连接处理
    io.on('connection', (socket) => {
      console.log('🔌 客户端已连接:', socket.id);

      socket.on('disconnect', () => {
        console.log('🔌 客户端已断开:', socket.id);
      });

      socket.on('subscribe:project', (projectId) => {
        socket.join(`project:${projectId}`);
        console.log(`📌 客户端订阅项目: ${projectId}`);
      });

      socket.on('subscribe:workshop', () => {
        socket.join('workshop');
        console.log('📌 客户端订阅工作间');
      });
    });

    // 前端路由 fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });

    // 错误处理
    app.use((err, req, res, next) => {
      console.error('❌ 错误:', err);
      res.status(500).json({ success: false, error: '服务器内部错误' });
    });

    // 启动服务器
    server.listen(PORT, () => {
      console.log(`🚀 API 服务运行在端口 ${PORT}`);
      console.log(`🚀 WebSocket 服务已启动`);
    });

    // 启动定时任务：检查智能体心跳
    setInterval(() => {
      try {
        const stmt = db.prepare(`
          SELECT * FROM agents 
          WHERE last_seen < datetime('now', '-5 minutes') 
          AND status != 'offline'
        `);
        const inactiveAgents = stmt.all();
        
        const updateStmt = db.prepare('UPDATE agents SET status = ? WHERE id = ?');
        for (const agent of inactiveAgents) {
          updateStmt.run('offline', agent.id);
          io.emit('agent:status_changed', { agent, status: 'offline' });
          console.log(`⚠️ 智能体 ${agent.name} 已离线`);
        }
      } catch (err) {
        console.error('检查心跳错误:', err);
      }
    }, 60000);

  } catch (err) {
    console.error('❌ 初始化失败:', err);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务...');
  if (db) db.close();
  server.close(() => {
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
});

init();

module.exports = { db, telegram, io };
