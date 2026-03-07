/**
 * OCR识别API路由
 * POST /api/v1/ticket/recognize - 提交OCR识别任务
 * GET /api/v1/ticket/recognize/:taskId - 查询识别结果
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { success, error, created } = require('../../../utils/response');
const ocrService = require('../../../services/ocrService');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 验证Base64图片格式
 * @param {string} base64String - Base64编码的图片
 * @returns {boolean}
 */
function isValidBase64Image(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  // 支持 data:image/jpeg;base64,xxx 格式或纯base64
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (base64Pattern.test(base64String)) {
    return true;
  }
  // 纯base64格式（至少包含有效字符）
  const pureBase64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return pureBase64Pattern.test(base64String) && base64String.length > 100;
}

/**
 * 模拟OSS上传（实际项目中使用阿里云OSS）
 * @param {string} base64Image - Base64图片
 * @returns {Promise<string>} - 图片URL
 */
async function uploadToOSS(base64Image) {
  // TODO: 实际项目中调用阿里云OSS SDK上传图片
  // 目前模拟返回URL
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `https://mock-oss.example.com/tickets/${timestamp}_${random}.jpg`;
}

/**
 * @route POST /api/v1/ticket/recognize
 * @desc 提交OCR识别任务
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const { imageBase64, type } = req.body;
    const userId = req.user?.id;

    // 参数验证
    if (!imageBase64) {
      return res.status(400).json(error('请上传票根图片', 400));
    }

    if (!isValidBase64Image(imageBase64)) {
      return res.status(400).json(error('图片格式无效，请上传jpg/png/webp格式的图片', 400));
    }

    // 检查图片大小（Base64字符串长度限制5MB）
    if (imageBase64.length > 5 * 1024 * 1024) {
      return res.status(400).json({ code: 400, message: '图片大小不能超过5MB' });
    }

    // 1. 上传图片到OSS
    let imageUrl;
    try {
      imageUrl = await uploadToOSS(imageBase64);
    } catch (uploadErr) {
      console.error('图片上传失败:', uploadErr);
      return res.status(500).json(error('图片上传失败，请重试', 500));
    }

    // 2. 创建OCR任务
    const task = await ocrService.createOcrTask({
      imageUrl,
    });

    // 3. 发送异步任务到队列
    await ocrService.submitOcrTask({
      taskId: task.id,
      imageUrl,
      type,
    });

    // 返回任务信息
    res.status(201).json(created({
      taskId: task.id,
      status: 'pending',
      message: 'OCR识别任务已提交，请轮询查询结果',
    }, 'OCR识别任务提交成功'));
  } catch (err) {
    console.error('提交OCR识别任务失败:', err);
    res.status(500).json(error('提交OCR识别任务失败', 500));
  }
});

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
    name: ticket.name,
    imageUrl: ticket.imageUrl,
    status: ticket.status,
    ocrStatus: ticket.ocrStatus,
    aiRecognized: ticket.aiRecognized,
    validStart: ticket.validStart,
    validEnd: ticket.validEnd,
    createdAt: ticket.createdAt,
  };
}

/**
 * @route GET /api/v1/ticket/recognize/:taskId
 * @desc 查询OCR识别结果
 * @access Private
 */
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;

    if (!taskId) {
      return res.status(400).json(error('任务ID不能为空', 400));
    }

    // 查询OCR任务
    const task = await ocrService.getTaskResult(taskId);

    if (!task) {
      return res.status(404).json(error('OCR任务不存在', 404));
    }

    // 如果任务还在处理中，直接返回状态
    if (task.status === 'pending' || task.status === 'processing') {
      return res.json(success({
        status: task.status,
        message: task.status === 'pending' ? '任务等待处理中' : '任务正在处理中',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }, '查询成功'));
    }

    // 如果任务失败，返回错误信息
    if (task.status === 'failed') {
      return res.json(success({
        status: 'failed',
        error: task.error || '识别失败',
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }, '识别失败'));
    }

    // 任务成功，创建票根记录（幂等：如果已创建则直接返回）
    let ticket = await prisma.ticket.findFirst({
      where: {
        ocrTaskId: taskId,
        userId,
      },
      include: {
        type: true,
      },
    });

    if (!ticket && task.result) {
      // 创建票根记录
      try {
        const validEnd = new Date();
        validEnd.setDate(validEnd.getDate() + 30); // 默认30天有效期

        ticket = await prisma.ticket.create({
          data: {
            userId,
            typeId: task.result.typeId,
            name: task.result.name,
            imageUrl: task.imageUrl,
            ocrResult: task.result,
            ocrStatus: 'success',
            ocrTaskId: taskId,
            aiRecognized: true,
            status: 'valid',
            validStart: new Date(),
            validEnd,
          },
          include: {
            type: true,
          },
        });
      } catch (createErr) {
        // 可能是重复创建，再次查询
        ticket = await prisma.ticket.findFirst({
          where: {
            ocrTaskId: taskId,
            userId,
          },
          include: {
            type: true,
          },
        });
      }
    }

    // 返回成功结果
    res.json(success({
      status: 'success',
      ticket: ticket ? formatTicket(ticket) : null,
      ocrResult: task.result,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }, 'OCR识别成功'));
  } catch (err) {
    console.error('查询OCR识别结果失败:', err);
    res.status(500).json(error('查询OCR识别结果失败', 500));
  }
});

module.exports = router;
