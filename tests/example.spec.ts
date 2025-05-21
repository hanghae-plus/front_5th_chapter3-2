import { expect, test } from '@playwright/test';

test('일정 페이지가 정상적으로 열림', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('일정 추가')).toBeVisible();
});
