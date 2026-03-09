/**
 * 错误处理中间件
 * 统一处理API错误响应
 */

const { error: errorResponse, HttpStatus } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Prisma 错误处理
  if (err.code && err.code.startsWith('P')) {
    // Prisma 唯一约束冲突
    if (err.code === 'P2002') {
      return res.status(409).json(
        errorResponse('资源已存在', HttpStatus.CONFLICT)
      );
    }
    // Prisma 外键约束失败
    if (err.code === 'P2003') {
      return res.status(400).json(
        errorResponse('关联资源不存在', HttpStatus.BAD_REQUEST)
      );
    }
    // Prisma 记录不存在
    if (err.code === 'P2025') {
      return res.status(404).json(
        errorResponse('资源不存在', HttpStatus.NOT_FOUND)
      );
    }
    // 其他Prisma错误
    return res.status(500).json(
      errorResponse('数据库操作失败', HttpStatus.INTERNAL_SERVER_ERROR)
    );
  }

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse('Token无效', HttpStatus.UNAUTHORIZED)
    );
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse('Token已过期', HttpStatus.UNAUTHORIZED)
    );
  }

  // 默认错误响应
  const statusCode = err.statusCode || err.status || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json(errorResponse(message, statusCode));
}

/**
 * 404 错误处理
 */
function notFoundHandler(req, res) {
  res.status(404).json(
    errorResponse('接口不存在', HttpStatus.NOT_FOUND)
  );
}

/**
 * 异步路由包装器
 * 自动捕获异步路由中的错误
 * @param {Function} fn - 异步路由处理函数
 * @returns {Function}
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
