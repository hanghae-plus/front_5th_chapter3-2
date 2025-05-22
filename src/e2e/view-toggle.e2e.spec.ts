import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request, page }) => {
  await request.post('http://localhost:3000/__reset');
  await page.goto('http://localhost:5173');
});

test('월/주 뷰 전환 시 팀 회의 일정이 유지되어야 한다', async ({ page }) => {
  // 월간 뷰에서 '팀 회의' 일정 확인
  await expect(page.getByTestId('month-view').getByText('팀 회의')).toBeVisible();

  // 주간 뷰 전환
  await page.getByLabel('view').selectOption('week');
  await expect(page.getByTestId('week-view').getByText('팀 회의')).toBeVisible();

  // 다시 월간 뷰 전환
  await page.getByLabel('view').selectOption('month');
  await expect(page.getByTestId('month-view').getByText('팀 회의')).toBeVisible();
});
