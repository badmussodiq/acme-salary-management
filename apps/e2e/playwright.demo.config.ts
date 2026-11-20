import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './demo',
  testMatch: /.*\.demo\.ts/,
  timeout: 8 * 60_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: 'list',
  outputDir: './demo-output',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    video: { mode: 'on', size: { width: 1280, height: 720 } },
  },
});
