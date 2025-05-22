/** 일정 생성 -> 조회 -> 일정 수정 -> 일정 삭제 */
import { expect, test } from '@playwright/test';

test('사용자는 캘린더에서 일정을 추가, 수정, 삭제할 수 있다', async ({ page }) => {
  await page.goto('/');

  //일정 추가
  await page.getByLabel('제목').fill('팀 회의');
  await page.getByLabel('날짜').fill('2025-05-09');
  await page.getByLabel('시작 시간').fill('14:00');
  await page.getByLabel('종료 시간').fill('15:00');
  await page.getByLabel('설명').fill('E2E 테스트 일정');
  await page.getByLabel('위치').fill('회의실 A');
  await page.getByLabel('카테고리').selectOption('업무');
  await page.getByTestId('event-submit-button').click();

  // 2. 추가 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList.locator('text=팀 회의')).toBeVisible();
  await expect(eventList.locator('text=2025-05-09')).toBeVisible();

  // 3. 수정
  await page
    .getByTestId(/^edit-event-button-/)
    .first()
    .click();
  await page.getByLabel('제목').fill('팀 회의(수정됨)');
  await page.getByTestId('event-submit-button').click();
  await expect(eventList.locator('text=팀 회의(수정됨)')).toBeVisible();

  // 4. 삭제
  await page.getByRole('button', { name: 'Delete event' }).nth(0).click();
  await expect(eventList.locator('text=팀 회의(수정됨)')).not.toBeVisible();
});
