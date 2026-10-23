import { expect, test } from '@playwright/test';
import { resolveAppearance, type PortraitAsset } from '../lib/character/appearance';
import { createHash } from 'node:crypto';
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
  expect(resolveAppearance(wolf).src).toBe('/characters/wolf/ranger/portrait.png');
  expect(resolveAppearance({ ...wolf, outfit: 'Ragged Hood' }).note).toContain('saved but not depicted');
});

test('uploaded Wolf PNG loads unchanged and stays synchronized through previews, outfits and passport', async ({ page }, testInfo) => {
  const response = await page.request.get('/characters/wolf/ranger/portrait.png');
  expect(response.ok()).toBe(true);
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe('bb00b8a3d99fd1d83189b54f9718c1daf4cd744230c33dddc16e914fc369127e');
  await page.goto('/');
  await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption('Wolf');
  await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption('Ranger');
  const source = '/characters/wolf/ranger/portrait.png';
  for (const selector of ['.character-preview-large img', '.poster img', '.profile-emblem img']) {
    await expect(page.locator(selector)).toHaveAttribute('src', source);
    await expect.poll(() => page.locator(selector).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(1030);
    expect(await page.locator(selector).evaluate(image => getComputedStyle(image).objectFit)).toBe('contain');
  }
  await expect(page.getByRole('button', { name: 'DOWNLOAD CHARACTER', exact: true })).toBeEnabled();
  await page.setViewportSize({ width: 393, height: 851 });
  await page.locator('.builder-stage').screenshot({ path: testInfo.outputPath('wolf-ranger-mobile.png') });
  await page.goto('/my-outlaw');
  await expect(page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true })).toHaveValue('Wolf');
  await expect(page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT', exact: true })).toBeEnabled();
  // Independently rasterize the unmodified PNG with the same aspect-preserving containment;
  // compare the actual passport image region, not just its metadata or source URL.
  expect(await page.locator('.passport canvas').evaluate(async element => {
    const image = new Image(); image.src = '/characters/wolf/ranger/portrait.png'; await image.decode();
    const reference = document.createElement('canvas'); reference.width = 840; reference.height = 1120;
    const ctx = reference.getContext('2d')!; ctx.fillStyle = '#17201b'; ctx.fillRect(65,173,710,345);
    const scale = Math.min(710/image.naturalWidth,345/image.naturalHeight);
    const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    ctx.drawImage(image,65+(710-w)/2,173+(345-h)/2,w,h);
    const expected=ctx.getImageData(65,173,710,345).data;
    const actual=(element as HTMLCanvasElement).getContext('2d')!.getImageData(65,173,710,345).data;
    return actual.every((value,index)=>value===expected[index]);
  })).toBe(true);
  for (const outfit of ['Ragged Hood', 'Worn Leather Vest']) {
    await page.getByRole('combobox', { name: 'YOUR OUTFIT', exact: true }).selectOption(outfit);
    await expect(page.locator('.character-preview-large img')).toHaveAttribute('src',source);
    await expect(page.locator('.art-availability')).toContainText(`Selected ${outfit} is saved but not depicted`);
    await expect(page.locator('.passport-tools')).toContainText('outfit preview unavailable');
    await expect(page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT', exact: true })).toBeEnabled();
  }
  await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption('Mage');
  await expect(page.locator('.character-preview-large img')).toHaveAttribute('src', /^data:image/);
  await expect(page.locator('.art-availability')).toContainText('No cinematic artwork');
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
