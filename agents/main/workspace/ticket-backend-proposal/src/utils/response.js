/**
 * 统一响应格式工具
 * 提供标准化的API响应格式
 */

/**
 * HTTP状态码枚举
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * 业务状态码枚举
 */
const BusinessCode = {
  SUCCESS: 200,
  PARAM_ERROR: 400001,
  UNAUTHORIZED: 401001,
  FORBIDDEN: 403001,
  NOT_FOUND: 404001,
  USER_NOT_FOUND: 404002,
  TICKET_NOT_FOUND: 404003,
  ORDER_NOT_FOUND: 404004,
  DUPLICATE_ERROR: 409001,
  TICKET_USED: 409002,
  TICKET_EXPIRED: 409003,
  VERIFY_FAILED: 422001,
  RATE_LIMIT: 429001,
  SERVER_ERROR: 500001,
  THIRD_PARTY_ERROR: 502001,
};

/**
 * 状态码对应的默认消息
 */
const defaultMessages = {
  [HttpStatus.OK]: 'success',
  [HttpStatus.CREATED]: 'created successfully',
  [HttpStatus.BAD_REQUEST]: 'bad request',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'too many requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal server error',
  [HttpStatus.BAD_GATEWAY]: 'bad gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service unavailable',
  [BusinessCode.PARAM_ERROR]: '参数错误',
  [BusinessCode.UNAUTHORIZED]: '未授权，请先登录',
  [BusinessCode.FORBIDDEN]: '无权限访问',
  [BusinessCode.NOT_FOUND]: '资源不存在',
  [BusinessCode.USER_NOT_FOUND]: '用户不存在',
  [BusinessCode.TICKET_NOT_FOUND]: '票根不存在',
  [BusinessCode.ORDER_NOT_FOUND]: '订单不存在',
  [BusinessCode.DUPLICATE_ERROR]: '资源已存在',
  [BusinessCode.TICKET_USED]: '票根已使用',
  [BusinessCode.TICKET_EXPIRED]: '票根已过期',
  [BusinessCode.VERIFY_FAILED]: '核销失败',
  [BusinessCode.RATE_LIMIT]: '请求过于频繁',
  [BusinessCode.SERVER_ERROR]: '服务器内部错误',
  [BusinessCode.THIRD_PARTY_ERROR]: '第三方服务异常',
};

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} code - 状态码
 * @returns {Object} - 标准响应对象
 */
function success(data = null, message = 'success', code = HttpStatus.OK) {
  return {
    code,
    data,
    message: message || defaultMessages[code] || 'success',
    success: true,
    timestamp: Date.now(),
  };
}

/**
 * 错误响应
 * @param {string} message - 错误消息
 * @param {number} code - 状态码
 * @param {*} details - 错误详情
 * @returns {Object} - 标准错误响应对象
 */
function error(
  message = 'error',
  code = HttpStatus.INTERNAL_SERVER_ERROR,
  details = null
) {
  return {
    code,
    data: null,
    message: message || defaultMessages[code] || 'error',
    details,
    success: false,
    timestamp: Date.now(),
  };
}

/**
 * 分页响应
 * @param {Array} list - 数据列表
 * @param {number} total - 总条数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页条数
 * @param {string} message - 响应消息
 * @returns {Object} - 标准分页响应对象
 */
function page(
  list = [],
  total = 0,
  page = 1,
  pageSize = 20,
  message = 'success'
) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    code: HttpStatus.OK,
    data: {
      list,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: Number(total),
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    message,
    success: true,
    timestamp: Date.now(),
  };
}

/**
 * 创建成功响应（201）
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object}
 */
function created(data = null, message = 'created successfully') {
  return success(data, message, HttpStatus.CREATED);
}

/**
 * 参数错误响应（400）
 * @param {string} message - 错误消息
 * @param {*} details - 错误详情
 * @returns {Object}
 */
function badRequest(message = 'bad request', details = null) {
  return error(message, HttpStatus.BAD_REQUEST, details);
}

/**
 * 未授权响应（401）
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function unauthorized(message = 'unauthorized') {
  return error(message, HttpStatus.UNAUTHORIZED);
}

/**
 * 禁止访问响应（403）
 * @param {string} message - 错误消息
 * @returns {Object}
 */
function forbidden(message = 'forbidden') {
  return error(message, HttpStatus.FORBIDDEN);
}

/**
 * 资源不存在响应（404）
 * @param {string} resource - 资源名称
 * @returns {Object}
 */
function notFound(resource = 'resource') {
  return error(`${resource} not found`, HttpStatus.NOT_FOUND);
}

/**
 * 验证错误响应（422）
 * @param {string} message - 错误消息
 * @param {Object} errors - 字段错误详情
 * @returns {Object}
 */
function validationError(message = 'validation failed', errors = {}) {
  return error(message, HttpStatus.UNPROCESSABLE_ENTITY, { errors });
}

/**
 * 服务器错误响应（500）
 * @param {string} message - 错误消息
 * @param {*} details - 错误详情
 * @returns {Object}
 */
function serverError(message = 'internal server error', details = null) {
  return error(message, HttpStatus.INTERNAL_SERVER_ERROR, details);
}

/**
 * 业务错误响应
 * @param {number} businessCode - 业务状态码
 * @param {string} message - 错误消息
 * @param {*} details - 错误详情
 * @returns {Object}
 */
function businessError(
  businessCode = BusinessCode.SERVER_ERROR,
  message = null,
  details = null
) {
  const defaultMessage = defaultMessages[businessCode] || 'business error';
  return {
    code: businessCode,
    data: null,
    message: message || defaultMessage,
    details,
    success: false,
    timestamp: Date.now(),
  };
}

module.exports = {
  // 核心方法
  success,
  error,
  page,

  // 快捷方法
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  serverError,
  businessError,

  // 常量
  HttpStatus,
  BusinessCode,
};
