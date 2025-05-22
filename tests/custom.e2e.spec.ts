import { expect, Page, test } from '@playwright/test';

import { Event } from '../src/types';
import { formatDate } from '../src/utils/dateUtils';

const fillScheduleForm = async (page: Page, data: Omit<Event, 'id'>) => {
  await page.getByRole('button', { name: '일정 추가' }).click();

  await page.getByLabel('제목').fill(data.title);
  await page.getByLabel('날짜').fill(data.date);
  await page.getByLabel('시작 시간').fill(data.startTime);
  await page.getByLabel('종료 시간').fill(data.endTime);
  await page.getByLabel('설명').fill(data.description);
  await page.getByLabel('위치').fill(data.location);
  await page.getByLabel('카테고리').selectOption(data.category);

  await page.getByLabel('알림 설정').selectOption(String(data.notificationTime));

  if (data.repeat.type !== 'none') {
    const checkbox = page.getByTestId('repeat-checkbox'); // 라벨보다 정확함

    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }
    await page.getByLabel('반복 유형').selectOption(data.repeat.type);
    await page.getByLabel('반복 간격').fill(String(data.repeat.interval));
    if (data.repeat.endDate) {
      await page.getByLabel('반복 종료일').fill(data.repeat.endDate);
    }
  }

  await page.getByTestId('event-submit-button').click();

  // 중복 팝업 시 계속 진행 클릭
  const proceedButton = page.getByRole('button', { name: '계속 진행' });
  if (await proceedButton.isVisible()) {
    await proceedButton.click();
  }
};

// 1. 일정의 각 항목을 작성하고 제출하면 캘린더와 목록에 표기된다
// 2. 다음 달 버튼을 클릭했을 때 목록과 캘린더에 저장된 반복 일정이 표기되고, 목록에서 반복 일정 수정 시 해당 항목만 수정된다.
// 3. 테스트로 생성된 반복 일정, 수정된 반복 일정을 다음 달 기록까지 모두 단일 제거로 제거한다.

test.describe.serial('반복 일정 테스트', () => {
  const targetTitle = '반복 일정 1';
  test('일정의 각 항목을 작성하고 제출하면 캘린더와 목록에 표기된다', async ({ page }) => {
    // 테스트 당시의 일자를 기준으로 테스트 이벤트를 생성
    const now = new Date();
    const date = formatDate(now, 10);
    const endDate = formatDate(new Date(now.getFullYear(), now.getMonth() + 2, 0));

    await page.goto('/');
    await fillScheduleForm(page, {
      title: targetTitle,
      date,
      startTime: '10:00',
      endTime: '11:00',
      description: '일정 1 설명',
      location: '집',
      category: '개인',
      repeat: { type: 'weekly', interval: 2, endDate },
      notificationTime: 60,
    });

    const monthView = page.getByTestId('month-view');
    const calendarEvents = monthView.locator('text=반복 일정 1');
    await expect(calendarEvents.first()).toBeVisible();

    const eventList = page.getByTestId('event-list');
    const listEvents = eventList.locator('text=반복 일정 1');
    await expect(listEvents.first()).toBeVisible();
  });

  test('다음 달 버튼을 클릭했을 때 목록과 캘린더에 저장된 반복 일정이 표기되고, 목록에서 반복 일정 수정 시 해당 항목만 수정된다.', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Next' }).click();

    const monthView = page.getByTestId('month-view');
    const calendarEvents = monthView.locator('text=반복 일정 1');
    await expect(calendarEvents.first()).toBeVisible();

    const eventList = page.getByTestId('event-list');
    const listEvents = eventList.locator('text=반복 일정 1');
    await expect(listEvents.first()).toBeVisible();

    const targetEvent = eventList
      .locator('[data-testid^="event-id-"]')
      .filter({
        hasText: targetTitle,
      })
      .first();

    await targetEvent.getByRole('button', { name: 'Edit event' }).click();

    await page.getByLabel('제목').fill('');
    await page.getByLabel('제목').fill('수정된 반복 해제 일정 1');

    await page.getByTestId('event-submit-button').click();

    const proceedButton = page.getByRole('button', { name: '계속 진행' });

    if (await proceedButton.isVisible()) {
      await proceedButton.click();
    }

    const updatedCalendarEvents = monthView.locator('text=수정된 반복 해제 일정 1');
    await expect(updatedCalendarEvents.first()).toBeVisible();

    const updatedListEvents = eventList.locator('text=수정된 반복 해제 일정 1');
    await expect(updatedListEvents.first()).toBeVisible();
  });

  test('테스트로 생성된 반복 일정, 수정된 반복 일정을 다음 달 기록까지 모두 단일 제거로 제거한다.', async ({
    page,
  }) => {
    await page.goto('/'); // 다시 5월부터 하나씩 삭제

    const deleteAllEvents = async (title: string) => {
      const eventList = page.getByTestId('event-list');
      let remaining = true;

      while (remaining) {
        const targetCard = eventList
          .locator('[data-testid^="event-id-"]')
          .filter({ hasText: title })
          .first();

        if ((await targetCard.count()) === 0) {
          remaining = false;
          break;
        }

        await targetCard.getByRole('button', { name: 'Delete event' }).click();
        await page.waitForTimeout(100);
      }
    };

    await deleteAllEvents('반복 일정 1');
    await deleteAllEvents('수정된 반복 해제 일정 1');

    await page.getByRole('button', { name: 'Next' }).click();

    await deleteAllEvents('반복 일정 1');
    await deleteAllEvents('수정된 반복 해제 일정 1');

    const monthView = page.getByTestId('month-view');
    await expect(monthView.locator('text=반복 일정 1')).toHaveCount(0);
    await expect(monthView.locator('text=수정된 반복 해제 일정 1')).toHaveCount(0);

    await page.goto('/');
    await page.getByRole('button', { name: '일정 추가' }).click();
  });
});
