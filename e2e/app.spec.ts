import { test, expect } from '@playwright/test';

test.describe('App 전체 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/reset');
    await page.goto('http://localhost:5173/');
  });
  test('단일 일정 추가 테스트', async ({ page }) => {
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-22');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByText('반복 일정').click();

    await page.getByTestId('event-submit-button').click();

    await expect(page.getByTestId('month-view').getByText('테스트')).toBeVisible();
  });
});
