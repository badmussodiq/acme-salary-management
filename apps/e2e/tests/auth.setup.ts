import { test as setup } from '@playwright/test';
import { credentials, signIn } from './support';

export const STORAGE_STATE = '.auth/hr-manager.json';

setup('sign in once and reuse the session', async ({ page }) => {
  await signIn(page, credentials());
  await page.context().storageState({ path: STORAGE_STATE });
});
