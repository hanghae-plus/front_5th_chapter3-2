import { test, expect } from '@playwright/test';

test('홈페이지 렌더링', async ({ page }) => {
  // 개발 서버 먼저 켜 두세요: pnpm start
  await page.goto('/');
});
