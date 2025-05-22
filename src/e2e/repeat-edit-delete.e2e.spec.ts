import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request, page }) => {
  await request.post('http://localhost:3000/__reset');
  await page.goto('http://localhost:5173');
});

test('반복 일정 중 하나를 수정/삭제해도 나머지는 유지되어야 한다', async ({ page }) => {
  const listItems = page.getByTestId('event-item');
  const titles = page.getByTestId('event-title');

  await page.getByRole('textbox', { name: '제목' }).fill('반복 테스트');
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-04');
  await page.getByRole('textbox', { name: '시작 시간' }).fill('12:00');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('13:00');
  await page.getByRole('textbox', { name: '설명' }).fill('반복 테스트 설명');
  await page.getByRole('textbox', { name: '위치' }).fill('회의실');
  await page.getByLabel('카테고리').selectOption('개인');
  await page.getByText('반복 일정').click();
  await page.getByLabel('반복 종료 방식').selectOption('count');
  await page.getByRole('spinbutton', { name: '반복 횟수' }).fill('3');
  await page.getByTestId('event-submit-button').click();

  await expect(titles.filter({ hasText: /^반복 테스트$/ })).toHaveCount(3);

  await listItems.filter({ hasText: '반복 테스트' }).nth(0).getByLabel('Edit event').click();

  await page.getByRole('textbox', { name: '제목' }).fill('수정 테스트');
  await page.getByText('반복 일정').click();
  await page.getByTestId('event-submit-button').click();

  await expect(titles.filter({ hasText: /^수정 테스트$/ })).toHaveCount(1);
  await expect(titles.filter({ hasText: /^반복 테스트$/ })).toHaveCount(2);

  await listItems.filter({ hasText: '반복 테스트' }).nth(1).getByLabel('Delete event').click();

  await expect(titles.filter({ hasText: /^수정 테스트$/ })).toHaveCount(1);
  await expect(titles.filter({ hasText: /^반복 테스트$/ })).toHaveCount(1);
});
