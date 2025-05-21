import { test, expect } from '@playwright/test';

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
});
