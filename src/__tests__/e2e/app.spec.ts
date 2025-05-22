import { test, expect, Page } from '@playwright/test';

import { getFilteredEvents } from '../../utils/eventUtils';

test.describe('일정 관리 App CRUD 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('1. GET API를 통해 저장된 Event List를 가져와서 렌더 한다.', async ({ page }) => {
    const toast = page.getByText('일정 로딩 완료!').first();
    await expect(toast).toBeVisible();

    // 실제 api에서 가져온 이벤트 목록과 일치하는지 확인
    const response = await fetch('http://localhost:5173/api/events');
    const { events } = await response.json();

    const eventList = getFilteredEvents(events, '', new Date(), 'month');
    const eventListView = page.getByTestId('event-list');

    for (const event of eventList) {
      await expect(eventListView.getByText(event.title).first()).toBeVisible();
    }
  });

  test('2. POST API를 통해 저장된 새로운 Event를 렌더하고 저장한 이벤트를 DELETE API를 통해 삭제 한다.', async ({
    page,
  }) => {
    // 테스트 시점 날짜로 고정
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];

    // create event test
    await page.getByLabel('제목').fill('test event');
    await page.getByLabel('날짜').fill(formattedDate);
    await page.getByLabel('시작 시간').fill('14:00');
    await page.getByLabel('종료 시간').fill('15:00');
    await page.getByLabel('설명').fill('test description');

    await page.getByTestId('event-submit-button').click();

    const toast = page.getByText('일정이 추가되었습니다.').first();
    await expect(toast).toBeVisible();

    const eventListView = page.getByTestId('event-list');

    await expect(eventListView.getByText('test event').first()).toBeVisible();
    await expect(eventListView.getByText('2025-05-21').first()).toBeVisible();
    await expect(eventListView.getByText('14:00 - 15:00').first()).toBeVisible();
    await expect(eventListView.getByText('test description').first()).toBeVisible();

    // delete event test
    const eventCard = eventListView.locator('div').filter({ hasText: 'test event' }).first();

    const deleteBtn = eventCard.getByRole('button', { name: 'Delete event' });
    await deleteBtn.click();

    const toast2 = page.getByText('일정이 삭제되었습니다.').first();
    await expect(toast2).toBeVisible();

    await expect(eventListView.locator('div', { hasText: 'test event' })).toHaveCount(0);
  });

  test('3. 새로운 Event를 생성하고 수정하는 시나리오를 테스트한다.', async ({ page }) => {
    // 테스트 시점 날짜로 고정
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];

    // 1. 새로운 이벤트 생성
    await page.getByLabel('제목').fill('수정 테스트 이벤트');
    await page.getByLabel('날짜').fill(formattedDate);
    await page.getByLabel('시작 시간').fill('20:00');
    await page.getByLabel('종료 시간').fill('21:00');
    await page.getByLabel('설명').fill('수정 전 설명');

    await page.getByTestId('event-submit-button').click();

    // 생성 성공 토스트 메시지 확인
    const toast = page.getByText('일정이 추가되었습니다.').first();
    await expect(toast).toBeVisible();

    // 2. 생성된 이벤트 수정
    const eventCard = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '수정 테스트 이벤트' })
      .first();

    // 수정 버튼 클릭
    const editBtn = eventCard.getByRole('button', { name: 'Edit event' });
    await editBtn.click();

    // 수정 폼 필드 업데이트
    await page.getByLabel('제목').fill('수정된 테스트 이벤트');
    await page.getByLabel('시작 시간').fill('23:00');
    await page.getByLabel('종료 시간').fill('23:30');
    await page.getByLabel('설명').fill('수정된 설명');

    // 수정 저장
    await page.getByTestId('event-submit-button').click();

    // 수정 성공 토스트 메시지 확인
    const updateToast = page.getByText('일정이 수정되었습니다.').first();
    await expect(updateToast).toBeVisible();

    // 3. 수정된 내용 확인
    const eventListView = page.getByTestId('event-list');
    await expect(eventListView.getByText('수정된 테스트 이벤트').first()).toBeVisible();
    await expect(eventListView.getByText('23:00 - 23:30').first()).toBeVisible();
    await expect(eventListView.getByText('수정된 설명').first()).toBeVisible();

    // 4. 테스트 데이터 정리 (삭제)
    const updatedEventCard = eventListView
      .locator('div')
      .filter({ hasText: '수정된 테스트 이벤트' })
      .first();

    const deleteBtn = updatedEventCard.getByRole('button', { name: 'Delete event' });
    await deleteBtn.click();

    const toast2 = page.getByText('일정이 삭제되었습니다.').first();
    await expect(toast2).toBeVisible();
  });

  describe('4. 반복 일정을 생성, 수정 및 삭제하는 시나리오를 테스트한다.', () => {
    const REPEAT_DURATION = 30 * 24 * 60 * 60 * 1000; // 30일을 반복 주기로 설정

    const proceedWarningDialog = async (page: Page) => {
      const warningDialog = page.getByText('일정 겹침 경고');
      if (await warningDialog.isVisible()) {
        await page.getByRole('button', { name: '계속 진행' }).click();
      }
    };

    test('4.1 반복 일정 생성 후 수정', async ({ page }) => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + REPEAT_DURATION);

      const [formattedStartDate, formattedEndDate] = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ];

      // 1. 새로운 반복 일정 생성
      await page.getByLabel('제목').fill('수정 테스트 반복 이벤트');
      await page.getByLabel('날짜').fill(formattedStartDate);
      await page.getByLabel('시작 시간').fill('20:00');
      await page.getByLabel('종료 시간').fill('21:00');

      // 반복 세부 설정
      await page.getByLabel('반복 일정').check();
      await page.getByLabel('반복 유형').selectOption({ value: 'daily' });
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill(formattedEndDate);

      await page.getByTestId('event-submit-button').click();

      // 만약 일정 겹침 경고가 뜨면 계속 진행 버튼 눌러서 이벤트 생성
      await proceedWarningDialog(page);

      // 생성 성공 토스트 메시지 확인
      const toast = page.getByText('일정이 추가되었습니다.').first();
      await expect(toast).toBeVisible();

      // 2. 이벤트 리스트에 반복 일정 있는지 확인
      const eventListView = page.getByTestId('event-list');

      const eventCard = eventListView
        .locator('div')
        .filter({ hasText: '수정 테스트 반복 이벤트' })
        .first();
      await expect(eventCard).toBeVisible();

      // 수정 버튼 클릭
      const editBtn = eventCard.getByRole('button', { name: 'Edit event' });
      await editBtn.click();

      // 반복 일정이 체크되어 있는지 확인
      const repeatCheckbox = page.getByLabel('반복 일정');
      await expect(repeatCheckbox).toBeChecked();

      // 3. 생성된 반복 일정 중 단일 일정을 수정
      await page.getByLabel('반복 유형').selectOption({ value: 'weekly' });
      await page.getByLabel('반복 간격').fill('2');

      // 수정 저장
      await page.getByTestId('event-submit-button').click();

      // 수정 성공 토스트 메시지 확인
      const updateToast = page.getByText('일정이 수정되었습니다.').first();
      await expect(updateToast).toBeVisible();

      await proceedWarningDialog(page);

      // 3. 수정된 내용 확인
      const updatedEventCard = eventListView
        .locator('div')
        .filter({ hasText: '수정 테스트 반복 이벤트' })
        .first();
      await updatedEventCard.getByRole('button', { name: 'Edit event' }).click();

      // 수정 후 반복 일정이 체크 해제되어 단일 일정이 되었는지 확인
      const updatedRepeatCheckbox = page.getByLabel('반복 일정');
      await expect(updatedRepeatCheckbox).not.toBeChecked();

      // 수정 후 반복 일정 유형과 간격이 변경되었는지 확인
      await expect(updatedEventCard.getByText('매주')).toBeVisible();
      await expect(updatedEventCard.getByText('2')).toBeVisible();
    });

    test('4.2 반복 일정 생성 후 삭제', async ({ page }) => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + REPEAT_DURATION);

      const [formattedStartDate, formattedEndDate] = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ];

      // 1. 새로운 반복 일정 생성
      await page.getByLabel('제목').fill('수정 테스트 반복 이벤트');
      await page.getByLabel('날짜').fill(formattedStartDate);
      await page.getByLabel('시작 시간').fill('20:00');
      await page.getByLabel('종료 시간').fill('21:00');

      // 반복 세부 설정
      await page.getByLabel('반복 일정').check();
      await page.getByLabel('반복 유형').selectOption({ value: 'daily' });
      await page.getByLabel('반복 간격').fill('1');
      await page.getByLabel('반복 종료일').fill(formattedEndDate);

      await page.getByTestId('event-submit-button').click();

      // 만약 일정 겹침 경고가 뜨면 계속 진행 버튼 눌러서 이벤트 생성
      await proceedWarningDialog(page);

      // 생성 성공 토스트 메시지 확인
      const createToast = page.getByText('일정이 추가되었습니다.').first();
      await expect(createToast).toBeVisible();

      // 2. 생성된 반복 일정 중 단일 일정을 삭제
      const eventListView = page.getByTestId('event-list');

      const eventCard = eventListView
        .locator('div')
        .filter({ hasText: '수정 테스트 반복 이벤트' })
        .first();

      const deleteBtn = eventCard.getByRole('button', { name: 'Delete event' });
      await deleteBtn.click();

      // 삭제 성공 토스트 메시지 확인
      const deleteToast = page.getByText('일정이 삭제되었습니다.').first();
      await expect(deleteToast).toBeVisible();

      // 삭제된 일정 제외 나머지 일정이 단일 일정으로 변경되었는지 확인
      const remainingEventCard = eventListView
        .locator('div')
        .filter({ hasText: '수정 테스트 반복 이벤트' })
        .first();
      await expect(remainingEventCard).toBeVisible();
    });
  });
});
