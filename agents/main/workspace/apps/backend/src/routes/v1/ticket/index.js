/**
 * 票根模块路由聚合
 * /api/v1/ticket/*
 */

const express = require('express');
const router = express.Router();

// 导入子路由
const verifyCodeRoutes = require('./verify-code');
const bannerRoutes = require('./banners');
const newsRoutes = require('./news');

// 注册路由
router.use('/', verifyCodeRoutes);
router.use('/', bannerRoutes);
router.use('/', newsRoutes);

module.exports = router;
