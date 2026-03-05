/**
 * 票根类型API路由
 * GET /api/v1/ticket/types - 获取票根类型列表
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../../../utils/response');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/ticket/types
 * @desc 获取票根类型列表
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // 获取查询参数
    const { active = 'true' } = req.query;

    // 构建查询条件
    const where = {};
    if (active === 'true') {
      where.isActive = true;
    }

    // 查询票根类型列表
    const ticketTypes = await prisma.ticketType.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
    });

    // 格式化响应数据
    const formattedTypes = ticketTypes.map(type => ({
      id: type.id,
      code: type.code,
      name: type.name,
      icon: type.icon,
      description: type.description,
      sortOrder: type.sortOrder,
      isActive: type.isActive,
    }));

    res.json(success(formattedTypes, '获取票根类型列表成功'));
  } catch (err) {
    console.error('获取票根类型列表失败:', err);
    res.status(500).json(error('获取票根类型列表失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/types/:code
 * @desc 获取单个票根类型详情
 * @access Public
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const ticketType = await prisma.ticketType.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        icon: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
    });

    if (!ticketType) {
      return res.status(404).json(error('票根类型不存在', 404));
    }

    res.json(success(ticketType, '获取票根类型详情成功'));
  } catch (err) {
    console.error('获取票根类型详情失败:', err);
    res.status(500).json(error('获取票根类型详情失败', 500));
  }
});

module.exports = router;
