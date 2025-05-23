import { test, expect } from '@playwright/test';

test.describe.serial('E2E Test', () => {
  test('1. 사용자에게 웹서비스가 정상적으로 로드 되어야한다.', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('2. 2일마다 반복 일정 생성 후 캘린더에 표시됨', async ({ page }) => {
    test.setTimeout(100000);
    await page.goto('http://localhost:5173/');
    // 테스트 독립성을 위해 모든 이벤트 제거
    await page.getByTestId('delete-all-events').click();

    // 반복 일정 생성
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('반복 일정 테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-22');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('09:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('반복 일정 테스트 설명');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('반복 일정 테스트 위치');
    await page.getByLabel('카테고리').selectOption('개인');
    await page.getByText('반복 일정').click();
    await page.getByTestId('repeat-type-selector').selectOption('daily');
    await page.getByRole('spinbutton', { name: '반복 간격' }).click();
    await page.getByRole('spinbutton', { name: '반복 간격' }).fill('2');
    await page.getByRole('textbox', { name: '반복 종료일' }).fill('2025-05-30');
    await page.getByTestId('event-submit-button').click();

    // 반복 일정 확인
    await page.getByRole('cell', { name: '22 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '24 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '26 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '28 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '30 반복 일정 테스트' }).click();

    // 반복 일정 반복 아이콘 확인
    await page.getByRole('cell', { name: '22 반복 일정 테스트' }).getByRole('img').click();
    await page.getByRole('cell', { name: '24 반복 일정 테스트' }).getByRole('img').click();
    await page.getByRole('cell', { name: '26 반복 일정 테스트' }).getByRole('img').click();
    await page.getByRole('cell', { name: '28 반복 일정 테스트' }).getByRole('img').click();
    await page.getByRole('cell', { name: '30 반복 일정 테스트' }).getByRole('img').click();
  });
  test('3. 반복 일정 중 단일 일정 수정 시 반복 아이콘이 사라지며 해당 일정만 변경되고 나머지 일정은 유지된다.', async ({
    page,
  }) => {
    test.setTimeout(100000);
    await page.goto('http://localhost:5173/');

    await page.getByRole('button', { name: 'Edit event' }).first().click();
    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('수정된 반복 일정 테스트');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('수정된 반복 일정 테스트 설명');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('수정된 반복 일정 테스트 위치');
    await page.getByTestId('event-submit-button').click();

    // 수정된 일정과 그 외 일정 유지 확인
    await page.getByRole('cell', { name: '수정된 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '24 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '26 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '28 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '30 반복 일정 테스트' }).click();

    // 수정된 일정 반복 아이콘 사라짐 확인
    const iconCount = await page
      .getByRole('cell', { name: '수정된 반복 일정 테스트' })
      .getByRole('img')
      .count();
    expect(iconCount).toBe(0);
  });

  test('4. 반복 일정 중 단일 일정 삭제 시 해당 일정만 삭제되고 나머지 일정은 유지된다.', async ({
    page,
  }) => {
    test.setTimeout(100000);
    await page.goto('http://localhost:5173/');

    await page.getByRole('button', { name: 'Delete event' }).nth(3).click();

    // 삭제된 일정 및 그 외 일정 유지 확인
    await page.getByRole('cell', { name: '수정된 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '24 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '26 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '28' }).click();
    await page.getByRole('cell', { name: '30 반복 일정 테스트' }).click();
  });

  test('5. 반복 일정 전체 삭제 시 모든 반복 일정이 삭제된다.', async ({ page }) => {
    test.setTimeout(100000);
    await page.goto('http://localhost:5173/');

    await page.getByTestId('delete-all-repeated-events').first().click();

    // 삭제된 일정 및 그 외 일정 유지 확인
    await page.getByRole('cell', { name: '수정된 반복 일정 테스트' }).click();
    await page.getByRole('cell', { name: '24' }).click();
    await page.getByRole('cell', { name: '26' }).click();
    await page.getByRole('cell', { name: '28' }).click();
    await page.getByRole('cell', { name: '30' }).click();
  });

  test('6. 31일에 매월 반복 일정을 설정하면 30일이 마지막인 달에는 일정이 등록되지 않는다.', async ({
    page,
  }) => {
    test.setTimeout(100000);
    await page.goto('http://localhost:5173/');
    // 테스트 독립성을 위해 모든 이벤트 제거
    await page.getByTestId('delete-all-events').click();

    await page.getByRole('textbox', { name: '제목' }).click();
    await page.getByRole('textbox', { name: '제목' }).fill('베라 데이 테스트');
    await page.getByRole('textbox', { name: '날짜' }).fill('2025-05-31');
    await page.getByRole('textbox', { name: '시작 시간' }).click();
    await page.getByRole('textbox', { name: '시작 시간' }).fill('09:00');
    await page.getByRole('textbox', { name: '종료 시간' }).click();
    await page.getByRole('textbox', { name: '종료 시간' }).fill('11:00');
    await page.getByRole('textbox', { name: '설명' }).click();
    await page.getByRole('textbox', { name: '설명' }).fill('베라데이 테스트 설명');
    await page.getByRole('textbox', { name: '위치' }).click();
    await page.getByRole('textbox', { name: '위치' }).fill('베라데이 테스트 위치');
    await page.getByLabel('카테고리').selectOption('개인');
    await page.getByText('반복 일정').click();
    await page.getByTestId('repeat-type-selector').selectOption('monthly');
    await page.getByRole('spinbutton', { name: '반복 간격' }).click();
    await page.getByRole('spinbutton', { name: '반복 간격' }).fill('1');
    await page.getByRole('textbox', { name: '반복 종료일' }).fill('2025-12-31');
    await page.getByTestId('event-submit-button').click();

    // 매월 마지막 날 일정 확인
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(1); // 5월
    await page.getByRole('cell', { name: '베라 데이 테스트' }).click();

    await page.getByRole('button', { name: 'Next' }).click(); // 6월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(0);

    await page.getByRole('button', { name: 'Next' }).click(); // 7월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(1);
    await page.getByRole('cell', { name: '베라 데이 테스트' }).click();

    await page.getByRole('button', { name: 'Next' }).click(); // 8월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(1);
    await page.getByRole('cell', { name: '베라 데이 테스트' }).click();

    await page.getByRole('button', { name: 'Next' }).click(); // 9월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(0);

    await page.getByRole('button', { name: 'Next' }).click(); // 10월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(1);

    await page.getByRole('cell', { name: '베라 데이 테스트' }).click();

    await page.getByRole('button', { name: 'Next' }).click(); // 11월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(0);

    await page.getByRole('button', { name: 'Next' }).click(); // 12월
    expect(await page.getByRole('cell', { name: '31' }).count()).toBe(1);
    await page.getByRole('cell', { name: '베라 데이 테스트' }).click();
  });
});
