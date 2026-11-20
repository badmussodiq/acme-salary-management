import { expect, test } from '@playwright/test';
import { credentials, fill, open, signIn } from './support';

test.describe('authentication', () => {
  test('sends anonymous visitors to the sign-in page', async ({ page }) => {
    await page.goto('/employees');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('rejects a wrong password without revealing which part was wrong', async ({ page }) => {
    await open(page, '/login');
    await fill(page.getByLabel('Email'), credentials().email);
    await fill(page.getByLabel('Password'), 'definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signs in, shows the directory and signs out', async ({ page }) => {
    await signIn(page, credentials());
    await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/employees');
    await expect(page).toHaveURL(/\/login$/);
  });
});
