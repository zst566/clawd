/**
 * 商户列表API
 * GET /api/v1/ticket/merchants
 */

const express = require('express');
const router = express.Router();
const { getMerchants } = require('../../services/merchantService');
const { success, error } = require('../../utils/response');

/**
 * @route GET /api/v1/ticket/merchants
 * @desc 获取商户列表（支持筛选、搜索、距离排序、分页）
 * @access Public
 * 
 * Query参数:
 * - category: 分类ID，可选
 * - keyword: 搜索关键词，可选
 * - lat: 用户纬度，可选（提供则按距离排序）
 * - lng: 用户经度，可选（提供则按距离排序）
 * - radius: 搜索半径（米），默认5000，可选
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20，最大100
 */
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      keyword, 
      lat, 
      lng, 
      radius, 
      page, 
      pageSize 
    } = req.query;
    
    // 验证经纬度格式（如果提供）
    if ((lat && !lng) || (!lat && lng)) {
      return res.status(400).json(error('经纬度必须同时提供或同时省略', 400));
    }
    
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      if (isNaN(latNum) || isNaN(lngNum)) {
        return res.status(400).json(error('经纬度格式无效', 400));
      }
      
      if (latNum < -90 || latNum > 90) {
        return res.status(400).json(error('纬度范围必须在-90到90之间', 400));
      }
      
      if (lngNum < -180 || lngNum > 180) {
        return res.status(400).json(error('经度范围必须在-180到180之间', 400));
      }
    }
    
    // 执行查询
    const result = await getMerchants({
      category,
      keyword,
      lat,
      lng,
      radius,
      page,
      pageSize
    });
    
    res.json(success({
      list: result.list,
      pagination: result.pagination
    }, '获取商户列表成功'));
    
  } catch (err) {
    console.error('获取商户列表失败:', err);
    res.status(500).json(error('获取商户列表失败', 500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    ));
  }
});

module.exports = router;
