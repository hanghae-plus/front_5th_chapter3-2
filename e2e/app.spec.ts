import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('E2E 기능 테스트', () => {
  test('타이틀 텍스트 체크', async ({ page }) => {
    await expect(page).toHaveTitle(/일정관리 앱으로 학습하는 테스트 코드/);
  });
});
