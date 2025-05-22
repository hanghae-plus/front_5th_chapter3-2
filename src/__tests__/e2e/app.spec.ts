import { test, expect } from '@playwright/test';

test('단일 일정 추가 e2e 테스트', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-05-23T10:00:00'));
  await page.goto('/');

  await page.getByRole('textbox', { name: '제목' }).fill('e2e 테스트');
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-23');
  await page.getByRole('textbox', { name: '시작 시간' }).fill('01:00');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('02:00');
  await page.getByRole('textbox', { name: '설명' }).fill('e2e 테스트 설명');
  await page.getByRole('textbox', { name: '위치' }).fill('e2e 테스트 위치');
  await page.getByLabel('카테고리').selectOption('업무');
  await page.getByTestId('event-submit-button').click();

  await expect(page.getByTestId('event-list')).toContainText('e2e 테스트');
  await expect(page.getByTestId('event-list')).toContainText('e2e 테스트 설명');
  await expect(page.getByTestId('event-list')).toContainText('e2e 테스트 위치');
  await expect(page.getByTestId('month-view')).toContainText('e2e 테스트');
});
