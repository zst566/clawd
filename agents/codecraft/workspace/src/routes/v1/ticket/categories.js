/**
 * 商户分类API路由
 * GET /api/v1/ticket/categories - 获取商户分类列表
 */

const express = require('express');
const { success, error } = require('../../../utils/response');
const merchantService = require('../../../services/merchantService');

const router = express.Router();

/**
 * @route GET /api/v1/ticket/categories
 * @desc 获取商户分类列表
 * @access Public
 * @query {boolean} all - 是否返回所有分类（包括禁用的）
 */
router.get('/', async (req, res) => {
  try {
    const { all = 'false' } = req.query;

    const categories = await merchantService.getCategories({
      activeOnly: all !== 'true',
    });

    res.json(success(categories, '获取商户分类列表成功'));
  } catch (err) {
    console.error('获取商户分类列表失败:', err);
    res.status(500).json(error('获取商户分类列表失败', 500));
  }
});

module.exports = router;