import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://localhost:5173/api/__reset');
});

test('단일 일정에 대하여 생성, 수정, 삭제를 할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill('영화');
  await page.getByText('날짜').click();
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-01');
  await page.getByText('시작 시간').click();
  await page.getByRole('textbox', { name: '시작 시간' }).fill('07:00');
  await page.getByText('종료 시간').click();
  await page.getByRole('textbox', { name: '종료 시간' }).fill('08:00');
  await page.getByTestId('event-submit-button').click();
  await expect(page.getByRole('cell', { name: '영화' }).locator('div').first()).toBeVisible();
  await page.getByTestId('event-list').locator('div').filter({ hasText: '영화' }).first().click();
  await expect(
    page.getByTestId('event-list').locator('div').filter({ hasText: '영화' }).first()
  ).toBeVisible();
  await page.getByRole('textbox', { name: '일정 검색' }).click();
  await page.getByRole('textbox', { name: '일정 검색' }).fill('영화');
  await expect(
    page.getByTestId('event-list').locator('div').filter({ hasText: '영화' }).first()
  ).toBeVisible();
  await page.getByRole('button', { name: 'Edit event' }).click();
  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill('달리기');
  await page.getByTestId('event-submit-button').click();
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
  await page.getByRole('textbox', { name: '일정 검색' }).click();
  await page.getByRole('textbox', { name: '일정 검색' }).fill('달리기');
  await expect(
    page.getByTestId('event-list').locator('div').filter({ hasText: '달리기' }).first()
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete event' }).click();
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
});
