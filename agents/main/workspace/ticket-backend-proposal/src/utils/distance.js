/**
 * 距离计算工具
 * 支持Haversine公式计算和MySQL距离查询构建
 */

// 地球半径（公里）
const EARTH_RADIUS_KM = 6371;
// 地球半径（米）
const EARTH_RADIUS_M = 6371000;

/**
 * 将度数转换为弧度
 * @param {number} degrees - 角度
 * @returns {number} - 弧度
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 使用Haversine公式计算两点间距离
 * @param {number} lat1 - 起点纬度
 * @param {number} lon1 - 起点经度
 * @param {number} lat2 - 终点纬度
 * @param {number} lon2 - 终点经度
 * @param {string} unit - 单位：'km'(公里) | 'm'(米) | 'mi'(英里)
 * @returns {number} - 距离
 */
function calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  // 参数校验
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    throw new Error('Invalid coordinates');
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  let distance;
  switch (unit.toLowerCase()) {
    case 'm':
      distance = EARTH_RADIUS_M * c;
      break;
    case 'mi':
      distance = EARTH_RADIUS_KM * c * 0.621371;
      break;
    case 'km':
    default:
      distance = EARTH_RADIUS_KM * c;
      break;
  }

  return Math.round(distance * 100) / 100; // 保留2位小数
}

/**
 * 验证坐标是否有效
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {boolean}
 */
function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * 批量计算多个点到参考点的距离
 * @param {number} refLat - 参考点纬度
 * @param {number} refLon - 参考点经度
 * @param {Array} points - 点数组 [{lat, lon, id, ...}]
 * @param {string} latKey - 纬度字段名
 * @param {string} lonKey - 经度字段名
 * @param {string} unit - 单位
 * @returns {Array} - 带距离的点数组
 */
function calculateDistances(
  refLat,
  refLon,
  points,
  latKey = 'lat',
  lonKey = 'lon',
  unit = 'km'
) {
  return points.map((point) => ({
    ...point,
    distance: calculateDistance(
      refLat,
      refLon,
      point[latKey],
      point[lonKey],
      unit
    ),
  }));
}

/**
 * 按距离排序点数组
 * @param {Array} points - 带距离的点数组
 * @param {string} order - 排序方式：'asc' | 'desc'
 * @returns {Array}
 */
function sortByDistance(points, order = 'asc') {
  return points.sort((a, b) => {
    return order === 'desc'
      ? b.distance - a.distance
      : a.distance - b.distance;
  });
}

/**
 * 筛选指定半径内的点
 * @param {Array} points - 带距离的点数组
 * @param {number} radius - 半径
 * @returns {Array}
 */
function filterByRadius(points, radius) {
  return points.filter((point) => point.distance <= radius);
}

/**
 * 构建MySQL距离计算SQL（Haversine公式）
 * @param {number} lat - 参考点纬度
 * @param {number} lon - 参考点经度
 * @param {string} latColumn - 数据库纬度字段名
 * @param {string} lonColumn - 数据库经度字段名
 * @param {string} alias - 距离字段别名
 * @returns {string} - SQL片段
 */
function buildMySQLDistanceSQL(
  lat,
  lon,
  latColumn = 'latitude',
  lonColumn = 'longitude',
  alias = 'distance'
) {
  const latRad = toRadians(lat);

  return `
    (
      ${EARTH_RADIUS_KM} * 2 * ASIN(
        SQRT(
          POWER(SIN((RADIANS(${latColumn}) - ${toRadians(lat)}) / 2), 2) +
          COS(${latRad}) *
          COS(RADIANS(${latColumn})) *
          POWER(SIN((RADIANS(${lonColumn}) - ${toRadians(lon)}) / 2), 2)
        )
      )
    ) AS ${alias}
  `.trim();
}

/**
 * 构建带距离过滤的MySQL查询
 * @param {number} lat - 参考点纬度
 * @param {number} lon - 参考点经度
 * @param {number} radiusKm - 半径（公里）
 * @param {string} tableName - 表名
 * @param {string} latColumn - 纬度字段名
 * @param {string} lonColumn - 经度字段名
 * @param {Array} columns - 需要查询的字段
 * @returns {string} - 完整SQL
 */
function buildMySQLNearbyQuery(
  lat,
  lon,
  radiusKm,
  tableName,
  latColumn = 'latitude',
  lonColumn = 'longitude',
  columns = ['*']
) {
  const distanceSQL = buildMySQLDistanceSQL(lat, lon, latColumn, lonColumn);
  const columnsSQL = columns.includes('*')
    ? `*, ${distanceSQL}`
    : [...columns, distanceSQL].join(', ');

  return `
    SELECT ${columnsSQL}
    FROM ${tableName}
    WHERE (
      ${EARTH_RADIUS_KM} * 2 * ASIN(
        SQRT(
          POWER(SIN((RADIANS(${latColumn}) - ${toRadians(lat)}) / 2), 2) +
          COS(${toRadians(lat)}) *
          COS(RADIANS(${latColumn})) *
          POWER(SIN((RADIANS(${lonColumn}) - ${toRadians(lon)}) / 2), 2)
        )
      )
    ) <= ${radiusKm}
    ORDER BY distance ASC
  `.trim();
}

/**
 * 构建使用bounding box优化的MySQL查询（性能更好）
 * @param {number} lat - 参考点纬度
 * @param {number} lon - 参考点经度
 * @param {number} radiusKm - 半径（公里）
 * @param {string} tableName - 表名
 * @param {string} latColumn - 纬度字段名
 * @param {string} lonColumn - 经度字段名
 * @returns {string} - 完整SQL
 */
function buildMySQLBoundingBoxQuery(
  lat,
  lon,
  radiusKm,
  tableName,
  latColumn = 'latitude',
  lonColumn = 'longitude'
) {
  // 粗略估算：1度纬度 ≈ 111km
  const latDelta = radiusKm / 111;
  // 1度经度 ≈ 111km * cos(纬度)
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(lat)));

  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  const minLon = lon - lonDelta;
  const maxLon = lon + lonDelta;

  const distanceSQL = buildMySQLDistanceSQL(lat, lon, latColumn, lonColumn);

  return `
    SELECT *, ${distanceSQL}
    FROM ${tableName}
    WHERE ${latColumn} BETWEEN ${minLat} AND ${maxLat}
      AND ${lonColumn} BETWEEN ${minLon} AND ${maxLon}
    HAVING distance <= ${radiusKm}
    ORDER BY distance ASC
  `.trim();
}

/**
 * 构建Prisma的raw查询距离计算
 * @param {number} lat - 参考点纬度
 * @param {number} lon - 参考点经度
 * @returns {Object} - Prisma raw query片段
 */
function buildPrismaDistanceQuery(lat, lon) {
  const latRad = toRadians(lat);

  return {
    select: {
      distance: {
        sql: `
          ${EARTH_RADIUS_KM} * 2 * ASIN(
            SQRT(
              POWER(SIN((RADIANS(latitude) - ${latRad}) / 2), 2) +
              COS(${latRad}) *
              COS(RADIANS(latitude)) *
              POWER(SIN((RADIANS(longitude) - ${toRadians(lon)}) / 2), 2)
            )
          )
        `,
      },
    },
  };
}

module.exports = {
  calculateDistance,
  calculateDistances,
  sortByDistance,
  filterByRadius,
  isValidCoordinate,
  buildMySQLDistanceSQL,
  buildMySQLNearbyQuery,
  buildMySQLBoundingBoxQuery,
  buildPrismaDistanceQuery,
  EARTH_RADIUS_KM,
  EARTH_RADIUS_M,
};
