import { test, expect } from '@playwright/test';

test.describe('일정관리 앱 E2e 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
  });

  test('1. ', async ({ page }) => {});

  test('2.', async ({ page }) => {});

  test('3. ', async ({ page }) => {});
});
