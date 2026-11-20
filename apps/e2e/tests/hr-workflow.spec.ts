import { expect, test, type Page } from '@playwright/test';
import { fill, open, uniqueSuffix } from './support';

const suffix = uniqueSuffix();
const person = {
  firstName: 'Zainab',
  lastName: `Test${suffix}`,
  email: `zainab.${suffix}@example.com`,
};

const createEmployee = async (page: Page): Promise<void> => {
  await open(page, '/employees/new');
  await fill(page.getByLabel('First name'), person.firstName);
  await fill(page.getByLabel('Last name'), person.lastName);
  await fill(page.getByLabel('Work email'), person.email);
  await page.getByLabel('Country').selectOption('GH');
  await fill(page.getByLabel('Department'), 'Finance');
  await fill(page.getByLabel('Job title'), 'Financial Analyst');
  await fill(page.getByLabel('Hire date'), '2024-02-01');
  await fill(page.getByLabel('Amount'), '90000');
  await page.getByLabel('Currency').selectOption('GHS');
  await fill(page.getByLabel('Effective from'), '2024-02-01');
  await page.getByRole('button', { name: 'Create employee' }).click();
  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);
};

test.describe.serial('HR manager salary workflow', () => {
  test('creates an employee with an initial compensation', async ({ page }) => {
    await createEmployee(page);

    await expect(
      page.getByRole('heading', { name: `${person.firstName} ${person.lastName}` }),
    ).toBeVisible();
    await expect(page.getByText('GHS 90,000.00 / yr').first()).toBeVisible();
    await expect(page.getByText(person.email)).toBeVisible();
  });

  test('rejects an invalid new compensation with a clear message', async ({ page }) => {
    await open(page, `/employees?search=${person.lastName}`);
    await page.getByRole('link', { name: `${person.firstName} ${person.lastName}` }).click();

    await fill(page.getByLabel('Amount'), '-5');
    await fill(page.getByLabel('Effective from'), '2025-01-01');
    await page.getByRole('button', { name: 'Add compensation' }).click();

    await expect(
      page.getByText('amount must be a positive amount with at most 2 decimal places'),
    ).toBeVisible();
  });

  test('adds a compensation change and keeps the history and audit trail', async ({ page }) => {
    await open(page, `/employees?search=${person.lastName}`);
    await page.getByRole('link', { name: `${person.firstName} ${person.lastName}` }).click();

    await fill(page.getByLabel('Amount'), '105000.50');
    await fill(page.getByLabel('Effective from'), '2025-03-01');
    await page.getByRole('button', { name: 'Add compensation' }).click();

    const history = page.getByRole('table').first();
    await expect(
      history.getByRole('row', { name: /105,000\.50.*01 Mar 2025.*Current/ }),
    ).toBeVisible();
    await expect(
      history.getByRole('row', { name: /90,000\.00.*01 Feb 2024.*01 Mar 2025/ }),
    ).toBeVisible();

    const audit = page.getByRole('table').nth(1);
    await expect(
      audit.getByRole('row', { name: /Compensation added.*replacing 90000\.00 GHS/ }),
    ).toBeVisible();
    await expect(audit.getByRole('row', { name: /Employee created/ })).toBeVisible();
  });

  test('refuses a compensation that starts before the latest one', async ({ page }) => {
    await open(page, `/employees?search=${person.lastName}`);
    await page.getByRole('link', { name: `${person.firstName} ${person.lastName}` }).click();

    await fill(page.getByLabel('Amount'), '1.00');
    await fill(page.getByLabel('Effective from'), '2024-06-01');
    await page.getByRole('button', { name: 'Add compensation' }).click();

    await expect(
      page.getByText(/Effective date must be after the latest compensation start date/),
    ).toBeVisible();
  });

  test('edits the employee and records the change', async ({ page }) => {
    await open(page, `/employees?search=${person.lastName}`);
    await page.getByRole('link', { name: `${person.firstName} ${person.lastName}` }).click();
    await page.getByRole('link', { name: 'Edit details' }).click();

    await fill(page.getByLabel('Department'), 'Treasury');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}$/);
    await expect(page.getByText('Treasury').first()).toBeVisible();
    await expect(
      page.getByRole('row', { name: /Employee updated.*department: Finance → Treasury/ }),
    ).toBeVisible();
  });

  test('finds the employee through search and filters', async ({ page }) => {
    await open(page, '/employees');

    await fill(page.getByLabel('Search name or employee number'), person.lastName.toLowerCase());
    await page.getByLabel('Country').selectOption('GH');
    await page.getByLabel('Currency').selectOption('GHS');
    await page.getByRole('button', { name: 'Apply filters' }).click();

    const rows = page.getByRole('table').getByRole('row');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText(`${person.firstName} ${person.lastName}`);
    await expect(rows.nth(1)).toContainText('GHS 105,000.50 / yr');
  });

  test('shows the employee in the currency-safe dashboard summary', async ({ page }) => {
    await open(page, '/dashboard?groupBy=countryCode&countryCode=GH&status=all');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    const summary = page.getByRole('table').first();
    await expect(summary.getByRole('row', { name: /Ghana.*GHS.*per year/ })).toBeVisible();
    await expect(page.getByText(/never converted or combined across currencies/)).toBeVisible();
  });

  test('links the data-quality counts to the filtered directory', async ({ page }) => {
    await open(page, '/dashboard');

    await page.getByRole('link', { name: /Without current pay/ }).click();

    await expect(page).toHaveURL(/compensation=missing/);
    await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();
  });

  test('renders the dashboard and employee pages without content security violations', async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) violations.push(message.text());
    });

    await open(page, '/dashboard');
    await open(page, '/employees');
    await open(page, '/employees/new');

    expect(violations).toEqual([]);
  });
});
