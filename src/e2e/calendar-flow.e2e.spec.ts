import { test, expect } from '@playwright/test';

test('일정 추가 → 수정 → 삭제가 event-list에 반영되는지 확인', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const listItems = page.locator('[data-testid="event-list"] > *');
  const initialCount = await listItems.count();

  // 일정 추가
  await page.getByRole('textbox', { name: '제목' }).fill('테스트');
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-04');
  await page.getByRole('textbox', { name: '시작 시간' }).fill('13:02');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('14:04');
  await page.getByTestId('event-submit-button').click();

  // 일정이 추가되었는지 확인 (전체 수 +1)
  await expect(listItems).toHaveCount(initialCount + 1);

  // '테스트'라는 제목을 가진 항목이 존재하는지 확인
  await expect(page.getByTestId('event-item').filter({ hasText: '테스트' })).toHaveCount(1);

  // 일정 수정
  await page
    .getByTestId('event-item')
    .filter({ hasText: '테스트' })
    .getByLabel('Edit event')
    .click();

  await page.getByRole('textbox', { name: '제목' }).fill('테스트-수정');
  await page.getByTestId('event-submit-button').click();

  // '테스트-수정'이라는 제목이 리스트에 있는지 확인
  await expect(page.getByTestId('event-item').filter({ hasText: '테스트-수정' })).toHaveCount(1);

  // 일정 삭제
  await page
    .getByTestId('event-item')
    .filter({ hasText: '테스트-수정' })
    .getByLabel('Delete event')
    .click();

  // 다시 리스트 길이가 initialCount로 돌아왔는지 확인
  await expect(listItems).toHaveCount(initialCount);
});
