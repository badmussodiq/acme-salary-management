import { expect, test } from '@playwright/test';
import { open } from './support';

test.describe('pagination', () => {
  test('restarts at page one when a filter changes and resets to the full list', async ({
    page,
  }) => {
    await open(page, '/employees');
    const pager = page.getByRole('navigation', { name: 'Employees pagination' });
    await expect(pager).toContainText('Page 1 of');

    await pager.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(pager).toContainText('Page 2 of');

    await page.locator('select[name="countryCode"]').selectOption('NG');
    await page.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(pager).toContainText('Page 1 of');
    const filteredTotal = await pager.innerText();

    await page.getByRole('link', { name: 'Reset' }).click();
    await expect(page).toHaveURL(/\/employees$/);
    await expect(pager).toContainText('Page 1 of');
    expect(await pager.innerText()).not.toBe(filteredTotal);
  });

  test('pages through the dashboard salary summary', async ({ page }) => {
    await open(page, '/dashboard');
    const pager = page.getByRole('navigation', { name: 'Salary summary pagination' });
    await expect(pager).toContainText('Page 1 of');
    await pager.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/summaryPage=2/);
    await expect(pager).toContainText('Page 2 of');
  });
});
