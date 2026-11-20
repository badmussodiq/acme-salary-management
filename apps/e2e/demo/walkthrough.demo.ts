import { expect, test } from '@playwright/test';
import { credentials, solidPng, uniqueSuffix } from '../tests/support';
import {
  clearCaption,
  fillDate,
  highlight,
  moneyToNumber,
  nextEffectiveDate,
  prepareNarration,
  say,
  scrollDown,
  typeSlowly,
} from './narration';

test('HR manager walkthrough', async ({ page }) => {
  const { email, password } = credentials();
  await prepareNarration(page);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await say(
    page,
    'ACME Salary Management: one place for the HR team to manage pay for 10,000 employees',
    4500,
  );

  await say(
    page,
    'Signing in as the HR manager. The session cookie is HttpOnly and revocable.',
    2200,
  );
  await typeSlowly(page.getByLabel('Email'), email);
  await typeSlowly(page.getByLabel('Password'), password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.waitForLoadState('networkidle');

  await say(
    page,
    'The dashboard answers how ACME pays its people, straight from the database',
    3500,
  );
  await highlight(page.getByRole('link', { name: /Without current pay/ }), 2200);
  await say(page, 'Headcount by country and department, computed in SQL', 3000);
  await scrollDown(page, 380, 1500);
  await say(page, 'Pay is shown per currency and per pay frequency, never mixed', 3500);
  await highlight(page.getByRole('heading', { name: 'Pay currency and frequency' }), 1500);
  await scrollDown(page, 420, 800);

  await say(page, 'Salary summary: minimum, median, average and maximum per currency', 3800);
  await highlight(page.getByText(/never converted or combined across currencies/), 2000);
  await scrollDown(page, 380, 1200);

  await say(page, 'Filter to one country and group by department', 2600);
  await page.locator('select[name="groupBy"]').selectOption('department');
  await page.locator('select[name="countryCode"]').selectOption('NG');
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.waitForLoadState('networkidle');
  await scrollDown(page, 300, 2800);

  await say(
    page,
    'Data quality: missing pay, inactive staff still paid, and unusual salaries',
    3800,
  );
  await page.getByRole('heading', { name: 'Data quality' }).scrollIntoViewIfNeeded();
  await scrollDown(page, 300, 3500);

  await page.getByRole('link', { name: /^[\d,]+ active employees$/ }).click();
  await page.waitForLoadState('networkidle');
  await say(page, 'One click lists the employees who have no compensation in effect', 3800);

  await say(
    page,
    'The directory is paginated, searchable, sortable and filterable on the server',
    3200,
  );
  await page.goto(
    '/employees?countryCode=US&department=Engineering&employmentStatus=active&currencyCode=USD',
  );
  await page.waitForLoadState('networkidle');
  await highlight(page.getByRole('table'), 2200);
  await say(page, 'Sorting by hire date, newest first', 2000);
  await page.getByRole('link', { name: /^Name/ }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  await say(page, 'Open an employee to see profile, pay history and the audit trail', 3000);
  const firstRow = page.getByRole('table').getByRole('row').nth(1);
  const payCell = await firstRow.getByRole('cell').nth(6).innerText();
  await firstRow.getByRole('link').click();
  await page.waitForLoadState('networkidle');
  await highlight(page.getByRole('heading', { name: 'Current compensation' }), 1800);
  await scrollDown(page, 380, 1800);

  const sinceText = await page
    .getByText(/^Since \d/)
    .first()
    .innerText();
  const raise = (moneyToNumber(payCell) * 1.08).toFixed(2);
  await say(page, 'Give a raise: a new pay period closes the previous one', 3000);
  await typeSlowly(page.getByLabel('Amount'), raise);
  await fillDate(page.getByLabel('Effective from'), nextEffectiveDate(sinceText));
  await page.getByRole('button', { name: 'Add compensation' }).click();
  await expect(
    page.locator('[data-sonner-toast]', { hasText: 'Compensation added' }),
  ).toBeVisible();
  await say(
    page,
    'History keeps the old period; the audit trail records who changed what, and when',
    4500,
  );

  await say(
    page,
    'Validation protects the data: a start date before the latest period is refused',
    3000,
  );
  await page.getByLabel('Amount').fill('1.00');
  await page.getByLabel('Effective from').fill('2020-01-01');
  await page.getByRole('button', { name: 'Add compensation' }).click();
  await expect(page.getByText(/Effective date must be after/)).toBeVisible();
  await page.waitForTimeout(3200);
  await scrollDown(page, 500, 3500);

  const suffix = uniqueSuffix();
  await say(page, 'Add a new employee together with their first compensation', 2600);
  await page.goto('/employees/new');
  await page.waitForLoadState('networkidle');
  await say(
    page,
    'Every country in the world is available, and the currency follows the country',
    3000,
  );
  for (const [country, currency] of [
    ['JP', 'JPY'],
    ['CH', 'CHF'],
    ['KI', 'AUD'],
  ] as const) {
    await page.getByLabel('Country').selectOption(country);
    await expect(page.getByLabel('Currency')).toHaveValue(currency);
    await page.waitForTimeout(1600);
  }
  await typeSlowly(page.getByLabel('First name'), 'Grace');
  await typeSlowly(page.getByLabel('Last name'), `Hopper${suffix}`.replaceAll(/\d/g, ''));
  await typeSlowly(page.getByLabel('Work email'), `grace.${suffix}@example.com`);
  await page.getByLabel('Country').selectOption('GB');
  await typeSlowly(page.getByLabel('Department'), 'Engineering');
  await typeSlowly(page.getByLabel('Job title'), 'Staff Engineer');
  await fillDate(page.getByLabel('Hire date'), '2025-09-01');
  await typeSlowly(page.getByLabel('Amount'), '98000');
  await page.getByLabel('Currency').selectOption('GBP');
  await fillDate(page.getByLabel('Effective from'), '2025-09-01');
  await page.getByRole('button', { name: 'Create employee' }).click();
  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);
  await page.waitForLoadState('networkidle');
  await say(page, 'Created. The employee number is generated and the creation is audited', 3800);

  await say(
    page,
    'Profile pictures upload to S3-compatible storage; initials show until then',
    3200,
  );
  await page.getByLabel('Profile picture file').setInputFiles({
    name: 'grace.png',
    mimeType: 'image/png',
    buffer: solidPng(96, [30, 120, 200]),
  });
  await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
  await page.waitForTimeout(2500);

  await say(
    page,
    'Editing uses optimistic concurrency, so two people cannot overwrite each other',
    3200,
  );
  await page.getByRole('link', { name: 'Edit details' }).click();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Department').fill('Platform');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);
  await page.waitForLoadState('networkidle');
  await scrollDown(page, 500, 3200);

  await say(
    page,
    'Behind the scenes: typed API, strict validation, rate limits, CSP, CI/CD and tests',
    4500,
  );
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await say(page, 'Signing out revokes the session on the server. Thanks for watching.', 4000);
  await clearCaption(page);
});
