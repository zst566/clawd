const axios = require('axios');

class TelegramNotifier {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(text, options = {}) {
    if (!this.botToken || !this.chatId) {
      console.log('[Telegram] 未配置，跳过发送:', text);
      return { ok: false, error: '未配置 Telegram' };
    }

    try {
      const response = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      });
      return { ok: true, data: response.data };
    } catch (err) {
      console.error('[Telegram] 发送失败:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // 任务分配通知
  async notifyTaskAssigned(task, agent, instance) {
    const text = `
🎯 <b>新任务分配</b>

📋 <b>${task.title}</b>
🤖 分配给: ${agent.name} ${instance ? `(${instance})` : ''}
📊 优先级: ${'⭐'.repeat(task.priority)}
⏱️ 预计耗时: ${task.estimated_duration || '未设置'} 分钟

${task.description ? `📝 ${task.description}` : ''}

请尽快确认并开始执行！
    `.trim();

    return this.sendMessage(text);
  }

  // 任务状态变更通知
  async notifyTaskStatusChanged(task, oldStatus, newStatus, agent) {
    const statusEmoji = {
      'pending': '⏳',
      'assigned': '📋',
      'running': '🔄',
      'paused': '⏸️',
      'completed': '✅',
      'failed': '❌'
    };

    const text = `
${statusEmoji[newStatus] || '📌'} <b>任务状态更新</b>

📋 <b>${task.title}</b>
🤖 ${agent ? `执行者: ${agent.name}` : ''}
📊 状态: ${oldStatus} → <b>${newStatus}</b>
    `.trim();

    return this.sendMessage(text);
  }

  // 智能体进入工作间通知
  async notifyAgentEnteredWorkshop(agent, instance) {
    const text = `
🏭 <b>${agent.name}</b> 已进入工作间

${instance ? `实例: ${instance}` : ''}
状态: 🔄 开始工作

祝工作顺利！💪
    `.trim();

    return this.sendMessage(text);
  }

  // 任务完成通知
  async notifyTaskCompleted(task, agent, duration) {
    const text = `
✅ <b>任务完成</b>

📋 <b>${task.title}</b>
🤖 执行者: ${agent.name}
⏱️ 实际耗时: ${Math.round(duration)} 分钟

辛苦啦！🎉
    `.trim();

    return this.sendMessage(text);
  }

  // 异常告警
  async notifyError(title, message) {
    const text = `
🚨 <b>系统告警</b>

⚠️ ${title}
${message}

请及时处理！
    `.trim();

    return this.sendMessage(text);
  }
}

module.exports = TelegramNotifier;
