/**
 * 商户查询服务
 * 提供商户分类、列表、详情等查询功能
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Haversine公式计算两点间距离（单位：公里）
 * @param {number} lat1 - 纬度1
 * @param {number} lon1 - 经度1
 * @param {number} lat2 - 纬度2
 * @param {number} lon2 - 经度2
 * @returns {number} - 距离（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 获取商户分类列表
 * @param {Object} options - 查询选项
 * @param {boolean} options.activeOnly - 仅返回启用的分类
 * @returns {Promise<Array>} - 分类列表
 */
async function getCategories(options = {}) {
  const { activeOnly = true } = options;

  const where = {};
  if (activeOnly) {
    where.isActive = true;
  }

  const categories = await prisma.merchantCategory.findMany({
    where,
    orderBy: {
      sortOrder: 'asc',
    },
    select: {
      id: true,
      name: true,
      icon: true,
      sortOrder: true,
    },
  });

  return categories;
}

/**
 * 获取商户列表
 * @param {Object} params - 查询参数
 * @param {string} params.categoryId - 分类ID
 * @param {string} params.keyword - 关键词搜索
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} params.sortBy - 排序方式: distance-距离, rating-评分, newest-最新
 * @param {number} params.lat - 用户纬度（用于距离排序）
 * @param {number} params.lng - 用户经度（用于距离排序）
 * @returns {Promise<Object>} - 商户列表和分页信息
 */
async function getMerchants(params = {}) {
  const {
    categoryId,
    keyword,
    page = 1,
    pageSize = 20,
    sortBy = 'rating',
    lat,
    lng,
  } = params;

  // 构建查询条件
  const where = {
    isActive: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { address: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }

  // 计算分页
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 获取总数
  const total = await prisma.merchant.count({ where });

  // 构建排序条件
  let orderBy = {};
  switch (sortBy) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'rating':
    default:
      orderBy = { rating: 'desc' };
      break;
  }

  // 查询商户列表
  const merchants = await prisma.merchant.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      phone: true,
      longitude: true,
      latitude: true,
      rating: true,
      businessHours: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          discountRules: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  });

  // 格式化数据，计算距离
  let formattedMerchants = merchants.map((merchant) => ({
    id: merchant.id,
    name: merchant.name,
    logo: merchant.logo,
    address: merchant.address,
    phone: merchant.phone,
    longitude: merchant.longitude,
    latitude: merchant.latitude,
    rating: merchant.rating,
    businessHours: merchant.businessHours,
    category: merchant.category,
    discountCount: merchant._count.discountRules,
    distance: null,
  }));

  // 计算距离并排序
  if (lat && lng) {
    formattedMerchants = formattedMerchants.map((merchant) => ({
      ...merchant,
      distance:
        merchant.latitude && merchant.longitude
          ? calculateDistance(
              Number(lat),
              Number(lng),
              merchant.latitude,
              merchant.longitude
            )
          : null,
    }));

    // 按距离排序
    if (sortBy === 'distance') {
      formattedMerchants.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
  }

  // 格式化距离显示
  formattedMerchants = formattedMerchants.map((merchant) => ({
    ...merchant,
    distanceText: merchant.distance
      ? merchant.distance < 1
        ? `${(merchant.distance * 1000).toFixed(0)}m`
        : `${merchant.distance.toFixed(1)}km`
      : null,
  }));

  return {
    list: formattedMerchants,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  };
}

/**
 * 获取商户详情
 * @param {string} merchantId - 商户ID
 * @param {Object} options - 查询选项
 * @param {number} options.lat - 用户纬度（用于计算距离）
 * @param {number} options.lng - 用户经度（用于计算距离）
 * @returns {Promise<Object|null>} - 商户详情
 */
async function getMerchantDetail(merchantId, options = {}) {
  const { lat, lng } = options;

  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId,
      isActive: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      discountRules: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          discountType: true,
          discountValue: true,
          minAmount: true,
          maxDiscount: true,
          validStart: true,
          validEnd: true,
        },
      },
    },
  });

  if (!merchant) {
    return null;
  }

  // 计算距离
  let distance = null;
  if (lat && lng && merchant.latitude && merchant.longitude) {
    distance = calculateDistance(
      Number(lat),
      Number(lng),
      merchant.latitude,
      merchant.longitude
    );
  }

  // 格式化优惠规则
  const discountRules = merchant.discountRules.map((rule) => {
    let discountText = '';
    switch (rule.discountType) {
      case 'percentage':
        discountText = `${rule.discountValue}折`;
        break;
      case 'fixed':
        discountText = `减${rule.discountValue}元`;
        break;
      case 'special':
        discountText = `特价${rule.discountValue}元`;
        break;
      default:
        discountText = rule.title;
    }

    const isValid =
      (!rule.validStart || new Date() >= rule.validStart) &&
      (!rule.validEnd || new Date() <= rule.validEnd);

    return {
      id: rule.id,
      title: rule.title,
      description: rule.description,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      discountText,
      minAmount: rule.minAmount,
      maxDiscount: rule.maxDiscount,
      validStart: rule.validStart,
      validEnd: rule.validEnd,
      isValid,
    };
  });

  return {
    id: merchant.id,
    name: merchant.name,
    logo: merchant.logo,
    description: merchant.description,
    address: merchant.address,
    phone: merchant.phone,
    longitude: merchant.longitude,
    latitude: merchant.latitude,
    businessHours: merchant.businessHours,
    rating: merchant.rating,
    category: merchant.category,
    distance,
    distanceText: distance
      ? distance < 1
        ? `${(distance * 1000).toFixed(0)}m`
        : `${distance.toFixed(1)}km`
      : null,
    discountRules,
    discountCount: discountRules.length,
  };
}

/**
 * 根据分类获取推荐商户
 * @param {string} categoryId - 分类ID
 * @param {number} limit - 限制数量
 * @returns {Promise<Array>} - 推荐商户列表
 */
async function getRecommendedMerchants(categoryId, limit = 5) {
  const where = {
    isActive: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const merchants = await prisma.merchant.findMany({
    where,
    orderBy: {
      rating: 'desc',
    },
    take: limit,
    select: {
      id: true,
      name: true,
      logo: true,
      rating: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          discountRules: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  });

  return merchants.map((merchant) => ({
    id: merchant.id,
    name: merchant.name,
    logo: merchant.logo,
    rating: merchant.rating,
    category: merchant.category,
    discountCount: merchant._count.discountRules,
  }));
}

module.exports = {
  getCategories,
  getMerchants,
  getMerchantDetail,
  getRecommendedMerchants,
  calculateDistance,
};