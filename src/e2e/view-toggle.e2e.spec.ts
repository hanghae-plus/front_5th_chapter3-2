import { test, expect } from '@playwright/test';

test.describe.serial('뷰 전환 테스트', () => {
  test.beforeEach(async ({ request, page }) => {
    await request.post('http://localhost:3000/__reset');
    await page.goto('http://localhost:5173');
  });

  test('월/주 뷰 전환 시 팀 회의 일정이 유지되어야 한다', async ({ page }) => {
    await page.waitForTimeout(1000);
    // 월간 뷰에서 '팀 회의' 일정 확인
    await expect(page.getByTestId('month-view').getByText('팀 회의')).toBeVisible();

    // 주간 뷰 전환
    await page.getByLabel('view').selectOption('week');
    await expect(page.getByTestId('week-view').getByText('팀 회의')).toBeVisible();

    // 다시 월간 뷰 전환
    await page.getByLabel('view').selectOption('month');
    await expect(page.getByTestId('month-view').getByText('팀 회의')).toBeVisible();
  });

  test('뷰를 주간으로 전환한 뒤에도 일정을 추가할 수 있다', async ({ page }) => {
    await page.getByLabel('view').selectOption('week');

    await page.getByRole('textbox', { name: '제목' }).fill('주간 일정 테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-19');
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).fill('주간 일정 테스트 설명');
    await page.getByRole('textbox', { name: '위치' }).fill('회의실');
    await page.getByLabel('카테고리').selectOption('개인');

    await page.getByTestId('event-submit-button').click();

    await expect(page.getByTestId('week-view').getByText('주간 일정 테스트')).toBeVisible();
  });
});
