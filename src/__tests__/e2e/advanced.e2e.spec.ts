import { test, expect } from '@playwright/test';
import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';

test.describe('일정 관리 CRUD 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });
  test('저장된 일정을 렌더링한다', async ({ page }) => {
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

  test('새 이벤트를 순서대로 등록하고 수정하고 삭제한다', async ({ page }) => {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];

    await page.getByLabel('제목').fill('새 이벤트');
    await page.getByLabel('날짜').fill(formattedDate);
    await page.getByLabel('시작 시간').fill('19:00');
    await page.getByLabel('종료 시간').fill('20:00');
    await page.getByLabel('설명').fill('새 이벤트 설명');

    await page.getByTestId('event-submit-button').click();

    const toastForCreateEvent = page.getByText('일정이 추가되었습니다.').first();
    await expect(toastForCreateEvent).toBeVisible();

    const eventCard = page
      .getByTestId('event-list')
      .locator('div')
      .filter({ hasText: '새 이벤트' })
      .first();

    const editBtn = eventCard.getByRole('button', { name: 'Edit event' });
    await editBtn.click();

    await page.getByLabel('제목').fill('수정된 이벤트');
    await page.getByLabel('시작 시간').fill('20:00');
    await page.getByLabel('종료 시간').fill('21:00');
    await page.getByLabel('설명').fill('수정된 이벤트 설명');

    await page.getByTestId('event-submit-button').click();

    const toastForUpdateEvent = page.getByText('일정이 수정되었습니다.').first();
    await expect(toastForUpdateEvent).toBeVisible();

    const eventListView = page.getByTestId('event-list');
    await expect(eventListView.getByText('수정된 이벤트').first()).toBeVisible();
    await expect(eventListView.getByText('20:00 - 21:00').first()).toBeVisible();
    await expect(eventListView.getByText('수정된 이벤트 설명').first()).toBeVisible();

    const updatedEventCard = eventListView
      .locator('div')
      .filter({ hasText: '수정된 이벤트' })
      .first();

    const deleteBtn = updatedEventCard.getByRole('button', { name: 'Delete event' });
    await deleteBtn.click();

    const toastForDeleteEvent = page.getByText('일정이 삭제되었습니다.').first();
    await expect(toastForDeleteEvent).toBeVisible();
  });
});
