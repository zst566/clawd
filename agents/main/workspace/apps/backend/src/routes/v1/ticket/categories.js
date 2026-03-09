/**
 * 商户分类API
 * GET /api/v1/ticket/categories
 */

const express = require('express');
const router = express.Router();
const { getMerchantCategories } = require('../../services/merchantService');
const { success, error } = require('../../utils/response');

/**
 * @route GET /api/v1/ticket/categories
 * @desc 获取商户分类列表
 * @access Public
 * 
 * 返回所有启用的商户分类，按sortOrder排序
 */
router.get('/', async (req, res) => {
  try {
    const categories = await getMerchantCategories();
    
    res.json(success(categories, '获取分类列表成功'));
  } catch (err) {
    console.error('获取商户分类列表失败:', err);
    res.status(500).json(error('获取分类列表失败', 500, 
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
});

module.exports = router;
