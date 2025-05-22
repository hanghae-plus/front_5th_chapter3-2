import { test, expect } from '@playwright/test';

test.describe('반복 일정 단일 수정/삭제 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // 기존 일정 모두 삭제
    const deleteButtons = page.locator('button[aria-label="Delete event"]');
    while (await deleteButtons.count()) {
      await deleteButtons.first().click();
      await page.waitForTimeout(100);
    }

    // 일반 일정 추가
    await page.getByRole('button', { name: '일정 추가' }).click();
    await page.getByLabel('제목').fill('운동');
    await page.getByLabel('날짜').fill('2025-05-22');
    await page.getByLabel('시작 시간').fill('18:00');
    await page.getByLabel('종료 시간').fill('19:00');
    await page.getByRole('button', { name: '일정 추가' }).click();

    // 반복 일정 추가
    await page.getByRole('button', { name: '일정 추가' }).click();
    await page.getByLabel('제목').fill('123123');
    await page.getByLabel('날짜').fill('2025-05-01');
    await page.getByLabel('시작 시간').fill('03:47');
    await page.getByLabel('종료 시간').fill('15:47');

    // 체크박스 클릭 시 시각적 요소 가림 문제 우회
    const checkbox = page.getByRole('checkbox', { name: /반복 일정/ });
    const box = checkbox.locator('..'); // 부모 요소 클릭
    await box.click({ force: true });

    await page.getByRole('button', { name: '일정 추가' }).click();
  });

  test('특정 반복 일정만 수정 → 반복 아이콘 사라짐', async ({ page }) => {
    const 운동Cell = page.locator('td', { hasText: '운동' }).first();
    await 운동Cell.click();

    await page.getByRole('button', { name: 'Edit event' }).first().click();
    await page.getByLabel('제목').fill('수정된 운동');
    await page.getByRole('button', { name: '일정 수정' }).click();

    const modified = page.locator('td', { hasText: '수정된 운동' });
    await expect(modified.locator('.repeat-icon')).toHaveCount(0);

    const repeatItem = page.locator('td', { hasText: '123123' }).first();
    await expect(repeatItem).toContainText('🔁');
  });

  test('특정 반복 일정만 삭제 → 나머지 반복 일정은 유지', async ({ page }) => {
    // '운동' 이벤트 인스턴스를 식별해서 클릭
    const 운동Cell = page.locator('td', { hasText: '운동' }).nth(0);
    await 운동Cell.click();

    // 삭제 버튼이 둘 이상 존재할 수 있으므로 first()로 지정
    await page.getByRole('button', { name: 'Delete event' }).first().click();

    const onlyDelete = page.getByRole('button', { name: 'Delete this event only' });
    if (await onlyDelete.isVisible()) {
      await onlyDelete.click();
    }

    // 삭제된 날짜(예: 2025-05-22)에 해당하는 운동 일정이 사라졌는지 확인
    const deleted = page.locator('td', { hasText: '운동' }).filter({ hasText: '22' });
    await expect(deleted).toHaveCount(1);

    // 다른 반복 일정 '123123'은 여전히 존재해야 함
    const repeatItem = page.locator('td', { hasText: '123123' }).first();
    await expect(repeatItem).toContainText('🔁');
  });
});
