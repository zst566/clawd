/**
 * 票根模块路由配置
 * 整合所有票根相关路由
 */

const express = require('express');
const { authMiddleware } = require('../../../middleware/auth');

// 导入子路由
const typesRouter = require('./types');
const recognizeRouter = require('./recognize');
const myTicketsRouter = require('./my-tickets');

const router = express.Router();

// 公开路由 - 票根类型查询（不需要登录）
router.use('/types', typesRouter);

// 需要认证的路由
router.use('/recognize', authMiddleware, recognizeRouter);
router.use('/my-tickets', authMiddleware, myTicketsRouter);

module.exports = router;
