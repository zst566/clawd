/**
 * 全局错误处理中间件
 * 统一处理应用中的各种错误
 */

const { error, HttpStatus, BusinessCode } = require('../utils/response');

/**
 * 错误类型映射
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'ValidationError',
  CAST_ERROR: 'CastError',
  DUPLICATE_KEY_ERROR: 'DuplicateKeyError',
  JWT_ERROR: 'JsonWebTokenError',
  JWT_EXPIRED: 'TokenExpiredError',
  PRISMA_ERROR: 'PrismaClientKnownRequestError',
  PRISMA_VALIDATION: 'PrismaClientValidationError',
  SYNTAX_ERROR: 'SyntaxError',
  UNAUTHORIZED_ERROR: 'UnauthorizedError',
};

/**
 * 错误日志记录
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 */
function logError(err, req) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  // 根据错误级别选择日志方式
  if (err.statusCode >= 500) {
    console.error('[ErrorHandler]', JSON.stringify(logData, null, 2));
  } else {
    console.warn('[ErrorHandler]', JSON.stringify(logData, null, 2));
  }
}

/**
 * 处理验证错误
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleValidationError(err) {
  const errors = {};

  // mongoose 验证错误
  if (err.errors) {
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
  }

  // joi/ajv 验证错误
  if (err.details) {
    err.details.forEach((detail) => {
      const field = detail.path?.join('.') || detail.context?.key || 'unknown';
      errors[field] = detail.message;
    });
  }

  return {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    response: {
      code: BusinessCode.PARAM_ERROR,
      data: null,
      message: '参数验证失败',
      details: { errors },
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理Prisma错误
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handlePrismaError(err) {
  const code = err.code;
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let businessCode = BusinessCode.SERVER_ERROR;
  let message = '数据库操作失败';
  let details = null;

  switch (code) {
    case 'P2002': // 唯一约束冲突
      statusCode = HttpStatus.CONFLICT;
      businessCode = BusinessCode.DUPLICATE_ERROR;
      message = '数据已存在';
      details = { target: err.meta?.target };
      break;

    case 'P2025': // 记录未找到
      statusCode = HttpStatus.NOT_FOUND;
      businessCode = BusinessCode.NOT_FOUND;
      message = '记录不存在';
      break;

    case 'P2003': // 外键约束失败
      statusCode = HttpStatus.BAD_REQUEST;
      businessCode = BusinessCode.PARAM_ERROR;
      message = '关联数据不存在';
      break;

    case 'P2000': // 输入值过长
      statusCode = HttpStatus.BAD_REQUEST;
      businessCode = BusinessCode.PARAM_ERROR;
      message = '输入数据超出长度限制';
      break;

    default:
      console.error('[PrismaError]', err);
  }

  return {
    statusCode,
    response: {
      code: businessCode,
      data: null,
      message,
      details,
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理JWT错误
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleJWTError(err) {
  let message = '身份验证失败';

  if (err.name === ErrorTypes.JWT_EXPIRED) {
    message = '登录已过期，请重新登录';
  } else if (err.name === ErrorTypes.JWT_ERROR) {
    message = '身份验证失败，请重新登录';
  }

  return {
    statusCode: HttpStatus.UNAUTHORIZED,
    response: {
      code: BusinessCode.UNAUTHORIZED,
      data: null,
      message,
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理MongoDB重复键错误
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field] || '';

  return {
    statusCode: HttpStatus.CONFLICT,
    response: {
      code: BusinessCode.DUPLICATE_ERROR,
      data: null,
      message: `${field} 已存在`,
      details: { field, value },
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理Cast错误（类型转换失败）
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleCastError(err) {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    response: {
      code: BusinessCode.PARAM_ERROR,
      data: null,
      message: `无效的 ${err.path}: ${err.value}`,
      details: { path: err.path, value: err.value },
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理Syntax错误（JSON解析失败）
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleSyntaxError(err) {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    response: {
      code: BusinessCode.PARAM_ERROR,
      data: null,
      message: '请求体格式错误，请检查JSON格式',
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 处理默认错误
 * @param {Error} err - 错误对象
 * @returns {Object}
 */
function handleDefaultError(err) {
  // 检查是否是业务错误（自定义错误）
  if (err.isBusinessError) {
    return {
      statusCode: err.statusCode || HttpStatus.BAD_REQUEST,
      response: {
        code: err.businessCode || BusinessCode.SERVER_ERROR,
        data: null,
        message: err.message,
        details: err.details,
        success: false,
        timestamp: Date.now(),
      },
    };
  }

  // 检查是否有预定义的状态码
  if (err.statusCode) {
    return {
      statusCode: err.statusCode,
      response: {
        code: err.businessCode || err.statusCode,
        data: null,
        message: err.message || '请求处理失败',
        details: err.details,
        success: false,
        timestamp: Date.now(),
      },
    };
  }

  // 服务器内部错误
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    response: {
      code: BusinessCode.SERVER_ERROR,
      data: null,
      message:
        process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : err.message || 'internal server error',
      details:
        process.env.NODE_ENV === 'development'
          ? { stack: err.stack }
          : undefined,
      success: false,
      timestamp: Date.now(),
    },
  };
}

/**
 * 主错误处理中间件
 * 注意：必须包含4个参数，Express才能识别为错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logError(err, req);

  let result;

  // 根据错误类型分发处理
  switch (err.name) {
    case ErrorTypes.VALIDATION_ERROR:
      result = handleValidationError(err);
      break;

    case ErrorTypes.CAST_ERROR:
      result = handleCastError(err);
      break;

    case ErrorTypes.DUPLICATE_KEY_ERROR:
      result = handleDuplicateKeyError(err);
      break;

    case ErrorTypes.JWT_ERROR:
    case ErrorTypes.JWT_EXPIRED:
    case ErrorTypes.UNAUTHORIZED_ERROR:
      result = handleJWTError(err);
      break;

    case ErrorTypes.SYNTAX_ERROR:
      result = handleSyntaxError(err);
      break;

    default:
      // 检查Prisma错误
      if (err.name?.includes('Prisma')) {
        result = handlePrismaError(err);
      } else {
        result = handleDefaultError(err);
      }
  }

  res.status(result.statusCode).json(result.response);
}

/**
 * 404错误处理中间件
 * 处理未匹配到的路由
 */
function notFoundHandler(req, res, next) {
  res.status(HttpStatus.NOT_FOUND).json({
    code: BusinessCode.NOT_FOUND,
    data: null,
    message: `无法找到 ${req.method} ${req.originalUrl}`,
    success: false,
    timestamp: Date.now(),
  });
}

/**
 * 异步错误包装器
 * 用于包装异步路由处理函数，自动捕获错误
 * @param {Function} fn - 异步处理函数
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 业务错误类
 * 用于抛出业务逻辑错误
 */
class BusinessError extends Error {
  constructor(message, statusCode = 400, businessCode = BusinessCode.SERVER_ERROR, details = null) {
    super(message);
    this.name = 'BusinessError';
    this.isBusinessError = true;
    this.statusCode = statusCode;
    this.businessCode = businessCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 参数错误类
 */
class ValidationError extends BusinessError {
  constructor(message = '参数验证失败', details = null) {
    super(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      BusinessCode.PARAM_ERROR,
      details
    );
    this.name = 'ValidationError';
  }
}

/**
 * 未授权错误类
 */
class UnauthorizedError extends BusinessError {
  constructor(message = '未授权') {
    super(message, HttpStatus.UNAUTHORIZED, BusinessCode.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 禁止访问错误类
 */
class ForbiddenError extends BusinessError {
  constructor(message = '禁止访问') {
    super(message, HttpStatus.FORBIDDEN, BusinessCode.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

/**
 * 资源不存在错误类
 */
class NotFoundError extends BusinessError {
  constructor(resource = '资源') {
    super(
      `${resource}不存在`,
      HttpStatus.NOT_FOUND,
      BusinessCode.NOT_FOUND
    );
    this.name = 'NotFoundError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  BusinessError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
