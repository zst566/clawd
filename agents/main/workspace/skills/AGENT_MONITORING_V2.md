# 智能体工作状态监控机制（改进版）

## 问题发现

**现象**：
- 子任务汇报显示"已完成"
- 但Git没有代码提交
- 码匠session中没有实际工作内容
- 长时间没有AI模型调用

**根因**：
1. 子任务可能执行了但没有正确提交代码
2. 或者子任务在错误的工作目录执行
3. 或者子任务汇报不准确

---

## 改进后的监控机制

### 1. 任务完成验证清单（必须检查）

子任务汇报"完成"后，必须验证：

```javascript
// 验证清单
const verificationChecklist = {
  // 1. Git提交验证
  gitCommits: async () => {
    const commits = await exec("git log --oneline -5");
    return commits.includes(expectedCommitMessage);
  },
  
  // 2. 文件存在验证
  filesExist: async () => {
    for (const file of expectedFiles) {
      const exists = await checkFileExists(file);
      if (!exists) return false;
    }
    return true;
  },
  
  // 3. 代码内容验证（抽样）
  codeContent: async () => {
    const content = await read(keyFile);
    return content.includes(expectedKeyword);
  },
  
  // 4. Session历史验证
  sessionActivity: async () => {
    const history = await sessions_history({sessionKey, limit: 20});
    return history.messages.length > 5; // 有实际工作内容
  }
};
```

### 2. 长时间无响应检测

```javascript
// 检测智能体是否空闲
async function checkAgentIdleStatus(agentId, sessionKey) {
  // 检查最近30分钟是否有活动
  const subagents = await subagents_list({recentMinutes: 30});
  const activeRuns = subagents.filter(s => s.label.includes(projectName));
  
  if (activeRuns.length === 0) {
    // 检查session历史
    const history = await sessions_history({sessionKey, limit: 10});
    const lastActivity = history.messages[history.messages.length - 1]?.timestamp;
    const idleTime = Date.now() - lastActivity;
    
    if (idleTime > 30 * 60 * 1000) { // 30分钟无活动
      return {
        status: 'IDLE',
        idleTimeMinutes: Math.floor(idleTime / 60000),
        action: '需要询问码匠状态'
      };
    }
  }
  
  return {status: 'ACTIVE'};
}
```

### 3. 代码提交强制验证

```javascript
// 子任务完成后必须执行
async function verifyTaskCompletion(subagentResult) {
  // 1. 检查Git提交
  const gitStatus = await exec("git status --short");
  const gitLog = await exec("git log --oneline -3");
  
  // 2. 检查文件
  const filesStatus = await Promise.all(
    expectedFiles.map(async (file) => ({
      file,
      exists: await checkFileExists(file),
      size: await getFileSize(file)
    }))
  );
  
  // 3. 验证报告
  const verificationReport = {
    gitCommits: gitLog,
    uncommittedChanges: gitStatus,
    files: filesStatus,
    allVerified: filesStatus.every(f => f.exists && f.size > 0)
  };
  
  if (!verificationReport.allVerified) {
    // 标记任务未完成，需要重新执行
    return {
      status: 'INCOMPLETE',
      report: verificationReport,
      action: 'REASSIGN_TASK'
    };
  }
  
  return {
    status: 'VERIFIED',
    report: verificationReport
  };
}
```

### 4. 主动询问机制

```javascript
// 如果检测到空闲，主动询问
async function proactiveCheck(agentId, sessionKey) {
  const idleStatus = await checkAgentIdleStatus(agentId, sessionKey);
  
  if (idleStatus.status === 'IDLE') {
    // 主动询问
    await sessions_send({
      sessionKey,
      message: `@${agentId} 进度检查：
      
1. 当前任务完成百分比？
2. 是否有阻塞问题？
3. Git提交记录在哪里？

请立即回复！`
    });
    
    // 等待回复（超时5分钟）
    await waitForResponse(sessionKey, 5 * 60 * 1000);
  }
}
```

### 5. 多维度验证报告

每次汇报必须包含：
- ✅ Git提交哈希
- ✅ 文件列表及大小
- ✅ 关键代码片段（抽样）
- ✅ 测试结果（如有）
- ✅ 下一步计划

---

## 实施计划

1. **立即实施**：对当前阶段3进行强制验证
2. **短期实施**：在每次子任务完成后自动执行验证清单
3. **长期实施**：开发通用的任务完成验证中间件

---

*制定时间: 2026-03-05*
