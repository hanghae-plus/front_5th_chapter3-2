import { test, expect } from '@playwright/test';

test('초기 페이지에 올바르게 접속할 수 있다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await expect(page).toHaveURL('http://localhost:5173/');
});

test('반복 일정 생성 및 삭제', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // 일정 입력
  await page.getByLabel('제목').fill('반복 테스트');
  await page.getByLabel('날짜').fill('2025-08-01');
  await page.getByLabel('시작 시간').fill('10:00');
  await page.getByLabel('종료 시간').fill('11:00');
  await page.getByLabel('설명').fill('반복 일정 테스트입니다');
  await page.getByLabel('위치').fill('회의실 A');
  await page.getByLabel('카테고리').selectOption('업무');

  // 반복 설정
  await page.locator('label:has-text("반복 일정")').click();

  // 반복 상세 설정
  await page.getByLabel('반복 유형').selectOption('daily');
  await page.getByLabel('반복 간격').fill('1');
  await page.getByLabel('반복 종료일').fill('2025-09-01');
  await page.getByLabel('반복 횟수').fill('15');

  // 일정 저장
  await page.getByTestId('event-submit-button').click();

  // 월별 뷰로 변경
  await page.getByLabel('view').selectOption('month');

  // 2025년 8월로 이동
  const nextButton = page.getByRole('button', { name: 'Next' });

  // 2025년 8월이 나올 때까지 Next 버튼 클릭
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentMonth = await page.getByTestId('month-view').getByRole('heading').textContent();

    if (currentMonth?.includes('2025년 8월')) {
      break;
    }

    await nextButton.click();
    await page.waitForTimeout(500);
  }

  // 2025년 8월이 표시되는지 확인
  await expect(page.getByTestId('month-view').getByRole('heading')).toHaveText('2025년 8월');

  // 월별 뷰에서 반복 일정 확인
  const monthView = page.getByTestId('month-view');

  await expect(monthView.getByText('반복 테스트').first()).toBeVisible({ timeout: 10000 });

  // 반복 아이콘 확인
  await expect(monthView.getByTestId('repeat-icon').first()).toBeVisible({ timeout: 10000 });

  // 8월 10일 일정 찾기 및 삭제
  const august10Cell = monthView.locator('td', { hasText: '10' });
  const eventList = page.getByTestId('event-list');
  const targetEvent = eventList.locator('div').filter({ hasText: '2025-08-10' }).first();

  // 8월 10일 일정 삭제
  const deleteButton = targetEvent.getByRole('button', { name: 'Delete event' });
  await deleteButton.click();

  // 8월 10일 일정이 사라졌는지 확인
  await expect(august10Cell.getByText('반복 테스트')).not.toBeVisible();
});
