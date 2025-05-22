import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { Event } from '../../types';

const saveScheduleForm = async (page: Page, form: Omit<Event, 'id' | 'notificationTime'>) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;
  const { type, interval, endDate } = repeat;

  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill(title);
  await page.getByRole('textbox', { name: '날짜' }).click();
  await page.getByRole('textbox', { name: '날짜' }).fill(date);
  await page.getByRole('textbox', { name: '시작 시간' }).click();
  await page.getByRole('textbox', { name: '시작 시간' }).fill(startTime);
  await page.getByRole('textbox', { name: '종료 시간' }).click();
  await page.getByRole('textbox', { name: '종료 시간' }).fill(endTime);
  await page.getByRole('textbox', { name: '설명' }).click();
  await page.getByRole('textbox', { name: '설명' }).fill(description);
  await page.getByRole('textbox', { name: '위치' }).click();
  await page.getByRole('textbox', { name: '위치' }).fill(location);
  await page.getByLabel('카테고리').selectOption(category);

  if (repeat.type !== 'none') {
    await page.locator('label').filter({ hasText: '반복 일정' }).click();
    await page.getByLabel('반복 유형').selectOption(type);
    await page.getByRole('spinbutton', { name: '반복 간격' }).click();
    await page.getByRole('spinbutton', { name: '반복 간격' }).fill(String(interval));

    if (endDate) {
      await page.getByRole('textbox', { name: '반복 종료일' }).fill(String(endDate));
    }
  }

  await page.getByTestId('event-submit-button').click();
};

test('일정의 각 항목을 입력하고 제출하면, 캘린더에 일정이 보인다.', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await saveScheduleForm(page, {
    title: '새로운 일정',
    date: '2025-05-07',
    startTime: '14:00',
    endTime: '15:00',
    description: '새로 추가한 일정의 설명',
    location: '11층 회의실',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
  });

  const eventList = page.getByTestId('event-list');
  await expect(eventList.getByText('새로운 일정', { exact: true })).toBeVisible();
  await expect(eventList.getByText('새로 추가한 일정의 설명', { exact: true })).toBeVisible();
});

test('다음 달의 일정과 미리 알림을 설정하면, 다음 달 버튼을 클릭했을 때 캘린더에 일정과 함께 아이콘이 렌더링된다.', async ({
  page,
}) => {});

test('2주 간격의 반복 일정을 다음 달 말일까지 등록하면, 반복 횟수에 따라 일정이 캘린더에 표시되고 다음 달 이동 버튼을 클릭해도 일정이 표기된다.', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/');
  await saveScheduleForm(page, {
    title: '새로 반복되는 일정',
    date: '2025-05-07',
    startTime: '14:00',
    endTime: '15:00',
    description: '팀 회의가 진행될 예정입니다',
    location: '11층 회의실',
    category: '업무',
    repeat: { type: 'weekly', interval: 2, endDate: '2025-06-30' },
  });

  const calendar = page.getByTestId('month-view');
  await expect(calendar.getByText('새로 반복되는 일정', { exact: true })).toHaveCount(2);

  await page.mouse.move(0, 0);

  await page.getByRole('button', { name: 'Next' }).click();

  const calendarAfter1Month = page.getByTestId('month-view');
  await expect(calendarAfter1Month.getByText('새로 반복되는 일정', { exact: true })).toHaveCount(2);
});
