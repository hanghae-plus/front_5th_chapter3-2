import { Page } from '@playwright/test';

interface EventForm {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  category?: string;
}

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const paddedMonth = month.toString().padStart(2, '0');
  const paddedDay = day.toString().padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}`;
};

// 헬퍼 함수들
export async function findItemByTitleInEventList(page: Page, title: string) {
  const eventList = page.getByTestId('event-list');
  const titleElement = eventList.getByText(title).first();
  // 제목 요소에서 상위 div 요소를 찾아 반환 (Cypress의 .parents('div').eq(2)와 유사)
  return titleElement.locator('..').locator('..').locator('..');
}

export async function deleteEventByTitle(page: Page, title: string) {
  const eventItem = await findItemByTitleInEventList(page, title);
  await eventItem.getByLabel('Delete event').click();
}

export async function createEvent(page: Page, form: Partial<EventForm>) {
  const {
    title = '',
    date = getToday(),
    startTime = '00:00',
    endTime = '00:01',
    description = '',
    location = '',
    category = '',
  } = form;

  await page.getByLabel('제목').fill(title);
  await page.getByLabel('날짜').fill(date);
  await page.getByLabel('시작 시간').fill(startTime);
  await page.getByLabel('종료 시간').fill(endTime);
  await page.getByLabel('설명').fill(description);
  await page.getByLabel('위치').fill(location);
  if (category) {
    await page.getByLabel('카테고리').selectOption(category);
  }
  await page.getByRole('button', { name: '일정 추가' }).click();
}

export async function updateEventByTitle(
  page: Page,
  targetTitle: string,
  form: Partial<EventForm>
) {
  const eventItem = await findItemByTitleInEventList(page, targetTitle);
  await eventItem.getByLabel('Edit event').click();

  const { title, date, startTime, endTime, description, location, category } = form;

  if (title) {
    await page.getByLabel('제목').clear();
    await page.getByLabel('제목').fill(title);
  }
  if (date) {
    await page.getByLabel('날짜').clear();
    await page.getByLabel('날짜').fill(date);
  }
  if (startTime) {
    await page.getByLabel('시작 시간').clear();
    await page.getByLabel('시작 시간').fill(startTime);
  }
  if (endTime) {
    await page.getByLabel('종료 시간').clear();
    await page.getByLabel('종료 시간').fill(endTime);
  }
  if (description) {
    await page.getByLabel('설명').clear();
    await page.getByLabel('설명').fill(description);
  }
  if (location) {
    await page.getByLabel('위치').clear();
    await page.getByLabel('위치').fill(location);
  }
  if (category) {
    await page.getByLabel('카테고리').selectOption(category);
  }

  await page.getByRole('button', { name: '일정 수정' }).click();
}
