import { test, expect, Page } from '@playwright/test';

async function fillRepeatEventForm(
  page: Page,
  {
    title,
    date,
    startTime,
    endTime,
    repeatType,
    interval,
    endDate,
  }: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    repeatType: string;
    interval: string;
    endDate: string;
  }
) {
  await page.getByLabel('제목').fill(title);
  await page.getByLabel('날짜').fill(date);
  await page.getByLabel('시작 시간').fill(startTime);
  await page.getByLabel('종료 시간').fill(endTime);
  await page.getByLabel('repeat-type').selectOption(repeatType);
  await page.getByRole('spinbutton', { name: 'repeat-interval' }).fill(interval);
  await page.getByLabel('repeat-end-date').fill(endDate);
}

test.describe('반복일정 추가', () => {
  let timestamp: string;
  let title: string;

  test.beforeEach(async ({ page }) => {
    timestamp = Date.now().toString();
    title = `반복일정-${timestamp}`;
    await page.goto('/');
    await page.waitForSelector('text=일정 로딩 완료');
  });

  test('반복일정을 생성하고 목록에 표시된다', async ({ page }) => {
    await page.getByLabel('repeat-checkbox').check();
    await fillRepeatEventForm(page, {
      title,
      date: '2025-05-04',
      startTime: '01:00',
      endTime: '05:03',
      repeatType: 'weekly',
      interval: '1',
      endDate: '2025-10-01',
    });
    await page.getByTestId('event-submit-button').click();

    const duplicateWarn = page.getByText('일정 겹침 경고');
    if (await duplicateWarn.isVisible()) {
      await page.getByRole('button', { name: 'continue-button' }).click();
      await page.waitForSelector('text=일정이 추가되었습니다');
    }

    const lastEvent = page.getByTestId('event-card').last();
    await lastEvent.scrollIntoViewIfNeeded();
    await expect(lastEvent).toBeVisible();
    await expect(lastEvent).toContainText(title);
    await expect(lastEvent).toContainText('반복: 1주마다 (종료: 2025-10-01)');
  });
});

test.describe('반복일정 수정', () => {
  let timestamp: string;
  let title: string;
  let updatedTitle: string;

  test.beforeEach(async ({ page }) => {
    timestamp = Date.now().toString();
    title = `반복일정-${timestamp}`;
    updatedTitle = `반복일정이 이젠 아니야-${timestamp}`;

    await page.goto('/');
    await page.waitForSelector('text=일정 로딩 완료');
    await page.getByLabel('repeat-checkbox').check();
    await fillRepeatEventForm(page, {
      title,
      date: '2025-05-01',
      startTime: '07:00',
      endTime: '10:03',
      repeatType: 'weekly',
      interval: '1',
      endDate: '2025-06-01',
    });
    await page.getByTestId('event-submit-button').click();

    const duplicateWarn = page.getByText('일정 겹침 경고');
    if (await duplicateWarn.isVisible()) {
      await page.getByRole('button', { name: 'continue-button' }).click();
      await page.waitForSelector('text=일정이 추가되었습니다');
    }
  });

  test('추가된 반복일정을 수정하면 일반 일정으로 변경된다', async ({ page }) => {
    const lastEvent = page.getByTestId('event-card').last();
    await lastEvent.getByLabel('Edit event').click();

    await page.getByLabel('제목').fill(updatedTitle);
    await page.getByLabel('날짜').fill('2025-05-14');
    await page.getByLabel('시작 시간').fill('02:00');
    await page.getByTestId('event-submit-button').click();

    const duplicateWarn = page.getByText('일정 겹침 경고');
    if (await duplicateWarn.isVisible()) {
      await page.getByRole('button', { name: 'continue-button' }).click();
      await page.waitForSelector('text=일정이 수정되었습니다');
    }

    await lastEvent.scrollIntoViewIfNeeded();
    await expect(lastEvent).toContainText(updatedTitle);
    await expect(lastEvent).not.toContainText('반복: 5주마다 (종료: 2025-06-15)');
  });
});

test.describe('반복일정 삭제', () => {
  let timestamp: string;
  let title: string;

  test.beforeEach(async ({ page }) => {
    timestamp = Date.now().toString();
    title = `반복일정-${timestamp}`;

    // 생성
    await page.goto('/');
    await page.waitForSelector('text=일정 로딩 완료');
    await page.getByLabel('repeat-checkbox').check();
    await fillRepeatEventForm(page, {
      title,
      date: '2025-05-04',
      startTime: '07:00',
      endTime: '12:03',
      repeatType: 'weekly',
      interval: '5',
      endDate: '2025-06-01',
    });
    await page.getByTestId('event-submit-button').click();

    const duplicateWarn = page.getByText('일정 겹침 경고');
    if (await duplicateWarn.isVisible()) {
      await page.getByRole('button', { name: 'continue-button' }).click();
      await page.waitForSelector('text=일정이 추가되었습니다');
    }
  });

  test('반복일정을 삭제할 수 있다', async ({ page }) => {
    const lastEvent = page.getByTestId('event-card').last();
    await lastEvent.getByRole('button', { name: 'Delete event' }).click();

    await page.waitForSelector('text=일정이 삭제되었습니다');
    await expect(page.getByText(title)).not.toBeVisible();
  });
});
