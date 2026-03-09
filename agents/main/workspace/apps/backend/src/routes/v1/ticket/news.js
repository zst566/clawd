/**
 * 热点资讯路由
 * GET /api/v1/ticket/news - 获取热点资讯列表
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../config/database');
const { success, error, paginated } = require('../../utils/response');

/**
 * GET /api/v1/ticket/news
 * 获取热点资讯列表
 * 
 * 查询参数:
 * - page: 页码 (可选，默认 1)
 * - pageSize: 每页数量 (可选，默认 10)
 * - category: 分类 (可选，默认 'news')
 * - hotOnly: 是否只显示热门 (可选，默认 false)
 */
router.get('/news', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10,
      category = 'news',
      hotOnly = 'false'
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(pageSize) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where = {
      isActive: true,
      category: category,
      publishedAt: {
        lte: new Date() // 只返回已发布的
      }
    };

    // 如果只查询热门
    if (hotOnly === 'true') {
      where.isHot = true;
    }

    // 查询总数
    const total = await prisma.article.count({ where });

    // 查询列表
    const news = await prisma.article.findMany({
      where,
      orderBy: [
        { isHot: 'desc' },      // 热门优先
        { publishedAt: 'desc' } // 发布时间倒序
      ],
      skip,
      take: limitNum,
      select: {
        id: true,
        title: true,
        coverImage: true,
        summary: true,
        category: true,
        isHot: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // 格式化响应数据
    const formattedNews = news.map(item => ({
      id: item.id,
      title: item.title,
      coverImage: item.coverImage || '',
      summary: item.summary || '',
      category: item.category,
      isHot: item.isHot,
      viewCount: item.viewCount,
      publishedAt: item.publishedAt,
      date: formatDate(item.publishedAt)
    }));

    res.json(paginated(formattedNews, {
      page: pageNum,
      pageSize: limitNum,
      total
    }));

  } catch (err) {
    console.error('获取热点资讯失败:', err);
    res.status(500).json(error('获取热点资讯失败', 500));
  }
});

/**
 * GET /api/v1/ticket/news/:id
 * 获取资讯详情
 */
router.get('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { 
        id,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        content: true,
        summary: true,
        category: true,
        isHot: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!article) {
      return res.status(404).json(error('资讯不存在', 404));
    }

    // 增加浏览量（异步，不阻塞响应）
    prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    }).catch(err => console.error('增加浏览量失败:', err));

    res.json(success({
      ...article,
      date: formatDate(article.publishedAt)
    }));

  } catch (err) {
    console.error('获取资讯详情失败:', err);
    res.status(500).json(error('获取资讯详情失败', 500));
  }
});

/**
 * GET /api/v1/ticket/news/hot/list
 * 获取热门资讯（简化接口，返回前10条）
 */
router.get('/news/hot/list', async (req, res) => {
  try {
    const news = await prisma.article.findMany({
      where: {
        isActive: true,
        category: 'news',
        isHot: true,
        publishedAt: {
          lte: new Date()
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        coverImage: true,
        summary: true,
        viewCount: true,
        publishedAt: true
      }
    });

    const formattedNews = news.map(item => ({
      id: item.id,
      title: item.title,
      coverImage: item.coverImage || '',
      summary: item.summary || '',
      viewCount: item.viewCount,
      date: formatDate(item.publishedAt)
    }));

    res.json(success(formattedNews, '获取热门资讯成功'));

  } catch (err) {
    console.error('获取热门资讯失败:', err);
    res.status(500).json(error('获取热门资讯失败', 500));
  }
});

/**
 * 格式化日期
 * @param {Date} date 
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = router;
