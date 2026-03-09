# Agent Browser 技能分析报告

**分析日期**: 2026-03-08

---

## 技能基本信息

| 项目 | 值 |
|------|-----|
| **技能名称** | Agent Browser |
| **官方描述** | A fast Rust-based headless browser automation CLI with Node.js fallback that enables AI agents to navigate, click, type, and snapshot pages via structured commands. |
| **GitHub** | https://github.com/vercel-labs/agent-browser |
| **维护者** | Vercel Labs |
| **Stars** | 活跃项目 |

---

## 功能评估

### 官方声称的功能

1. ✅ 浏览器导航和交互 (click, fill, type, hover)
2. ✅ 表单自动化填写
3. ✅ 页面快照 (snapshot with refs)
4. ✅ 状态保存和恢复 (session, state save/load)
5. ✅ 截图和 PDF 生成
6. ✅ 网络拦截和 Mock
7. ✅ 多标签页和窗口管理
8. ✅ 设备模拟 (viewport, geo, offline)
9. ✅ 视频录制

### 实际功能验证

| 功能 | 状态 | 备注 |
|------|------|------|
| 基础交互 | ✅ 可用 | click, fill, type 等命令正常工作 |
| Snapshot | ✅ 可用 | -i 参数获取可交互元素 |
| Session 状态 | ⚠️ 有问题 | 见下方 Issue |
| 设备模拟 | ✅ 可用 | 支持 viewport, geo, device |
| 网络拦截 | ✅ 可用 | 支持 mock 和 abort |

---

## 用户反馈分析

### 发现的 Issue

**Issue #677 (2026-03-06)**: `--session-name` 在 macOS 上无法正确保存和恢复状态

- 问题：会话关闭后重新打开，localStorage 和 cookies 丢失
- 环境：macOS 26.3, agent-browser 0.16.3
- 临时解决方案：使用 `--profile` 或 `state save/load`

**活跃 Issues 数量**: 146 个 (活跃维护中)

### 用户体验总结

| 维度 | 评分 | 说明 |
|------|------|------|
| **性能** | ⭐⭐⭐⭐⭐ | Rust 实现，速度很快 |
| **易用性** | ⭐⭐⭐⭐ | CLI 直观，文档完善 |
| **稳定性** | ⭐⭐⭐⭐ | 大多数场景稳定，小问题存在 |
| **功能完整性** | ⭐⭐⭐⭐⭐ | 功能非常全面 |
| **社区活跃度** | ⭐⭐⭐⭐⭐ | Vercel Labs 维护，更新频繁 |

---

## 效果对比

### 描述 vs 实际

| 官方描述 | 实际情况 |
|---------|---------|
| "Fast Rust-based" | ✅ 确实很快 |
| "headless browser automation" | ✅ 完全支持 |
| "session state save/restore" | ⚠️ macOS 有 bug，但有 workaround |
| "network interception" | ✅ 功能正常 |

---

## 推荐指数

**⭐⭐⭐⭐ (4/5)**

### 优点
- 性能优秀 (Rust + Playwright)
- 功能全面
- Vercel 官方维护
- 文档详细
- 支持 headed 模式调试

### 缺点
- Session 状态保存在 macOS 有 bug
- 需要安装 Chromium
- 依赖 Node.js 环境

### 适用场景
- 浏览器自动化测试 ✅
- 网页数据抓取 ✅
- 表单自动填写 ✅
- E2E 测试 ✅
- 回归测试 ✅

---

## 结论

**推荐使用** - Agent Browser 是一个功能强大且维护活跃的浏览器自动化工具。虽然在 macOS 上 session 状态保存有小 bug，但有明确的 workaround。对于回归测试和 E2E 测试场景非常适合。

---

*报告生成时间: 2026-03-08 10:45*
