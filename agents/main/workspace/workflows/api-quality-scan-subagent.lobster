name: api-quality-scan
description: |
  API 质量扫描工作流 (智能多端版)
  
  使用 sessions_spawn 分配任务给子 Agent：
  - codecraft: 扫描/修复 API 问题
  - guardian: 代码评审
  - tester: 验证修复效果
  
  流程:
  1. 检测项目结构 → 2. 用户选择目标 → 3. 扫描 → 4. 分析 → 5. 修复 → 6. 评审 → 7. 验证 → 8. 报告

args:
  projectPath:
    description: 项目根目录路径
  apiServer:
    description: API 测试服务器地址
  fixThreshold:
    description: 修复并行阈值
    default: 3
  reviewThreshold:
    description: 评审并行阈值
    default: 2
  targetApp:
    description: 目标扫描应用（可选，不指定则让用户选择）
    default: ""
