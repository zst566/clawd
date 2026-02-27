#!/bin/bash
# Playwright 全局使用脚本
# 使用方法: ./global-playwright.sh <command>

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎭 Playwright 全局测试工具${NC}"
echo "=========================="

# 获取项目路径
PROJECT_DIR="/Volumes/SanDisk2T/dv-codeBase/茂名·交投-文旅平台/apps/mobile-h5"
TEST_URL="http://localhost"

# 创建截图目录
mkdir -p "$PROJECT_DIR/e2e/screenshots"

case "${1:-quick}" in
  "quick"|"q")
    echo -e "\n${YELLOW}运行快速测试...${NC}"
    # 切换到项目目录运行快速测试
    cd "$PROJECT_DIR"
    if [ -f "quick-test.ts" ]; then
      npx ts-node quick-test.ts
    else
      echo -e "${RED}quick-test.ts 不存在，运行基础测试${NC}"
      npx playwright test --project="Mobile Chrome" --headed
    fi
    ;;

  "screenshot"|"s")
    echo -e "\n${YELLOW}批量截图所有页面...${NC}"
    PAGES=(
      "http://localhost:首页"
      "http://localhost/login:登录页"
      "http://localhost/v2/carpool/create:拼车创建"
      "http://localhost/v2/attractions:景点"
      "http://localhost/v2/homestays:民宿"
      "http://localhost/v2/profile:个人中心"
    )

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    for PAGE in "${PAGES[@]}"; do
      IFS=':' read -r URL NAME <<< "$PAGE"
      echo "截图: $NAME"
      
      node -e "
        const { chromium } = require('@playwright/test');
        (async () => {
          const browser = await chromium.launch();
          const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
          const page = await context.newPage();
          try {
            await page.goto('$URL', { waitUntil: 'networkidle' });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: '$PROJECT_DIR/e2e/screenshots/${NAME}_${TIMESTAMP}.png', fullPage: true });
            console.log('  ✅ $NAME 截图完成');
          } catch (e) {
            console.log('  ❌ $NAME 失败:', e.message);
          }
          await browser.close();
        })();
      "
    done
    
    echo -e "\n${GREEN}截图保存到: e2e/screenshots/${NC}"
    ls -la "$PROJECT_DIR/e2e/screenshots/"
    ;;

  "api-check"|"a")
    echo -e "\n${YELLOW}检查 API 请求...${NC}"
    node -e "
      const { chromium } = require('@playwright/test');
      (async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
        const page = await context.newPage();
        
        const requests = [];
        const errors = [];
        
        page.on('request', req => {
          if (req.url().includes('/api/')) {
            requests.push({ url: req.url(), method: req.method() });
          }
        });
        
        page.on('response', async res => {
          if (res.url().includes('/api/') && res.status() >= 400) {
            errors.push({ url: res.url(), status: res.status() });
          }
        });
        
        await page.goto('http://localhost', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        
        console.log('\\n📊 API 监控结果');
        console.log('================');
        console.log('总 API 请求:', requests.length);
        console.log('API 错误:', errors.length);
        
        if (errors.length > 0) {
          console.log('\\n❌ 错误的请求:');
          errors.forEach(e => console.log('  -', e.url, '[', e.status, ']'));
        }
        
        await browser.close();
      })();
    "
    ;;

  "console"|"c")
    echo -e "\n${YELLOW}检查控制台错误...${NC}"
    node -e "
      const { chromium } = require('@playwright/test');
      (async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
        const page = await context.newPage();
        
        const errors = [];
        const warnings = [];
        
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
          if (msg.type() === 'warning') warnings.push(msg.text());
        });
        
        page.on('pageerror', err => {
          errors.push(err.message);
        });
        
        await page.goto('http://localhost', { waitUntil: 'networkidle' });
        
        // 滚动触发懒加载
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        console.log('\\n📝 控制台检查结果');
        console.log('==================');
        console.log('错误数:', errors.length);
        console.log('警告数:', warnings.length);
        
        if (errors.length > 0) {
          console.log('\\n❌ 错误:');
          errors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 100)));
        }
        
        await browser.close();
      })();
    "
    ;;

  "codegen"|"gen")
    echo -e "\n${YELLOW}启动录制模式...${NC}"
    echo -e "${GREEN}使用方法: 在打开的浏览器中操作，自动生成测试代码${NC}"
    npx playwright codegen http://localhost
    ;;

  "report"|"r")
    echo -e "\n${YELLOW}查看测试报告...${NC}"
    npx playwright show-report
    ;;

  "help"|"h"|*)
    echo -e "\n${YELLOW}可用命令:${NC}"
    echo "  quick, q       - 运行快速测试 (默认)"
    echo "  screenshot, s  - 批量截图所有页面"
    echo "  api-check, a   - 检查 API 请求"
    echo "  console, c     - 检查控制台错误"
    echo "  codegen, gen   - 录制测试脚本"
    echo "  report, r      - 查看测试报告"
    echo "  help, h        - 显示帮助"
    echo ""
    echo -e "${YELLOW}使用示例:${NC}"
    echo "  ./global-playwright.sh quick"
    echo "  ./global-playwright.sh screenshot"
    echo "  ./global-playwright.sh api-check"
    ;;
esac
