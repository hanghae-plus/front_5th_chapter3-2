import { test, expect } from '@playwright/test';
import { formatDate } from '../src/utils/dateUtils';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
});

function getNthDayOfCurrentMonth(n) {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();

  const nthDay = new Date(year, month, n);

  return formatDate(nthDay);
}

async function addEvent({ page, event }) {
  await page.getByRole('textbox', { name: '제목' }).click();
  await page.getByRole('textbox', { name: '제목' }).fill(event.title);
  await page.getByRole('textbox', { name: '날짜' }).fill(event.date);
  await page.getByRole('textbox', { name: '시작 시간' }).click();
  await page.getByRole('textbox', { name: '시작 시간' }).click();
  await page.getByRole('textbox', { name: '시작 시간' }).press('ArrowDown');
  await page.getByRole('textbox', { name: '시작 시간' }).press('Tab');
  await page.getByRole('textbox', { name: '시작 시간' }).fill('20:00');
  await page.getByRole('textbox', { name: '종료 시간' }).click();
  await page.getByRole('textbox', { name: '종료 시간' }).press('ArrowDown');
  await page.getByRole('textbox', { name: '종료 시간' }).press('Tab');
  await page.getByRole('textbox', { name: '종료 시간' }).fill('21:00');
  await page.getByRole('textbox', { name: '설명' }).click();
  await page.getByRole('textbox', { name: '설명' }).fill('코어 타임');
  await page.getByRole('textbox', { name: '설명' }).press('Tab');
  await page.getByRole('textbox', { name: '위치' }).fill('잽');
  await page.getByLabel('카테고리').selectOption('개인');
  await page.getByTestId('event-submit-button').click();
}

test.describe.serial('순차적 실행', () => {
  test('일정 추가하기', async ({ page }) => {
    const event = {
      title: '추가 일정',
      date: getNthDayOfCurrentMonth(1),
    };
    await addEvent({ page, event });

    await page.waitForTimeout(500);

    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('추가 일정')).toBeVisible();
    await expect(eventList.getByText('코어 타임')).toBeVisible();
  });

  test('일정 수정하기', async ({ page }) => {
    const event = {
      title: '수정할 일정',
      date: getNthDayOfCurrentMonth(2),
    };
    await addEvent({ page, event });

    await page.getByRole('button', { name: 'Edit event' }).first().click();
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('팀 회의 수정!');
    await page.getByTestId('event-submit-button').click();

    await expect(page.getByText('일정이 수정되었습니다')).toBeVisible();
    const eventList = page.getByTestId('event-list');
    await expect(eventList.getByText('팀 회의 수정!')).toBeVisible();
  });

  test('일정 삭제하기', async ({ page }) => {
    const event = {
      title: '삭제할 일정',
      date: getNthDayOfCurrentMonth(3),
    };
    await addEvent({ page, event });

    const eventList = page.getByTestId('event-list');

    await expect(eventList.getByText('삭제할 일정')).toBeVisible();

    const deleteButtons = page.getByRole('button', { name: 'Delete event' });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
    }

    await expect(eventList.getByText('삭제할 일정')).not.toBeVisible();
  });
});
