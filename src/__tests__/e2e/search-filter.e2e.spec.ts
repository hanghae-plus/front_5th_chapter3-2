import { expect, test } from '@playwright/test';

// 일정 추가 후 검색 필터 잘되는지 e2e 테스트

test('검색창에 키워드를 입력하면 해당 일정만 필터링된다', async ({ page }) => {
  await page.goto('/');

  // 일정 A 생성

  await page.getByLabel('제목').fill('팀 회의');
  await page.getByLabel('날짜').fill('2025-05-27');
  await page.getByLabel('시작 시간').fill('14:00');
  await page.getByLabel('종료 시간').fill('15:00');
  await page.getByLabel('설명').fill('E2E 테스트 일정');
  await page.getByLabel('위치').fill('회의실 A');
  await page.getByLabel('카테고리').selectOption('업무');
  await page.getByTestId('event-submit-button').click();

  // 일정 B 생성
  await page.getByLabel('제목').fill('커피챗');
  await page.getByLabel('날짜').fill('2025-05-28');
  await page.getByLabel('시작 시간').fill('16:00');
  await page.getByLabel('종료 시간').fill('17:00');
  await page.getByLabel('설명').fill('E2E 테스트 관련');
  await page.getByLabel('위치').fill('회의실 B');
  await page.getByLabel('카테고리').selectOption('업무');
  await page.getByTestId('event-submit-button').click();

  await page.getByPlaceholder('검색어를 입력하세요').fill('커피챗');

  const eventList = page.getByTestId('event-list');
  await expect(eventList.locator('text=커피챗')).toBeVisible();

  await expect(eventList.locator('text=팀 회의')).not.toBeVisible();

  // 검색어 지우기
  await page.getByPlaceholder('검색어를 입력하세요').fill('');

  // 다시 둘 다 보여야 함
  await expect(eventList.locator('text=커피챗')).toBeVisible();
  await expect(eventList.locator('text=팀 회의')).toBeVisible();
});
