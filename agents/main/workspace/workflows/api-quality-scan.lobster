name: api-quality-scan
description: |
  API 质量扫描工作流 (智能多端版)
  
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

steps:
  # ========== Step 1: 检测项目结构 ==========
  - id: detect
    command: "echo '请在下一步指定 projectPath 参数'"
    description: 检测项目结构，列出可扫描的目标

  # ========== Step 2: 用户选择目标 ==========
  - id: select
    command: "echo '请选择要扫描的目标'"
    description: 用户选择要扫描的目标

  # ========== Step 3: 扫描 API ==========
  - id: scan
    command: "echo '扫描 API - 需要调用 api-map 技能'"
    description: 调用 api-map 技能扫描 API

  # ========== Step 4: 分析结果 ==========
  - id: analyze
    command: "echo '分析扫描结果'"
    description: 分析扫描结果，提取问题列表

  # ========== Step 5: 修复 ==========
  - id: fix
    command: "echo '修复问题'"
    description: 调用 codecraft 修复问题

  # ========== Step 6: 评审 ==========
  - id: review
    command: "echo '代码评审'"
    description: 调用 guardian 评审代码

  # ========== Step 7: 验证 ==========
  - id: verify
    command: "echo '验证修复'"
    description: 重新扫描验证修复效果

  # ========== Step 8: 报告 ==========
  - id: report
    command: "echo '生成最终报告'"
    description: 生成最终报告
