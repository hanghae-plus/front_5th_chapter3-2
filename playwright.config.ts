import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'src/__tests__/e2e',
  testMatch: /.*\.spec\.ts/,
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm run start',
    port: 5173,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
});
