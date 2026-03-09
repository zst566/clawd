/**
 * 商户查询服务
 * 提供商户列表查询、距离计算、筛选等功能
 */

const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 构建商户查询条件
 * @param {Object} params - 查询参数
 * @param {string} params.category - 分类ID
 * @param {string} params.keyword - 关键词
 * @returns {Object} Prisma where条件
 */
function buildMerchantWhere(params) {
  const { category, keyword } = params;
  const where = { status: 'active' };
  
  if (category) {
    where.categoryId = category;
  }
  
  if (keyword && keyword.trim()) {
    where.name = {
      contains: keyword.trim()
    };
  }
  
  return where;
}

/**
 * 计算分页参数
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} { skip, take }
 */
function buildPagination(page, pageSize) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
  
  return {
    skip: (validPage - 1) * validPageSize,
    take: validPageSize,
    page: validPage,
    pageSize: validPageSize
  };
}

/**
 * 获取商户列表（支持距离排序）
 * @param {Object} params - 查询参数
 * @param {string} params.category - 分类ID
 * @param {string} params.keyword - 关键词
 * @param {number} params.lat - 纬度
 * @param {number} params.lng - 经度
 * @param {number} params.radius - 搜索半径（米），默认5000
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} { list, pagination }
 */
async function getMerchants(params) {
  const { category, keyword, lat, lng, radius = 5000, page, pageSize } = params;
  
  const pagination = buildPagination(page, pageSize);
  
  // 有地理位置时，使用Haversine公式按距离排序
  if (lat && lng) {
    return getMerchantsByDistance({
      category,
      keyword,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: parseInt(radius) || 5000,
      ...pagination
    });
  }
  
  // 无地理位置时，按推荐排序
  return getMerchantsByRecommendation({
    category,
    keyword,
    ...pagination
  });
}

/**
 * 按距离获取商户列表
 * @private
 */
async function getMerchantsByDistance(params) {
  const { category, keyword, lat, lng, radius, skip, take, page, pageSize } = params;
  
  // 构建WHERE条件
  let whereClause = Prisma.sql`status = 'active'`;
  
  if (category) {
    whereClause = Prisma.sql`${whereClause} AND categoryId = ${category}`;
  }
  
  if (keyword && keyword.trim()) {
    whereClause = Prisma.sql`${whereClause} AND name LIKE ${`%${keyword.trim()}%`}`;
  }
  
  // 使用Haversine公式计算距离
  // 6371是地球半径（公里），计算结果单位为公里
  const merchants = await prisma.$queryRaw`
    SELECT 
      m.*,
      c.name as categoryName,
      c.icon as categoryIcon,
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(${lng})) + 
        sin(radians(${lat})) * sin(radians(latitude))
      )) AS distance
    FROM Merchant m
    LEFT JOIN MerchantCategory c ON m.categoryId = c.id
    WHERE ${whereClause}
    HAVING distance <= ${radius / 1000}
    ORDER BY distance ASC
    LIMIT ${take} OFFSET ${skip}
  `;
  
  // 获取总数（使用子查询保证条件一致）
  const countResult = await prisma.$queryRaw`
    SELECT COUNT(*) as total FROM (
      SELECT 
        m.id,
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(${lng})) + 
          sin(radians(${lat})) * sin(radians(latitude))
        )) AS distance
      FROM Merchant m
      WHERE ${whereClause}
      HAVING distance <= ${radius / 1000}
    ) as filtered
  `;
  
  const total = parseInt(countResult[0]?.total || 0);
  
  // 转换距离单位并格式化数据
  const formattedMerchants = merchants.map(m => ({
    ...m,
    distance: m.distance ? Math.round(m.distance * 1000) : null, // 转为米
    distanceText: m.distance 
      ? m.distance < 1 
        ? `${Math.round(m.distance * 1000)}m` 
        : `${m.distance.toFixed(1)}km`
      : null,
    category: m.categoryName ? {
      id: m.categoryId,
      name: m.categoryName,
      icon: m.categoryIcon
    } : null
  }));
  
  return {
    list: formattedMerchants,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * 按推荐度获取商户列表
 * @private
 */
async function getMerchantsByRecommendation(params) {
  const { category, keyword, skip, take, page, pageSize } = params;
  
  const where = buildMerchantWhere({ category, keyword });
  
  const [merchants, total] = await Promise.all([
    prisma.merchant.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        discountRules: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            value: true,
            title: true,
            description: true,
            applyTicketTypes: true
          }
        }
      },
      orderBy: [
        { isRecommended: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take
    }),
    prisma.merchant.count({ where })
  ]);
  
  return {
    list: merchants,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * 获取商户详情
 * @param {string} merchantId - 商户ID
 * @returns {Promise<Object|null>} 商户详情或null
 */
async function getMerchantDetail(merchantId) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true
        }
      },
      images: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          sortOrder: true
        }
      },
      discountRules: {
        where: { isActive: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          type: true,
          value: true,
          minAmount: true,
          maxDiscount: true,
          title: true,
          description: true,
          applyTicketTypes: true
        }
      },
      staff: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    }
  });
  
  return merchant;
}

/**
 * 获取商户分类列表
 * @returns {Promise<Array>} 分类列表
 */
async function getMerchantCategories() {
  const categories = await prisma.merchantCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      icon: true,
      description: true
    }
  });
  
  return categories;
}

/**
 * 获取商户总数
 * @param {Object} params - 筛选参数
 * @returns {Promise<number>} 商户数量
 */
async function getMerchantCount(params = {}) {
  const where = buildMerchantWhere(params);
  return prisma.merchant.count({ where });
}

module.exports = {
  getMerchants,
  getMerchantDetail,
  getMerchantCategories,
  getMerchantCount,
  buildMerchantWhere,
  buildPagination
};
