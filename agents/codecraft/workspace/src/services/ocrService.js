/**
 * OCR任务处理服务
 * 处理票根图片的OCR识别任务
 */

const { PrismaClient } = require('@prisma/client');
const redis = require('../config/redis');

const prisma = new PrismaClient();

/**
 * OCR任务状态
 */
const TaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
};

/**
 * OCR任务队列名称
 */
const OCR_QUEUE_NAME = 'ocr:tasks';

/**
 * OCR任务处理锁（防止重复处理）
 */
const PROCESSING_LOCK_PREFIX = 'ocr:processing:';

/**
 * 任务超时时间（毫秒）
 */
const TASK_TIMEOUT_MS = 5 * 60 * 1000; // 5分钟

/**
 * 提交OCR任务到队列
 * @param {Object} taskData - 任务数据
 * @param {string} taskData.taskId - 任务ID
 * @param {string} taskData.imageUrl - 图片URL
 * @param {string} taskData.type - 票根类型（可选）
 * @returns {Promise<boolean>}
 */
async function submitOcrTask(taskData) {
  try {
    const { taskId, imageUrl, type } = taskData;

    // 更新任务状态为处理中
    await prisma.ocrTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.PROCESSING,
        updatedAt: new Date(),
      },
    });

    // 将任务添加到Redis队列
    await redis.lpush(OCR_QUEUE_NAME, JSON.stringify({
      taskId,
      imageUrl,
      type: type || null,
      createdAt: Date.now(),
    }));

    // 设置处理锁，防止重复处理
    await redis.setex(
      `${PROCESSING_LOCK_PREFIX}${taskId}`,
      Math.ceil(TASK_TIMEOUT_MS / 1000),
      '1'
    );

    return true;
  } catch (error) {
    console.error('提交OCR任务失败:', error);
    throw error;
  }
}

/**
 * 获取待处理的OCR任务
 * @returns {Promise<Object|null>}
 */
async function getPendingTask() {
  try {
    // 从队列右侧弹出任务（FIFO）
    const taskJson = await redis.rpop(OCR_QUEUE_NAME);
    if (!taskJson) {
      return null;
    }

    return JSON.parse(taskJson);
  } catch (error) {
    console.error('获取待处理OCR任务失败:', error);
    return null;
  }
}

/**
 * 模拟OCR识别（实际项目中调用OCR服务）
 * @param {string} imageUrl - 图片URL
 * @param {string} type - 票根类型
 * @returns {Promise<Object>}
 */
async function performOcrRecognition(imageUrl, type) {
  // TODO: 实际项目中这里调用OCR服务（如百度OCR、阿里云OCR等）
  // 目前模拟识别结果

  const ticketTypes = [
    { code: 'movie', name: '电影票', keywords: ['影院', '电影', 'CINEMA'] },
    { code: 'train', name: '火车票', keywords: ['铁路', '列车', '车次'] },
    { code: 'flight', name: '飞机票', keywords: ['航空', '航班', '机场'] },
    { code: 'bus', name: '汽车票', keywords: ['客运站', '班车', '巴士'] },
    { code: 'scenic', name: '景点门票', keywords: ['景区', '门票', '游览'] },
  ];

  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // 随机选择一个类型（实际应该根据OCR结果判断）
  const detectedType = ticketTypes.find(t => t.code === type) ||
    ticketTypes[Math.floor(Math.random() * ticketTypes.length)];

  return {
    type: detectedType.code,
    name: `${detectedType.name}-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    confidence: 0.85 + Math.random() * 0.14,
    rawText: '模拟OCR识别文本内容...',
    fields: {
      venue: '模拟场馆名称',
      seat: '5排8座',
      price: '45.00',
      time: '14:30',
    },
  };
}

/**
 * 处理OCR任务
 * @param {Object} task - 任务对象
 * @returns {Promise<void>}
 */
async function processOcrTask(task) {
  const { taskId, imageUrl, type } = task;

  try {
    console.log(`[OCR] 开始处理任务: ${taskId}`);

    // 检查任务是否已被处理
    const lockKey = `${PROCESSING_LOCK_PREFIX}${taskId}`;
    const lock = await redis.get(lockKey);
    if (!lock) {
      console.log(`[OCR] 任务已超时或被取消: ${taskId}`);
      return;
    }

    // 执行OCR识别
    const ocrResult = await performOcrRecognition(imageUrl, type);

    // 获取票根类型ID
    const ticketType = await prisma.ticketType.findUnique({
      where: { code: ocrResult.type },
    });

    if (!ticketType) {
      throw new Error(`不支持的票根类型: ${ocrResult.type}`);
    }

    // 更新任务状态为成功
    await prisma.ocrTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SUCCESS,
        result: {
          typeId: ticketType.id,
          typeCode: ticketType.code,
          typeName: ticketType.name,
          name: ocrResult.name,
          date: ocrResult.date,
          confidence: ocrResult.confidence,
          rawText: ocrResult.rawText,
          fields: ocrResult.fields,
        },
        updatedAt: new Date(),
      },
    });

    // 删除处理锁
    await redis.del(lockKey);

    console.log(`[OCR] 任务处理成功: ${taskId}`);
  } catch (error) {
    console.error(`[OCR] 任务处理失败: ${taskId}`, error);

    // 更新任务状态为失败
    await prisma.ocrTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.FAILED,
        error: error.message,
        updatedAt: new Date(),
      },
    });

    // 删除处理锁
    await redis.del(`${PROCESSING_LOCK_PREFIX}${taskId}`);
  }
}

/**
 * 轮询查询OCR任务结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>}
 */
async function getTaskResult(taskId) {
  try {
    const task = await prisma.ocrTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      status: task.status,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  } catch (error) {
    console.error('查询OCR任务结果失败:', error);
    throw error;
  }
}

/**
 * 创建OCR任务记录
 * @param {Object} data - 任务数据
 * @param {string} data.imageUrl - 图片URL
 * @param {string} data.ticketId - 关联的票根ID（可选）
 * @returns {Promise<Object>}
 */
async function createOcrTask(data) {
  try {
    const task = await prisma.ocrTask.create({
      data: {
        imageUrl: data.imageUrl,
        ticketId: data.ticketId || null,
        status: TaskStatus.PENDING,
      },
    });

    return task;
  } catch (error) {
    console.error('创建OCR任务失败:', error);
    throw error;
  }
}

/**
 * 清理过期的OCR任务
 * @param {number} maxAgeDays - 最大保留天数
 * @returns {Promise<number>}
 */
async function cleanupOldTasks(maxAgeDays = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await prisma.ocrTask.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[OCR] 清理了 ${result.count} 个过期任务`);
    return result.count;
  } catch (error) {
    console.error('清理过期OCR任务失败:', error);
    throw error;
  }
}

/**
 * 获取OCR任务统计
 * @returns {Promise<Object>}
 */
async function getTaskStats() {
  try {
    const [pending, processing, success, failed, total] = await Promise.all([
      prisma.ocrTask.count({ where: { status: TaskStatus.PENDING } }),
      prisma.ocrTask.count({ where: { status: TaskStatus.PROCESSING } }),
      prisma.ocrTask.count({ where: { status: TaskStatus.SUCCESS } }),
      prisma.ocrTask.count({ where: { status: TaskStatus.FAILED } }),
      prisma.ocrTask.count(),
    ]);

    return {
      pending,
      processing,
      success,
      failed,
      total,
    };
  } catch (error) {
    console.error('获取OCR任务统计失败:', error);
    throw error;
  }
}

/**
 * 启动OCR任务处理器（Worker）
 * @param {Object} options - 配置选项
 * @param {number} options.interval - 轮询间隔（毫秒）
 * @param {boolean} options.autoStart - 是否自动启动
 */
function startOcrWorker(options = {}) {
  const { interval = 5000, autoStart = true } = options;

  if (!autoStart) {
    return;
  }

  console.log('[OCR] 启动OCR任务处理器...');

  const workerInterval = setInterval(async () => {
    try {
      const task = await getPendingTask();
      if (task) {
        await processOcrTask(task);
      }
    } catch (error) {
      console.error('[OCR] Worker处理异常:', error);
    }
  }, interval);

  // 返回停止函数
  return () => {
    clearInterval(workerInterval);
    console.log('[OCR] 停止OCR任务处理器');
  };
}

module.exports = {
  // 状态常量
  TaskStatus,

  // 核心方法
  createOcrTask,
  submitOcrTask,
  getTaskResult,
  processOcrTask,

  // Worker管理
  startOcrWorker,
  getPendingTask,

  // 工具方法
  cleanupOldTasks,
  getTaskStats,
  performOcrRecognition,
};
