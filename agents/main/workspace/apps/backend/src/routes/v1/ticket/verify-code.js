/**
 * 核销码路由
 * POST /api/v1/ticket/verify-code - 生成核销码
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../config/database');
const { 
  generateVerifyCode, 
  calculateDiscount, 
  generateQRCodeUrl 
} = require('../../services/verifyCodeService');
const { success, error } = require('../../utils/response');

/**
 * POST /api/v1/ticket/verify-code
 * 生成核销码
 * 
 * 请求体:
 * {
 *   merchantId: string,  // 商户ID
 *   ticketId: string,    // 票根ID
 *   amount: number       // 消费金额
 * }
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { merchantId, ticketId, amount } = req.body;
    const userId = req.user?.id;

    // 参数校验
    if (!merchantId || !ticketId || !amount) {
      return res.status(400).json(error('参数不完整，需要 merchantId, ticketId, amount', 400));
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json(error('金额必须大于0', 400));
    }

    // 1. 验证票根是否存在且属于当前用户
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: userId
      }
    });

    if (!ticket) {
      return res.status(404).json(error('票根不存在或不属于当前用户', 404));
    }

    // 2. 验证票根状态
    if (ticket.status !== 'valid') {
      return res.status(400).json(error(`票根状态无效，当前状态: ${ticket.status}`, 400));
    }

    // 3. 验证商户是否存在
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        discountRules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!merchant) {
      return res.status(404).json(error('商户不存在', 404));
    }

    if (merchant.status !== 'active') {
      return res.status(400).json(error('商户未营业', 400));
    }

    // 4. 检查商户是否支持该票根类型
    const supportedTypes = merchant.supportTicketTypes || [];
    if (!supportedTypes.includes(ticket.typeId)) {
      return res.status(400).json(error('该商户不支持此票根类型', 400));
    }

    // 5. 生成核销码
    const discountRule = merchant.discountRules[0] || null;
    const verifyCode = await generateVerifyCode({
      merchantId,
      ticketId,
      amount: parseFloat(amount),
      discountRule
    });

    // 6. 计算优惠金额（用于返回）
    const { discountAmount, actualPay } = calculateDiscount(parseFloat(amount), discountRule);

    // 7. 生成二维码URL
    const codeUrl = generateQRCodeUrl(verifyCode.code);

    // 8. 返回结果
    res.json(success({
      code: verifyCode.code,
      codeUrl,
      expireTime: verifyCode.expireAt.getTime(),
      amount: parseFloat(amount),
      discountAmount,
      actualPay,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        logo: merchant.logo
      }
    }, '核销码生成成功'));

  } catch (err) {
    console.error('生成核销码失败:', err);
    res.status(500).json(error('生成核销码失败，请稍后重试', 500));
  }
});

/**
 * GET /api/v1/ticket/verify-code/:code
 * 查询核销码信息（供商户扫码后查询）
 */
router.get('/verify-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { merchantId } = req.query;

    if (!code || !merchantId) {
      return res.status(400).json(error('参数不完整', 400));
    }

    const verifyCode = await prisma.verificationCode.findUnique({
      where: { code },
      include: {
        ticket: {
          include: {
            type: true
          }
        },
        merchant: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    if (!verifyCode) {
      return res.status(404).json(error('核销码不存在', 404));
    }

    // 校验商户
    if (verifyCode.merchantId !== merchantId) {
      return res.status(403).json(error('核销码不属于当前商户', 403));
    }

    // 检查状态
    if (verifyCode.status === 'verified') {
      return res.status(400).json(error('核销码已被使用', 400));
    }

    if (verifyCode.status === 'expired' || new Date() > new Date(verifyCode.expireAt)) {
      return res.status(400).json(error('核销码已过期', 400));
    }

    res.json(success({
      code: verifyCode.code,
      status: verifyCode.status,
      amount: verifyCode.amount,
      discountAmount: verifyCode.discountAmount,
      actualPay: verifyCode.actualPay,
      expireAt: verifyCode.expireAt,
      ticket: {
        id: verifyCode.ticket.id,
        name: verifyCode.ticket.name,
        type: verifyCode.ticket.type?.name,
        imageUrl: verifyCode.ticket.imageUrl
      },
      merchant: verifyCode.merchant
    }));

  } catch (err) {
    console.error('查询核销码失败:', err);
    res.status(500).json(error('查询失败', 500));
  }
});

module.exports = router;
