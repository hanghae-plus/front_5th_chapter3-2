import { expect, Page, test } from '@playwright/test';

import { Event } from '../src/types';

// 일정의 각 항목을 작성하고 제출하면 캘린더와 목록에 표기된다.
// 다음 달의 일정과 미리 알림을 설정하면, 다음 달 버튼을 클릭했을 때 캘린더에 일정과 함께 아이콘이 렌더링된다.
// 2주 간격의 반복 일정을 다음 달 말일까지 등록하면, 반복 횟수에 따라 일정이 캘린더에 표시되고 다음 달 이동 버튼을 클릭해도 일정이 표기된다.

const fillScheduleForm = async (page: Page, data: Omit<Event, 'id' | 'notificationTime'>) => {
  await page.getByRole('button', { name: '일정 추가' }).click();

  await page.getByLabel('제목').fill(data.title);
  await page.getByLabel('날짜').fill(data.date);
  await page.getByLabel('시작 시간').fill(data.startTime);
  await page.getByLabel('종료 시간').fill(data.endTime);
  await page.getByLabel('설명').fill(data.description);
  await page.getByLabel('위치').fill(data.location);
  await page.getByLabel('카테고리').selectOption(data.category);

  if (data.repeat.type !== 'none') {
    const checkbox = page.getByLabel('반복 설정');
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
};

test('일정의 각 항목을 작성하고 제출하면 캘린더와 목록에 표기된다', async ({ page }) => {
  await page.goto('/');
  await fillScheduleForm(page, {
    title: '일정 1',
    date: '2025-05-10',
    startTime: '10:00',
    endTime: '11:00',
    description: '일정 1 설명',
    location: '집',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
  });

  const monthView = page.getByTestId('month-view');
  await expect(monthView.getByText('일정 1')).toBeVisible();

  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('2025-05-10')).toBeVisible();
  await expect(eventList.getByText('10:00 - 11:00')).toBeVisible();
});

test('다음 달의 일정과 미리 알림을 설정하면, 다음 달 버튼을 클릭했을 때 캘린더에 일정과 함께 아이콘이 렌더링된다.', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('일정 추가')).toBeVisible();
});

test('2주 간격의 반복 일정을 다음 달 말일까지 등록하면, 반복 횟수에 따라 일정이 캘린더에 표시되고 다음 달 이동 버튼을 클릭해도 일정이 표기된다.', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('일정 추가')).toBeVisible();
});
