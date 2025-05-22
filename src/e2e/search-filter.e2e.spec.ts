import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request, page }) => {
  await request.post('http://localhost:3000/__reset'); // 초기화
  await page.goto('http://localhost:5173');
});

test('검색 → 수정 → 삭제 → 검색 결과 없음 반영 확인', async ({ page }) => {
  // 기존 일정 '팀 회의' 검색
  await page.getByRole('textbox', { name: '일정 검색' }).fill('팀 회의');

  // 검색 검증
  const eventItem = page.getByTestId('event-item').filter({ hasText: '팀 회의' });
  await expect(eventItem).toContainText('팀 회의');

  // 수정 버튼 클릭
  await eventItem.getByLabel('Edit event').click();

  // 제목 수정 후 저장
  await page.getByRole('textbox', { name: '제목' }).fill('팀 회의 - 수정');
  await page.getByTestId('event-submit-button').click();

  // 수정된 제목으로 재검색
  await page.getByRole('textbox', { name: '일정 검색' }).fill('팀 회의 - 수정');

  // 검색 검증
  const updatedEventItem = page.getByTestId('event-item').filter({ hasText: '팀 회의 - 수정' });
  await expect(updatedEventItem).toContainText('팀 회의 - 수정');

  // 삭제 후 결과 없음 메시지 확인
  await updatedEventItem.getByLabel('Delete event').click();
  await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
});
