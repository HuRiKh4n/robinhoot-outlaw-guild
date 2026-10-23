import { expect, test } from '@playwright/test';
import { resolveAppearance, portraits, type PortraitAsset } from '../lib/character/appearance';
import { defaultDraft } from '../lib/profile/draft';

test('cinematic catalogue only covers exact ready species/class/outfit combinations', () => {
  const wolf = { ...defaultDraft, species: 'Wolf' as const, class: 'Ranger' as const };
  // Resolver-only metadata fixture: no replacement artwork is shipped or shown in the app.
  const entry: PortraitAsset = { id: 'test-only', species: 'Wolf', class: 'Ranger', outfit: 'Patched Cloak', status: 'ready', src: '/characters/test-only.png', width: 1440, height: 1860, credit: 'Test metadata only' };
  const art = resolveAppearance(wolf, [entry]);
  expect(art.kind).toBe('cinematic'); expect(art.src).toBe(entry.src);
  expect(resolveAppearance({ ...wolf, name: 'Different name', personality: 'Loyal' }, [entry]).src).toBe(entry.src);
  expect(art.note).toContain('does not change this portrait');
  for (const selection of [{ ...wolf, outfit: 'Ragged Hood' as const }, { ...wolf, class: 'Mage' as const }, { ...wolf, species: 'Fox' as const }]) {
    expect(resolveAppearance(selection, [entry]).kind).toBe('prototype');
  }
  expect(resolveAppearance(wolf, [{ ...entry, status: 'awaiting-artwork' }]).kind).toBe('prototype');
  expect(portraits.filter(asset => asset.status === 'ready')).toHaveLength(0);
});

test('missing Wolf artwork is honestly labelled and never fetched; all previews stay synchronized', async ({ page }) => {
  const artRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/characters/')) artRequests.push(request.url()); });
  await page.goto('/');
  await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption('Wolf');
  await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption('Ranger');
  await expect(page.locator('.art-availability')).toContainText('No cinematic artwork is available for Wolf / Ranger');
  const source = await page.locator('.character-preview-large img').getAttribute('src');
  expect(await page.locator('.poster img').getAttribute('src')).toBe(source);
  expect(await page.locator('.profile-emblem img').getAttribute('src')).toBe(source);
  await expect(page.locator('.poster figcaption')).toContainText('Vector prototype');
  await expect(page.getByRole('button', { name: 'DOWNLOAD CHARACTER', exact: true })).toBeEnabled();
  expect(artRequests).toEqual([]);
  await page.goto('/my-outlaw');
  await expect(page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true })).toHaveValue('Wolf');
  await expect(page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT', exact: true })).toBeEnabled();
  await expect(page.locator('.passport-tools')).toContainText('Vector prototype');
  await expect(page.locator('.passport canvas')).toHaveAttribute('aria-label', /cinematic artwork unavailable/);
});

test('cinematic studio stays usable at narrow Android and desktop sizes', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toBeEnabled();
  for (const width of [320, 393, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const control of [page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' }), page.getByRole('combobox', { name: 'YOUR OUTFIT', exact: true }), page.getByRole('button', { name: 'SAVE DRAFT', exact: true })]) {
      const box = await control.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(48);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    const portrait = await page.locator('.portrait-pane').boundingBox();
    const controls = await page.locator('.controls').boundingBox();
    if (width <= 850) expect(controls!.y).toBeGreaterThanOrEqual(portrait!.y + portrait!.height - 1);
    else expect(controls!.x).toBeGreaterThan(portrait!.x);
  }
  await page.setViewportSize({ width: 393, height: 851 });
  await page.locator('.builder-stage').screenshot({ path: testInfo.outputPath('cinematic-mobile-foundation.png') });
});
