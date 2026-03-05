/**
 * 热点资讯API路由
 * GET /api/v1/ticket/news - 获取热点资讯列表
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error, page } = require('../../../utils/response');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/v1/ticket/news
 * @desc 获取热点资讯列表
 * @access Public
 *
 * Query参数:
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认10，最大50
 * - sortBy: 排序字段（publishTime/sortOrder/viewCount），默认sortOrder
 * - sortOrder: 排序方式（asc/desc），默认desc
 * - onlyActive: 只返回有效的，默认true
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      onlyActive = 'true',
    } = req.query;

    // 参数转换
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10));
    const skip = (currentPage - 1) * limit;

    // 构建查询条件
    const where = {};

    // 只返回有效的资讯
    if (onlyActive === 'true') {
      where.isActive = true;
      where.publishTime = { lte: new Date() };
    }

    // 排序配置
    const validSortFields = ['publishTime', 'sortOrder', 'viewCount', 'createdAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'sortOrder';
    const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';

    // 查询总数
    const total = await prisma.news.count({ where });

    // 查询资讯列表
    const newsList = await prisma.news.findMany({
      where,
      orderBy: {
        [orderByField]: orderDirection,
      },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        linkUrl: true,
        source: true,
        viewCount: true,
        sortOrder: true,
        publishTime: true,
      },
    });

    // 格式化响应数据
    const formattedNews = newsList.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      source: item.source,
      viewCount: item.viewCount,
      sortOrder: item.sortOrder,
      publishTime: item.publishTime,
    }));

    // 返回分页数据
    res.json(page(
      formattedNews,
      total,
      currentPage,
      limit,
      '获取热点资讯列表成功'
    ));
  } catch (err) {
    console.error('获取热点资讯列表失败:', err);
    res.status(500).json(error('获取热点资讯列表失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/news/:id
 * @desc 获取资讯详情
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const newsItem = await prisma.news.findUnique({
      where: { id },
    });

    if (!newsItem) {
      return res.status(404).json(error('资讯不存在', 404));
    }

    // 更新浏览量（异步，不阻塞响应）
    prisma.news.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('更新浏览量失败:', err));

    // 格式化响应
    const formatted = {
      id: newsItem.id,
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      imageUrl: newsItem.imageUrl,
      linkUrl: newsItem.linkUrl,
      source: newsItem.source,
      viewCount: newsItem.viewCount + 1, // 预+1
      publishTime: newsItem.publishTime,
      createdAt: newsItem.createdAt,
    };

    res.json(success(formatted, '获取资讯详情成功'));
  } catch (err) {
    console.error('获取资讯详情失败:', err);
    res.status(500).json(error('获取资讯详情失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/news/recommend/list
 * @desc 获取推荐资讯列表（置顶/热门）
 * @access Public
 *
 * Query参数:
 * - limit: 返回数量，默认5
 */
router.get('/recommend/list', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const take = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));

    // 获取推荐资讯（排序靠前且有效的）
    const newsList = await prisma.news.findMany({
      where: {
        isActive: true,
        publishTime: { lte: new Date() },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { viewCount: 'desc' },
      ],
      take,
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        viewCount: true,
        publishTime: true,
      },
    });

    res.json(success(newsList, '获取推荐资讯成功'));
  } catch (err) {
    console.error('获取推荐资讯失败:', err);
    res.status(500).json(error('获取推荐资讯失败', 500));
  }
});

module.exports = router;
