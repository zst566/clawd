/**
 * 响应工具
 * 统一API返回格式
 */

/**
 * 成功响应
 * @param {*} data - 响应数据
 * @param {string} message - 成功消息
 * @param {number} code - 状态码
 * @returns {Object} 标准响应对象
 */
function success(data, message = '操作成功', code = 200) {
  return {
    code,
    message,
    data,
    success: true
  };
}

/**
 * 错误响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误码
 * @param {*} details - 错误详情
 * @returns {Object} 标准错误响应对象
 */
function error(message = '操作失败', code = 500, details = null) {
  return {
    code,
    message,
    data: details,
    success: false
  };
}

/**
 * 分页响应
 * @param {Array} list - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 成功消息
 * @returns {Object} 标准分页响应对象
 */
function paginated(list, pagination, message = '查询成功') {
  return {
    code: 200,
    message,
    data: {
      list,
      pagination
    },
    success: true
  };
}

/**
 * 参数错误响应
 * @param {string} message - 错误消息
 * @returns {Object} 400错误响应
 */
function badRequest(message = '参数错误') {
  return error(message, 400);
}

/**
 * 未授权响应
 * @param {string} message - 错误消息
 * @returns {Object} 401错误响应
 */
function unauthorized(message = '未授权') {
  return error(message, 401);
}

/**
 * 禁止访问响应
 * @param {string} message - 错误消息
 * @returns {Object} 403错误响应
 */
function forbidden(message = '禁止访问') {
  return error(message, 403);
}

/**
 * 资源不存在响应
 * @param {string} message - 错误消息
 * @returns {Object} 404错误响应
 */
function notFound(message = '资源不存在') {
  return error(message, 404);
}

module.exports = {
  success,
  error,
  paginated,
  badRequest,
  unauthorized,
  forbidden,
  notFound
};
