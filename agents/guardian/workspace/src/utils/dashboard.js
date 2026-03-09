/**
 * Guardian - Dashboard SDK 集成
 * 安全审查智能体
 */

const { AgentSDK } = require('/Volumes/SanDisk2T/dv-codeBase/claw-dashboard/sdk');

const dashboard = new AgentSDK({
  agentId: 'guardian',
  name: '安全审查',
  apiUrl: process.env.DASHBOARD_API_URL || 'http://localhost:3000',
  wsUrl: process.env.DASHBOARD_WS_URL || 'http://localhost:3000'
});

dashboard.startHeartbeat();
console.log('[Guardian Dashboard] SDK 已启动');

async function withSecurityScan(taskId, options, scanFn) {
  const { title, target } = options;
  
  await dashboard.startTask(taskId, { 
    type: 'security_scan', 
    title: title || `安全扫描 ${target}`
  });
  
  try {
    const result = await scanFn((progress, message) => {
      dashboard.updateProgress(progress, message);
    });
    
    await dashboard.completeTask({ 
      status: 'success',
      summary: `扫描完成: 发现 ${result.vulnerabilities?.length || 0} 个问题`
    });
    
    return result;
  } catch (error) {
    await dashboard.updateStatus({ status: 'error', message: error.message });
    throw error;
  }
}

module.exports = { dashboard, withSecurityScan };
