import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request, page }) => {
  await request.post('http://localhost:3000/__reset');
  await page.goto('http://localhost:5173');
});

test('동일 시간대에 중복 일정 추가 시 충돌 경고 메시지가 표시되어야 한다', async ({ page }) => {
  // ⚠️ 운동 일정과 동일한 시간에 새로운 일정 추가 시도
  await page.getByRole('textbox', { name: '제목' }).fill('충돌 테스트');
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-22');
  await page.getByRole('textbox', { name: '시작 시간' }).fill('18:00');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('19:00');
  await page.getByTestId('event-submit-button').click();

  // ❗ 충돌 경고 메시지 노출 확인
  await expect(page.getByText('일정 겹침 경고')).toBeVisible();
});
