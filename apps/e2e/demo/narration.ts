import type { Locator, Page } from '@playwright/test';

const OVERLAY_STORAGE_KEY = 'demo-caption';

const installOverlay = (storageKey: string): void => {
  const render = (): void => {
    const text = sessionStorage.getItem(storageKey);
    let box = document.getElementById('demo-caption');
    if (!text) {
      box?.remove();
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.id = 'demo-caption';
      Object.assign(box.style, {
        position: 'fixed',
        left: '50%',
        bottom: '28px',
        transform: 'translateX(-50%)',
        maxWidth: '1000px',
        padding: '14px 24px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.92)',
        color: '#ffffff',
        font: '600 20px/1.35 ui-sans-serif, system-ui, sans-serif',
        textAlign: 'center',
        zIndex: '2147483647',
        pointerEvents: 'none',
        boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
      });
      document.body.appendChild(box);
    }
    box.textContent = text;
  };
  window.addEventListener('demo-caption', render);
  document.addEventListener('DOMContentLoaded', render);
  setInterval(render, 400);
};

export const prepareNarration = async (page: Page): Promise<void> => {
  await page.addInitScript(installOverlay, OVERLAY_STORAGE_KEY);
};

export const say = async (page: Page, text: string, holdMs: number): Promise<void> => {
  await page.evaluate(
    ([key, caption]) => {
      sessionStorage.setItem(key, caption);
      window.dispatchEvent(new Event('demo-caption'));
    },
    [OVERLAY_STORAGE_KEY, text] as const,
  );
  await page.waitForTimeout(holdMs);
};

export const clearCaption = async (page: Page): Promise<void> => {
  await page.evaluate((key) => {
    sessionStorage.removeItem(key);
    window.dispatchEvent(new Event('demo-caption'));
  }, OVERLAY_STORAGE_KEY);
};

export const highlight = async (target: Locator, holdMs = 1200): Promise<void> => {
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((element) => {
    element.style.outline = '3px solid #4f46e5';
    element.style.outlineOffset = '6px';
    element.style.borderRadius = '8px';
  });
  await target.page().waitForTimeout(holdMs);
  await target.evaluate((element) => {
    element.style.outline = '';
    element.style.outlineOffset = '';
  });
};

export const scrollDown = async (page: Page, pixels: number, holdMs = 900): Promise<void> => {
  const steps = 8;
  for (let step = 0; step < steps; step += 1) {
    await page.mouse.wheel(0, pixels / steps);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(holdMs);
};

export const typeSlowly = async (field: Locator, value: string): Promise<void> => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await field.click();
    await field.fill('');
    await field.pressSequentially(value, { delay: 55 });
    await field.page().waitForTimeout(300);
    if ((await field.inputValue()) === value) return;
  }
  throw new Error(`The field did not keep the typed value "${value}"`);
};

export const moneyToNumber = (text: string): number => Number(text.replaceAll(/[^0-9.]/g, ''));

export const fillDate = async (field: Locator, isoDate: string): Promise<void> => {
  await field.click();
  await field.fill(isoDate);
  await field.page().waitForTimeout(500);
  if ((await field.inputValue()) !== isoDate) {
    await field.fill(isoDate);
  }
};

const DAY_MS = 86_400_000;

export const nextEffectiveDate = (sinceText: string, today: Date = new Date()): string => {
  const started = new Date(`${sinceText.replace(/^Since\s+/, '')} UTC`).getTime();
  const earliest = Number.isNaN(started) ? today.getTime() : started + DAY_MS;
  return new Date(Math.max(earliest, today.getTime())).toISOString().slice(0, 10);
};
