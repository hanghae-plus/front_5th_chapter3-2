import { test, expect } from '@playwright/test';

test.describe('일정관리 App 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async ({
    page,
  }) => {
    // 입력값 정의
    await page.getByLabel('제목').fill('적당한 제목');
    await page.getByLabel('날짜').fill('2025-05-23');
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('적당한 설명');
    await page.getByLabel('위치').fill('적당한 위치');
    await page.getByLabel('카테고리').selectOption({ label: '업무' });

    // 제출
    await page.getByTestId('event-submit-button').click();

    // 성공 메시지 확인
    await expect(page.getByText('일정이 추가되었습니다.')).toBeVisible();

    // 이벤트 리스트에서 각 정보 확인
    await expect(
      page
        .getByTestId('event-list')
        .locator('div', {
          hasText: '2025-05-23',
        })
        .filter({
          hasText: '적당한 제목',
        })
    ).toBeVisible();
  });
});
