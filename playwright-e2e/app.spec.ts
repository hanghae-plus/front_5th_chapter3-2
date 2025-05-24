import { expect, Page, test } from '@playwright/test';

import {
  createEvent,
  deleteEventByTitle,
  findItemByTitleInEventList,
  updateEventByTitle,
} from './testUtils';

test.describe('일반 일정 추가', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Create / Update', () => {
    test.beforeEach(async ({ page }) => {
      await createEvent(page, {
        title: '테스트 일정-1',
        startTime: '09:00',
        endTime: '10:00',
        description: '테스트 설명',
        location: '테스트 위치',
        category: '개인',
      });
    });

    test.afterEach(async ({ page }) => {
      await deleteEventByTitle(page, '테스트 일정-1');
    });

    test('"테스트 일정-1"을 생성한 경우 "일정이 추가되었습니다" 토스트가 노출된다', async ({
      page,
    }) => {
      await expect(page.getByText('일정이 추가되었습니다.')).toBeVisible();
    });

    test('일정을 추가한 경우 일정 목록에 "테스트 일정-1"및 관련 일정이 모두 올바르게 표현된다', async ({
      page,
    }) => {
      const eventItem = await findItemByTitleInEventList(page, '테스트 일정-1');

      await expect(eventItem.getByText('테스트 일정-1')).toBeVisible();
      await expect(eventItem.getByText('09:00 - 10:00')).toBeVisible();
      await expect(eventItem.getByText('테스트 설명')).toBeVisible();
      await expect(eventItem.getByText('테스트 위치')).toBeVisible();
      await expect(eventItem.getByText('카테고리: 개인')).toBeVisible();
    });

    test('일정을 수정하는 경우 변경된 제목 "수정된 테스트 일정-1"이 일정 목록에 올바르게 표현된다', async ({
      page,
    }) => {
      await updateEventByTitle(page, '테스트 일정-1', { title: '수정된 테스트 일정-1' });

      const updatedEventItem = await findItemByTitleInEventList(page, '수정된 테스트 일정-1');
      await expect(updatedEventItem.getByText('수정된 테스트 일정-1')).toBeVisible();

      // 원래 제목으로 되돌리기
      await updateEventByTitle(page, '수정된 테스트 일정-1', { title: '테스트 일정-1' });
    });
  });

  test('삭제 버튼을 누른 경우 일정이 삭제되며, "일정이 삭제되었습니다"라는 토스트가 노출된다', async ({
    page,
  }) => {
    // 먼저 일정을 생성
    await createEvent(page, {
      title: '테스트 일정-1',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '테스트 위치',
      category: '개인',
    });

    // 일정 삭제
    await deleteEventByTitle(page, '테스트 일정-1');

    // 삭제 토스트 메시지 확인
    await expect(page.getByText('일정이 삭제되었습니다.')).toBeVisible();
  });
});
