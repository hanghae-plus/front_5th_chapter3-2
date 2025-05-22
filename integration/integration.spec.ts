import { test, expect } from '@playwright/test';

test.describe.serial('Integration Test', () => {
  test.describe('반복 일정 생성', () => {
    test('반복 유형을 매일로 선택하면 매일 반복되는 일정이 생성된다. ', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('반복 일정 테스트');
      await page.getByLabel('날짜').fill('2025-05-06');
      await page.getByLabel('시작 시간').click();
      await page.getByLabel('시작 시간').fill('09:00');
      await page.getByLabel('종료 시간').click();
      await page.getByLabel('종료 시간').fill('11:00');
      await page.getByLabel('설명').click();
      await page.getByLabel('설명').fill('반복 일정 테스트 설명');
      await page.getByLabel('위치').click();
      await page.getByLabel('위치').fill('반복 일정 테스트 위치');
      await page.getByLabel('카테고리').selectOption('개인');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('daily');
      await page.getByLabel('반복 간격').click();
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-05-10');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '6 반복 일정 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '7 반복 일정 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '8 반복 일정 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '9 반복 일정 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '10 반복 일정 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '11 반복 일정 테스트' })).not.toBeVisible();
    });

    test('반복 유형을 매주로 선택하면 매주 반복되는 일정이 생성된다.', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('주간 반복 테스트');
      await page.getByLabel('날짜').fill('2025-05-12');
      await page.getByLabel('시작 시간').fill('10:00');
      await page.getByLabel('종료 시간').fill('12:00');
      await page.getByLabel('설명').fill('주간 반복 테스트 설명');
      await page.getByLabel('위치').fill('주간 반복 테스트 위치');
      await page.getByLabel('카테고리').selectOption('업무');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('weekly');
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-05-25');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '12 주간 반복 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '19 주간 반복 테스트' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '26 주간 반복 테스트' })).not.toBeVisible();
    });

    test('반복 유형을 매월로 선택하면 매월 반복되는 일정이 생성된다.', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('월간 반복 테스트');
      await page.getByLabel('날짜').fill('2025-05-15');
      await page.getByLabel('시작 시간').fill('14:00');
      await page.getByLabel('종료 시간').fill('15:00');
      await page.getByLabel('설명').fill('월간 반복 테스트 설명');
      await page.getByLabel('위치').fill('월간 반복 테스트 위치');
      await page.getByLabel('카테고리').selectOption('가족');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('monthly');
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-07-15');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '15 월간 반복 테스트' })).toBeVisible();

      await page.getByRole('button', { name: 'Next' }).click(); // 6월로 이동
      await expect(page.getByRole('cell', { name: '15 월간 반복 테스트' })).toBeVisible();

      await page.getByRole('button', { name: 'Next' }).click(); // 7월로 이동
      await expect(page.getByRole('cell', { name: '15 월간 반복 테스트' })).toBeVisible();

      await page.getByRole('button', { name: 'Next' }).click(); // 8월로 이동
      await expect(page.getByRole('cell', { name: '15 월간 반복 테스트' })).not.toBeVisible();
    });

    test('반복 유형을 매년으로 선택하면 매년 반복되는 일정이 생성된다.', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('연간 반복 테스트');
      await page.getByLabel('날짜').fill('2025-06-01');
      await page.getByLabel('시작 시간').fill('16:00');
      await page.getByLabel('종료 시간').fill('17:00');
      await page.getByLabel('설명').fill('연간 반복 테스트 설명');
      await page.getByLabel('위치').fill('연간 반복 테스트 위치');
      await page.getByLabel('카테고리').selectOption('기타');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('yearly');
      await page.getByLabel('반복 간격').fill('1'); // 매년
      await page.getByLabel('반복 종료일').fill('2027-06-01');
      await page.getByTestId('event-submit-button').click();

      // 2025-06-01 일정 확인
      page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('cell', { name: '1 연간 반복 테스트' })).toBeVisible();

      // 2026-06-01 일정 확인
      for (let i = 0; i < 12; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      await expect(page.getByRole('cell', { name: '1 연간 반복 테스트' })).toBeVisible();

      // 2027-06-01 일정 확인
      for (let i = 0; i < 12; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      await expect(page.getByRole('cell', { name: '1 연간 반복 테스트' })).toBeVisible();

      // 2028-06-01 일정은 생성되지 않아야 함
      for (let i = 0; i < 12; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      await expect(page.getByRole('cell', { name: '1 연간 반복 테스트' })).not.toBeVisible();
    });

    test('31일에 매월 반복되는 일정을 생성하면 30일이 마지막인 달에는 일정이 등록되지 않는다.', async ({
      page,
    }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('매월 31일 테스트');
      await page.getByLabel('날짜').fill('2025-05-31');
      await page.getByLabel('시작 시간').fill('09:00');
      await page.getByLabel('종료 시간').fill('11:00');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('monthly');
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-12-31');
      await page.getByTestId('event-submit-button').click();

      // 5월 (31일 있음)
      await expect(page.getByRole('cell', { name: '31 매월 31일 테스트' })).toBeVisible();

      // 6월 (30일까지만 있음)
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('cell', { name: '30 매월 31일 테스트' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '31 매월 31일 테스트' })).not.toBeVisible();

      // 7월 (31일 있음)
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('cell', { name: '31 매월 31일 테스트' })).toBeVisible();
    });

    test('2월 29일에 매년 반복되는 일정을 생성하면 평년에는 일정이 생성되지 않는다.', async ({
      page,
    }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').click();
      await page.getByLabel('제목').fill('윤년 테스트');
      // 시작일을 윤년인 2024년 2월 29일로 설정
      await page.getByLabel('날짜').fill('2024-02-29');
      await page.getByLabel('시작 시간').fill('10:00');
      await page.getByLabel('종료 시간').fill('11:00');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('yearly');
      await page.getByLabel('반복 간격').fill('1');
      // 종료일을 2026년 말까지로 넉넉하게 설정
      await page.getByLabel('반복 종료일').fill('2028-12-31');
      await page.getByTestId('event-submit-button').click();

      await page.getByTestId('specific-date-input').fill('2024-02-01');
      await page.getByTestId('navigate-to-specific-date').click();
      await expect(page.getByRole('cell', { name: '29 윤년 테스트' })).toBeVisible();

      await page.getByTestId('specific-date-input').fill('2025-02-01');
      await page.getByTestId('navigate-to-specific-date').click();
      await expect(page.getByRole('cell', { name: '28 윤년 테스트' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '29 윤년 테스트' })).not.toBeVisible();

      await page.getByTestId('specific-date-input').fill('2026-02-01');
      await page.getByTestId('navigate-to-specific-date').click();
      await expect(page.getByRole('cell', { name: '28 윤년 테스트' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '29 윤년 테스트' })).not.toBeVisible();

      await page.getByTestId('specific-date-input').fill('2027-02-01');
      await page.getByTestId('navigate-to-specific-date').click();
      await expect(page.getByRole('cell', { name: '28 윤년 테스트' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '29 윤년 테스트' })).not.toBeVisible();

      await page.getByTestId('specific-date-input').fill('2028-02-01');
      await page.getByTestId('navigate-to-specific-date').click();
      await expect(page.getByRole('cell', { name: '29 윤년 테스트' })).toBeVisible();
    });
  });

  test.describe('반복 일정 수정', () => {
    test('반복 일정을 수정하면 수정된 일정만 변경되고 나머지는 유지된다.', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').fill('수정 전 반복');
      await page.getByLabel('날짜').fill('2025-05-06');
      await page.getByLabel('시작 시간').fill('09:00');
      await page.getByLabel('종료 시간').fill('10:00');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('daily');
      await page.getByLabel('반복 간격').fill('2');
      await page.getByLabel('반복 종료일').fill('2025-05-10');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '6 수정 전 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '8 수정 전 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '10 수정 전 반복' })).toBeVisible();

      const eventToEdit = page
        .locator('[data-testid="event-list"] > div', { hasText: '수정 전 반복' })
        .filter({ hasText: '2025-05-08' });
      await eventToEdit.getByRole('button', { name: 'Edit event' }).click();

      await page.getByLabel('제목').fill('수정된 단일 일정');
      await page.getByLabel('설명').fill('수정된 설명입니다.');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '8 수정된 단일 일정' })).toBeVisible();
      // 수정된 일정에는 반복 아이콘이 없어야 함
      const editedEventCell = page.getByRole('cell', { name: '8 수정된 단일 일정' });
      await expect(editedEventCell.getByRole('img')).not.toBeVisible();

      await expect(page.getByRole('cell', { name: '6 수정 전 반복' })).toBeVisible();
      const firstEventCell = page.getByRole('cell', { name: '6 수정 전 반복' });
      expect(firstEventCell.getByRole('img')).toBeVisible();

      await expect(page.getByRole('cell', { name: '10 수정 전 반복' })).toBeVisible();
      const thirdEventCell = page.getByRole('cell', { name: '10 수정 전 반복' });
      expect(thirdEventCell.getByRole('img')).toBeVisible();
    });
  });

  test.describe('반복 일정 삭제', () => {
    test('반복 일정 중 단일 일정을 삭제하면 해당 일정만 삭제되고 나머지는 유지된다.', async ({
      page,
    }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').fill('삭제 테스트 반복');
      await page.getByLabel('날짜').fill('2025-05-12');
      await page.getByLabel('시작 시간').fill('13:00');
      await page.getByLabel('종료 시간').fill('14:00');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('daily');
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-05-14');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '12 삭제 테스트 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '13 삭제 테스트 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '14 삭제 테스트 반복' })).toBeVisible();

      const eventToDelete = page
        .locator('[data-testid="event-list"] > div', { hasText: '삭제 테스트 반복' })
        .filter({ hasText: '2025-05-13' });
      await eventToDelete.getByRole('button', { name: 'Delete event' }).click();

      await expect(page.getByRole('cell', { name: '13 삭제 테스트 반복' })).not.toBeVisible();

      await expect(page.getByRole('cell', { name: '12 삭제 테스트 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '14 삭제 테스트 반복' })).toBeVisible();
    });

    test('반복 일정 전체 삭제를 하면 모든 반복 일정이 삭제된다.', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      // 테스트 독립성을 위해 모든 이벤트 제거
      await page.getByTestId('delete-all-events').click();

      await page.getByLabel('제목').fill('전체 삭제 반복');
      await page.getByLabel('날짜').fill('2025-05-19');
      await page.getByLabel('시작 시간').fill('15:00');
      await page.getByLabel('종료 시간').fill('16:00');
      await page.getByText('반복 일정').click();
      await page.getByTestId('repeat-type-selector').selectOption('daily');
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill('2025-05-21');
      await page.getByTestId('event-submit-button').click();

      await expect(page.getByRole('cell', { name: '19 전체 삭제 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '20 전체 삭제 반복' })).toBeVisible();
      await expect(page.getByRole('cell', { name: '21 전체 삭제 반복' })).toBeVisible();

      const eventForFullDelete = page
        .locator('[data-testid="event-list"] > div', { hasText: '전체 삭제 반복' })
        .filter({ hasText: '2025-05-19' });
      await eventForFullDelete.getByTestId('delete-all-repeated-events').click();

      // 모든 반복 일정이 삭제되었는지 확인
      await expect(page.getByRole('cell', { name: '19 전체 삭제 반복' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '20 전체 삭제 반복' })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: '21 전체 삭제 반복' })).not.toBeVisible();
    });
  });
});
