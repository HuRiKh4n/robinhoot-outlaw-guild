import { expect, test } from '@playwright/test';

test('the hideout is navigable by its objects, with story pages and keyboard access', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Forge your outlaw', 'The tale', 'The Sheriff', 'The road ahead', 'Bounty board'])
    await expect(page.locator('.hotspots').getByRole('link', { name: new RegExp(name) })).toHaveCount(1);
  await page.locator('.hotspots').getByRole('link', { name: /The tale/ }).click();
  const tale = page.getByRole('dialog', { name: /Once upon a time/ });
  await expect(tale).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tale).toBeHidden();
  await expect(page).not.toHaveURL(/#tale/);
  await page.locator('.hotspots').getByRole('link', { name: /Forge your outlaw/ }).click();
  await expect(page).toHaveURL(/\/my-outlaw$/);
});

test('phones get the tall art and a bottom bar; nothing requires exploring the picture', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/');
  const bar = page.getByRole('navigation', { name: 'Quick navigation' });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('link', { name: /Forge your outlaw/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  const src = await page.locator('.hideout-art img').evaluate(img => (img as HTMLImageElement).currentSrc);
  expect(src).toContain('hideout-tall');
});
