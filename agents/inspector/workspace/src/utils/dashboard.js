/**
 * Inspector - Dashboard SDK 集成
 * 质量审查智能体
 */

const { AgentSDK } = require('/Volumes/SanDisk2T/dv-codeBase/claw-dashboard/sdk');

const dashboard = new AgentSDK({
  agentId: 'inspector',
  name: '质量审查',
  apiUrl: process.env.DASHBOARD_API_URL || 'http://localhost:3000',
  wsUrl: process.env.DASHBOARD_WS_URL || 'http://localhost:3000'
});

dashboard.startHeartbeat();
console.log('[Inspector Dashboard] SDK 已启动');

async function withCodeReview(taskId, options, reviewFn) {
  const { title, prUrl, files } = options;
  
  await dashboard.startTask(taskId, { 
    type: 'code_review', 
    title: title || `审查 ${files?.length || 0} 个文件`
  });
  
  try {
    let reviewedFiles = 0;
    
    const result = await reviewFn((fileName) => {
      reviewedFiles++;
      const progress = files?.length 
        ? Math.round((reviewedFiles / files.length) * 100)
        : Math.min(100, reviewedFiles * 10);
      dashboard.updateProgress(progress, `审查 ${fileName}`);
    });
    
    await dashboard.completeTask({ 
      status: 'success',
      summary: `审查完成: ${reviewedFiles} 个文件, ${result.issues?.length || 0} 个问题`
    });
    
    return result;
  } catch (error) {
    await dashboard.updateStatus({ status: 'error', message: error.message });
    throw error;
  }
}

module.exports = { dashboard, withCodeReview };
