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

    const response = await fetch('http://localhost:5173/api/events');
    const { events } = await response.json();

    const eventList = getFilteredEvents(events, '', new Date(), 'month');
    const eventListView = page.getByTestId('event-list');

    eventList.forEach(async (event: Event) => {
      await expect(eventListView.getByText(event.title).first()).toBeVisible();
    });
  });

  test('2. POST API를 통해 저장된 새로운 Event를 렌더 한다.', async ({ page }) => {
    await page.getByLabel('제목').fill('test event');
    await page.getByLabel('날짜').fill('2025-05-21');
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
  });
});
