import { test, expect } from '@playwright/test';

import { Event } from '../../types';
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

    eventList.forEach(async (event: Event) => {
      await expect(eventListView.getByText(event.title).first()).toBeVisible();
    });
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
});
