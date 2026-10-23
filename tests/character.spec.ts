import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const species = ['Fox', 'Wolf', 'Raccoon', 'Bear', 'Rabbit', 'Badger', 'Owl'];
const classes = ['Ranger', 'Rogue', 'Warrior', 'Mage', 'Scout', 'Trickster', 'Guardian'];
const outfits = ['Patched Cloak', 'Ragged Hood', 'Worn Leather Vest'];

test('every species, class and outfit has distinct reusable local visual layers', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  const preview = page.locator('.character-preview-large img');
  const hashes = new Set<string>();
  for (const value of species) {
    await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption(value);
    await expect(preview).toHaveAttribute('alt', new RegExp(`^${value} `));
    const source = await preview.getAttribute('src');
    expect(source).toMatch(/^data:image\/svg\+xml/);
    hashes.add(createHash('sha256').update(source!).digest('hex'));
  }
  expect(hashes.size).toBe(species.length);
  const equipment = new Set<string>();
  for (const value of classes) {
    await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption(value);
    equipment.add((await preview.getAttribute('src'))!);
  }
  expect(equipment.size).toBe(classes.length);
  const clothes = new Set<string>();
  for (const value of outfits) {
    await page.getByRole('combobox', { name: 'YOUR OUTFIT', exact: true }).selectOption(value);
    clothes.add((await preview.getAttribute('src'))!);
  }
  expect(clothes.size).toBe(outfits.length);
  await expect(page.getByText('Final painted, cinematic character artwork is still pending', { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 393, height: 851 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  await page.locator('.builder-stage').screenshot({ path: testInfo.outputPath('illustration-preview.png') });
});

test('passport PNG pixels change with species, equipment and clothing, matching the live source', async ({ page }, testInfo) => {
  await page.goto('/my-outlaw');
  const pngHashes: string[] = [];
  const selections = [
    ['Fox', 'Ranger', 'Patched Cloak'], ['Wolf', 'Ranger', 'Patched Cloak'],
    ['Wolf', 'Mage', 'Patched Cloak'], ['Wolf', 'Mage', 'Worn Leather Vest'],
  ];
  for (const [index, [animal, job, outfit]] of selections.entries()) {
    await page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true }).selectOption(animal);
    await page.getByRole('combobox', { name: 'YOUR CLASS', exact: true }).selectOption(job);
    await page.getByRole('combobox', { name: 'YOUR OUTFIT', exact: true }).selectOption(outfit);
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

test('legacy drafts retain all choices and use the same art on poster and profile', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('robinhoot:outlaw-draft', JSON.stringify({ name: 'Old Owl', animal: 'Owl', class: 'Guardian', outfit: 'Ragged Hood', trait: 'Loyal' })));
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'YOUR OUTLAW NAME' })).toHaveValue('Old Owl');
  await expect(page.getByRole('combobox', { name: 'YOUR SPECIES', exact: true })).toHaveValue('Owl');
  await expect(page.getByRole('combobox', { name: 'YOUR CLASS', exact: true })).toHaveValue('Guardian');
  const live = await page.locator('.character-preview-large img').getAttribute('src');
  expect(await page.locator('.poster .character-preview img').getAttribute('src')).toBe(live);
  expect(await page.locator('.profile-emblem img').getAttribute('src')).toBe(live);
  const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem('robinhoot:outlaw-draft')!));
  expect(stored.animal).toBe('Owl'); // Reads never rewrite or discard the original draft.
});
