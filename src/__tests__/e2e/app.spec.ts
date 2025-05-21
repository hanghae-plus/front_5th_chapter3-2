import { test, expect } from '@playwright/test';

import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';

test('1. GET API를 통해 저장된 Event List를 가져와서 렌더 한다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');

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
