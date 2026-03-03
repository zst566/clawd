# TOOLS.md - Local Notes

## Testing Frameworks

### Frontend (Vue/React)
- **Vitest** - Unit testing
- **Vue Test Utils** - Vue component testing
- **Playwright** - E2E testing

### Backend (Node.js)
- **Jest** - Unit testing
- **Supertest** - API testing

### Coverage
- **v8** coverage - Built-in
- **Istanbul** - Coverage reports

## Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run specific test file
npm test -- src/utils/auth.test.ts
```
