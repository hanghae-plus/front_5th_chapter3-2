import { test, expect } from '@playwright/test';

test.describe('일정관리 앱 E2E 테스트', () => {
  test.beforeEach(async ({ page, request }) => {
    // 서버 상태 초기화
    await request.post('http://localhost:3000/__reset');
    await page.goto('http://localhost:5173/');
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
  });

  test('반복 일정을 생성한다', async ({ page }) => {
    await page.getByLabel('제목').fill('E2E 테스트 반복 일정');
    await page.getByLabel('날짜').fill('2025-05-01');
    await page.getByLabel('시작 시간').click();
    await page.getByLabel('시작 시간').fill('10:00');
    await page.getByLabel('종료 시간').click();
    await page.getByLabel('종료 시간').fill('11:00');

    // 반복 설정
    const checkBox = page.getByLabel('반복 일정');
    if (!(await checkBox.isChecked())) {
      await checkBox.click();
    }

    await page.getByLabel('반복 유형').selectOption('daily');
    await page.getByLabel('반복 종료일').fill('2025-05-29');

    await page.getByTestId('event-submit-button').click();

    // 일정 겹침 경고가 표시되면 계속 진행
    const overlapDialog = page.getByRole('alertdialog');
    if (await overlapDialog.isVisible()) {
      await page.getByRole('button', { name: '계속 진행' }).click();
    }

    // 특정 날짜의 일정이 제대로 생성되었는지 확인
    const eventList = page.getByTestId('event-list');

    // 시작일 일정 확인
    const firstEvent = eventList.locator('div').filter({ hasText: '2025-05-01' }).first();
    await expect(firstEvent.getByText('E2E 테스트 반복 일정')).toBeVisible();

    // 중간 날짜 일정 확인
    const middleEvent = eventList.locator('div').filter({ hasText: '2025-05-15' }).first();
    await expect(middleEvent.getByText('E2E 테스트 반복 일정')).toBeVisible();

    // 종료일 일정 확인
    const lastEvent = eventList.locator('div').filter({ hasText: '2025-05-29' }).first();
    await expect(lastEvent.getByText('E2E 테스트 반복 일정')).toBeVisible();

    // 반복 아이콘이 있는지 확인
    const repeatIcons = await page.getByLabel('repeat-icon').all();
    expect(repeatIcons.length).toBeGreaterThan(0);
  });
});
