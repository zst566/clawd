/**
 * 商户详情API路由
 * GET /api/v1/ticket/merchant/:id - 获取商户详情
 */

const express = require('express');
const { success, error } = require('../../../utils/response');
const merchantService = require('../../../services/merchantService');

const router = express.Router();

/**
 * @route GET /api/v1/ticket/merchant/:id
 * @desc 获取商户详情（包含优惠规则）
 * @access Public
 * @param {string} id - 商户ID
 * @query {number} lat - 用户纬度（用于计算距离）
 * @query {number} lng - 用户经度（用于计算距离）
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    if (!id) {
      return res.status(400).json(error('商户ID不能为空', 400));
    }

    const merchant = await merchantService.getMerchantDetail(id, {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    });

    if (!merchant) {
      return res.status(404).json(error('商户不存在或已下架', 404));
    }

    res.json(success(merchant, '获取商户详情成功'));
  } catch (err) {
    console.error('获取商户详情失败:', err);
    res.status(500).json(error('获取商户详情失败', 500));
  }
});

module.exports = router;