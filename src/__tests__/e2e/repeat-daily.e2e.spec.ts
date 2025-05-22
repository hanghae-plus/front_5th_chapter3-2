import { expect, test } from '@playwright/test';

// 반복 일정 생성 테스트

test('매일 반복 일정을 생성하면 여러 날짜에 표시된다', async ({ page }) => {
  await page.goto('/');

  // 기본 정보 입력
  await page.getByLabel('제목').fill('반복 테스트 일정');
  await page.getByLabel('날짜').fill('2025-05-07');
  await page.getByLabel('시작 시간').fill('09:00');
  await page.getByLabel('종료 시간').fill('10:00');
  await page.getByLabel('설명').fill('E2E 테스트');
  await page.getByLabel('위치').fill('회의실 D');
  await page.getByLabel('카테고리').selectOption('업무');

  // 반복 설정
  await page.getByTestId('repeat-toggle').check(); // checkbox ON
  await page.getByLabel('반복 유형').selectOption('daily'); // 매일
  await page.getByLabel('반복 간격').fill('1'); // 1일마다
  await page.getByLabel('반복 횟수').fill('1');
  await page.getByLabel('반복 종료일').fill('2025-05-10');

  // 제출
  await page.getByTestId('event-submit-button').click();

  await expect(page.getByTestId('event-list')).toBeVisible(); //자동으로 렌더가 끝날 때까지 기다려줌
  // 반복된 일정들이 캘린더에 있는지 확인
  const eventList = page.getByTestId('event-list');
  await expect(eventList).toContainText('2025-05-07');
  await expect(eventList).toContainText('2025-05-08');
  await expect(eventList).toContainText('2025-05-09');
  await expect(eventList).toContainText('2025-05-10');
});
