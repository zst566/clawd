/**
 * 核销码生成API路由
 * POST /api/v1/ticket/verify-code - 生成核销码
 * GET /api/v1/ticket/verify-code/:ticketId - 获取票根的核销码列表
 */

const express = require('express');
const { success, error, created } = require('../../../utils/response');
const verifyCodeService = require('../../../services/verifyCodeService');

const router = express.Router();

/**
 * @route POST /api/v1/ticket/verify-code
 * @desc 为票根生成核销码
 * @access Private
 *
 * Body参数:
 * - ticketId: 票根ID（必填）
 */
router.post('/', async (req, res) => {
  try {
    const { ticketId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    // 参数验证
    if (!ticketId) {
      return res.status(400).json(error('票根ID不能为空', 400));
    }

    // 检查是否可以生成
    const check = await verifyCodeService.canGenerateCode(ticketId, userId);
    
    if (!check.canGenerate) {
      return res.status(400).json(error(check.reason, 400));
    }

    // 生成核销码
    const result = await verifyCodeService.generateVerifyCode(ticketId, userId);

    res.status(201).json(created({
      verifyCode: result.verifyCode,
      discountAmount: result.discountAmount,
      expireAt: result.expireAt,
      ticketName: result.ticketName,
      ticketType: result.ticketType,
      expireMinutes: verifyCodeService.CONFIG.CODE_EXPIRE_MINUTES,
    }, '核销码生成成功'));
  } catch (err) {
    console.error('生成核销码失败:', err);
    res.status(500).json(error(err.message || '生成核销码失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/verify-code/check/:ticketId
 * @desc 检查票根是否可以生成核销码
 * @access Private
 */
router.get('/check/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    const check = await verifyCodeService.canGenerateCode(ticketId, userId);

    res.json(success({
      canGenerate: check.canGenerate,
      reason: check.reason || null,
      remainingChances: check.canGenerate 
        ? verifyCodeService.CONFIG.MAX_CODES_PER_TICKET - check.existingCodesCount 
        : 0,
      maxChances: verifyCodeService.CONFIG.MAX_CODES_PER_TICKET,
    }, check.canGenerate ? '可以生成核销码' : check.reason));
  } catch (err) {
    console.error('检查核销码生成条件失败:', err);
    res.status(500).json(error('检查失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/verify-code/:ticketId
 * @desc 获取票根的核销码列表
 * @access Private
 */
router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    const codes = await verifyCodeService.getTicketVerifyCodes(ticketId, userId);

    res.json(success(codes, '获取核销码列表成功'));
  } catch (err) {
    console.error('获取核销码列表失败:', err);
    res.status(500).json(error(err.message || '获取核销码列表失败', 500));
  }
});

/**
 * @route POST /api/v1/ticket/verify-code/validate
 * @desc 验证核销码（商家端接口）
 * @access Public（实际项目中需要商家认证）
 *
 * Body参数:
 * - verifyCode: 核销码（必填）
 */
router.post('/validate', async (req, res) => {
  try {
    const { verifyCode } = req.body;

    if (!verifyCode) {
      return res.status(400).json(error('核销码不能为空', 400));
    }

    // 格式化核销码（转大写，去除空格）
    const formattedCode = verifyCode.toUpperCase().replace(/\s/g, '');

    const validation = await verifyCodeService.validateVerifyCode(formattedCode);

    if (!validation.valid) {
      return res.status(400).json(error(validation.reason, 400));
    }

    res.json(success({
      valid: true,
      verifyCode: formattedCode,
      discountAmount: validation.discountAmount,
      ticketName: validation.ticketName,
      ticketType: validation.ticketType,
      userNickname: validation.userNickname,
      userPhone: validation.userPhone,
    }, '核销码验证成功'));
  } catch (err) {
    console.error('验证核销码失败:', err);
    res.status(500).json(error('验证失败', 500));
  }
});

/**
 * @route POST /api/v1/ticket/verify-code/use
 * @desc 确认核销（商家端接口）
 * @access Public（实际项目中需要商家认证）
 *
 * Body参数:
 * - verifyCode: 核销码（必填）
 * - merchantId: 商家ID（可选）
 */
router.post('/use', async (req, res) => {
  try {
    const { verifyCode, merchantId } = req.body;

    if (!verifyCode) {
      return res.status(400).json(error('核销码不能为空', 400));
    }

    // 格式化核销码
    const formattedCode = verifyCode.toUpperCase().replace(/\s/g, '');

    const result = await verifyCodeService.useVerifyCode(formattedCode, merchantId);

    res.json(success({
      verifyCode: result.verifyCode,
      discountAmount: result.discountAmount,
      usedAt: result.usedAt,
    }, '核销成功'));
  } catch (err) {
    console.error('核销失败:', err);
    
    if (err.message === '核销码不存在' || 
        err.message === '核销码已过期' || 
        err.message === '核销码已使用') {
      return res.status(400).json(error(err.message, 400));
    }
    
    res.status(500).json(error('核销失败', 500));
  }
});

module.exports = router;
