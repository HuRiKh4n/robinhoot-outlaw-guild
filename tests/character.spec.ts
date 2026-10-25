import { choose, selected } from './creator-helpers';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const speciesWithoutArt = ['Bear', 'Owl'];
const classes = ['Ranger', 'Rogue', 'Warrior', 'Mage', 'Scout', 'Trickster'];

test('species without artwork are not offered; a stored one still shows an explicit unavailable state', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  await page.getByRole('tab', { name: /^Species\b/ }).click();
  for (const value of speciesWithoutArt) await expect(page.getByRole('radio', { name: value, exact: true })).toHaveCount(0);
  for (const value of ['Wolf', 'Fox', 'Raccoon', 'Rabbit', 'Badger']) await expect(page.getByRole('radio', { name: value, exact: true })).toHaveCount(1);
  // A draft saved before Owl was hidden keeps its species and shows no substitute art for any class.
  await page.evaluate(() => sessionStorage.setItem('robinhoot:outlaw-draft', JSON.stringify({ name: 'Old Owl', species: 'Owl', class: 'Ranger', outfit: 'Patched Cloak', personality: 'Loyal' })));
  await page.reload();
  await selected(page, 'SPECIES', 'Owl');
  for (const value of classes) {
    await choose(page, 'CLASS', value);
    await expect(page.locator('.character-preview-large img')).toHaveCount(0);
    await expect(page.locator('.character-preview-large .portrait-unavailable')).toContainText(value);
  }
  await page.setViewportSize({width:393,height:851});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await page.locator('.builder-stage').screenshot({path:testInfo.outputPath('unavailable-artwork.png')});
});

test('passport PNG pixels change with species, equipment and clothing, matching the live source', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  const pngHashes: string[] = [];
  const selections = [
    ['Fox', 'Ranger', 'Patched Cloak'], ['Wolf', 'Ranger', 'Patched Cloak'],
    ['Wolf', 'Mage', 'Arcane Robes'], ['Wolf', 'Ranger', 'Leather Vest'],
  ];
  for (const [index, [animal, job, outfit]] of selections.entries()) {
    await choose(page, 'SPECIES', animal);
    await choose(page, 'CLASS', job);
    await choose(page, 'OUTFIT', outfit);
    const link = page.getByRole('button', { name: 'DOWNLOAD GUILD PASSPORT' });
    await expect(link).toBeEnabled();
    // The exported card is the exact current canvas, not a fixed mascot image.
    const signature = await page.locator('.passport canvas').evaluate(canvas => (canvas as HTMLCanvasElement).toDataURL());
    const promise = page.waitForEvent('download'); await link.click();
    const download = await promise; const path = testInfo.outputPath(`selection-${index}.png`); await download.saveAs(path);
    const bytes = await readFile(path);
    expect(`data:image/png;base64,${bytes.toString('base64')}`).toBe(signature);
    pngHashes.push(createHash('sha256').update(bytes).digest('hex'));
  }
  expect(new Set(pngHashes).size).toBe(selections.length);
});

test('legacy drafts keep their choices, retired Guardian reads as Warrior, and poster matches profile', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('robinhoot:outlaw-draft', JSON.stringify({ name: 'Old Owl', animal: 'Owl', class: 'Guardian', outfit: 'Ragged Hood', trait: 'Loyal' })));
  await page.goto('/my-outlaw');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Old Owl');
  await selected(page, 'SPECIES', 'Owl');
  await selected(page, 'CLASS', 'Warrior');
  await expect(page.locator('.character-preview-large img, .poster .character-preview img, .profile-emblem img')).toHaveCount(0);
  await expect(page.locator('.poster')).toContainText('Cinematic artwork not yet available');
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!));
  expect(stored.animal).toBe('Owl'); // Reads never rewrite or discard the original draft.
});
