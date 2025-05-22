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

    const checkBox = page.getByRole('checkbox', { name: '반복' });
    await checkBox.waitFor({ state: 'visible' });
    if (!(await checkBox.isChecked())) {
      await checkBox.click({ force: true });
    }

    await page.getByLabel('반복 유형').selectOption('weekly');
    await page.getByRole('textbox', { name: '반복 종료일' }).fill('2025-05-23');
    await page.getByRole('button', { name: '일정 추가' }).click();

    // 경고 다이얼로그 처리
    // try {
    //   const continueButton = page.getByRole('button', { name: '계속 진행' });
    //   await continueButton.waitFor({ state: 'visible', timeout: 2000 });
    //   await continueButton.click();
    // } catch (error) {
    //   console.log('No overlap warning dialog');
    // }

    // 이벤트가 추가되고 리스트가 업데이트될 때까지 대기
    await page.waitForTimeout(1000);

    // 첫 번째 수정 버튼 클릭
    const editButton = page
      .getByTestId('event-list')
      .getByRole('button', { name: 'Edit event' })
      .first();

    await editButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await editButton.click({
      force: true,
      timeout: 10000,
      delay: 100,
    });

    // 수정 폼 필드들이 나타날 때까지 대기
    await page.waitForTimeout(1000); // 클릭 후 잠시 대기

    // 제목 입력 필드가 나타날 때까지 대기
    await page.getByRole('textbox', { name: '제목' }).waitFor({
      state: 'visible',
      timeout: 10000,
    });

    // 수정할 내용 입력
    await page.getByRole('textbox', { name: '제목' }).fill('수정된 반복일정');
    await page.getByRole('button', { name: '일정 수정' }).click();

    // 일정 겹침 경고 다이얼로그 처리
    try {
      const continueButton = page.getByRole('button', { name: '계속 진행' });
      await continueButton.waitFor({ state: 'visible', timeout: 5000 });
      await continueButton.click();
    } catch (error) {
      console.log('No overlap warning dialog');
    }

    // 수정된 내용이 리스트에 반영되었는지 확인
    await expect(page.getByTestId('event-list').getByText('수정된 반복일정')).toBeVisible({
      timeout: 10000,
    });

    // 삭제버튼을 클릭 aria-label이 'Delete event'인 버튼을 클릭
    const deleteButton = page
      .getByTestId('event-list')
      .getByRole('button', { name: 'Delete event' })
      .first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // 삭제 후 해당 일정이 사라졌는지 확인
    await expect(page.getByTestId('event-list').getByText('수정된 반복일정')).toHaveCount(0, {
      timeout: 10000,
    });
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
