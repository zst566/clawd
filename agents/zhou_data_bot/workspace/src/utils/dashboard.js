/**
 * 数据助理 - Dashboard SDK 集成
 * 
 * 用于实时上报数据分析状态到龙虾任务看板
 */

const { AgentSDK } = require('/Volumes/SanDisk2T/dv-codeBase/claw-dashboard/sdk');

// 初始化 SDK
const dashboard = new AgentSDK({
  agentId: 'data_bot',
  name: '数据助理',
  apiUrl: process.env.DASHBOARD_API_URL || 'http://localhost:3000',
  wsUrl: process.env.DASHBOARD_WS_URL || 'http://localhost:3000'
});

// 启动自动心跳
dashboard.startHeartbeat();
console.log('[DataBot Dashboard] SDK 已启动，开始上报分析状态');

/**
 * 数据分析任务包装器，自动上报进度
 * @param {string} taskId - 任务ID
 * @param {Object} options - 分析选项
 * @param {Function} analyzeFn - 实际分析函数
 */
async function withAnalysisProgress(taskId, options, analyzeFn) {
  const { title, dataSource, totalRows } = options;
  
  try {
    // 开始任务
    await dashboard.startTask(taskId, { 
      type: 'data_analysis', 
      title: title || `分析 ${dataSource}`
    });
    console.log(`[DataBot] 开始分析: ${title}`);
    
    // 执行分析，自动上报进度
    const startTime = Date.now();
    let processedRows = 0;
    
    const updateProgress = (rowsProcessed, message) => {
      processedRows = rowsProcessed;
      const progress = totalRows 
        ? Math.min(100, Math.round((rowsProcessed / totalRows) * 100))
        : Math.min(100, Math.round((rowsProcessed / 1000) * 100)); // 默认按1000行估算
      
      dashboard.updateProgress(progress, message || `已处理 ${rowsProcessed} 行`);
    };
    
    const result = await analyzeFn(updateProgress);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // 完成分析
    await dashboard.completeTask({ 
      status: 'success',
      summary: `分析完成: ${processedRows} 行数据, 耗时 ${duration}s`
    });
    console.log(`[DataBot] 分析完成: ${processedRows} 行, ${duration}s`);
    
    return result;
  } catch (error) {
    await dashboard.updateStatus({ 
      status: 'error',
      message: error.message
    });
    console.error(`[DataBot] 分析失败:`, error);
    throw error;
  }
}

/**
 * 批量处理数据，自动分批上报进度
 * @param {Array} items - 数据项数组
 * @param {Function} processFn - 处理函数
 * @param {Object} options - 选项
 */
async function processBatch(items, processFn, options = {}) {
  const { taskId, title, batchSize = 100 } = options;
  
  await dashboard.startTask(taskId, {
    type: 'data_processing',
    title: title || '批量数据处理'
  });
  
  const results = [];
  const total = items.length;
  
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // 处理本批次
    const batchResults = await Promise.all(
      batch.map(item => processFn(item))
    );
    results.push(...batchResults);
    
    // 上报进度
    const progress = Math.round(((i + batch.length) / total) * 100);
    dashboard.updateProgress(progress, `已处理 ${i + batch.length}/${total}`);
  }
  
  await dashboard.completeTask({
    status: 'success',
    summary: `处理完成: ${results.length} 条数据`
  });
  
  return results;
}

/**
 * 快速上报当前分析状态
 * @param {string} message - 状态描述
 * @param {number} progress - 进度 0-100
 */
function reportAnalysisStatus(message, progress) {
  dashboard.updateProgress(progress, message);
}

module.exports = {
  dashboard,
  withAnalysisProgress,
  processBatch,
  reportAnalysisStatus
};
