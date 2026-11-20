import { expect, request as playwrightRequest, test, type Page } from '@playwright/test';
import { credentials, fill, open, signIn } from './support';

const watchForCspViolations = (page: Page): string[] => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  return violations;
};

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

  test('signs in, shows the dashboard and signs out', async ({ page }) => {
    await signIn(page, credentials());
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/employees');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('serves pages under a strict content security policy with no violations', async ({
    page,
  }) => {
    const violations = watchForCspViolations(page);

    const response = await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await fill(page.getByLabel('Email'), 'someone@example.com');

    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
    );
    expect(headers['content-security-policy']).not.toContain('unsafe-eval');
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(violations).toEqual([]);
  });

  test('hides the sign-in cookie from page scripts', async ({ page }) => {
    await signIn(page, credentials());

    const visibleToScripts = await page.evaluate(() => document.cookie);

    expect(visibleToScripts).not.toContain('acme_session');
  });

  test('returns to sign-in, without looping, when the session was revoked elsewhere', async ({
    page,
    baseURL,
  }) => {
    await signIn(page, credentials());
    const session = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'acme_session',
    );
    const otherDevice = await playwrightRequest.newContext({
      ...(baseURL ? { baseURL } : {}),
      extraHTTPHeaders: { cookie: `acme_session=${session?.value ?? ''}` },
    });
    await otherDevice.post('/api/v1/auth/logout');
    await otherDevice.dispose();

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
