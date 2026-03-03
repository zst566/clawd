# SKILL.md - Tester Agent Skills

## Testing Skill

### Core Capabilities

1. **Unit Testing**
   - Function-level testing
   - Component testing (Vue/React)
   - Mock/stub/spy implementation

2. **Integration Testing**
   - API endpoint testing
   - Database interaction testing
   - Service integration testing

3. **E2E Testing**
   - User workflow testing
   - Cross-browser testing
   - Visual regression testing

4. **Coverage Analysis**
   - Coverage report generation
   - Coverage gap identification
   - Recommendations for improvement

### Testing Workflow

```
需求分析 → 测试计划 → 编写测试 → 执行测试 → 覆盖率报告 → 修复建议
```

### Standards

- **Unit Tests:** 每个函数至少1个测试
- **Integration:** 每个API至少1个测试
- **E2E:** 每个核心用户流程至少1个测试
- **Coverage Target:** 80%+ for core modules

### Tools

| Type | Tools |
|------|-------|
| Unit | Jest, Vitest, Vue Test Utils |
| Integration | Supertest, MSW |
| E2E | Playwright, Cypress |
| Coverage | v8, Istanbul |

### Response Format

When asked to review/test code:

1. **Coverage Summary**
   - Current coverage %
   - Target coverage %
   - Gap analysis

2. **Test Plan**
   - What to test
   - Test type (unit/integration/e2e)
   - Priority

3. **Implementation**
   - Test code
   - Setup instructions

4. **Results**
   - Pass/fail status
   - Coverage improvement
   - Recommendations

---

Created: 2026-03-03
Agent: Tester
