import { Page } from '@playwright/test';

export const proceedWarningDialog = async (page: Page) => {
  const warningDialog = page.getByText('일정 겹침 경고');
  if (await warningDialog.isVisible()) {
    await page.getByRole('button', { name: '계속 진행' }).click();
  }
};

export const getEventCardByTitle = async (page: Page, title: string) => {
  return page.getByTestId('event-list').locator('div').filter({ hasText: title }).first();
};
