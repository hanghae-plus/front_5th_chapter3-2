import { expect, test } from '@playwright/test';

test('반복 일정을 단일 일정으로 수정하면 반복 아이콘이 사라진다', async ({ page }) => {
  await page.goto('/');

  const title = `반복 일정 테스트 ${Date.now()}`;

  // 1. 반복 일정 생성
  await page.getByLabel('제목').fill(title);
  await page.getByLabel('날짜').fill('2025-05-24');
  await page.getByLabel('시작 시간').fill('10:00');
  await page.getByLabel('종료 시간').fill('11:00');
  await page.getByLabel('설명').fill('E2E 테스트 일정');
  await page.getByLabel('위치').fill('회의실 C');
  await page.getByLabel('카테고리').selectOption('업무');

  // 반복 설정
  await page.getByTestId('repeat-toggle').check();
  await page.getByLabel('반복 유형').selectOption('daily');
  await page.getByLabel('반복 간격').fill('2');
  await page.getByLabel('반복 횟수').fill('1');
  await page.getByLabel('반복 종료일').fill('2025-05-31');

  await page.getByTestId('event-submit-button').click();

  // 2. 반복 아이콘이 있는지 확인
  const event = page.getByText(title).first().locator('..');
  await expect(event.getByText('🔁')).toBeVisible();

  // 3. 수정 → 반복 일정 해제
  await page
    .getByTestId(/^edit-event-button-/)
    .first()
    .click();
  await page.getByTestId('repeat-toggle').uncheck();
  await page.getByTestId('event-submit-button').click();

  // 4. 아이콘이 사라졌는지 확인
  const updatedCard = page.getByText(title).first().locator('..');
  await expect(updatedCard.getByText('🔁')).not.toBeVisible();
});
