import { test, expect } from '@playwright/test';

test.describe.serial('반복 아이콘 테스트', () => {
  test.beforeEach(async ({ request, page }) => {
    await request.post('http://localhost:3000/__reset');
    await page.goto('http://localhost:5173');
  });

  test('반복 일정 생성 후 단일 일정으로 수정하면 반복 아이콘이 사라져야 한다', async ({ page }) => {
    await page.getByRole('textbox', { name: '제목' }).fill('아이콘테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-04');
    await page.getByRole('textbox', { name: '시작 시간' }).fill('12:00');
    await page.getByRole('textbox', { name: '종료 시간' }).fill('13:00');
    await page.getByRole('textbox', { name: '설명' }).fill('반복 테스트 설명');
    await page.getByRole('textbox', { name: '위치' }).fill('회의실');
    await page.getByLabel('카테고리').selectOption('개인');

    await page.getByText('반복 일정').click();
    await page.getByLabel('반복 유형').selectOption('weekly');
    await page.getByLabel('반복 종료 방식').selectOption('count');
    await page.getByRole('spinbutton', { name: '반복 횟수' }).fill('3');

    await page.getByTestId('event-submit-button').click();

    // 생성된 일정에 반복 아이콘이 표시되어야 함
    const cell = page.getByRole('cell', {
      name: '4 cycle 아이콘테스트',
      exact: true,
    });

    await page.waitForTimeout(1000);
    await expect(cell.locator('span').first()).toBeVisible();

    // 일정 수정 - 반복 해제
    await page
      .getByTestId('event-item')
      .filter({ hasText: '아이콘테스트' })
      .nth(0) // ← 첫 번째 인스턴스만 선택
      .getByLabel('Edit event')
      .click();

    await page.getByRole('textbox', { name: '제목' }).fill('아이콘테스트-수정');
    await page.getByText('반복 일정').click();

    await page.getByTestId('event-submit-button').click();

    // ✅ 반복 아이콘이 사라져야 함
    const updatedCell = page.getByRole('cell', { name: /아이콘테스트-수정/ });
    await expect(updatedCell.locator('span')).toHaveCount(0); // 반복 아이콘 제거 여부
  });
});
