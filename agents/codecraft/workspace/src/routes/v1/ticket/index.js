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
const verifyCodeRouter = require('./verify-code');
const bannersRouter = require('./banners');
const newsRouter = require('./news');
const categoriesRouter = require('./categories');
const merchantsRouter = require('./merchants');
const merchantDetailRouter = require('./merchant-detail');

const router = express.Router();

// 公开路由 - 票根类型查询、Banner、热点资讯（不需要登录）
router.use('/types', typesRouter);
router.use('/banners', bannersRouter);
router.use('/news', newsRouter);

// 商户相关公开路由
router.use('/categories', categoriesRouter);
router.use('/merchants', merchantsRouter);
router.use('/merchant', merchantDetailRouter);

// 需要认证的路由
router.use('/recognize', authMiddleware, recognizeRouter);
router.use('/my-tickets', authMiddleware, myTicketsRouter);
router.use('/verify-code', authMiddleware, verifyCodeRouter);

module.exports = router;
