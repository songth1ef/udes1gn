import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 配置（H 测试）。
 * - 单 worker、串行：E2E 主链路有状态（注册→登录→发提案→投票），避免并发互扰。
 * - webServer：复用已 build 的 standalone 产物，由 `npm run start` 起在 3000。
 *   NEXTAUTH_URL 也是 3000，credentials session 才能正常签发。
 * - 失败留痕：trace + 截图；响应式用例主动截图到 e2e/screenshots。
 */
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'e2e/.report/results.json' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
