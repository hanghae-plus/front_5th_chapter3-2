import { test, expect } from '@playwright/test';

test('새로운 일정을 만들면, 일정 목록에 추가된다.', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.getByLabel('제목').fill('새 회의');
  await page.getByLabel('날짜').fill('2025-10-15');
  await page.getByLabel('시작 시간').fill('14:00');
  await page.getByLabel('종료 시간').fill('15:00');
  await page.getByLabel('설명').fill('프로젝트 진행 상황 논의');
  await page.getByLabel('위치').fill('회의실 A');
  await page.getByLabel('카테고리').selectOption('업무');

  await page.getByTestId('event-submit-button').click();

  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('새 회의')).toBeVisible();
  await expect(eventList.getByText('2025-10-15')).toBeVisible();
  await expect(eventList.getByText('14:00 - 15:00')).toBeVisible();
  await expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeVisible();
  await expect(eventList.getByText('회의실 A')).toBeVisible();
  await expect(eventList.getByText('카테고리: 업무')).toBeVisible();
});

test('기존의 일정을 수정할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.getByLabel('Edit event').click();

  const titleInput = page.getByLabel('제목');
  await titleInput.fill('');
  await titleInput.type('수정된 회의');

  const descInput = page.getByLabel('설명');
  await descInput.fill('');
  await descInput.type('회의 내용 변경');

  await page.getByTestId('event-submit-button').click();

  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('수정된 회의')).toBeVisible();
  await expect(eventList.getByText('회의 내용 변경')).toBeVisible();
});

test('기존의 일정을 삭제할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('삭제할 이벤트')).toBeVisible();

  const deleteButtons = await page.getByLabel('Delete event').all();
  await deleteButtons[0].click();

  await expect(eventList.getByText('삭제할 이벤트')).not.toBeVisible();
});
