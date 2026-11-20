import { expect, test } from '@playwright/test';
import { open, solidPng } from './support';

test('HR manager sets and removes a profile picture', async ({ page }) => {
  await open(page, '/employees');
  await page.getByRole('table').getByRole('row').nth(1).getByRole('link').click();
  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);

  await page
    .getByLabel('Profile picture file')
    .setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: solidPng(64, [30, 120, 200]) });
  await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
  await expect(page.locator('main img').first()).toBeVisible();

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('button', { name: 'Upload picture' })).toBeVisible();
});
