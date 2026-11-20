import { readFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
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
  await expect(page).toHaveURL(/\/dashboard$/);
};

export const uniqueSuffix = (): string =>
  Date.now()
    .toString(26)
    .replace(/[0-9]/g, (digit) => String.fromCharCode(97 + Number(digit)));

const pngChunk = (type: string, data: Buffer): Buffer => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

export const solidPng = (
  size: number,
  [red, green, blue]: readonly [number, number, number],
): Buffer => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array.from({ length: size }, () => [red, green, blue]).flat()),
  ]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
};
