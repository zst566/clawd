/**
 * 商户列表API路由
 * GET /api/v1/ticket/merchants - 获取商户列表
 */

const express = require('express');
const { success, error, page } = require('../../../utils/response');
const merchantService = require('../../../services/merchantService');

const router = express.Router();

/**
 * @route GET /api/v1/ticket/merchants
 * @desc 获取商户列表
 * @access Public
 * @query {string} categoryId - 分类ID筛选
 * @query {string} keyword - 关键词搜索（商户名称、地址）
 * @query {number} page - 页码，默认1
 * @query {number} pageSize - 每页条数，默认20
 * @query {string} sortBy - 排序方式: distance(距离)/rating(评分)/newest(最新)，默认rating
 * @query {number} lat - 用户纬度（用于距离排序）
 * @query {number} lng - 用户经度（用于距离排序）
 */
router.get('/', async (req, res) => {
  try {
    const {
      categoryId,
      keyword,
      page = 1,
      pageSize = 20,
      sortBy = 'rating',
      lat,
      lng,
    } = req.query;

    // 参数验证
    if (sortBy === 'distance' && (!lat || !lng)) {
      return res
        .status(400)
        .json(error('按距离排序需要提供经纬度参数(lat, lng)', 400));
    }

    // 页码和每页条数验证
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));

    // 允许的排序方式
    const allowedSortBy = ['distance', 'rating', 'newest'];
    const sortByValue = allowedSortBy.includes(sortBy) ? sortBy : 'rating';

    const result = await merchantService.getMerchants({
      categoryId,
      keyword,
      page: pageNum,
      pageSize: pageSizeNum,
      sortBy: sortByValue,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    });

    res.json(
      page(
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取商户列表成功'
      )
    );
  } catch (err) {
    console.error('获取商户列表失败:', err);
    res.status(500).json(error('获取商户列表失败', 500));
  }
});

module.exports = router;