import { test, expect } from '@playwright/test';

test.describe('캘린더 E2E', () => {
  test.beforeEach(async ({ request, page }) => {
    await request.post('http://localhost:3000/__reset');
    await page.goto('http://localhost:5173');
  });

  test('반복 일정을 생성하고 수정하면 단일 일정으로 변경되고 그것을 삭제하면 단일로 삭제 된다.', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('반복일정');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-01');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('10:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');

    const checkBox = page.getByLabel('반복 일정');
    if (!(await checkBox.isChecked())) {
      await checkBox.click();
    }

    await page.getByLabel('반복 유형').selectOption('weekly');
    await page.getByRole('textbox', { name: '반복 종료일' }).fill('2025-05-23');
    await page.getByRole('button', { name: '일정 추가' }).click();

    const editButton = page
      .getByTestId('event-list')
      .getByRole('button', { name: 'Edit event' })
      .nth(1);
    await expect(editButton).toBeVisible();
    await editButton.click();

    await page.getByRole('textbox', { name: '제목' }).fill('수정된 반복일정');
    await page.getByRole('button', { name: '일정 수정' }).click();

    await expect(page.getByTestId('event-list').getByText('수정된 반복일정')).toBeVisible();

    // 삭제버튼을 클릭 aria-label이 'Delete event'인 버튼을 클릭
    const deleteButton = page
      .getByTestId('event-list')
      .getByRole('button', { name: 'Delete event' })
      .nth(1);
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // // 일정이 삭제되었는지 확인
    await expect(page.getByTestId('event-list').getByText('수정된 반복일정')).not.toBeVisible();
  });

  test('단일 일정을 여러 개 생성하고 수정시 원하는 일정만 수정된다.', async ({ page }) => {
    const events = [
      {
        title: '이벤트 0',
        date: '2025-05-01',
        startTime: '10:00',
        endTime: '11:00',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 1,
      },
      {
        title: '이벤트 1',
        date: '2025-05-02',
        startTime: '10:00',
        endTime: '11:00',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 1,
      },
      {
        title: '이벤트 2',
        date: '2025-05-03',
        startTime: '10:00',
        endTime: '11:00',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 1,
      },
    ];

    for (const event of events) {
      await page.getByRole('textbox', { name: '제목' }).fill(event.title);
      await page.getByRole('textbox', { name: '날짜' }).fill(event.date);
      await page.getByRole('textbox', { name: '시작 시간' }).click();
      await page.getByRole('textbox', { name: '시작 시간' }).fill(event.startTime);
      await page.getByRole('textbox', { name: '종료 시간' }).click();
      await page.getByRole('textbox', { name: '종료 시간' }).fill(event.endTime);
      await page.getByRole('button', { name: '일정 추가' }).click();
    }

    const editButtons = page.getByTestId('event-list').getByRole('button', { name: 'Edit event' });
    await expect(editButtons).toHaveCount(events.length);

    await page.getByRole('button', { name: 'Edit event' }).nth(1).click();
    // editButtons.nth(1).click(); // 이렇게 하면 클릭 이전에 아래 빈칸 채우기를 먼저 진행함.
    await page.getByRole('textbox', { name: '제목' }).fill('수정된 이벤트 0');
    await page.getByRole('button', { name: '일정 수정' }).click();

    await expect(page.getByTestId('event-list').getByText('수정된 이벤트 0')).toBeVisible();
  });

  test('월별뷰 상태에서 단일 일정과 반복일정을 추가후 올바르게 등록되는지 확인, 이후 주별 뷰 전환시 등록된 일정들이 날짜에 맞춰 표시 되는지 확인', async ({
    page,
  }) => {
    const events = [
      {
        title: '이벤트 0',
        date: '2025-05-01',
        startTime: '10:00',
        endTime: '11:00',
        repeat: { type: 'none', interval: 1 },
        notificationTime: 1,
      },
      {
        title: '이벤트 1',
        date: '2025-05-02',
        startTime: '10:00',
        endTime: '11:00',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-23' },
        notificationTime: 1,
      },
    ];

    for (const event of events) {
      await page.getByRole('textbox', { name: '제목' }).fill(event.title);
      await page.getByRole('textbox', { name: '날짜' }).fill(event.date);
      await page.getByRole('textbox', { name: '시작 시간' }).click();
      await page.getByRole('textbox', { name: '시작 시간' }).fill(event.startTime);
      await page.getByRole('textbox', { name: '종료 시간' }).click();
      await page.getByRole('textbox', { name: '종료 시간' }).fill(event.endTime);

      if (event.repeat.type !== 'none') {
        await page
          .getByRole('checkbox', { name: '반복 일정' })
          .locator('..')
          .click({ force: true });

        await page.getByLabel('반복 유형').selectOption(event.repeat.type);
        await page.getByRole('textbox', { name: '반복 종료일' }).fill(event.repeat.endDate ?? '');
      }

      await page.getByRole('button', { name: '일정 추가' }).click();
    }

    await page.getByLabel('view').selectOption('month');
    await expect(page.getByTestId('event-list').getByText('이벤트 0')).toBeVisible();
    const repeatEvents = page.getByTestId('event-list').getByText('이벤트 1');
    await expect(repeatEvents).toHaveCount(4);

    await page.getByLabel('view').selectOption('week');
    await expect(page.getByTestId('event-list').getByText('이벤트 0')).not.toBeVisible();
    await expect(repeatEvents).toHaveCount(1);
  });
});
