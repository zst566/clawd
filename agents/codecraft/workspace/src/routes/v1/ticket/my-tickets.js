/**
 * 我的票根API路由
 * GET /api/v1/ticket/my-tickets - 获取当前用户的票根列表
 * 支持状态筛选（valid/used/expired）和分页
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error, page } = require('../../../utils/response');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 票根状态常量
 */
const TicketStatus = {
  VALID: 'valid',
  USED: 'used',
  EXPIRED: 'expired',
};

/**
 * 格式化票根数据
 * @param {Object} ticket - 票根对象
 * @returns {Object}
 */
function formatTicket(ticket) {
  return {
    id: ticket.id,
    typeId: ticket.typeId,
    typeName: ticket.type?.name || null,
    typeCode: ticket.type?.code || null,
    typeIcon: ticket.type?.icon || null,
    name: ticket.name,
    imageUrl: ticket.imageUrl,
    status: ticket.status,
    ocrStatus: ticket.ocrStatus,
    aiRecognized: ticket.aiRecognized,
    validStart: ticket.validStart,
    validEnd: ticket.validEnd,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

/**
 * 检查票根是否过期
 * @param {Date} validEnd - 有效期结束时间
 * @returns {boolean}
 */
function isExpired(validEnd) {
  if (!validEnd) return false;
  return new Date(validEnd) < new Date();
}

/**
 * @route GET /api/v1/ticket/my-tickets
 * @desc 获取当前用户的票根列表
 * @access Private
 *
 * Query参数:
 * - status: 状态筛选（valid/used/expired/all），默认all
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20，最大50
 * - sortBy: 排序字段（createdAt/validEnd），默认createdAt
 * - sortOrder: 排序方式（asc/desc），默认desc
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    // 解析查询参数
    const {
      status = 'all',
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // 参数验证和转换
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const skip = (currentPage - 1) * limit;

    // 构建查询条件
    const where = {
      userId,
    };

    // 状态筛选
    if (status && status !== 'all') {
      if (!Object.values(TicketStatus).includes(status)) {
        return res.status(400).json(error('无效的状态参数，可选值: valid/used/expired/all', 400));
      }
      where.status = status;
    }

    // 排序配置
    const validSortFields = ['createdAt', 'validEnd', 'updatedAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // 查询总数
    const total = await prisma.ticket.count({ where });

    // 查询票根列表
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        type: {
          select: {
            id: true,
            code: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: {
        [orderByField]: orderDirection,
      },
      skip,
      take: limit,
    });

    // 更新过期票根状态（异步，不阻塞响应）
    const now = new Date();
    const expiredTickets = tickets.filter(t =>
      t.status === TicketStatus.VALID && isExpired(t.validEnd)
    );

    if (expiredTickets.length > 0) {
      // 异步更新过期票根状态
      Promise.all(
        expiredTickets.map(ticket =
          prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: TicketStatus.EXPIRED },
          })
        )
      ).catch(err => console.error('更新过期票根状态失败:', err));
    }

    // 格式化响应数据
    const formattedTickets = tickets.map(ticket => {
      const formatted = formatTicket(ticket);
      // 如果票根已过期但状态仍为valid，前端显示为expired
      if (formatted.status === TicketStatus.VALID && isExpired(formatted.validEnd)) {
        formatted.status = TicketStatus.EXPIRED;
        formatted.isActuallyExpired = true;
      }
      return formatted;
    });

    // 返回分页数据
    res.json(page(
      formattedTickets,
      total,
      currentPage,
      limit,
      '获取票根列表成功'
    ));
  } catch (err) {
    console.error('获取票根列表失败:', err);
    res.status(500).json(error('获取票根列表失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/my-tickets/stats
 * @desc 获取当前用户的票根统计
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    // 统计各状态票根数量
    const [validCount, usedCount, expiredCount, totalCount] = await Promise.all([
      prisma.ticket.count({
        where: { userId, status: TicketStatus.VALID },
      }),
      prisma.ticket.count({
        where: { userId, status: TicketStatus.USED },
      }),
      prisma.ticket.count({
        where: { userId, status: TicketStatus.EXPIRED },
      }),
      prisma.ticket.count({
        where: { userId },
      }),
    ]);

    // 计算即将过期的票根（7天内）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringSoonCount = await prisma.ticket.count({
      where: {
        userId,
        status: TicketStatus.VALID,
        validEnd: {
          lte: sevenDaysLater,
          gte: new Date(),
        },
      },
    });

    res.json(success({
      valid: validCount,
      used: usedCount,
      expired: expiredCount,
      total: totalCount,
      expiringSoon: expiringSoonCount,
    }, '获取票根统计成功'));
  } catch (err) {
    console.error('获取票根统计失败:', err);
    res.status(500).json(error('获取票根统计失败', 500));
  }
});

/**
 * @route GET /api/v1/ticket/my-tickets/:id
 * @desc 获取单个票根详情
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json(error('未授权，请先登录', 401));
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        type: {
          select: {
            id: true,
            code: true,
            name: true,
            icon: true,
            description: true,
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json(error('票根不存在', 404));
    }

    // 格式化数据
    const formatted = formatTicket(ticket);

    // 检查是否过期
    if (formatted.status === TicketStatus.VALID && isExpired(formatted.validEnd)) {
      formatted.status = TicketStatus.EXPIRED;
      formatted.isActuallyExpired = true;

      // 异步更新数据库状态
      prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.EXPIRED },
      }).catch(err => console.error('更新过期票根状态失败:', err));
    }

    res.json(success(formatted, '获取票根详情成功'));
  } catch (err) {
    console.error('获取票根详情失败:', err);
    res.status(500).json(error('获取票根详情失败', 500));
  }
});

module.exports = router;
