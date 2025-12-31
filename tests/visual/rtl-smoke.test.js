import { test, expect } from '@playwright/test';

test('main demo #rtl section renders', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/#rtl');
  await expect(page.locator('#rtl')).toBeVisible();
  await expect(page.locator('#rtl .n-carousel')).toBeVisible();
  // Basic sanity: carousel should have content slides.
  const count = await page.locator('#rtl .n-carousel__content > *').count();
  expect(count).toBeGreaterThan(1);

  // Chromium can emit policy errors that are unrelated to app behavior.
  const relevantErrors = errors.filter(
    (e) => !/Permissions policy violation:\s*compute-pressure/i.test(e)
  );
  expect(relevantErrors, relevantErrors.join('\n')).toEqual([]);
});
