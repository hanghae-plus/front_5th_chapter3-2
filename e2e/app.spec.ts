import { test, expect } from '@playwright/test';

test.describe.serial('App 전체 테스트', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3000/api/mock-reset');
    await page.goto('http://localhost:5173/');
  });

  test('단일 일정 추가/수정/삭제가 정상적으로 동작하고 화면에 반영이 잘되는지 테스트', async ({
    page,
  }) => {
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-23');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByText('반복 일정').click();

    await page.getByTestId('event-submit-button').click();

    // 캘린더 뷰에 렌더링 잘되는지 체크
    await expect(page.getByTestId('month-view').getByText('테스트')).toBeVisible();

    // 일정 목록에 렌더링 잘되는지 체크
    const addedSchedule = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '테스트2025-05-2310:00 - 11:00' })
      .first();
    await expect(addedSchedule).toMatchAriaSnapshot(`
      - paragraph: 테스트
      - paragraph: 2025-05-23
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
      - paragraph: "알림: 10분 전"
      - button "Edit event"
      - button "Delete event"
    `);

    // 일정 수정 테스트
    await page.getByRole('button', { name: 'Edit event' }).nth(1).click();
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('테스트 수정');
    await page.getByLabel('카테고리').selectOption('개인');

    await page.getByTestId('event-submit-button').click();

    // 캘린더 뷰에 렌더링 잘되는지 체크
    await expect(page.getByTestId('month-view').getByText('테스트 수정')).toBeVisible();

    // 수정된 일정 목록에 렌더링 잘되는지 체크
    const updatedSchedule = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '테스트 수정2025-05-2310:00 - 11:00' })
      .first();
    await expect(updatedSchedule).toMatchAriaSnapshot(`
      - paragraph: 테스트 수정
      - paragraph: 2025-05-23
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 개인"
      - paragraph: "알림: 10분 전"
      - button "Edit event"
      - button "Delete event"
    `);

    // 일정 삭제 테스트
    await page.getByRole('button', { name: 'Delete event' }).nth(1).click();

    // 캘린더 뷰에 렌더링 안되는지 체크
    await expect(page.getByTestId('month-view').getByText('테스트 수정')).not.toBeVisible();
  });

  test('반복 일정 종료날짜와 반복간격의 추가/수정/삭제가 정상적으로 동작하고 화면에 반영이 잘되는지 테스트', async ({
    page,
  }) => {
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('반복일정');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-24');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByTestId('repeat-end-date').fill('2025-05-25');
    await page.getByTestId('repeat-end-date').press('Enter');

    await page.getByTestId('event-submit-button').click();

    await page.getByRole('cell', { name: '24 반복일정' }).locator('div').first().click();

    // 캘린더 뷰에 렌더링 잘되는지 체크
    const calendar24DayRepeatEvent = page
      .getByRole('cell', { name: '24 반복일정' })
      .locator('div')
      .first();
    await expect(calendar24DayRepeatEvent).toBeVisible();

    const calendar25DayRepeatEvent = page
      .getByRole('cell', { name: '25 반복일정' })
      .locator('div')
      .first();
    await expect(calendar25DayRepeatEvent).toBeVisible();

    // 일정 목록에 렌더링 잘되는지 체크
    const repeat24DayEvent = await page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '반복일정2025-05-24반복일정10:00 - 11:' })
      .first();
    await expect(repeat24DayEvent).toMatchAriaSnapshot(`
      - paragraph: 반복일정
      - paragraph: 2025-05-24
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
      - paragraph: "반복: 1일마다 (종료: 2025-05-25)"
    `);

    // 반복 일정 수정시 단일로 변경되는지 테스트
    await page.getByRole('button', { name: 'Edit event' }).nth(2).click();
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('단일로');

    await page.getByTestId('event-submit-button').click();

    const repeatToSingleEvent = await page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '단일로2025-05-2510:00 - 11:00' })
      .first();
    await expect(repeatToSingleEvent).toMatchAriaSnapshot(`
      - paragraph: 단일로
      - paragraph: 2025-05-25
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
    `);

    await page.getByRole('button', { name: 'Repeat All Delete' }).first().click();

    await expect(repeat24DayEvent).not.toBeVisible();
  });

  test('반복 일정 횟수와 반복간격의 추가/수정/삭제가 정상적으로 동작하고 화면에 반영이 잘되는지 테스트', async ({
    page,
  }) => {
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('반복일정');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-26');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByLabel('반복 종료').selectOption('endCount');

    await page.getByTestId('repeat-end-count').click();
    await page.getByTestId('repeat-end-count').fill('02');

    await page.getByTestId('event-submit-button').click();

    // 일정 목록에 렌더링 잘되는지 체크
    const repeat26DayEvent = await page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '반복일정2025-05-26반복일정10:00 - 11:' })
      .first();
    await expect(repeat26DayEvent).toMatchAriaSnapshot(`
      - paragraph: 반복일정
      - paragraph: 2025-05-26
      - img
      - paragraph: 반복일정
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
      - paragraph: "반복: 1일마다 (종료: 2회)"
      - paragraph: "알림: 10분 전"
      - button "Edit event"
      - button "Delete event"
    `);

    await page.getByRole('button', { name: 'Repeat All Delete' }).first().click();

    await expect(repeat26DayEvent).not.toBeVisible();
  });

  test('일정 충돌에서 계속하기시 저장이 잘되고, 취소시 작성한 내용이 저장 안되는지 테스트', async ({
    page,
  }) => {
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-23');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByText('반복 일정').uncheck();

    await page.getByTestId('event-submit-button').click();

    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('충돌 테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-23');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('테스트 일정');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('테스트 위치');
    await page.getByLabel('카테고리').selectOption('업무');

    await page.getByText('반복 일정').uncheck();

    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정 겹침 경고')).toBeVisible();

    // 일정 겹침 경고(취소)
    await page.getByRole('button', { name: '취소' }).click();

    // 다시 계속 진행하여 일정 겹침 계속 진행
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('충돌 테스트');

    await page.getByTestId('event-submit-button').click();

    // 일접 겸칭 경고(계속하기)
    await page.getByRole('button', { name: '계속 진행' }).click();

    await expect(page.getByText('일정 겹침 경고')).not.toBeVisible();

    const firstEvent = await page
      .locator('div')
      .filter({
        hasText: /^테스트2025-05-2310:00 - 11:00테스트 일정테스트 위치카테고리: 업무알림: 10분 전$/,
      })
      .first();

    await expect(firstEvent).toMatchAriaSnapshot(`
      - paragraph: 테스트
      - paragraph: 2025-05-23
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
      - paragraph: "알림: 10분 전"
      - button "Edit event"
      - button "Delete event"
    `);

    const secondeEvent = await page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '충돌 테스트2025-05-2310:00 - 11:00' })
      .first();

    await expect(secondeEvent).toMatchAriaSnapshot(`
      - paragraph: 충돌 테스트
      - paragraph: 2025-05-23
      - paragraph: 10:00 - 11:00
      - paragraph: 테스트 일정
      - paragraph: 테스트 위치
      - paragraph: "카테고리: 업무"
      - paragraph: "알림: 10분 전"
      - button "Edit event"
      - button "Delete event"
    `);

    await page.getByRole('button', { name: 'Delete event' }).nth(1).click();
    await expect(firstEvent).not.toBeVisible();

    await page.getByRole('button', { name: 'Delete event' }).nth(1).click();
    await expect(secondeEvent).not.toBeVisible();
  });
});
