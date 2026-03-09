/**
 * 商户详情API
 * GET /api/v1/ticket/merchant/:id
 */

const express = require('express');
const router = express.Router();
const { getMerchantDetail } = require('../../services/merchantService');
const { success, error } = require('../../utils/response');

/**
 * @route GET /api/v1/ticket/merchant/:id
 * @desc 获取商户详情
 * @access Public
 * 
 * 返回商户完整信息，包括:
 * - 基本信息（名称、地址、电话等）
 * - 分类信息
 * - 图片列表
 * - 优惠规则列表
 * - 员工列表
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json(error('商户ID不能为空', 400));
    }
    
    const merchant = await getMerchantDetail(id);
    
    if (!merchant) {
      return res.status(404).json(error('商户不存在', 404));
    }
    
    // 检查商户状态
    if (merchant.status !== 'active') {
      return res.status(404).json(error('商户已下线', 404));
    }
    
    res.json(success(merchant, '获取商户详情成功'));
    
  } catch (err) {
    console.error('获取商户详情失败:', err);
    res.status(500).json(error('获取商户详情失败', 500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
});

module.exports = router;
