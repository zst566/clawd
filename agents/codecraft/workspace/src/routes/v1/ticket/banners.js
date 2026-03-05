/**
 * Banner轮播图API路由
 * GET /api/v1/ticket/banners - 获取Banner列表
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../../../utils/response');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/ticket/banners
 * @desc 获取Banner列表
 * @access Public
 *
 * Query参数:
 * - position: 位置筛选（可选）
 * - limit: 返回数量限制，默认10
 * - onlyActive: 只返回有效的，默认true
 */
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 10, 
      onlyActive = 'true',
    } = req.query;

    // 参数转换
    const take = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    // 构建查询条件
    const where = {};

    // 只返回有效的Banner
    if (onlyActive === 'true') {
      where.isActive = true;
      
      // 检查时间范围
      const now = new Date();
      where.AND = [
        {
          OR: [
            { startTime: null },
            { startTime: { lte: now } },
          ],
        },
        {
          OR: [
            { endTime: null },
            { endTime: { gte: now } },
          ],
        },
      ];
    }

    // 查询Banner列表
    const banners = await prisma.banner.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
      take,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        sortOrder: true,
        isActive: true,
        startTime: true,
        endTime: true,
      },
    });

    // 格式化响应数据
    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      sortOrder: banner.sortOrder,
    }));

    res.json(success(formattedBanners, '获取Banner列表成功'));
  } catch (err) {
    console.error('获取Banner列表失败:', err);
    res.status(500).json(error('获取Banner列表失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/banners/:id
 * @desc 获取单个Banner详情
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        sortOrder: true,
        isActive: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!banner) {
      return res.status(404).json(error('Banner不存在', 404));
    }

    res.json(success(banner, '获取Banner详情成功'));
  } catch (err) {
    console.error('获取Banner详情失败:', err);
    res.status(500).json(error('获取Banner详情失败', 500));
  }
});

module.exports = router;
