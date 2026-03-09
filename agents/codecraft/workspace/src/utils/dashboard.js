/**
 * 码匠 - Dashboard SDK 集成
 * 
 * 用于实时上报工作状态到龙虾任务看板
 */

const { AgentSDK } = require('/Volumes/SanDisk2T/dv-codeBase/claw-dashboard/sdk');

// 初始化 SDK
const dashboard = new AgentSDK({
  agentId: 'codecraft',
  name: '码匠',
  apiUrl: process.env.DASHBOARD_API_URL || 'http://localhost:3000',
  wsUrl: process.env.DASHBOARD_WS_URL || 'http://localhost:3000'
});

// 启动自动心跳
dashboard.startHeartbeat();
console.log('[CodeCraft Dashboard] SDK 已启动，开始上报工作状态');

/**
 * 包装开发任务，自动上报进度
 * @param {string} taskId - 任务ID
 * @param {Object} options - 任务选项
 * @param {Function} workFn - 实际工作函数
 */
async function withProgress(taskId, options, workFn) {
  const { title, type = 'coding', totalSteps = 10 } = options;
  
  try {
    // 开始任务
    await dashboard.startTask(taskId, { type, title });
    console.log(`[CodeCraft] 开始任务: ${title}`);
    
    // 执行工作，包装进度回调
    let currentStep = 0;
    const updateProgress = (message) => {
      currentStep++;
      const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      dashboard.updateProgress(progress, message);
    };
    
    const result = await workFn(updateProgress);
    
    // 完成任务
    await dashboard.completeTask({ 
      status: 'success',
      summary: `完成: ${title}`
    });
    console.log(`[CodeCraft] 完成任务: ${title}`);
    
    return result;
  } catch (error) {
    // 任务失败
    await dashboard.updateStatus({ 
      status: 'error',
      message: error.message
    });
    console.error(`[CodeCraft] 任务失败: ${title}`, error);
    throw error;
  }
}

/**
 * 快速上报进度（适用于简单任务）
 * @param {string} message - 当前操作描述
 * @param {number} progress - 进度 0-100
 */
function reportProgress(message, progress) {
  dashboard.updateProgress(progress, message);
}

/**
 * 标记任务完成
 */
async function completeCurrentTask(summary) {
  await dashboard.completeTask({
    status: 'success',
    summary
  });
}

module.exports = {
  dashboard,
  withProgress,
  reportProgress,
  completeCurrentTask
};
