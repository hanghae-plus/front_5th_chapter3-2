import { test, expect } from '@playwright/test';

test('1. 초기 페이지에 올바르게 접속할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await expect(page).toHaveURL('http://localhost:5173/');
});
