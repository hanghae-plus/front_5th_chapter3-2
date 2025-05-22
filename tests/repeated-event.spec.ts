import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://localhost:5173/api/__reset');
});

test('반복 일정(종료조건: 종료일)에 대하여 생성, 수정, 삭제를 할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill('');
  await page.getByRole('textbox', { name: '제목' }).fill('반복일정');
  await page.getByText('날짜').click();
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-01-31');
  await page.getByText('시작 시간').click();
  await page.getByRole('textbox', { name: '시작 시간' }).fill('07:00');
  await page.getByText('종료 시간').click();
  await page.getByRole('textbox', { name: '종료 시간' }).fill('08:00');
  await page.locator('span').first().click();
  await page.getByLabel('반복 유형').selectOption('monthly');
  await page.getByRole('textbox', { name: '반복 종료일' }).fill('2025-05-31');
  await page.getByTestId('event-submit-button').click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.getByRole('button', { name: 'Edit event' }).click();
  await page.getByText('제목').click();
  await page.getByRole('textbox', { name: '제목' }).fill('수정된 단일 일정');
  await page.getByText('날짜').click();
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-03-27');
  await page.getByTestId('event-submit-button').click();
  await expect(
    page.getByTestId('event-list').locator('div').filter({ hasText: '수정된 단일 일정' }).nth(1)
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('cell', { name: '반복일정' }).locator('div').first()).toBeVisible();
  await page
    .getByTestId('event-list')
    .locator('div')
    .filter({ hasText: '반복일정' })
    .nth(1)
    .click();
  await page.locator('div:nth-child(7) > div > div:nth-child(2) > button:nth-child(2)').click();
  await page.getByRole('textbox', { name: '일정 검색' }).click();
  await page.getByRole('textbox', { name: '일정 검색' }).fill('반복');
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
});

test('반복 일정(종료조건: 반복 횟수)에 대하여 생성, 수정, 삭제를 할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill('4번 반복 일정');
  await page.getByText('날짜').click();
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-01');
  await page.getByText('시작 시간').click();
  await page.getByRole('textbox', { name: '시작 시간' }).fill('07:00');
  await page.getByText('종료 시간').click();
  await page.getByRole('textbox', { name: '종료 시간' }).fill('08:00');
  await page.locator('span').first().click();
  await page.getByLabel('반복 유형').selectOption('weekly');
  await page.getByLabel('반복 종료 조건').selectOption('count');
  await page.getByRole('spinbutton', { name: '반복 횟수' }).click();
  await page.getByRole('spinbutton', { name: '반복 횟수' }).fill('4');
  await page.getByTestId('event-submit-button').click();
  await page.getByRole('textbox', { name: '일정 검색' }).click();
  await page.getByRole('textbox', { name: '일정 검색' }).fill('반복 일정');
  const allRepeatedEvents = page.getByRole('cell', { name: '4번 반복 일정' }).all();
  await expect(await allRepeatedEvents).toHaveLength(4);
  for (const event of await allRepeatedEvents) {
    await expect(event).toBeVisible();
  }
  await page.getByRole('button', { name: 'Delete event' }).first().click();
  await page.getByRole('button', { name: 'Edit event' }).first().click();
  await page.getByRole('textbox', { name: '제목' }).dblclick();
  await page.getByText('제목').click();
  await page.getByRole('textbox', { name: '제목' }).fill('반복 일정 수정');
  await page.getByTestId('event-submit-button').click();
  await expect(
    page.getByRole('cell', { name: '반복 일정 수정' }).locator('div').first()
  ).toBeVisible();
});
