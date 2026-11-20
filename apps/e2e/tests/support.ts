import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

const exampleValue = (name: string): string => {
  const file = readFileSync(new URL('../../../.env.example', import.meta.url), 'utf8');
  const line = file.split('\n').find((entry) => entry.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} is missing from .env.example`);
  return line.slice(name.length + 1).trim();
};

export const credentials = (): Credentials => ({
  email: process.env['E2E_HR_EMAIL'] ?? exampleValue('INITIAL_HR_EMAIL'),
  password: process.env['E2E_HR_PASSWORD'] ?? exampleValue('INITIAL_HR_PASSWORD'),
});

export const open = async (page: Page, path: string): Promise<void> => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
};

export const fill = async (field: Locator, value: string): Promise<void> => {
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }).toPass();
};

export const signIn = async (page: Page, { email, password }: Credentials): Promise<void> => {
  await open(page, '/login');
  await fill(page.getByLabel('Email'), email);
  await fill(page.getByLabel('Password'), password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/employees$/);
};

export const uniqueSuffix = (): string =>
  Date.now()
    .toString(26)
    .replace(/[0-9]/g, (digit) => String.fromCharCode(97 + Number(digit)));
