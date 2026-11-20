import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const isCi = Boolean(process.env['CI']);
const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:3000';
const usesExternalStack = process.env['E2E_EXTERNAL'] === '1';
const STORAGE_STATE = '.auth/hr-manager.json';

const localServers: PlaywrightTestConfig['webServer'] = [
  {
    command: 'node ../api/dist/main.js',
    url: 'http://localhost:3001/api/v1/health/ready',
    reuseExistingServer: !isCi,
    timeout: 90_000,
    env: { THROTTLE_LIMIT: '100000' },
  },
  {
    command: 'pnpm exec next start',
    cwd: '../web',
    url: 'http://localhost:3000/healthz',
    reuseExistingServer: !isCi,
    timeout: 90_000,
  },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: isCi ? 1 : 0,
  expect: { timeout: 10_000 },
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'sign-in',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['workflow'],
    },
    {
      name: 'workflow',
      testMatch: /(hr-workflow|avatar)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
  ...(usesExternalStack ? {} : { webServer: localServers }),
});
