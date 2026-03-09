/**
 * Banner 路由
 * GET /api/v1/ticket/banners - 获取Banner列表
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../config/database');
const { success, error } = require('../../utils/response');

/**
 * GET /api/v1/ticket/banners
 * 获取Banner列表
 * 
 * 查询参数:
 * - position: Banner位置 (可选，默认 'ticket_home')
 * - limit: 返回数量限制 (可选，默认 10)
 */
router.get('/banners', async (req, res) => {
  try {
    const { 
      position = 'ticket_home',
      limit = 10
    } = req.query;

    // 查询Banner列表
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        position: position
      },
      orderBy: {
        sortOrder: 'asc'
      },
      take: parseInt(limit) || 10,
      select: {
        id: true,
        imageUrl: true,
        title: true,
        link: true,
        sortOrder: true,
        position: true,
        createdAt: true
      }
    });

    // 格式化响应数据
    const formattedBanners = banners.map(banner => ({
      id: banner.id,
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      link: banner.link || '',
      sortOrder: banner.sortOrder,
      position: banner.position
    }));

    res.json(success(formattedBanners, '获取Banner列表成功'));

  } catch (err) {
    console.error('获取Banner列表失败:', err);
    res.status(500).json(error('获取Banner列表失败', 500));
  }
});

/**
 * GET /api/v1/ticket/banners/:id
 * 获取单个Banner详情
 */
router.get('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
        title: true,
        link: true,
        sortOrder: true,
        position: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!banner) {
      return res.status(404).json(error('Banner不存在', 404));
    }

    res.json(success(banner));

  } catch (err) {
    console.error('获取Banner详情失败:', err);
    res.status(500).json(error('获取Banner详情失败', 500));
  }
});

module.exports = router;
