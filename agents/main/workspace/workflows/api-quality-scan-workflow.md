# api-quality-scan 工作流实现

## 方式：用 sessions_spawn 编排任务

这个工作流不需要 lobster 文件，而是直接在 main agent 中用 `sessions_spawn` 编排。

---

## 工作流步骤

### Step 1: 检测项目结构
```
main agent 执行：
1. 列出 ${projectPath}/apps/ 下的所有子目录
2. 列出所有可扫描的目标
3. 生成选择列表供用户确认
```

### Step 2: 用户选择目标
```
用户回复要扫描的目标（如：mobile-h5）
确定最终扫描路径：${projectPath}/apps/${targetApp}
```

### Step 3: 扫描 API
```
sessions_spawn:
  agentId: codecraft
  task: |
    请执行以下操作：
    1. 加载 api-map 技能 (~/.kimi/skills/api-map/SKILL.md)
    2. 扫描项目 ${projectPath}/apps/${targetApp}
    3. 使用服务器 ${apiServer} 测试
    4. 生成扫描报告，保存到 ~/clawd/agents/main/workspace/docs/api-map/${targetApp}-$(date +%Y%m%d).md
```

### Step 4: 分析结果
```
main agent 执行：
1. 读取扫描报告
2. 列出问题数量和类型
3. 决定修复方式（串行/并行）
```

### Step 5: 修复
```
sessions_spawn:
  agentId: codecraft
  task: 修复扫描发现的问题
```

### Step 6: 评审
```
sessions_spawn:
  agentId: guardian
  task: 评审修复的代码
```

### Step 7: 验证
```
sessions_spawn:
  agentId: tester
  task: 重新扫描验证修复效果
```

### Step 8: 报告
```
main agent:
生成最终报告，汇总所有结果
```

---

## 启动方式

直接在 main session 中输入：

```
启动 api-quality-scan 工作流
projectPath: ~/dv-codeBase/茂名·交投-文旅平台
apiServer: http://192.168.31.188
```

main agent 会自动执行上述流程。
