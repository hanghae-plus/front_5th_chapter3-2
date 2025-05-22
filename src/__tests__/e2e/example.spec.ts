import { test, expect } from '@playwright/test';

test.describe('일정관리 앱 E2e 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('1. 단일 일정을 생성하고, 수정하고, 지운다. ', async ({ page }) => {
    // 신규 이벤트 폼 입력
    await page.getByLabel('제목').fill('E2E 테스트 일정');
    await page.getByLabel('날짜').fill('2025-05-30');
    await page.getByLabel('시작 시간').click();
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').click();
    await page.getByLabel('종료 시간').fill('11:00');

    // 이벤트 생성
    await page.getByTestId('event-submit-button').click();

    // 이벤트 생성 확인
    await expect(page.getByTestId('event-list').getByText('E2E 테스트 일정')).toBeVisible();

    // 생성된 이벤트 카드
    const eventCard = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: 'E2E 테스트 일정' })
      .first();

    // 수정 시작
    await eventCard.getByLabel('Edit event').click();

    // 수정 및 제출
    await page.getByLabel('제목').fill('수정된 E2E 테스트 일정');
    await page.getByTestId('event-submit-button').click();

    // 수정 확인
    const newEventCard = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '수정된 E2E 테스트 일정' })
      .first();

    await expect(newEventCard).toBeVisible();

    // 삭제 클릭
    await newEventCard.getByLabel('Delete event').click();

    // 삭제 확인
    await expect(
      page.getByTestId('event-list').getByText('수정된 E2E 테스트 일정')
    ).not.toBeVisible();
  });
});
