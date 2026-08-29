import { test, expect } from '@playwright/test';

test.describe('live site smoke', () => {
  test('homepage returns a healthy document', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response, 'homepage should return an HTTP response').not.toBeNull();
    expect(response!.ok(), `homepage returned ${response!.status()}`).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/application error|internal server error|build failed/i);
  });

  test('primary navigation is usable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible();
    expect(await nav.getByRole('link').count()).toBeGreaterThan(0);
  });
});
